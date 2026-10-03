import type { ResumeTemplate, ResumeTheme, SectionId } from '../types/resume';
import { sectionIds, sectionLabels } from '../types/resume';
import { createDesignPresets } from './designPresets';

const sidebarSections: SectionId[] = ['skills', 'languages', 'certificates', 'links'];
const base: ResumeTheme = {
  language: 'pl', icons: { style: 'none', size: 14 },
  keepSectionsTogether: true,
  design: { entryStyle: 'plain', decoration: 'none', nameStyle: 'natural', contactPlacement: 'header', contactIcons: false, skillMeter: 'numbers', sidebarPadding: 12, continuationGap: 24 },
  headerStyle: 'accent', sectionStyle: 'underline',
  photo: { isVisible: true, shape: 'circle', size: 42, position: 'sidebar', borderWidth: 2, borderColor: '#ffffff' },
  typography: { fontFamily: 'Inter', headingFont: 'Inter', baseSize: 8.8, headingSize: 10, nameSize: 28, lineHeight: 1.38, tracking: 0 },
  colors: { accent: '#1e3a5f', background: '#ffffff', text: '#1e293b', muted: '#64748b', separator: '#e2e8f0', sidebar: '#1a3353' },
  geometry: { margins: { top: 14, right: 16, bottom: 14, left: 16 }, sectionPadding: 0, sectionGap: 7, blockGap: 4, radius: 4, lineWidth: 0.6, columnGap: 20 },
  layout: 'sidebar-left', sidebarWidth: 32, skillStyle: 'text',
  sections: sectionIds.map(id => ({ id, icon: 'auto', title: sectionLabels[id], isVisible: true, column: sidebarSections.includes(id) ? 'sidebar' : 'main' })),
};
const template = (id: string, name: string, description: string, theme: ResumeTheme): ResumeTemplate => ({ id, name, description, theme, builtIn: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' });

export const presets: ResumeTemplate[] = [
  template('modern', 'Modern Navy', 'Głęboki granat z dużym, okrągłym zdjęciem w lewym górnym rogu.', {
    ...base,
    photo: { ...base.photo, shape: 'circle', size: 44, position: 'sidebar', borderWidth: 2.5, borderColor: '#ffffff' },
    colors: { accent: '#1e3a5f', background: '#ffffff', text: '#1e293b', muted: '#64748b', separator: '#dbeafe', sidebar: '#172e4d' },
    geometry: { ...base.geometry, sectionGap: 6.5, blockGap: 3.5, margins: { top: 13, right: 15, bottom: 13, left: 15 } },
  }),
  template('executive', 'Executive Serif', 'Ponadczasowa elegancja z tradycyjnym, szeryfowym nagłówkiem.', {
    ...base, layout: 'single', headerStyle: 'centered', sectionStyle: 'underline',
    typography: { ...base.typography, fontFamily: 'Lora', headingFont: 'Lora', baseSize: 9.2, nameSize: 29 },
    photo: { ...base.photo, shape: 'square', position: 'left', size: 32, borderWidth: 1, borderColor: '#cbd5e1' },
    colors: { ...base.colors, accent: '#293b57', text: '#1e293b', muted: '#64748b', separator: '#cbd5e1' },
    geometry: { ...base.geometry, sectionGap: 11, margins: { top: 16, right: 19, bottom: 16, left: 19 } },
  }),
  template('creative', 'Charcoal Studio', 'Mocna grafitowa kolumna boczna i wysokie pionowe zdjęcie 3:4.', {
    ...base,
    sidebarWidth: 32,
    photo: { ...base.photo, shape: 'portrait-rounded', size: 46, position: 'sidebar', borderWidth: 0 },
    colors: { accent: '#1e2024', background: '#ffffff', text: '#1e2024', muted: '#71717a', separator: '#e4e4e7', sidebar: '#18191c' },
    geometry: { ...base.geometry, sectionGap: 6.5, blockGap: 3.5 },
  }),
  template('warm-sand', 'Warm Sand & Taupe', 'Ciepły beż z piaskową kolumną i dużym zdjęciem w lewym rogu.', {
    ...base,
    sidebarWidth: 33,
    typography: { ...base.typography, headingFont: 'Lora', baseSize: 9 },
    photo: { ...base.photo, shape: 'circle', size: 46, position: 'sidebar', borderWidth: 2, borderColor: '#ffffff' },
    colors: { accent: '#735c49', background: '#ffffff', text: '#342e29', muted: '#786e64', separator: '#e5ded5', sidebar: '#f5f0e8' },
    geometry: { ...base.geometry, sectionGap: 7, blockGap: 4 },
  }),
  template('emerald', 'Emerald Corporate', 'Głęboka leśna zieleń, profesjonalna forma i kadr z zaokrąglonymi rogami.', {
    ...base,
    sidebarWidth: 31,
    photo: { ...base.photo, shape: 'rounded', size: 43, position: 'sidebar', borderWidth: 1.5, borderColor: '#345e53' },
    colors: { accent: '#18473b', background: '#ffffff', text: '#1c2e28', muted: '#5c736a', separator: '#d7e4df', sidebar: '#12362d' },
    geometry: { ...base.geometry, sectionGap: 7, blockGap: 3.5, radius: 5 },
  }),
  template('nordic', 'Nordic Slate', 'Skandynawski chłód, stalowy błękit i wyrazisty pionowy portret.', {
    ...base,
    sidebarWidth: 32,
    typography: { ...base.typography, fontFamily: 'Roboto', headingFont: 'Roboto' },
    photo: { ...base.photo, shape: 'portrait-rounded', size: 45, position: 'sidebar', borderWidth: 0 },
    colors: { accent: '#263d52', background: '#ffffff', text: '#1d2731', muted: '#5f6f7f', separator: '#dbe4eb', sidebar: '#1e3040' },
    geometry: { ...base.geometry, sectionGap: 6.5, blockGap: 3.5 },
  }),
  template('minimalist', 'Minimalist Light', 'Jasne, czyste studio z subtelnym tłem i dużym kadrem portretowym.', {
    ...base,
    sidebarWidth: 31,
    sectionStyle: 'plain',
    photo: { ...base.photo, shape: 'portrait', size: 48, position: 'sidebar', borderWidth: 1, borderColor: '#e2e8f0' },
    colors: { accent: '#0f172a', background: '#ffffff', text: '#1e293b', muted: '#64748b', separator: '#e2e8f0', sidebar: '#f8fafc' },
    geometry: { ...base.geometry, lineWidth: 0, sectionGap: 7, blockGap: 4 },
  }),
  template('bordeaux', 'Bordeaux Chic', 'Luksusowe bordowe tony i eleganckie szeryfowe nagłówki.', {
    ...base,
    sidebarWidth: 32,
    typography: { ...base.typography, headingFont: 'Lora' },
    photo: { ...base.photo, shape: 'circle', size: 44, position: 'sidebar', borderWidth: 2, borderColor: '#ffffff' },
    colors: { accent: '#4e1728', background: '#ffffff', text: '#2a161e', muted: '#765e66', separator: '#ebdce1', sidebar: '#3a101d' },
    geometry: { ...base.geometry, sectionGap: 6.5, blockGap: 3.5 },
  }),
  template('classic-swiss', 'Classic Swiss', 'Stylowa typografia w duchu szwajcarskim z ceglastym akcentem.', {
    ...base,
    sidebarWidth: 30,
    photo: { ...base.photo, shape: 'square', size: 38, position: 'sidebar', borderWidth: 0 },
    colors: { accent: '#c2410c', background: '#ffffff', text: '#1c1917', muted: '#78716c', separator: '#fed7aa', sidebar: '#faf8f5' },
    geometry: { ...base.geometry, sectionGap: 7, blockGap: 4, radius: 0 },
  }),
  template('blueprint', 'Blueprint Horizon', 'Układ z poziomym banerem i zdjęciem po lewej stronie.', {
    ...base, headerStyle: 'banner', sectionStyle: 'filled', layout: 'sidebar-right', sidebarWidth: 30,
    typography: { ...base.typography, fontFamily: 'Roboto', headingFont: 'Roboto', nameSize: 28, baseSize: 8.5 },
    colors: { accent: '#1e40af', background: '#ffffff', text: '#1e293b', muted: '#64748b', separator: '#dbeafe', sidebar: '#f0f7ff' },
    photo: { ...base.photo, shape: 'rounded', size: 32, position: 'left', borderWidth: 0 },
    geometry: { ...base.geometry, radius: 5, sectionGap: 7, columnGap: 18, margins: { top: 13, right: 15, bottom: 13, left: 15 } },
  }),
  template('atelier', 'Atelier Grid', 'Dwukolumnowy układ siatki na ciepłym papierze z centralnym nagłówkiem.', {
    ...base, layout: 'grid', headerStyle: 'centered', sectionStyle: 'filled', skillStyle: 'tags',
    colors: { accent: '#855b2b', background: '#fffdf9', text: '#40362a', muted: '#7d7060', separator: '#e8dcce', sidebar: '#f7f2e8' },
    typography: { ...base.typography, headingFont: 'Lora', nameSize: 29, baseSize: 8.5 },
    photo: { ...base.photo, shape: 'rounded', size: 32, position: 'left', borderWidth: 1, borderColor: '#e8dcce' },
    geometry: { ...base.geometry, radius: 5, columnGap: 14, sectionGap: 8, blockGap: 4 },
  }),
  template('midnight', 'Midnight Horizon', 'Wyrazisty ciemny fiolet i granat z nowoczesnym układem.', {
    ...base, layout: 'single', headerStyle: 'banner', sectionStyle: 'underline', skillStyle: 'tags',
    colors: { accent: '#4c3a6b', background: '#ffffff', text: '#2c2538', muted: '#766c84', separator: '#ded7e8', sidebar: '#f5f2f9' },
    typography: { ...base.typography, headingFont: 'Lora', nameSize: 30 },
    photo: { ...base.photo, shape: 'circle', size: 36, position: 'left', borderWidth: 2, borderColor: '#ffffff' },
    geometry: { ...base.geometry, radius: 6, sectionGap: 9, lineWidth: 0.8, margins: { top: 14, right: 17, bottom: 14, left: 17 } },
  }),
  template('editorial', 'Editorial Ink', 'Literackie nagłówki, dużo światła i klasyczne linie.', { ...base, layout: 'single', headerStyle: 'centered', sectionStyle: 'underline', icons: { style: 'none', size: 14 }, typography: { ...base.typography, fontFamily: 'SourceSans3', headingFont: 'PlayfairDisplay', headingSize: 10, nameSize: 30 }, colors: { ...base.colors, accent: '#292524', sidebar: '#f5f5f4', separator: '#f5f5f4' }, photo: { ...base.photo, isVisible: true, position: 'right', size: 32, borderWidth: 0 }, geometry: { ...base.geometry, sectionGap: 9, radius: 2 } }),
  template('azure', 'Azure Icons', 'Niebieskie nagłówki z kwadratowymi ikonami.', { ...base, layout: 'single', headerStyle: 'accent', sectionStyle: 'underline', icons: { style: 'square', size: 14 }, typography: { ...base.typography, fontFamily: 'Inter', headingFont: 'Montserrat', headingSize: 10, nameSize: 30 }, colors: { ...base.colors, accent: '#2563eb', sidebar: '#eff6ff', separator: '#eff6ff' }, photo: { ...base.photo, isVisible: true, position: 'right', size: 32, borderWidth: 0 }, geometry: { ...base.geometry, sectionGap: 9, radius: 2 } }),
  template('sage', 'Sage Notebook', 'Szałwiowa belka i delikatne ikony konturowe.', { ...base, layout: 'sidebar-right', headerStyle: 'centered', sectionStyle: 'plain', icons: { style: 'outline', size: 14 }, typography: { ...base.typography, fontFamily: 'SourceSans3', headingFont: 'Lora', headingSize: 10, nameSize: 30 }, colors: { ...base.colors, accent: '#426b56', sidebar: '#eef4ef', separator: '#eef4ef' }, photo: { ...base.photo, isVisible: true, position: 'left', size: 32, borderWidth: 0 }, geometry: { ...base.geometry, sectionGap: 9, radius: 2 } }),
  template('cobalt', 'Cobalt Portfolio', 'Wyrazisty baner, okrągłe plakietki i geometryczna typografia.', { ...base, layout: 'sidebar-left', headerStyle: 'banner', sectionStyle: 'plain', icons: { style: 'circle', size: 14 }, typography: { ...base.typography, fontFamily: 'SourceSans3', headingFont: 'Montserrat', headingSize: 10, nameSize: 30 }, colors: { ...base.colors, accent: '#2445bd', sidebar: '#edf1ff', separator: '#edf1ff' }, photo: { ...base.photo, isVisible: true, position: 'left', size: 32, borderWidth: 0 }, geometry: { ...base.geometry, sectionGap: 9, radius: 2 } }),
  template('rose', 'Rose Atelier', 'Pudrowy róż i kontrast szeryfowych nagłówków.', { ...base, layout: 'grid', headerStyle: 'centered', sectionStyle: 'filled', icons: { style: 'outline', size: 14 }, typography: { ...base.typography, fontFamily: 'Inter', headingFont: 'PlayfairDisplay', headingSize: 10, nameSize: 30 }, colors: { ...base.colors, accent: '#96566d', sidebar: '#fcf0f4', separator: '#fcf0f4' }, photo: { ...base.photo, isVisible: true, position: 'right', size: 32, borderWidth: 0 }, geometry: { ...base.geometry, sectionGap: 9, radius: 2 } }),
  template('copper', 'Copper Journal', 'Miedziane detale, lewa kolumna i spokojna typografia.', { ...base, layout: 'sidebar-left', headerStyle: 'accent', sectionStyle: 'underline', icons: { style: 'square', size: 14 }, typography: { ...base.typography, fontFamily: 'SourceSans3', headingFont: 'PlayfairDisplay', headingSize: 10, nameSize: 30 }, colors: { ...base.colors, accent: '#995b34', sidebar: '#f8f0e7', separator: '#f8f0e7' }, photo: { ...base.photo, isVisible: true, position: 'sidebar', size: 32, borderWidth: 0 }, geometry: { ...base.geometry, sectionGap: 9, radius: 2 } }),
  template('graphite', 'Graphite Technical', 'Techniczny układ z portretem i grafitowymi symbolami.', { ...base, layout: 'single', headerStyle: 'accent', sectionStyle: 'plain', icons: { style: 'outline', size: 14 }, typography: { ...base.typography, fontFamily: 'Roboto', headingFont: 'Montserrat', headingSize: 10, nameSize: 30 }, colors: { ...base.colors, accent: '#374151', sidebar: '#f3f4f6', separator: '#f3f4f6' }, photo: { ...base.photo, isVisible: true, position: 'right', size: 32, borderWidth: 0 }, geometry: { ...base.geometry, sectionGap: 9, radius: 2 } }),
  template('violet', 'Violet Orbit', 'Fioletowy baner i ikony w okrągłych plakietkach.', { ...base, layout: 'sidebar-right', headerStyle: 'banner', sectionStyle: 'filled', icons: { style: 'circle', size: 14 }, typography: { ...base.typography, fontFamily: 'Inter', headingFont: 'Montserrat', headingSize: 10, nameSize: 30 }, colors: { ...base.colors, accent: '#6d4db5', sidebar: '#f5f0ff', separator: '#f5f0ff' }, photo: { ...base.photo, isVisible: true, position: 'left', size: 32, borderWidth: 0 }, geometry: { ...base.geometry, sectionGap: 9, radius: 2 } }),
  template('ivory', 'Ivory Signature', 'Jasna kolumna, elegancki portret i redakcyjne nagłówki.', { ...base, layout: 'sidebar-left', headerStyle: 'accent', sectionStyle: 'plain', icons: { style: 'none', size: 14 }, typography: { ...base.typography, fontFamily: 'Lora', headingFont: 'PlayfairDisplay', headingSize: 10, nameSize: 30 }, colors: { ...base.colors, accent: '#73624a', sidebar: '#f8f4ed', separator: '#f8f4ed' }, photo: { ...base.photo, isVisible: true, position: 'sidebar', size: 32, borderWidth: 0 }, geometry: { ...base.geometry, sectionGap: 9, radius: 2 } }),
  template('teal', 'Teal Signal', 'Turkusowe symbole i przejrzysta siatka.', { ...base, layout: 'grid', headerStyle: 'accent', sectionStyle: 'underline', icons: { style: 'square', size: 14 }, typography: { ...base.typography, fontFamily: 'SourceSans3', headingFont: 'Montserrat', headingSize: 10, nameSize: 30 }, colors: { ...base.colors, accent: '#0f766e', sidebar: '#eff9f7', separator: '#eff9f7' }, photo: { ...base.photo, isVisible: true, position: 'right', size: 32, borderWidth: 0 }, geometry: { ...base.geometry, sectionGap: 9, radius: 2 } }),
  template('mono', 'Mono Essential', 'Proste jednokolumnowe CV z czytelną typografią.', { ...base, layout: 'single', headerStyle: 'centered', sectionStyle: 'underline', icons: { style: 'none', size: 14 }, typography: { ...base.typography, fontFamily: 'SourceSans3', headingFont: 'SourceSans3', headingSize: 10, nameSize: 30 }, colors: { ...base.colors, accent: '#18181b', sidebar: '#fafafa', separator: '#fafafa' }, photo: { ...base.photo, isVisible: true, position: 'right', size: 32, borderWidth: 0 }, geometry: { ...base.geometry, sectionGap: 9, radius: 2 } }),
  template('ochre', 'Ochre Studio', 'Musztardowe detale i subtelne ikony w prawej kolumnie.', { ...base, layout: 'sidebar-right', headerStyle: 'accent', sectionStyle: 'filled', icons: { style: 'outline', size: 14 }, typography: { ...base.typography, fontFamily: 'Inter', headingFont: 'Lora', headingSize: 10, nameSize: 30 }, colors: { ...base.colors, accent: '#956f16', sidebar: '#fbf6e6', separator: '#fbf6e6' }, photo: { ...base.photo, isVisible: true, position: 'left', size: 32, borderWidth: 0 }, geometry: { ...base.geometry, sectionGap: 9, radius: 2 } }),
  ...createDesignPresets(base),
];
export const defaultTheme = structuredClone(base);
