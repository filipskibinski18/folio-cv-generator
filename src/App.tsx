import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Check, ChevronDown, FileText, LayoutTemplate, Leaf, Menu, Palette, Redo2, RotateCcw, Rows3, ShieldCheck, Sparkles, Undo2, X } from 'lucide-react';
import { useResumeStore } from './store/useResumeStore';
import { SectionList } from './components/editor/SectionList';
import { ThemeEditor, LayoutEditor } from './components/editor/ThemeEditor';
import { TemplateManager } from './components/editor/TemplateManager';
import { ResumePreview } from './components/preview/ResumePreview';
import { ExportDialog } from './components/ExportDialog';
import { Dialog } from './components/Dialog';
import { parseProjectJson } from './services/projectJson';
import { getStorageError, storageEvent } from './lib/storage';

type Tab = 'content' | 'design' | 'layout' | 'templates';
const tabs = [{ id: 'content' as const, icon: FileText, label: 'Treść' }, { id: 'design' as const, icon: Palette, label: 'Wygląd' }, { id: 'layout' as const, icon: Rows3, label: 'Układ' }, { id: 'templates' as const, icon: LayoutTemplate, label: 'Szablony' }];
const headings = { content: { overline: 'TWOJA HISTORIA', title: 'Zacznij od siebie.', description: 'Dodaj to, co Cię wyróżnia. My zadbamy o formę.' }, design: { overline: 'TWÓJ STYL', title: 'Zrób dobre wrażenie.', description: 'Dopracuj każdy detal. Zobacz zmianę od razu.' }, layout: { overline: 'DOBRA KOMPOZYCJA', title: 'Wszystko na swoim miejscu.', description: 'Wybierz układ, kolejność i widoczność sekcji.' }, templates: { overline: 'PUNKT WYJŚCIA', title: 'Znajdź swój charakter.', description: 'Wybierz szablon i nadaj mu własny styl.' } };
export default function App() {
  const [tab, setTab] = useState<Tab>('content'); const [exportOpen, setExportOpen] = useState(false); const [resetOpen, setResetOpen] = useState(false); const [mobileEditor, setMobileEditor] = useState(true);
  const [toast, setToast] = useState(''); const [storageError, setStorageError] = useState(''); const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null); const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const store = useResumeStore();
  const notify = useCallback((message: string) => { setToast(message); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 4500); }, []);
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
      if (file.size > 2 * 1024 * 1024) throw new Error('Plik jest za duży. Maksymalny rozmiar to 2 MB.');
      const result = parseProjectJson(await file.text());
      if (result.kind === 'folio-template') { store.importTemplate(result.template); setTab('templates'); notify('Zaimportowano szablon do Twojej kolekcji'); }
      else { store.importProject(result.name, result.data, result.theme); notify('Zaimportowano projekt CV'); }
    } catch (error) { setImportError(error instanceof Error ? error.message : 'Nie udało się zaimportować pliku.'); }
  };
  const themeVariables = { '--cv-accent': store.theme.colors.accent, '--cv-background': store.theme.colors.background, '--cv-text': store.theme.colors.text, '--cv-muted': store.theme.colors.muted, '--cv-sidebar': store.theme.colors.sidebar, '--cv-font': store.theme.typography.fontFamily } as CSSProperties;
  return <div className="app" style={themeVariables}>
    <header className="app-header"><a className="brand" href="#" aria-label="Folio — studio CV"><span className="brand-icon"><Leaf size={21} strokeWidth={1.6} /></span><span>folio<span className="brand-period">.</span></span><span className="brand-label">STUDIO CV</span></a>
      <div className="document-name"><FileText size={15} /><input value={store.name} aria-label="Nazwa dokumentu" maxLength={100} onChange={event => store.setName(event.target.value)} /><ChevronDown size={13} /></div>
      <div className="header-actions"><span className={`save-status ${storageError ? 'save-error' : ''}`} title={storageError || 'Dane zapisane w tej przeglądarce'}>{storageError ? <X size={13} /> : <Check size={13} />}<span>{storageError ? 'Błąd zapisu' : 'Zapisano lokalnie'}</span></span><div className="history-actions"><button className="icon-button" title="Cofnij (Ctrl+Z)" aria-label="Cofnij zmianę" disabled={!store.history.length} onClick={store.undo}><Undo2 size={17} /></button><button className="icon-button" title="Ponów (Ctrl+Shift+Z)" aria-label="Ponów zmianę" disabled={!store.future.length} onClick={store.redo}><Redo2 size={17} /></button></div><button className="primary-button export-button" onClick={() => setExportOpen(true)}><ArrowDownToLine size={15} /><span>Eksportuj CV</span><ChevronDown size={13} /></button></div>
    </header>
    <div className="workspace-heading"><div><span className="workspace-breadcrumb">TWOJA PRZESTRZEŃ<span>/</span></span><strong>Kreator CV</strong><span className="workspace-chip">Osobisty, jak Ty.</span></div><div className="workspace-actions"><button className="text-button" aria-label="Importuj JSON" onClick={() => fileRef.current?.click()}><ArrowUpFromLine size={14} /><span>Importuj JSON</span></button><button className="mobile-toggle secondary-button" onClick={() => setMobileEditor(value => !value)}>{mobileEditor ? <FileText size={15} /> : <Menu size={15} />}{mobileEditor ? 'Podgląd' : 'Edytor'}</button></div></div>
    {storageError && <div className="storage-warning" role="alert">{storageError}</div>}
    <main className={`workspace ${mobileEditor ? 'show-editor' : 'show-preview'}`}><nav className="nav-rail" aria-label="Panele edytora">{tabs.map(({ id, icon: Icon, label }) => <button key={id} onClick={() => { setTab(id); setMobileEditor(true); }} className={`nav-item ${tab === id ? 'active' : ''}`} aria-current={tab === id ? 'page' : undefined}><Icon size={21} strokeWidth={1.6} /><span>{label}</span></button>)}<div className="rail-bottom"><span className="rail-line" /><ShieldCheck size={19} strokeWidth={1.3} /><span>100%<br />prywatnie</span></div></nav>
      <aside className="editor-panel"><div className="panel-intro"><span className="overline">{headings[tab].overline}</span><h1>{headings[tab].title}</h1><p>{headings[tab].description}</p></div>
        <div className="editor-scroll" key={tab}>{tab === 'content' ? <SectionList /> : tab === 'design' ? <ThemeEditor /> : tab === 'layout' ? <><LayoutEditor /><div className="subheading"><span>SEKCJE I KOLEJNOŚĆ</span><span>{store.theme.sections.filter(s => s.isVisible).length} / 9</span></div><SectionList layoutOnly /></> : <TemplateManager notify={notify} />}</div>
        <div className="editor-footer"><span><ShieldCheck size={13} />Twoje dane zostają u Ciebie.</span><button className="icon-button" title="Przywróć przykład" aria-label="Przywróć przykładowe CV" onClick={() => setResetOpen(true)}><RotateCcw size={14} /></button></div>
      </aside>
      <ResumePreview />
    </main>
    <input ref={fileRef} type="file" accept=".json,application/json" className="sr-only" aria-label="Wybierz plik JSON" onChange={event => { const file = event.target.files?.[0]; if (file) void importFile(file); event.target.value = ''; }} />
    {toast && <div className="toast" role="status"><span><Check size={15} /></span>{toast}<button className="icon-button" aria-label="Zamknij powiadomienie" onClick={() => setToast('')}><X size={13} /></button></div>}
    {exportOpen && <ExportDialog onClose={() => setExportOpen(false)} notify={notify} />}
    {resetOpen && <Dialog title="Wrócić do przykładowego CV?" onClose={() => setResetOpen(false)}><p className="dialog-description">Zastąpi to dane i wygląd bieżącego dokumentu. Własne szablony pozostaną w kolekcji. Zmianę możesz cofnąć.</p><div className="dialog-actions"><button className="secondary-button" onClick={() => setResetOpen(false)}>Anuluj</button><button className="primary-button" onClick={() => { store.restoreExample(); setResetOpen(false); notify('Przywrócono przykładowe CV'); }}><RotateCcw size={14} />Przywróć przykład</button></div></Dialog>}
    {importError && <Dialog title="Nie można wczytać pliku" onClose={() => setImportError('')}><p className="dialog-description error-text">{importError}</p><button className="primary-button full-width" onClick={() => setImportError('')}>Rozumiem</button></Dialog>}
    <div className="mobile-brand-note"><Sparkles size={12} />Folio Studio</div>
  </div>;
}
