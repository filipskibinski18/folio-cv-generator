import { tr } from '../../lib/i18n';
import { useEffect, useRef } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import type { EditorTarget } from '../../lib/previewTargets';
import { useResumeStore } from '../../store/useResumeStore';
import { PersonalEditor, SectionEditor } from './DataEditor';
import { PhotoEditor } from './PhotoEditor';
import { Field, SelectField } from './Fields';

export function SelectedElementEditor({ target, onClose }: { target: EditorTarget; onClose: () => void }) {
  const { data, theme, updateTheme } = useResumeStore();
  const panel = useRef<HTMLDivElement>(null);
  const section = theme.sections.find(section => section.id === target.section);
  const value = target.section === 'personal' ? undefined : data[target.section];
  const item = Array.isArray(value) ? value.find(item => item.id === target.itemId) : undefined;
  const exists = !target.itemId || Boolean(item);
  useEffect(() => { if (!exists) onClose(); }, [exists, onClose]);
  useEffect(() => {
    panel.current?.querySelector<HTMLElement>('input:not([type="file"]), textarea, select')?.focus({ preventScroll: true });
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !document.querySelector('dialog[open], [role="dialog"]')) onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);
  const name = item && ('company' in item ? item.company : 'institution' in item ? item.institution : 'label' in item ? item.label : 'name' in item ? item.name : '');
  const title = target.mode === 'photo' ? tr("Zdjęcie profilowe") : target.section === 'personal' ? 'Dane osobowe' : section?.title || tr('Edycja elementu');
  const updateSection = (patch: Partial<NonNullable<typeof section>>) => updateTheme({ sections: theme.sections.map(s => s.id === target.section ? { ...s, ...patch } : s) });
  return <div className="selected-element-editor" ref={panel}>
    <div className="selected-editor-heading"><button type="button" className="text-button" onClick={onClose}><ArrowLeft size={14} />{tr("Wróć do panelu")}</button><span className="selected-editor-live"><Check size={12} />{tr("Na żywo")}</span></div>
    <h2>{title}</h2>{name && <p className="selected-editor-description">{name}</p>}
    <p className="selected-editor-description">{tr("Zmiany pojawiają się w podglądzie i zapisują automatycznie.")}</p>
    {target.mode === 'layout' && section ? <div className="form-content">
      <Field label={tr("Nagłówek sekcji")} value={section.title} onChange={title => updateSection({ title })} />
      <SelectField label={tr("Ikonka sekcji")} value={section.icon} onChange={value => updateSection({ icon: value as typeof section.icon })} options={['auto', 'none', 'user', 'briefcase', 'book', 'code', 'award', 'globe', 'link', 'shield'].map(value => ({ value, label: ({ auto: 'Automatyczna', none: 'Brak', user: 'Osoba', briefcase: 'Praca', book: 'Książka', code: 'Kod', award: 'Nagroda', globe: 'Glob', link: 'Link', shield: 'Tarcza' } as Record<string, string>)[value] }))} />
      <SelectField label={tr("Kolumna")} value={section.column} onChange={column => updateSection({ column: column as 'main' | 'sidebar' })} options={[{ value: 'main', label: 'Główna' }, { value: 'sidebar', label: 'Boczna' }]} />
      <label className="check-field"><input type="checkbox" checked={section.isVisible} onChange={event => updateSection({ isVisible: event.target.checked })} />{tr("Pokaż sekcję w CV")}</label>
    </div> : target.mode === 'photo' ? <PhotoEditor initialShowSettings /> : target.section === 'personal' ? <PersonalEditor /> : <SectionEditor section={target.section} itemId={target.itemId} />}
    <button type="button" className="primary-button full-width" onClick={onClose}><Check size={14} />{tr("Gotowe")}</button>
  </div>;
}
