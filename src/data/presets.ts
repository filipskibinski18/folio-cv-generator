import type { ResumeTemplate, ResumeTheme, SectionId } from '../types/resume';
import { sectionIds, sectionLabels } from '../types/resume';

const sidebar: SectionId[] = ['skills', 'education', 'languages', 'certificates', 'links'];
const base: ResumeTheme = {
  headerStyle: 'accent', sectionStyle: 'underline',
  photo: { isVisible: true, shape: 'circle', size: 26, position: 'right' },
  typography: { fontFamily: 'Inter', headingFont: 'Inter', baseSize: 9, headingSize: 10, nameSize: 30, lineHeight: 1.4, tracking: 0 },
  colors: { accent: '#25564a', background: '#ffffff', text: '#263a36', muted: '#6d7c78', separator: '#dbe3df', sidebar: '#f3f6f4' },
  geometry: { margins: { top: 16, right: 17, bottom: 14, left: 17 }, sectionPadding: 0, sectionGap: 8, blockGap: 5, radius: 3, lineWidth: 0.6, columnGap: 22 },
  layout: 'sidebar-left', sidebarWidth: 32, skillStyle: 'text',
  sections: sectionIds.map(id => ({ id, title: sectionLabels[id], isVisible: true, column: sidebar.includes(id) ? 'sidebar' : 'main' })),
};
const template = (id: string, name: string, description: string, theme: ResumeTheme): ResumeTemplate => ({ id, name, description, theme, builtIn: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' });
export const presets: ResumeTemplate[] = [
  template('modern', 'Modern', 'Przejrzysty. Konkretny. Twój.', base),
  template('executive', 'Executive', 'Ponadczasowa elegancja.', {
    ...base, layout: 'single', typography: { ...base.typography, fontFamily: 'Lora', headingFont: 'Lora', baseSize: 9.5, nameSize: 29 },
    headerStyle: 'centered', photo: { ...base.photo, shape: 'square', position: 'left' },
    colors: { ...base.colors, accent: '#293b57', text: '#273346', muted: '#727986' },
    geometry: { ...base.geometry, sectionGap: 14, margins: { top: 18, right: 21, bottom: 18, left: 21 } },
  }),
  template('creative', 'Creative', 'Odważny akcent. Własny rytm.', {
    ...base, layout: 'sidebar-right', skillStyle: 'tags', sidebarWidth: 35,
    photo: { ...base.photo, shape: 'rounded', size: 29 }, sectionStyle: 'filled',
    colors: { ...base.colors, accent: '#ae5b3c', text: '#3c302b', muted: '#8b776e', separator: '#ecddd4', sidebar: '#fcf3ed' },
    typography: { ...base.typography, headingFont: 'Lora', nameSize: 34 },
    geometry: { ...base.geometry, radius: 7, lineWidth: 1.1 },
  }),
  template('blueprint', 'Blueprint', 'Technologia w dobrym świetle.', {
    ...base, headerStyle: 'banner', sectionStyle: 'filled', sidebarWidth: 30,
    typography: { ...base.typography, fontFamily: 'Roboto', headingFont: 'Roboto', nameSize: 29, baseSize: 8.5 },
    colors: { accent: '#244967', background: '#ffffff', text: '#263b4d', muted: '#637887', separator: '#d9e5ed', sidebar: '#edf4f8' },
    photo: { ...base.photo, shape: 'rounded', size: 28 },
    geometry: { ...base.geometry, radius: 5, sectionGap: 8, columnGap: 18, margins: { ...base.geometry.margins, top: 14 } },
  }),
  template('editorial', 'Editorial', 'Typografia z charakterem.', {
    ...base, layout: 'single', headerStyle: 'centered', sectionStyle: 'plain',
    typography: { ...base.typography, headingFont: 'Lora', nameSize: 34, baseSize: 9.5 },
    colors: { accent: '#793f57', background: '#fffdfb', text: '#3f3036', muted: '#81717a', separator: '#e8dce0', sidebar: '#f6ecef' },
    photo: { ...base.photo, size: 30, position: 'left' },
    geometry: { ...base.geometry, sectionGap: 13, lineWidth: 0, margins: { top: 19, right: 21, bottom: 18, left: 21 } },
  }),
  template('nordic', 'Nordic', 'Spokój. Światło. Przestrzeń.', {
    ...base, layout: 'sidebar-right', sectionStyle: 'plain', skillStyle: 'levels', sidebarWidth: 30,
    colors: { accent: '#2a7070', background: '#ffffff', text: '#2c4143', muted: '#698083', separator: '#dbe8e7', sidebar: '#eff7f6' },
    photo: { ...base.photo, shape: 'square', size: 25, position: 'left' },
    typography: { ...base.typography, nameSize: 28 }, geometry: { ...base.geometry, radius: 0, sectionGap: 12, lineWidth: 0 },
  }),
  template('atelier', 'Atelier', 'Ciepły papier. Nowa perspektywa.', {
    ...base, layout: 'grid', headerStyle: 'centered', sectionStyle: 'filled', skillStyle: 'tags',
    colors: { accent: '#87622d', background: '#fffdf7', text: '#453d30', muted: '#827763', separator: '#e8ddc7', sidebar: '#f5eedf' },
    typography: { ...base.typography, headingFont: 'Lora', nameSize: 32, baseSize: 8.5 },
    photo: { ...base.photo, shape: 'rounded', size: 27 },
    geometry: { ...base.geometry, radius: 6, columnGap: 14, sectionGap: 9, blockGap: 5 },
  }),
  template('midnight', 'Midnight', 'Wyrazista forma. Mocny początek.', {
    ...base, layout: 'single', headerStyle: 'banner', sectionStyle: 'underline', skillStyle: 'tags',
    colors: { accent: '#56466f', background: '#ffffff', text: '#342e42', muted: '#81768c', separator: '#e2dce9', sidebar: '#f2eef8' },
    typography: { ...base.typography, headingFont: 'Lora', nameSize: 31 },
    photo: { ...base.photo, size: 30 },
    geometry: { ...base.geometry, radius: 8, sectionGap: 10, lineWidth: 1, margins: { top: 16, right: 18, bottom: 16, left: 18 } },
  }),
];
export const defaultTheme = structuredClone(base);
