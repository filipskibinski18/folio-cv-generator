import { tr } from '../../lib/i18n';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Award, BookOpen, BriefcaseBusiness, ChevronDown, Eye, EyeOff, FileText, FileUp, Globe2, GripVertical, Languages, Layers3, Link2, ShieldCheck, UserRound } from 'lucide-react';
import type { ResumeTheme, SectionId } from '../../types/resume';
import { useResumeStore } from '../../store/useResumeStore';
import { PersonalEditor, SectionEditor } from './DataEditor';
import { PhotoEditor } from './PhotoEditor';

export function ContentEditor() {
  const [active, setActive] = useState<SectionId | 'personal'>('personal');
  const sections = useResumeStore(state => state.theme.sections);
  const current = sections.find(section => section.id === active);
  const title = active === 'personal' ? tr('Dane osobowe') : current?.title || '';
  return <div className="content-editor">
    <div className="content-heading">
      <div><h1>{title}</h1><p>{tr(active === 'personal' ? 'Dane kontaktowe w Twoim CV.' : 'Edytuj treść wybranej sekcji.')}</p>
        <label className="section-picker"><span className="sr-only">{tr('Wybierz sekcję CV')}</span><select value={active} onChange={event => setActive(event.target.value as SectionId | 'personal')}><option value="personal">{tr('Dane osobowe')}</option>{sections.map(section => <option key={section.id} value={section.id}>{section.title}</option>)}</select></label>
      </div>
      {active === 'personal' && <PhotoEditor compact />}
    </div>
    <div key={active}>{active === 'personal' ? <PersonalEditor showPhoto={false} /> : <SectionEditor section={active} />}</div>
  </div>;
}

const icons = { summary: FileText, experience: BriefcaseBusiness, education: BookOpen, skills: Award, projects: Layers3, certificates: ShieldCheck, languages: Languages, links: Link2, consent: Globe2 };
function SortableSection({ section, open, onToggle, layoutOnly }: { section: ResumeTheme['sections'][number]; open: boolean; onToggle: () => void; layoutOnly: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const data = useResumeStore(state => state.data); const theme = useResumeStore(state => state.theme); const updateTheme = useResumeStore(state => state.updateTheme);
  const Icon = icons[section.id];
  const value = data[section.id]; const count = typeof value === 'string' ? value.trim() ? 1 : 0 : value.length;
  const update = (patch: Partial<typeof section>) => updateTheme({ sections: theme.sections.map(s => s.id === section.id ? { ...s, ...patch } : s) });
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.65 : 1, zIndex: isDragging ? 2 : undefined };
  return <div ref={setNodeRef} style={style} className={`section-accordion ${open ? 'expanded' : ''} ${!section.isVisible ? 'section-hidden' : ''}`}>
    <div className="section-row"><button className="drag-handle" aria-label={`${tr("Przenieś sekcję")} ${section.title}`} {...attributes} {...listeners}><GripVertical size={15} /></button>
      <button className="section-trigger" onClick={onToggle} aria-expanded={open}><span className="section-icon"><Icon size={17} /></span><span>{section.title}</span><span className="section-count">{count}</span><ChevronDown size={15} className={open ? 'rotated' : ''} /></button>
      <button className="visibility-button" aria-label={`${tr(section.isVisible ? "Ukryj sekcję" : "Pokaż sekcję")} ${section.title}`} aria-pressed={section.isVisible} onClick={() => update({ isVisible: !section.isVisible })}>{section.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
    </div>
    {open && (layoutOnly ? <div className="form-content"><label className="field"><span>{tr("Nagłówek sekcji")}</span><input value={section.title} maxLength={300} onChange={event => update({ title: event.target.value })} /></label><label className="field"><span>{tr("Kolumna")}</span><select value={section.column} onChange={event => update({ column: event.target.value as 'main' | 'sidebar' })}><option value="main">{tr("Główna")}</option><option value="sidebar">{tr("Boczna")}</option></select></label></div> : <SectionEditor section={section.id} />)}
  </div>;
}
export function SectionList({ layoutOnly = false, onOpenImport }: { layoutOnly?: boolean; onOpenImport?: () => void }) {
  const [open, setOpen] = useState<string | null>(layoutOnly ? null : 'personal');
  const sections = useResumeStore(state => state.theme.sections); const reorder = useResumeStore(state => state.reorderSections);
  const sectionName = (id: string | number) => sections.find(section => section.id === id)?.title || String(id);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 7 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  return <div className="section-list">
    {!layoutOnly && onOpenImport && (
      <div className="cv-import-banner">
        <div className="cv-import-banner-content">
          <strong>{tr("Masz już gotowe CV?")}</strong>
          <span>{tr("Wgraj plik PDF lub DOCX — automatycznie uzupełnimy pola formularza.")}</span>
        </div>
        <button type="button" className="primary-button import-cv-cta" onClick={onOpenImport} style={{ fontSize: 10, padding: '7px 11px', minHeight: 32 }}>
          <FileUp size={13} />
          <span>{tr("Wgraj CV")}</span>
        </button>
      </div>
    )}
    {!layoutOnly && <div className={`section-accordion personal-accordion ${open === 'personal' ? 'expanded' : ''}`}><button className="personal-trigger" onClick={() => setOpen(open === 'personal' ? null : 'personal')} aria-expanded={open === 'personal'}><span className="section-icon"><UserRound size={18} /></span><span>{tr("Dane osobowe")}</span><span className="required-dot" /><ChevronDown size={15} className={open === 'personal' ? 'rotated' : ''} /></button>{open === 'personal' && <PersonalEditor />}</div>}
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => { if (over) reorder(active.id as SectionId, over.id as SectionId); }} accessibility={{ screenReaderInstructions: { draggable: 'Naciśnij spację, aby chwycić sekcję. Przesuń strzałkami i naciśnij spację, aby ją upuścić.' }, announcements: {
      onDragStart: ({ active }) => `Chwycono sekcję ${sectionName(active.id)}.`,
      onDragOver: ({ active, over }) => over ? `Sekcja ${sectionName(active.id)} nad sekcją ${sectionName(over.id)}.` : tr("Sekcja poza listą."),
      onDragEnd: ({ active, over }) => over ? `Przeniesiono sekcję ${sectionName(active.id)} na pozycję sekcji ${sectionName(over.id)}.` : tr("Kolejność pozostaje bez zmian."),
      onDragCancel: () => 'Anulowano przenoszenie sekcji.',
    } }}>
      <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>{sections.map(section => <SortableSection key={section.id} section={section} open={open === section.id} onToggle={() => setOpen(open === section.id ? null : section.id)} layoutOnly={layoutOnly} />)}</SortableContext>
    </DndContext>
    <div className="list-hint"><GripVertical size={14} />{tr("Przeciągnij sekcje, aby zmienić ich kolejność.")}</div>
  </div>;
}
