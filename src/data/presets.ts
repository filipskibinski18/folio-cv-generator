import type { ResumeTemplate, ResumeTheme, SectionId } from '../types/resume';
import { sectionIds, sectionLabels } from '../types/resume';

const sidebar: SectionId[] = ['skills', 'education', 'languages', 'certificates', 'links'];
const base: ResumeTheme = {
  typography: { fontFamily: 'Inter', headingFont: 'Inter', baseSize: 9, headingSize: 10, nameSize: 30, lineHeight: 1.4, tracking: 0 },
  colors: { accent: '#25564a', background: '#ffffff', text: '#263a36', muted: '#6d7c78', separator: '#dbe3df', sidebar: '#f3f6f4' },
  geometry: { margins: { top: 17, right: 17, bottom: 16, left: 17 }, sectionPadding: 0, sectionGap: 10, blockGap: 6, radius: 3, lineWidth: 0.6, columnGap: 22 },
  layout: 'sidebar-left', sidebarWidth: 32, skillStyle: 'text',
  sections: sectionIds.map(id => ({ id, title: sectionLabels[id], isVisible: true, column: sidebar.includes(id) ? 'sidebar' : 'main' })),
};
const template = (id: string, name: string, description: string, theme: ResumeTheme): ResumeTemplate => ({ id, name, description, theme, builtIn: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' });
export const presets: ResumeTemplate[] = [
  template('modern', 'Modern', 'Przejrzysty. Konkretny. Twój.', base),
  template('executive', 'Executive', 'Ponadczasowa elegancja.', {
    ...base, layout: 'single', typography: { ...base.typography, fontFamily: 'Lora', headingFont: 'Lora', baseSize: 9.5, nameSize: 29 },
    colors: { ...base.colors, accent: '#293b57', text: '#273346', muted: '#727986' },
    geometry: { ...base.geometry, sectionGap: 14, margins: { top: 18, right: 21, bottom: 18, left: 21 } },
  }),
  template('creative', 'Creative', 'Odważny akcent. Własny rytm.', {
    ...base, layout: 'sidebar-right', skillStyle: 'tags', sidebarWidth: 35,
    colors: { ...base.colors, accent: '#ae5b3c', text: '#3c302b', muted: '#8b776e', separator: '#ecddd4', sidebar: '#fcf3ed' },
    typography: { ...base.typography, headingFont: 'Lora', nameSize: 34 },
    geometry: { ...base.geometry, radius: 7, lineWidth: 1.1 },
  }),
];
export const defaultTheme = structuredClone(base);
