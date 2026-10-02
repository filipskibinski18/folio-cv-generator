import { useState } from 'react';
import { ArrowDownToLine, Check, Copy, Plus, Save, Trash2, Sparkles } from 'lucide-react';
import { presets } from '../../data/presets';
import type { ResumeTemplate } from '../../types/resume';
import { useResumeStore } from '../../store/useResumeStore';
import { exportTemplateJson } from '../../services/projectJson';
import { Dialog } from '../Dialog';
import { Field } from './Fields';

export function MiniResume({ template }: { template: ResumeTemplate }) {
  const theme = template.theme;
  return <div className={`mini-resume mini-${theme.layout}`} style={{ '--mini-accent': theme.colors.accent, '--mini-sidebar': theme.colors.sidebar, '--mini-background': theme.colors.background } as React.CSSProperties} aria-hidden="true">
    <div className="mini-page"><div className="mini-header"><i /><b>Aleksandra<br />Nowak</b><em /></div><div className="mini-columns"><div className="mini-side">{[1, 2, 3].map(i => <div className="mini-section" key={i}><strong />{[1, 2, 3].map(j => <span key={j} />)}</div>)}</div><div className="mini-main">{[1, 2, 3].map(i => <div className="mini-section" key={i}><strong />{[1, 2, 3, 4].map(j => <span key={j} />)}</div>)}</div></div></div>
  </div>;
}
export function TemplateManager({ notify }: { notify: (message: string) => void }) {
  const store = useResumeStore(); const [mode, setMode] = useState<'new' | 'update' | null>(null); const [name, setName] = useState('');
  const current = store.templates.find(t => t.id === store.activeTemplateId);
  const apply = (template: ResumeTemplate) => { store.applyTemplate(template); notify(`Załadowano szablon ${template.name}`); };
  const card = (template: ResumeTemplate) => <div className={`template-card ${store.activeTemplateId === template.id ? 'active' : ''}`} key={template.id}>
    <button className="template-apply" onClick={() => apply(template)} aria-label={`Wybierz szablon ${template.name}`} aria-pressed={store.activeTemplateId === template.id}>
      <MiniResume template={template} />{store.activeTemplateId === template.id && <span className="template-check"><Check size={12} /></span>}
      <div className="template-description"><strong>{template.name}</strong><span>{template.description}</span></div>
    </button>
    <div className="template-actions"><button className="text-button" onClick={() => { store.cloneTemplate(template); notify('Utworzono kopię szablonu'); }}><Copy size={12} />Klonuj</button>
      {!template.builtIn && <><button className="icon-button" aria-label={`Eksportuj szablon ${template.name}`} onClick={() => exportTemplateJson(template)}><ArrowDownToLine size={13} /></button><button className="icon-button danger" aria-label={`Usuń szablon ${template.name}`} onClick={() => { store.deleteTemplate(template.id); notify('Usunięto szablon'); }}><Trash2 size={13} /></button></>}
    </div>
  </div>;
  return <div className="template-manager"><div className="subheading"><span>KOLEKCJA FOLIO</span><span>03</span></div><div className="template-grid">{presets.map(card)}</div>
    <div className="own-templates-heading"><h3>Twoje szablony</h3><span>{store.templates.length.toString().padStart(2, '0')}</span></div>
    {store.templates.length > 0 ? <div className="template-grid">{store.templates.map(card)}</div> : <div className="empty-templates"><Sparkles size={22} strokeWidth={1.3} /><strong>Miejsce na Twój styl</strong><p>Dopracuj kolory i typografię.<br />Zapisz wygląd, by wrócić do niego później.</p></div>}
    <button className="primary-button full-width" onClick={() => { setName('Mój szablon'); setMode('new'); }}><Plus size={16} />Zapisz jako nowy szablon</button>
    {current && <button className="secondary-button full-width" onClick={() => { setName(current.name); setMode('update'); }}><Save size={15} />Zapisz zmiany szablonu</button>}
    <p className="panel-footnote">Szablon zapisuje wygląd i układ sekcji. Dane kandydata pozostają w Twoim dokumencie.</p>
    {mode && <Dialog title={mode === 'new' ? 'Zapisz swój szablon' : 'Zaktualizuj szablon'} onClose={() => setMode(null)}><form onSubmit={event => { event.preventDefault(); if (!name.trim()) return; if (mode === 'new') store.saveTemplate(name); else if (current) store.updateTemplate(current.id, name); setMode(null); notify('Szablon został zapisany'); }}>
      <p className="dialog-description">Twój obecny wygląd CV będzie dostępny w kolekcji własnych szablonów.</p><Field label="Nazwa szablonu" value={name} onChange={setName} placeholder="np. Minimalistyczny zielony" /><div className="dialog-actions"><button type="button" className="secondary-button" onClick={() => setMode(null)}>Anuluj</button><button type="submit" className="primary-button" disabled={!name.trim()}><Save size={14} />Zapisz szablon</button></div>
    </form></Dialog>}
  </div>;
}
