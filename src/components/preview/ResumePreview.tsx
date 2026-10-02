import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { getDocument, GlobalWorkerOptions, TextLayer } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import 'pdfjs-dist/web/pdf_viewer.css';
import { Check, FileCheck2, Focus, LoaderCircle, Minus, Plus, RefreshCw } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { createPdfBlob } from '../../services/exportPdf';
import { presets } from '../../data/presets';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
function PdfPage({ pdf, number, scale }: { pdf: PDFDocumentProxy; number: number; scale: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null); const textRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let canceled = false; let renderTask: RenderTask | undefined; let textLayer: TextLayer | undefined;
    async function render() {
      const page = await pdf.getPage(number); if (canceled || !canvasRef.current || !textRef.current) return;
      const canvas = canvasRef.current; const viewport = page.getViewport({ scale });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(viewport.width * ratio); canvas.height = Math.ceil(viewport.height * ratio);
      canvas.style.width = `${viewport.width}px`; canvas.style.height = `${viewport.height}px`;
      renderTask = page.render({ canvas, viewport, transform: [ratio, 0, 0, ratio, 0, 0] });
      await renderTask.promise; if (canceled || !textRef.current) return;
      const textContent = await page.getTextContent();
      if (canceled || !textRef.current) return;
      textRef.current.replaceChildren();
      textRef.current.style.setProperty('--scale-factor', String(scale));
      textLayer = new TextLayer({ textContentSource: textContent, container: textRef.current, viewport });
      await textLayer.render();
    }
    render().catch(error => { if (!canceled) console.error('Podgląd strony:', error); });
    return () => { canceled = true; renderTask?.cancel(); textLayer?.cancel(); };
  }, [pdf, number, scale]);
  return <div className="preview-page" style={{ width: 595.28 * scale, minHeight: 841.89 * scale }} aria-label={`Strona CV ${number}`}><canvas ref={canvasRef} /><div className="textLayer" ref={textRef} /></div>;
}
export function ResumePreview() {
  const data = useResumeStore(state => state.data); const theme = useResumeStore(state => state.theme);
  const templates = useResumeStore(state => state.templates); const activeTemplateId = useResumeStore(state => state.activeTemplateId);
  const [pdf, setPdf] = useState<PDFDocumentProxy>(); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [retry, setRetry] = useState(0); const [zoom, setZoom] = useState<number | 'fit'>('fit'); const [fit, setFit] = useState(0.8);
  const scrollRef = useRef<HTMLDivElement>(null); const generation = useRef(0); const currentPdf = useRef<PDFDocumentProxy | undefined>(undefined);
  const active = [...presets, ...templates].find(t => t.id === activeTemplateId);
  useEffect(() => {
    const element = scrollRef.current; if (!element) return;
    const observer = new ResizeObserver(([entry]) => setFit(Math.min(0.86, Math.max(0.2, (entry.contentRect.width - 88) / 793.7))));
    observer.observe(element); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const token = ++generation.current; setLoading(true); setError('');
    const timer = setTimeout(async () => {
      try {
        const blob = await createPdfBlob(data, theme); if (token !== generation.current) return;
        const next = await getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
        if (token !== generation.current) { await next.destroy(); return; }
        const previous = currentPdf.current; currentPdf.current = next; setPdf(next); setLoading(false);
        if (previous) setTimeout(() => { void previous.destroy(); }, 500);
      } catch (error) { if (token === generation.current) { setError(error instanceof Error ? error.message : 'Nie udało się odświeżyć podglądu.'); setLoading(false); } }
    }, 350);
    return () => clearTimeout(timer);
  }, [data, theme, retry]);
  useEffect(() => () => { generation.current++; void currentPdf.current?.destroy(); }, []);
  const actualZoom = zoom === 'fit' ? fit : zoom;
  return <section className="preview-panel" aria-label="Podgląd CV"><div className="preview-toolbar"><div className="live-label"><span className="live-dot" />PODGLĄD NA ŻYWO</div><div className="preview-template"><FileCheck2 size={14} />{active?.name || 'Własny wygląd'}<span>A4</span></div></div>
    <div className="preview-scroll" ref={scrollRef}><div className="preview-caption"><span>TWÓJ NASTĘPNY ROZDZIAŁ</span><span>{pdf ? `${pdf.numPages} ${pdf.numPages === 1 ? 'strona' : 'str.'}` : 'A4'}</span></div>
      {error && <div className="preview-error" role="alert"><strong>Podgląd wymaga odświeżenia</strong><p>{error}</p><button className="secondary-button" onClick={() => setRetry(value => value + 1)}><RefreshCw size={14} />Spróbuj ponownie</button></div>}
      {!pdf && loading && <div className="preview-skeleton"><LoaderCircle size={25} className="spin" /><span>Składamy Twoje CV…</span></div>}
      {pdf && Array.from({ length: pdf.numPages }, (_, index) => <div className="page-wrapper" key={`${pdf.fingerprints[0]}-${index}`}><PdfPage pdf={pdf} number={index + 1} scale={actualZoom * 96 / 72} /><span className="page-index">STRONA {index + 1} / {pdf.numPages}</span></div>)}
      <div className="preview-end"><span />Zaprojektowane przez Ciebie. Gotowe na nowe możliwości.<span /></div>
    </div>
    <div className="preview-footer"><span className="render-status" aria-live="polite">{loading ? <><LoaderCircle className="spin" size={13} />Aktualizowanie</> : error ? 'Błąd podglądu' : <><Check size={13} />Podgląd zgodny z PDF</>}</span><div className="zoom-controls"><button className="icon-button" aria-label="Pomniejsz podgląd" onClick={() => setZoom(Math.max(0.25, Number((actualZoom - 0.1).toFixed(2))))}><Minus size={15} /></button><span>{Math.round(actualZoom * 100)}%</span><button className="icon-button" aria-label="Powiększ podgląd" onClick={() => setZoom(Math.min(1.5, Number((actualZoom + 0.1).toFixed(2))))}><Plus size={15} /></button><i /><button className="icon-button" title="Dopasuj do szerokości" aria-label="Dopasuj podgląd" onClick={() => setZoom('fit')}><Focus size={16} /></button></div><span className="paper-size">210 × 297 mm</span></div>
  </section>;
}
