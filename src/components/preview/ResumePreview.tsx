import { tr } from '../../lib/i18n';
import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { getDocument, GlobalWorkerOptions, TextLayer } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import 'pdfjs-dist/web/pdf_viewer.css';
import { Check, FileCheck2, Focus, LoaderCircle, Minus, Plus, RefreshCw, MousePointer2, Eye } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { createPdfPreview } from '../../services/exportPdf';
import { presets } from '../../data/presets';
import type { EditorTarget, PreviewRegion } from '../../lib/previewTargets';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function PdfPage({ pdf, number, scale, regions, selected, onElementClick }: {
  pdf: PDFDocumentProxy; number: number; scale: number; regions: PreviewRegion[];
  selected: EditorTarget | null; onElementClick: (target: EditorTarget) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const sections = useResumeStore(state => state.theme.sections);
  const data = useResumeStore(state => state.data);
  useEffect(() => {
    let canceled = false;
    let renderTask: RenderTask | undefined;
    let textLayer: TextLayer | undefined;
    setReady(false); setError('');
    async function render() {
      const page = await pdf.getPage(number);
      if (canceled || !canvasRef.current || !textRef.current) return;
      const canvas = canvasRef.current;
      const viewport = page.getViewport({ scale });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(viewport.width * ratio);
      canvas.height = Math.ceil(viewport.height * ratio);
      canvas.style.width = viewport.width + 'px';
      canvas.style.height = viewport.height + 'px';
      renderTask = page.render({ canvas, viewport, transform: [ratio, 0, 0, ratio, 0, 0] });
      await renderTask.promise;
      if (canceled || !textRef.current) return;
      const textContent = await page.getTextContent();
      if (canceled || !textRef.current) return;
      textRef.current.replaceChildren();
      for (const key of ['--scale-factor', '--total-scale-factor']) textRef.current.style.setProperty(key, String(scale));
      textRef.current.style.setProperty('--user-unit', '1');
      textLayer = new TextLayer({ textContentSource: textContent, container: textRef.current, viewport });
      await textLayer.render();
      if (!canceled) setReady(true);
    }
    void render().catch(error => { if (!canceled) setError(error instanceof Error ? error.message : tr("Nie udało się wyświetlić strony.")); });
    return () => { canceled = true; renderTask?.cancel(); textLayer?.cancel(); };
  }, [pdf, number, scale, retry]);
  return <div className="preview-page" style={{ width: 595.28 * scale, minHeight: 841.89 * scale }} aria-label={`${tr('Strona CV')} ${number}`} aria-busy={!ready && !error}>
    <canvas ref={canvasRef} />
    <div className="textLayer" ref={textRef} />
    {error && <div className="preview-page-error" role="alert"><p>{error}</p><button className="secondary-button" onClick={() => setRetry(value => value + 1)}>{tr("Ponów wyświetlanie strony")}</button></div>}
    {ready && <div className="interactive-elements-layer">{regions.filter(region => region.page === number).map((region, index) => {
      const target = region.target;
      const sectionLabel = target.section === 'personal' ? tr('Dane osobowe') : sections.find(section => section.id === target.section)?.title || target.section;
      const entries = target.section === 'personal' ? undefined : data[target.section];
      const item = Array.isArray(entries) ? entries.find(item => item.id === target.itemId) : undefined;
      const itemLabel = item && ('company' in item ? item.company : 'institution' in item ? item.institution : 'label' in item ? item.label : 'name' in item ? item.name : '');
      const label = target.mode === 'photo' ? tr("Zdjęcie profilowe") : target.mode === 'layout' ? `${tr('Układ sekcji')}: ${sectionLabel}` : itemLabel ? `${sectionLabel}: ${itemLabel}` : sectionLabel;
      const active = selected?.section === target.section && selected?.itemId === target.itemId && selected?.mode === target.mode;
      return <button type="button" key={index} className={`interactive-element-box ${active ? 'is-selected' : ''}`}
        style={{ left: region.left * scale, top: region.top * scale, width: region.width * scale, height: region.height * scale }}
        onClick={() => onElementClick(target)} aria-label={`${tr('Edytuj')}: ${label}`} title={`${tr('Edytuj')}: ${label}`} aria-pressed={active}>
        <span className="interactive-element-badge" aria-hidden="true">{label}</span>
      </button>;
    })}</div>}
  </div>;
}

export function ResumePreview({ onSelect, selected }: { onSelect: (target: EditorTarget) => void; selected: EditorTarget | null }) {
  const data = useResumeStore(state => state.data);
  const theme = useResumeStore(state => state.theme);
  const templates = useResumeStore(state => state.templates);
  const activeTemplateId = useResumeStore(state => state.activeTemplateId);
  const [pdf, setPdf] = useState<PDFDocumentProxy>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [fit, setFit] = useState(0.8);
  const [regions, setRegions] = useState<PreviewRegion[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const generation = useRef(0);
  const currentPdf = useRef<PDFDocumentProxy | undefined>(undefined);
  const active = [...presets, ...templates].find(t => t.id === activeTemplateId);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setFit(Math.min(0.86, Math.max(0.2, (entry.contentRect.width - 24) / 793.7))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const token = ++generation.current;
    setLoading(true);
    setError('');
    const timer = setTimeout(async () => {
      try {
        const { blob, regions: nextRegions } = await createPdfPreview(data, theme);
        if (token !== generation.current) return;
        const next = await getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
        if (token !== generation.current) { await next.destroy(); return; }
        const previous = currentPdf.current;
        currentPdf.current = next;
        setPdf(next);
        setRegions(nextRegions);
        setLoading(false);
        if (previous) setTimeout(() => { void previous.destroy(); }, 500);
      } catch (error) {
        if (token === generation.current) {
          setError(error instanceof Error ? error.message : tr("Nie udało się odświeżyć podglądu."));
          setLoading(false);
        }
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [data, theme, retry]);

  useEffect(() => () => { generation.current++; void currentPdf.current?.destroy(); }, []);

  const actualZoom = zoom === 'fit' ? fit : zoom;

  return (
    <section className="preview-panel" aria-label={tr("Podgląd CV")}>
      <div className="preview-toolbar">
        <div className="live-label">
          <Eye size={17} strokeWidth={1.6} />{tr("Podgląd")}</div>
        <div className="preview-template">
          <FileCheck2 size={14} />
          {active?.name || tr("Własny wygląd")}
          <span>{pdf ? pdf.numPages : 0} {tr(pdf?.numPages === 1 ? "strona" : "str.")}</span>
        </div>
        <div className="preview-toolbar-controls"><div className="zoom-controls">
          <button
            className="icon-button"
            aria-label={tr("Pomniejsz podgląd")}
            onClick={() => setZoom(Math.max(0.25, Number((actualZoom - 0.1).toFixed(2))))}
          >
            <Minus size={15} />
          </button>
          <span>{Math.round(actualZoom * 100)}%</span>
          <button
            className="icon-button"
            aria-label={tr("Powiększ podgląd")}
            onClick={() => setZoom(Math.min(1.5, Number((actualZoom + 0.1).toFixed(2))))}
          >
            <Plus size={15} />
          </button>
          <i />
          <button
            className="icon-button"
            title={tr("Dopasuj do szerokości")}
            aria-label={tr("Dopasuj podgląd")}
            onClick={() => setZoom('fit')}
          >
            <Focus size={16} />
          </button>
        </div></div>
      </div>

      <div className="preview-scroll" ref={scrollRef}>
        {error && (
          <div className="preview-error" role="alert">
            <strong>{tr("Podgląd wymaga odświeżenia")}</strong>
            <p>{error}</p>
            <button className="secondary-button" onClick={() => setRetry(value => value + 1)}>
              <RefreshCw size={14} />{tr("Spróbuj ponownie")}</button>
          </div>
        )}

        {!pdf && loading && (
          <div className="preview-skeleton">
            <LoaderCircle size={25} className="spin" />
            <span>{tr("Składamy Twoje CV…")}</span>
          </div>
        )}

        {pdf && Array.from({ length: pdf.numPages }, (_, index) => (
          <div className="page-wrapper" key={`${pdf.fingerprints[0]}-${index}`}>
            <PdfPage
              pdf={pdf}
              number={index + 1}
              scale={actualZoom * 96 / 72}
              regions={regions}
              selected={selected}
              onElementClick={onSelect}
            />
            <span className="page-index">{tr("STRONA")}{index + 1} / {pdf.numPages}</span>
          </div>
        ))}
      </div>

      <div className="preview-footer">
        <span className="render-status" aria-live="polite">
          {loading ? (
            <><LoaderCircle className="spin" size={13} />{tr("Aktualizowanie")}</>
          ) : error ? (
            tr("Błąd podglądu")
          ) : (
            <><Check size={13} />{tr("Podgląd zgodny z PDF")}</>
          )}
        </span>

        <span className="preview-edit-help"><MousePointer2 size={13} />{tr("Kliknij element, aby go edytować.")}</span><span className="paper-size">A4</span>
      </div>

    </section>
  );
}
