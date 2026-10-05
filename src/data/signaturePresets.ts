import type { ResumeTemplate, ResumeTheme } from '../types/resume';

type Patch = Omit<Partial<ResumeTheme>, 'design' | 'colors' | 'typography' | 'geometry' | 'photo' | 'icons'> & {
  design?: Partial<ResumeTheme['design']>; colors?: Partial<ResumeTheme['colors']>; icons?: Partial<ResumeTheme['icons']>;
  typography?: Partial<ResumeTheme['typography']>; geometry?: Partial<ResumeTheme['geometry']>; photo?: Partial<ResumeTheme['photo']>;
};

/**
 * Flagship designs built on the full-bleed sidebar, hero header, numbered/side
 * headings and split name. Each one is composed as a whole rather than as a
 * colour swap of another preset.
 */
export function createSignaturePresets(base: ResumeTheme): ResumeTemplate[] {
  const make = (id: string, name: string, description: string, patch: Patch): ResumeTemplate => ({
    id, name, description, categories: ['signature'], builtIn: true, createdAt: '2026-10-05', updatedAt: '2026-10-05',
    theme: {
      ...structuredClone(base), ...patch,
      icons: { ...base.icons, style: 'none', ...patch.icons },
      design: { ...base.design, entryStyle: 'plain', contactIcons: true, continuationGap: 18, ...patch.design },
      colors: { ...base.colors, ...patch.colors },
      typography: { ...base.typography, fontFamily: 'Inter', headingFont: 'Inter', baseSize: 8.7, headingSize: 10, nameSize: 30, lineHeight: 1.32, tracking: 0, ...patch.typography },
      geometry: { ...base.geometry, margins: { top: 12, right: 15, bottom: 12, left: 15 }, sectionGap: 7.5, blockGap: 4.5, radius: 3, lineWidth: 0.6, columnGap: 22, sectionPadding: 0, ...patch.geometry },
      photo: { ...base.photo, borderWidth: 0, ...patch.photo },
    },
  });
  // Light sidebar sections keep their own column; single layouts ignore it.
  return [
    make('aurora', 'Aurora', 'Granatowa kolumna od krawędzi do krawędzi, dwukolorowe nazwisko i oś czasu z węzłami.', {
      layout: 'sidebar-left', sidebarWidth: 33, sectionStyle: 'bar', skillStyle: 'tags',
      design: { sidebarStyle: 'bleed', nameStyle: 'split', entryStyle: 'timeline', contactPlacement: 'sidebar', sidebarPadding: 14 },
      colors: { accent: '#e2553f', background: '#ffffff', text: '#18202e', muted: '#677185', separator: '#e6e9ef', sidebar: '#16233b' },
      typography: { headingFont: 'Montserrat', nameSize: 30 },
      photo: { position: 'sidebar', shape: 'circle', size: 33, borderWidth: 3, borderColor: '#e2553f' },
    }),
    make('monolith', 'Monolith', 'Czarny nagłówek na całą szerokość, numerowane sekcje i plakatowe nazwisko.', {
      layout: 'single', headerStyle: 'hero', sectionStyle: 'numbered',
      design: { nameStyle: 'uppercase', contactIcons: false },
      colors: { accent: '#111111', background: '#ffffff', text: '#161616', muted: '#6b6b6b', separator: '#dedede', sidebar: '#f2f2f2' },
      typography: { headingFont: 'Oswald', nameSize: 40, headingSize: 11, tracking: 0 },
      photo: { position: 'right', shape: 'square', size: 30, borderWidth: 2, borderColor: 'white' },
      geometry: { sectionGap: 9 },
    }),
    make('broadsheet', 'Broadsheet', 'Redakcyjny układ z tytułami sekcji na marginesie, jak w dobrym magazynie.', {
      layout: 'single', headerStyle: 'accent', sectionStyle: 'side',
      design: { nameStyle: 'split', decoration: 'rule', contactIcons: false },
      colors: { accent: '#9f1d20', background: '#fffdf9', text: '#1f1a17', muted: '#6f655d', separator: '#e7dfd5', sidebar: '#f4ede4' },
      typography: { fontFamily: 'SourceSans3', headingFont: 'PlayfairDisplay', nameSize: 38, baseSize: 9, headingSize: 10 },
      photo: { position: 'right', shape: 'portrait', size: 28 },
      geometry: { sectionGap: 10, margins: { top: 13, right: 17, bottom: 12, left: 17 } },
    }),
    make('helvetica', 'Raster', 'Szwajcarska siatka: czerwony akcent, tytuły w lewej kolumnie i dużo bieli.', {
      layout: 'single', headerStyle: 'accent', sectionStyle: 'side',
      design: { nameStyle: 'stacked', contactIcons: false, decoration: 'none', entryStyle: 'table' },
      colors: { accent: '#e11d27', background: '#ffffff', text: '#111111', muted: '#5f5f5f', separator: '#e5e5e5', sidebar: '#f5f5f5' },
      typography: { headingFont: 'Inter', nameSize: 36, headingSize: 10, tracking: -0.1 },
      photo: { position: 'right', shape: 'square', size: 27 },
      geometry: { sectionGap: 10, radius: 0 },
    }),
    make('lagoon-bleed', 'Laguna', 'Jasna turkusowa kolumna na całą wysokość, numerowane sekcje i miękkie plamy koloru.', {
      layout: 'sidebar-right', sidebarWidth: 32, sectionStyle: 'numbered', skillStyle: 'tags',
      design: { sidebarStyle: 'bleed', decoration: 'blob', contactPlacement: 'sidebar', sidebarPadding: 14 },
      colors: { accent: '#0f766e', background: '#ffffff', text: '#12302c', muted: '#5f7a76', separator: '#cfe5e1', sidebar: '#e7f3f1' },
      typography: { headingFont: 'Montserrat', nameSize: 31 },
      photo: { position: 'sidebar', shape: 'circle', size: 33, borderWidth: 3, borderColor: 'white' },
    }),
    make('graphite-line', 'Linia', 'Kolumna oddzielona tylko włosową linią. Techniczna precyzja, paski poziomów i oś czasu.', {
      layout: 'sidebar-left', sidebarWidth: 30, sectionStyle: 'bar', skillStyle: 'levels',
      design: { sidebarStyle: 'line', entryStyle: 'timeline', skillMeter: 'bars', contactPlacement: 'sidebar' },
      colors: { accent: '#2563eb', background: '#ffffff', text: '#0f172a', muted: '#64748b', separator: '#dbe2ea', sidebar: '#f1f5f9' },
      typography: { fontFamily: 'Roboto', headingFont: 'Roboto', nameSize: 30 },
      photo: { position: 'sidebar', shape: 'rounded', size: 32 },
    }),
    make('terracotta-hero', 'Terakota', 'Ciepły nagłówek na całą szerokość, szeryfowe nazwisko w dwóch tonach i okrągły portret.', {
      layout: 'single', headerStyle: 'hero', sectionStyle: 'numbered',
      design: { nameStyle: 'split', contactIcons: true },
      colors: { accent: '#a8492a', background: '#fffaf6', text: '#2b1d17', muted: '#7a6458', separator: '#ecdcd2', sidebar: '#f6e9e1' },
      typography: { fontFamily: 'SourceSans3', headingFont: 'Lora', nameSize: 34, baseSize: 9 },
      photo: { position: 'left', shape: 'circle', size: 32, borderWidth: 2.5, borderColor: 'white' },
    }),
    make('noir-gold', 'Noir', 'Ciemny papier, złoty akcent i elegancki szeryf. Do wysyłki cyfrowej.', {
      layout: 'sidebar-left', sidebarWidth: 32, sectionStyle: 'bar',
      design: { sidebarStyle: 'bleed', nameStyle: 'split', contactPlacement: 'sidebar', sidebarPadding: 14 },
      colors: { accent: '#d4b26a', background: '#161514', text: '#f1ece2', muted: '#a59e90', separator: '#36322c', sidebar: '#1f1d1b' },
      typography: { fontFamily: 'SourceSans3', headingFont: 'CormorantGaramond', nameSize: 33, headingSize: 11, baseSize: 9 },
      photo: { position: 'sidebar', shape: 'portrait', size: 33, borderWidth: 1, borderColor: 'accent' },
    }),
    make('sorbet', 'Sorbet', 'Brzoskwiniowa kolumna na całą wysokość, tagi i świeża, przyjazna typografia.', {
      layout: 'sidebar-left', sidebarWidth: 33, sectionStyle: 'bar', skillStyle: 'tags',
      design: { sidebarStyle: 'bleed', decoration: 'blob', contactPlacement: 'sidebar', sidebarPadding: 14 },
      colors: { accent: '#c2410c', background: '#ffffff', text: '#2a1a12', muted: '#80675a', separator: '#f6dccd', sidebar: '#fdebe1' },
      typography: { headingFont: 'Montserrat', nameSize: 31 },
      geometry: { radius: 8 },
      photo: { position: 'sidebar', shape: 'circle', size: 33, borderWidth: 3, borderColor: 'white' },
    }),
    make('atlas-hero', 'Meridian', 'Granatowy nagłówek na całą szerokość i dwie kolumny rozdzielone linią.', {
      layout: 'sidebar-right', sidebarWidth: 31, headerStyle: 'hero', sectionStyle: 'numbered', skillStyle: 'tags',
      design: { sidebarStyle: 'line', entryStyle: 'timeline' },
      colors: { accent: '#1c2c4c', background: '#ffffff', text: '#18202e', muted: '#646f82', separator: '#dde3ec', sidebar: '#eef2f8' },
      typography: { headingFont: 'Montserrat', nameSize: 31 },
      photo: { position: 'left', shape: 'circle', size: 30, borderWidth: 2, borderColor: 'white' },
    }),
    make('botanika', 'Botanika', 'Szałwiowa kolumna, szeryfowe nagłówki i pionowy portret jak z albumu.', {
      layout: 'sidebar-left', sidebarWidth: 33, sectionStyle: 'bar',
      design: { sidebarStyle: 'bleed', nameStyle: 'split', contactPlacement: 'sidebar', entryStyle: 'timeline', sidebarPadding: 14 },
      colors: { accent: '#3f6b4b', background: '#fffefa', text: '#1f2a21', muted: '#69766b', separator: '#dbe5d8', sidebar: '#e6eee2' },
      typography: { fontFamily: 'SourceSans3', headingFont: 'CormorantGaramond', nameSize: 33, headingSize: 11.5, baseSize: 9 },
      photo: { position: 'sidebar', shape: 'portrait-rounded', size: 33 },
    }),
    make('commit', 'Commit', 'Dla programistów: tytuły na marginesie, tagi technologii i diagonalny akcent.', {
      layout: 'single', headerStyle: 'accent', sectionStyle: 'side', skillStyle: 'tags',
      design: { decoration: 'diagonal', entryStyle: 'timeline', nameStyle: 'natural' },
      colors: { accent: '#059669', background: '#ffffff', text: '#0f1d17', muted: '#5d6f67', separator: '#dcebe4', sidebar: '#ecf7f2' },
      typography: { fontFamily: 'Roboto', headingFont: 'Roboto', nameSize: 32 },
      photo: { position: 'right', shape: 'rounded', size: 27 },
      geometry: { sectionGap: 9 },
    }),
    make('indigo-bleed', 'Indygo', 'Głęboka indygo kolumna, jasne nagłówki i geometryczny akcent w rogu.', {
      layout: 'sidebar-left', sidebarWidth: 32, sectionStyle: 'numbered', skillStyle: 'levels',
      design: { sidebarStyle: 'bleed', skillMeter: 'dots', contactPlacement: 'sidebar', sidebarPadding: 14 },
      colors: { accent: '#4f46e5', background: '#ffffff', text: '#1b1a33', muted: '#686784', separator: '#e3e2f3', sidebar: '#262361' },
      typography: { headingFont: 'Montserrat', nameSize: 31 },
      photo: { position: 'sidebar', shape: 'rounded', size: 33, borderWidth: 2, borderColor: 'white' },
    }),
    make('prime', 'Prime', 'Wyśrodkowana, oszczędna kompozycja z numeracją sekcji. Minimalizm bez nudy.', {
      layout: 'single', headerStyle: 'centered', sectionStyle: 'numbered',
      design: { nameStyle: 'split', contactIcons: false },
      colors: { accent: '#1f2937', background: '#ffffff', text: '#1f2937', muted: '#6b7280', separator: '#e5e7eb', sidebar: '#f3f4f6' },
      typography: { headingFont: 'Inter', nameSize: 30 },
      photo: { position: 'center', shape: 'circle', size: 24 },
      geometry: { sectionGap: 10, margins: { top: 13, right: 19, bottom: 12, left: 19 } },
    }),
    make('cobalt-hero', 'Kobalt', 'Intensywny kobaltowy nagłówek, siatka dwóch kolumn i wyraźne tagi.', {
      layout: 'sidebar-left', sidebarWidth: 31, headerStyle: 'hero', sectionStyle: 'bar', skillStyle: 'tags',
      design: { sidebarStyle: 'line', nameStyle: 'uppercase', entryStyle: 'plain' },
      colors: { accent: '#1d4ed8', background: '#ffffff', text: '#0f172a', muted: '#5b6b85', separator: '#dbe4f5', sidebar: '#eaf0ff' },
      typography: { headingFont: 'Oswald', nameSize: 32, headingSize: 10.5 },
      photo: { position: 'right', shape: 'circle', size: 26, borderWidth: 2.5, borderColor: 'white' },
    }),
  ];
}
