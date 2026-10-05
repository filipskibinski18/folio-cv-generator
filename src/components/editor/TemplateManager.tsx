import { tr } from '../../lib/i18n';
import { useState } from 'react';
import { ArrowDownToLine, Check, Copy, Plus, Save, Trash2, Sparkles } from 'lucide-react';
import { presets } from '../../data/presets';
import type { ResumeTemplate, TemplateCategory } from '../../types/resume';
import { useResumeStore } from '../../store/useResumeStore';
import { exportTemplateJson } from '../../services/projectJson';
import { Dialog } from '../Dialog';
import { Field, SelectField } from './Fields';
import { categoriesFor, templateCategories } from '../../data/templateCategories';
import { iconPaths } from '../../lib/sectionIcons';
import { contrastColor, photoRadius } from '../../lib/photo';

export function MiniResume({ template }: { template: ResumeTemplate }) {
  const theme = template.theme;
  const isSidebarPhoto = theme.photo.isVisible && (theme.photo.position === 'sidebar' || theme.photo.position === 'top-left') && theme.layout !== 'single';
  const isPortrait = theme.photo.shape === 'portrait' || theme.photo.shape === 'portrait-rounded';
  const photoRadiusVal = photoRadius(theme.photo.shape, 21);
  return <div className={`mini-resume mini-${theme.layout} mini-${theme.headerStyle} mini-section-${theme.sectionStyle} mini-entry-${theme.design.entryStyle} mini-decoration-${theme.design.decoration} mini-name-${theme.design.nameStyle}`} style={{ '--mini-accent': theme.colors.accent, '--mini-sidebar': theme.colors.sidebar, '--mini-background': theme.colors.background, '--mini-text': theme.colors.text, '--mini-muted': theme.colors.muted, '--mini-header-text': contrastColor(theme.colors.accent), '--mini-font': theme.typography.headingFont } as React.CSSProperties} aria-hidden="true">
    <div className="mini-page">
      {!isSidebarPhoto && (
        <div className="mini-header" style={{ flexDirection: (theme.photo.position === 'left' || theme.photo.position === 'top-left') ? 'row-reverse' : 'row' }}>
          <i />
          <div className="mini-identity"><b>{tr("Aleksandra")}<br />{tr("Nowak")}</b><em /></div>
          {theme.photo.isVisible && <div className="mini-photo" style={{ width: 21, height: isPortrait ? 26 : 21, borderRadius: photoRadiusVal }}><span /><small /></div>}
        </div>
      )}
      <div className="mini-columns">
        <div className="mini-side">
          {isSidebarPhoto && theme.photo.isVisible && (
            <div className="mini-photo mini-photo-side" style={{ width: 21, height: isPortrait ? 26 : 21, borderRadius: photoRadiusVal, margin: '0 auto 6px' }}><span /><small /></div>
          )}
          {[1, 2, 3].map(i => <div className="mini-section" key={i}><strong>{theme.icons.style !== 'none' && <small className={`mini-icon mini-icon-${theme.icons.style}`}><svg viewBox="0 0 24 24" width="6" height="6"><path d={iconPaths.briefcase} stroke="currentColor" strokeWidth="2" fill="none" /></svg></small>}</strong>{[1, 2, 3].map(j => <span key={j} />)}</div>)}
        </div>
        <div className="mini-main">
          {isSidebarPhoto && (
            <div className="mini-header" style={{ marginBottom: 6, paddingLeft: 0 }}>
              <div className="mini-identity"><b>{tr("Aleksandra")}<br />{tr("Nowak")}</b><em /></div>
            </div>
          )}
          {[1, 2, 3].map(i => <div className="mini-section" key={i}><strong>{theme.icons.style !== 'none' && <small className={`mini-icon mini-icon-${theme.icons.style}`}><svg viewBox="0 0 24 24" width="6" height="6"><path d={iconPaths.briefcase} stroke="currentColor" strokeWidth="2" fill="none" /></svg></small>}</strong>{[1, 2, 3, 4].map(j => <span key={j} />)}</div>)}
        </div>
      </div>
    </div>
  </div>;
}
/** Built-in templates show a real first page rendered by `npm run thumbnails`; the sketch is only a fallback. */
function TemplateThumbnail({ template }: { template: ResumeTemplate }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <MiniResume template={template} />;
  return <div className="template-thumbnail" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}thumbnails/${template.id}.webp`} alt="" loading="lazy" decoding="async" width={360} height={509} onError={() => setFailed(true)} /></div>;
}
export function TemplateManager({ notify }: { notify: (message: string) => void }) {
  const store = useResumeStore(); const [mode, setMode] = useState<'new' | 'update' | null>(null); const [name, setName] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState(''); const [visual, setVisual] = useState('all'); const [layout, setLayout] = useState('all');
  const matches = (template: ResumeTemplate) => {
    const theme = template.theme;
    const searchable = [template.name, tr(template.description), theme.typography.headingFont, ...categoriesFor(template).map(id => tr(templateCategories.find(category => category.id === id)?.label))].join(' ').toLocaleLowerCase();
    return searchable.includes(search.trim().toLocaleLowerCase()) && (layout === 'all' || (layout === 'single' ? theme.layout === 'single' : theme.layout !== 'single')) &&
      (visual === 'all' || (visual === 'icons' ? theme.icons.style !== 'none' || theme.design.contactIcons : visual === 'simple' ? theme.icons.style === 'none' && !theme.design.contactIcons : visual === 'photo' ? theme.photo.isVisible : !theme.photo.isVisible));
  };
  const shown = presets.filter(template => matches(template) && (filter === 'all' || categoriesFor(template).includes(filter as TemplateCategory)));
  const own = store.templates.filter(matches);
  const current = store.templates.find(t => t.id === store.activeTemplateId);
  const apply = (template: ResumeTemplate) => { store.applyTemplate(template); notify(`${tr("Załadowano szablon")} ${template.name}`); };
  const card = (template: ResumeTemplate) => <div className={`template-card ${store.activeTemplateId === template.id ? 'active' : ''}`} key={template.id}>
    <button className="template-apply" onClick={() => apply(template)} aria-label={`${tr("Wybierz szablon")} ${template.name}`} aria-pressed={store.activeTemplateId === template.id}>
      {template.builtIn ? <TemplateThumbnail template={template} /> : <MiniResume template={template} />}{store.activeTemplateId === template.id && <span className="template-check"><Check size={12} /></span>}
      <div className="template-description"><strong>{template.name}</strong><span>{tr(template.description)}</span></div>
    </button>
    <div className="template-actions"><button className="text-button" onClick={() => { store.cloneTemplate(template); notify(tr("Utworzono kopię szablonu")); }}><Copy size={12} />{tr("Klonuj")}</button>
      {!template.builtIn && <><button className="icon-button" aria-label={`${tr("Eksportuj szablon")} ${template.name}`} onClick={() => exportTemplateJson(template)}><ArrowDownToLine size={13} /></button><button className="icon-button danger" aria-label={`${tr("Usuń szablon")} ${template.name}`} onClick={() => { store.deleteTemplate(template.id); notify(tr("Usunięto szablon")); }}><Trash2 size={13} /></button></>}
    </div>
  </div>;
  return <div className="template-manager"><div className="subheading"><span>{tr("KOLEKCJA FOLIO")}</span><span>{presets.length.toString().padStart(2, '0')}</span></div><p className="collection-note">{presets.length} {tr("stylów — od prostych po szablony z ikonkami.")}</p>
    <Field label="Szukaj szablonu" value={search} onChange={setSearch} placeholder="Nazwa, styl lub czcionka" />
    <div className="template-categories" aria-label={tr('Kategorie szablonów')}>
      {[{ id: 'all', label: 'Wszystkie' }, ...templateCategories, { id: 'personal', label: 'Moje' }].map(category => <button key={category.id} aria-pressed={filter === category.id} onClick={() => setFilter(category.id)}>{tr(category.label)}<span>{category.id === 'personal' ? own.length : presets.filter(template => matches(template) && (category.id === 'all' || categoriesFor(template).includes(category.id as TemplateCategory))).length}</span></button>)}
    </div>
    <div className="field-grid template-extra-filters">
      <SelectField label="Elementy" value={visual} onChange={setVisual} options={[{ value: 'all', label: 'Wszystkie' }, { value: 'icons', label: 'Z ikonkami' }, { value: 'simple', label: 'Bez ikonek' }, { value: 'photo', label: 'Ze zdjęciem' }, { value: 'no-photo', label: 'Bez zdjęcia' }]} />
      <SelectField label="Kompozycja" value={layout} onChange={setLayout} options={[{ value: 'all', label: 'Wszystkie' }, { value: 'single', label: 'Jedna kolumna' }, { value: 'columns', label: 'Dwie kolumny' }]} />
    </div>
    <p className="template-results" role="status">{tr('Wyniki')}: {filter === 'personal' ? own.length : shown.length}{filter === 'all' && own.length > 0 ? ` + ${own.length} ${tr('własnych')}` : ''}</p>
    {filter !== 'personal' && templateCategories.filter(category => filter === 'all' || category.id === filter).map(category => {
      const items = shown.filter(template => filter !== 'all' || categoriesFor(template)[0] === category.id);
      return items.length ? <section className="template-category-group" key={category.id}><div className="own-templates-heading"><h3>{tr(category.label)}</h3><span>{items.length}</span></div><p className="collection-note">{tr(category.description)}</p><div className="template-grid">{items.map(card)}</div></section> : null;
    })}
    {filter !== 'personal' && shown.length === 0 && <p className="empty-templates">{tr('Brak szablonów dla tych filtrów.')}<button className="text-button" onClick={() => { setSearch(''); setVisual('all'); setLayout('all'); setFilter('all'); }}>{tr('Wyczyść filtry')}</button></p>}
    {(filter === 'all' || filter === 'personal') && <><div className="own-templates-heading"><h3>{tr("Twoje szablony")}</h3><span>{own.length.toString().padStart(2, '0')}</span></div>
    {own.length > 0 ? <div className="template-grid">{own.map(card)}</div> : <div className="empty-templates"><Sparkles size={22} strokeWidth={1.3} /><strong>{tr("Miejsce na Twój styl")}</strong><p>{tr("Dopracuj kolory i typografię.")}<br />{tr("Zapisz wygląd, by wrócić do niego później.")}</p></div>}</>}
    <button className="primary-button full-width" onClick={() => { setName(tr("Mój szablon")); setMode('new'); }}><Plus size={16} />{tr("Zapisz jako nowy szablon")}</button>
    {current && <button className="secondary-button full-width" onClick={() => { setName(current.name); setMode('update'); }}><Save size={15} />{tr("Zapisz zmiany szablonu")}</button>}
    <p className="panel-footnote">{tr("Szablon zapisuje wygląd i układ sekcji. Dane kandydata pozostają w Twoim dokumencie.")}</p>
    {mode && <Dialog title={mode === 'new' ? tr("Zapisz swój szablon") : tr('Zaktualizuj szablon')} onClose={() => setMode(null)}><form onSubmit={event => { event.preventDefault(); if (!name.trim()) return; if (mode === 'new') store.saveTemplate(name); else if (current) store.updateTemplate(current.id, name); setMode(null); notify(tr("Szablon został zapisany")); }}>
      <p className="dialog-description">{tr("Twój obecny wygląd CV będzie dostępny w kolekcji własnych szablonów.")}</p><Field label={tr("Nazwa szablonu")} value={name} onChange={setName} placeholder={tr("np. Minimalistyczny zielony")} /><div className="dialog-actions"><button type="button" className="secondary-button" onClick={() => setMode(null)}>{tr("Anuluj")}</button><button type="submit" className="primary-button" disabled={!name.trim()}><Save size={14} />{tr("Zapisz szablon")}</button></div>
    </form></Dialog>}
  </div>;
}
