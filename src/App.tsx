import { useLocaleStore } from './store/useLocaleStore';
import { tr } from './lib/i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Check, ChevronDown, FileText, FileUp, LayoutTemplate, Leaf, Menu, Moon, Palette, Redo2, RotateCcw, Rows3, ShieldCheck, Sparkles, Sun, Undo2, X } from 'lucide-react';
import { useResumeStore } from './store/useResumeStore';
import { SectionList } from './components/editor/SectionList';
import { ThemeEditor, LayoutEditor } from './components/editor/ThemeEditor';
import { TemplateManager } from './components/editor/TemplateManager';
import { AtsOptimizer } from './components/editor/AtsOptimizer';
import { ResumePreview } from './components/preview/ResumePreview';
import { ExportDialog } from './components/ExportDialog';
import { ImportCvDialog } from './components/ImportCvDialog';
import { Dialog } from './components/Dialog';
import { parseProjectJson } from './services/projectJson';
import { getStorageError, storageEvent } from './lib/storage';
import { SelectedElementEditor } from './components/editor/SelectedElementEditor';
import type { EditorTarget } from './lib/previewTargets';
import { useAppTheme } from './hooks/useAppTheme';

type Tab = 'content' | 'design' | 'layout' | 'templates' | 'ats';
const tabs = [
  { id: 'content' as const, icon: FileText, label: 'Treść' },
  { id: 'design' as const, icon: Palette, label: 'Wygląd' },
  { id: 'layout' as const, icon: Rows3, label: 'Układ' },
  { id: 'templates' as const, icon: LayoutTemplate, label: 'Szablony' },
  { id: 'ats' as const, icon: ShieldCheck, label: 'ATS' },
];
const headings = {
  content: { overline: 'TWOJA HISTORIA', title: 'Zacznij od siebie.', description: 'Dodaj to, co Cię wyróżnia. My zadbamy o formę.' },
  design: { overline: 'TWÓJ STYL', title: 'Zrób dobre wrażenie.', description: 'Dopracuj każdy detal. Zobacz zmianę od razu.' },
  layout: { overline: 'DOBRA KOMPOZYCJA', title: 'Wszystko na swoim miejscu.', description: 'Wybierz układ, kolejność i widoczność sekcji.' },
  templates: { overline: 'PUNKT WYJŚCIA', title: 'Znajdź swój charakter.', description: 'Wybierz szablon i nadaj mu własny styl.' },
  ats: { overline: 'APPLICANT TRACKING SYSTEM', title: 'Optymalizator ATS.', description: 'Dostosuj CV pod roboty rekrutacyjne i zbadaj zgodność z ogłoszeniem.' },
};
export default function App() {
  const { theme: appTheme, toggleTheme } = useAppTheme();
  const [tab, setTab] = useState<Tab>('content'); const [exportOpen, setExportOpen] = useState(false); const [resetOpen, setResetOpen] = useState(false); const [mobileEditor, setMobileEditor] = useState(true);
  const [importCvOpen, setImportCvOpen] = useState(false); const [droppedCvFile, setDroppedCvFile] = useState<File | null>(null);
  const [toast, setToast] = useState(''); const [storageError, setStorageError] = useState(''); const [importError, setImportError] = useState('');
  const [selectedElement, setSelectedElement] = useState<EditorTarget | null>(null);
  const closeSelectedElement = useCallback(() => setSelectedElement(null), []);
  const fileRef = useRef<HTMLInputElement>(null); const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const store = useResumeStore();
  const locale = useLocaleStore();
  useEffect(() => { document.documentElement.lang = locale.language; }, [locale.language]);
  const notify = useCallback((message: string) => { setToast(message); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 4500); }, []);
  useEffect(() => {
    const handleDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes('Files')) event.preventDefault();
    };
    const handleDrop = (event: DragEvent) => {
      if (event.defaultPrevented) return;
      if (event.dataTransfer?.files?.length) {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'pdf' || ext === 'docx') {
          event.preventDefault();
          setDroppedCvFile(file);
          setImportCvOpen(true);
        } else if (ext === 'json') {
          event.preventDefault();
          void importFile(file);
        }
      }
    };
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); setExportOpen(true); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !['INPUT', 'TEXTAREA'].includes(target.tagName)) { event.preventDefault(); if (event.shiftKey) useResumeStore.getState().redo(); else useResumeStore.getState().undo(); }
    };
    window.addEventListener('keydown', handler); return () => { window.removeEventListener('keydown', handler); clearTimeout(toastTimer.current); };
  }, []);
  useEffect(() => {
    setStorageError(getStorageError());
    const handler = (event: Event) => setStorageError((event as CustomEvent<string>).detail);
    window.addEventListener(storageEvent, handler);
    return () => window.removeEventListener(storageEvent, handler);
  }, []);
  const importFile = async (file: File) => {
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error(tr("Plik jest za duży. Maksymalny rozmiar to 2 MB."));
      const result = parseProjectJson(await file.text());
      setSelectedElement(null);
      if (result.kind === 'folio-template') { store.importTemplate(result.template); setTab('templates'); notify('Zaimportowano szablon do Twojej kolekcji'); }
      else { store.importProject(result.name, result.data, result.theme); notify('Zaimportowano projekt CV'); }
    } catch (error) { setImportError(error instanceof Error ? error.message : tr("Nie udało się zaimportować pliku.")); }
  };
  const themeVariables = { '--cv-accent': store.theme.colors.accent, '--cv-background': store.theme.colors.background, '--cv-text': store.theme.colors.text, '--cv-muted': store.theme.colors.muted, '--cv-sidebar': store.theme.colors.sidebar, '--cv-font': store.theme.typography.fontFamily } as CSSProperties;
  return <div className="app" style={themeVariables}>
    <header className="app-header"><a className="brand" href="#" aria-label={tr("Folio — studio CV")}><span className="brand-icon"><Leaf size={21} strokeWidth={1.6} /></span><span>{tr("folio")}<span className="brand-period">.</span></span><span className="brand-label">{tr("STUDIO CV")}</span></a>
      <div className="document-name"><FileText size={15} /><input value={store.name} aria-label={tr("Nazwa dokumentu")} maxLength={100} onChange={event => store.setName(event.target.value)} /><ChevronDown size={13} /></div>
      <div className="header-actions"><button className="icon-button theme-toggle" onClick={toggleTheme} aria-label={tr("Tryb ciemny")} aria-pressed={appTheme === 'dark'} title={tr(appTheme === 'dark' ? "Włącz tryb jasny" : "Włącz tryb ciemny")}>{appTheme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button><select className="language-switch" aria-label={tr("Język strony")} value={locale.language} onChange={event => locale.setLanguage(event.target.value as 'pl' | 'en')}><option value="pl">PL</option><option value="en">EN</option></select><span className={`save-status ${storageError ? 'save-error' : ''}`} title={storageError || tr("Dane zapisane w tej przeglądarce")}>{storageError ? <X size={13} /> : <Check size={13} />}<span>{storageError ? tr("Błąd zapisu") : tr('Zapisano lokalnie')}</span></span><div className="history-actions"><button className="icon-button" title={tr("Cofnij (Ctrl+Z)")} aria-label={tr("Cofnij zmianę")} disabled={!store.history.length} onClick={store.undo}><Undo2 size={17} /></button><button className="icon-button" title={tr("Ponów (Ctrl+Shift+Z)")} aria-label={tr("Ponów zmianę")} disabled={!store.future.length} onClick={store.redo}><Redo2 size={17} /></button></div><button className="primary-button export-button" aria-label={tr("Eksportuj CV")} onClick={() => setExportOpen(true)}><ArrowDownToLine size={15} /><span>{tr("Eksportuj CV")}</span><ChevronDown size={13} /></button></div>
    </header>
    <div className="workspace-heading"><div><span className="workspace-breadcrumb">{tr("TWOJA PRZESTRZEŃ")}<span>/</span></span><strong>{tr("Kreator CV")}</strong><span className="workspace-chip">{tr("Osobisty, jak Ty.")}</span></div><div className="workspace-actions"><button className="primary-button import-cv-cta" title={tr("Wczytaj dane z pliku PDF lub Word (.docx)")} onClick={() => { setDroppedCvFile(null); setImportCvOpen(true); }}><FileUp size={14} /><span>{tr("Wgraj CV (PDF / DOCX)")}</span></button><button className="text-button" aria-label={tr("Importuj JSON")} onClick={() => fileRef.current?.click()}><ArrowUpFromLine size={14} /><span>{tr("Importuj JSON")}</span></button><button className="mobile-toggle secondary-button" onClick={() => setMobileEditor(value => !value)}>{mobileEditor ? <FileText size={15} /> : <Menu size={15} />}{mobileEditor ? tr("Podgląd") : tr("Edytor")}</button></div></div>
    {storageError && <div className="storage-warning" role="alert">{storageError}</div>}
    <main className={`workspace ${mobileEditor ? 'show-editor' : 'show-preview'}`}><nav className="nav-rail" aria-label={tr("Panele edytora")}>{tabs.map(({ id, icon: Icon, label }) => <button key={id} onClick={() => { setTab(id); setSelectedElement(null); setMobileEditor(true); }} className={`nav-item ${tab === id ? 'active' : ''}`} aria-current={tab === id ? 'page' : undefined}><Icon size={21} strokeWidth={1.6} /><span>{tr(label)}</span></button>)}<div className="rail-bottom"><span className="rail-line" /><ShieldCheck size={19} strokeWidth={1.3} /><span>{tr("Lokalny")}<br />{tr("zapis")}</span></div></nav>
      <aside className="editor-panel" aria-label={tr("Panel edycji CV")}>{!selectedElement && <div className="panel-intro"><span className="overline">{tr(headings[tab].overline)}</span><h1>{tr(headings[tab].title)}</h1><p>{tr(headings[tab].description)}</p></div>}
        <div className={`editor-scroll ${selectedElement ? 'editing-selection' : ''}`} key={selectedElement ? JSON.stringify(selectedElement) : tab}>{selectedElement ? <SelectedElementEditor target={selectedElement} onClose={closeSelectedElement} /> : tab === 'content' ? <SectionList onOpenImport={() => { setDroppedCvFile(null); setImportCvOpen(true); }} /> : tab === 'design' ? <ThemeEditor /> : tab === 'layout' ? <><LayoutEditor /><div className="subheading"><span>{tr("SEKCJE I KOLEJNOŚĆ")}</span><span>{store.theme.sections.filter(s => s.isVisible).length} / 9</span></div><SectionList layoutOnly /></> : tab === 'templates' ? <TemplateManager notify={notify} /> : <AtsOptimizer notify={notify} />}</div>
        <div className="editor-footer"><span><ShieldCheck size={13} />{tr("Twoje dane zostają u Ciebie.")}</span><button className="icon-button" title={tr("Przywróć przykład")} aria-label={tr("Przywróć przykładowe CV")} onClick={() => setResetOpen(true)}><RotateCcw size={14} /></button></div>
      </aside>
      <ResumePreview selected={selectedElement} onSelect={target => { setSelectedElement(target); setMobileEditor(true); }} />
    </main>
    <input ref={fileRef} type="file" accept=".json,application/json" className="sr-only" aria-label={tr("Wybierz plik JSON")} onChange={event => { const file = event.target.files?.[0]; if (file) void importFile(file); event.target.value = ''; }} />
    {toast && <div className="toast" role="status"><span><Check size={15} /></span>{toast}<button className="icon-button" aria-label={tr("Zamknij powiadomienie")} onClick={() => setToast('')}><X size={13} /></button></div>}
    {exportOpen && <ExportDialog onClose={() => setExportOpen(false)} notify={notify} />}
    {importCvOpen && <ImportCvDialog initialFile={droppedCvFile} onClose={() => { setImportCvOpen(false); setDroppedCvFile(null); }} notify={notify} />}
    {resetOpen && <Dialog title={tr("Wrócić do przykładowego CV?")} onClose={() => setResetOpen(false)}><p className="dialog-description">{tr("Zastąpi to dane i wygląd bieżącego dokumentu. Własne szablony pozostaną w kolekcji. Zmianę możesz cofnąć.")}</p><div className="dialog-actions"><button className="secondary-button" onClick={() => setResetOpen(false)}>{tr("Anuluj")}</button><button className="primary-button" onClick={() => { store.restoreExample(); setSelectedElement(null); setResetOpen(false); notify(tr("Przywrócono przykładowe CV")); }}><RotateCcw size={14} />{tr("Przywróć przykład")}</button></div></Dialog>}
    {importError && <Dialog title={tr("Nie można wczytać pliku")} onClose={() => setImportError('')}><p className="dialog-description error-text">{importError}</p><button className="primary-button full-width" onClick={() => setImportError('')}>{tr("Rozumiem")}</button></Dialog>}
    <div className="mobile-brand-note"><Sparkles size={12} />{tr("Folio Studio")}</div>
  </div>;
}
