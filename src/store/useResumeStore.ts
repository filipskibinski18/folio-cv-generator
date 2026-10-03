import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { defaultTheme, presets } from '../data/presets';
import { sampleResume } from '../data/sampleResume';
import { resumeDataSchema, resumeThemeSchema, templateSchema } from '../types/resume';
import type { ResumeData, ResumeTemplate, ResumeTheme, SectionId } from '../types/resume';
import { uid } from '../lib/format';
import { withCvLanguage } from '../lib/cvLanguage';
import { safeStorage } from '../lib/storage';

interface Snapshot { data: ResumeData; theme: ResumeTheme; activeTemplateId: string }
interface ResumeState {
  name: string; data: ResumeData; theme: ResumeTheme; templates: ResumeTemplate[];
  activeTemplateId: string; updatedAt: string; history: Snapshot[]; future: Snapshot[];
  setName: (name: string) => void;
  setData: (data: ResumeData) => void;
  updatePersonal: (patch: Partial<ResumeData['personal']>) => void;
  updateTheme: (patch: Partial<ResumeTheme>) => void;
  reorderSections: (active: SectionId, over: SectionId) => void;
  applyTemplate: (template: ResumeTemplate) => void;
  saveTemplate: (name: string) => string;
  updateTemplate: (id: string, name: string) => void;
  deleteTemplate: (id: string) => void;
  cloneTemplate: (template: ResumeTemplate) => void;
  importTemplate: (template: ResumeTemplate) => void;
  importProject: (name: string, data: ResumeData, theme: ResumeTheme) => void;
  undo: () => void; redo: () => void; restoreExample: () => void;
}
let lastHistoryAt = 0;
const historyPatch = (state: ResumeState, force = false) => {
  const now = Date.now();
  const capture = force || now - lastHistoryAt > 600;
  if (capture) lastHistoryAt = now;
  return { history: capture ? [...state.history.slice(-39), { data: state.data, theme: state.theme, activeTemplateId: state.activeTemplateId }] : state.history, future: [], updatedAt: new Date().toISOString() };
};
export const useResumeStore = create<ResumeState>()(persist((set) => ({
  name: 'Moje CV', data: structuredClone(sampleResume), theme: structuredClone(defaultTheme),
  templates: [], activeTemplateId: 'modern', updatedAt: new Date().toISOString(), history: [], future: [],
  setName: name => set({ name, updatedAt: new Date().toISOString() }),
  setData: data => set(state => ({ ...historyPatch(state), data })),
  updatePersonal: patch => set(state => ({ ...historyPatch(state), data: { ...state.data, personal: { ...state.data.personal, ...patch } } })),
  updateTheme: patch => set(state => ({ ...historyPatch(state), theme: { ...state.theme, ...patch } })),
  reorderSections: (active, over) => set(state => {
    const sections = [...state.theme.sections]; const from = sections.findIndex(s => s.id === active); const to = sections.findIndex(s => s.id === over);
    if (from < 0 || to < 0 || from === to) return state;
    sections.splice(to, 0, sections.splice(from, 1)[0]);
    return { ...historyPatch(state, true), theme: { ...state.theme, sections } };
  }),
  applyTemplate: template => set(state => ({ ...historyPatch(state, true), theme: { ...withCvLanguage(structuredClone(template.theme), state.theme.language), keepSectionsTogether: state.theme.keepSectionsTogether }, activeTemplateId: template.id })),
  saveTemplate: name => {
    const id = uid(); const date = new Date().toISOString();
    set(state => ({ templates: [...state.templates, { id, name: name.trim().slice(0, 80) || 'Mój szablon', description: 'Twój własny projekt', theme: structuredClone(state.theme), builtIn: false, createdAt: date, updatedAt: date }], activeTemplateId: id }));
    return id;
  },
  updateTemplate: (id, name) => set(state => ({ templates: state.templates.map(t => t.id === id ? { ...t, name: name.trim().slice(0, 80) || t.name, theme: structuredClone(state.theme), updatedAt: new Date().toISOString() } : t) })),
  deleteTemplate: id => set(state => ({ templates: state.templates.filter(t => t.id !== id), activeTemplateId: state.activeTemplateId === id ? '' : state.activeTemplateId })),
  cloneTemplate: template => set(state => {
    const date = new Date().toISOString(); return { templates: [...state.templates, { ...structuredClone(template), id: uid(), name: `${template.name} — kopia`.slice(0, 80), builtIn: false, createdAt: date, updatedAt: date }] };
  }),
  importTemplate: template => set(state => ({ templates: [...state.templates, { ...structuredClone(template), id: uid(), builtIn: false }] })),
  importProject: (name, data, theme) => set(state => ({ ...historyPatch(state, true), name, data, theme, activeTemplateId: '' })),
  undo: () => set(state => {
    const previous = state.history.at(-1); if (!previous) return state;
    lastHistoryAt = 0;
    return { ...previous, history: state.history.slice(0, -1), future: [{ data: state.data, theme: state.theme, activeTemplateId: state.activeTemplateId }, ...state.future], updatedAt: new Date().toISOString() };
  }),
  redo: () => set(state => {
    const next = state.future[0]; if (!next) return state;
    lastHistoryAt = 0;
    return { ...next, history: [...state.history, { data: state.data, theme: state.theme, activeTemplateId: state.activeTemplateId }], future: state.future.slice(1), updatedAt: new Date().toISOString() };
  }),
  restoreExample: () => set(state => ({ ...historyPatch(state, true), data: structuredClone(sampleResume), theme: structuredClone(presets[0].theme), activeTemplateId: 'modern' })),
}), {
  name: 'folio-resume-v1', version: 1,
  storage: createJSONStorage(() => safeStorage),
  partialize: state => ({ name: state.name, data: state.data, theme: state.theme, templates: state.templates, activeTemplateId: state.activeTemplateId, updatedAt: state.updatedAt }),
  merge: (persisted, current) => {
    if (!persisted || typeof persisted !== 'object') return current;
    const saved = persisted as Partial<ResumeState>;
    const data = resumeDataSchema.safeParse(saved.data); const theme = resumeThemeSchema.safeParse(saved.theme);
    return { ...current, name: typeof saved.name === 'string' ? saved.name.slice(0, 300) : current.name,
      data: data.success ? data.data : current.data, theme: theme.success ? theme.data : current.theme,
      templates: Array.isArray(saved.templates) ? saved.templates.flatMap(t => { const parsed = templateSchema.safeParse(t); return parsed.success ? [{ ...parsed.data, builtIn: false }] : []; }) : [],
      activeTemplateId: typeof saved.activeTemplateId === 'string' ? saved.activeTemplateId : current.activeTemplateId,
      updatedAt: typeof saved.updatedAt === 'string' ? saved.updatedAt : current.updatedAt,
    };
  },
}));
