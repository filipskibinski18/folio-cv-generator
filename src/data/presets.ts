import type { ResumeTemplate, ResumeTheme, SectionId, TemplateCategory } from '../types/resume';
import { sectionIds, sectionLabels } from '../types/resume';

const sidebarSections: SectionId[] = ['skills', 'languages', 'certificates', 'links', 'interests'];
const base: ResumeTheme = {
  language: 'pl', icons: { style: 'none', size: 14 },
  keepSectionsTogether: true,
  design: { entryStyle: 'plain', decoration: 'none', nameStyle: 'natural', contactPlacement: 'header', contactIcons: false, skillMeter: 'numbers', sidebarPadding: 12, continuationGap: 24, sidebarStyle: 'box' },
  headerStyle: 'accent', sectionStyle: 'underline',
  photo: { isVisible: true, shape: 'circle', size: 42, position: 'sidebar', borderWidth: 2, borderColor: '#ffffff' },
  typography: { fontFamily: 'Inter', headingFont: 'Inter', baseSize: 8.8, headingSize: 10, nameSize: 28, lineHeight: 1.38, tracking: 0 },
  colors: { accent: '#1e3a5f', background: '#ffffff', text: '#1e293b', muted: '#64748b', separator: '#e2e8f0', sidebar: '#1a3353' },
  geometry: { margins: { top: 14, right: 16, bottom: 14, left: 16 }, sectionPadding: 0, sectionGap: 7, blockGap: 4, radius: 4, lineWidth: 0.6, columnGap: 20 },
  layout: 'sidebar-left', sidebarWidth: 32, skillStyle: 'text',
  sections: sectionIds.map(id => ({ id, icon: 'auto', title: sectionLabels[id], isVisible: true, column: sidebarSections.includes(id) ? 'sidebar' : 'main' })),
};

type Patch = Omit<Partial<ResumeTheme>, 'design' | 'colors' | 'typography' | 'geometry' | 'photo' | 'icons'> & {
  design?: Partial<ResumeTheme['design']>; colors?: Partial<ResumeTheme['colors']>; icons?: Partial<ResumeTheme['icons']>;
  typography?: Partial<ResumeTheme['typography']>; geometry?: Partial<ResumeTheme['geometry']>; photo?: Partial<ResumeTheme['photo']>;
};
// Shared typographic rhythm for the whole collection, so every design starts
// from the same well-fitted page and differs in composition, not in spacing noise.
const make = (id: string, name: string, description: string, categories: TemplateCategory[], patch: Patch): ResumeTemplate => ({
  id, name, description, categories, builtIn: true, createdAt: '2026-10-05', updatedAt: '2026-10-05',
  theme: {
    ...structuredClone(base), ...patch,
    icons: { ...base.icons, ...patch.icons },
    design: { ...base.design, contactIcons: true, continuationGap: 18, sidebarPadding: 14, ...patch.design },
    colors: { ...base.colors, ...patch.colors },
    typography: { ...base.typography, baseSize: 8.7, headingSize: 10, nameSize: 30, lineHeight: 1.34, ...patch.typography },
    geometry: { ...base.geometry, margins: { top: 12, right: 15, bottom: 12, left: 15 }, sectionGap: 8, blockGap: 5, radius: 3, columnGap: 20, ...patch.geometry },
    photo: { ...base.photo, borderWidth: 0, ...patch.photo },
  },
});

export const presets: ResumeTemplate[] = [
  // — Minimalistyczne —
  make('prime', 'Prime', 'Wyśrodkowana, oszczędna kompozycja z numeracją sekcji. Minimalizm bez nudy.', ['signature', 'minimal'], {
    layout: 'single', headerStyle: 'centered', sectionStyle: 'numbered', skillStyle: 'inline',
    design: { nameStyle: 'split', contactIcons: false, entryStyle: 'aligned' },
    colors: { accent: '#1f2937', text: '#1f2937', muted: '#6b7280', separator: '#e5e7eb', sidebar: '#f3f4f6' },
    photo: { position: 'center', shape: 'circle', size: 24 },
    geometry: { sectionGap: 10, margins: { top: 13, right: 19, bottom: 12, left: 19 } },
  }),
  make('pure', 'Czysty', 'Klasyczny wiersz „stanowisko — daty”, zwarte umiejętności i nic zbędnego. Bezpieczny wybór pod ATS.', ['minimal'], {
    layout: 'single', headerStyle: 'accent', sectionStyle: 'underline', skillStyle: 'inline',
    design: { entryStyle: 'aligned', contactIcons: false },
    colors: { accent: '#111827', text: '#111827', muted: '#6b7280', separator: '#e5e7eb', sidebar: '#f3f4f6' },
    photo: { position: 'right', shape: 'rounded', size: 25 },
    geometry: { sectionGap: 9 },
  }),
  make('graphite-line', 'Linia', 'Kolumna oddzielona tylko włosową linią. Techniczna precyzja, paski poziomów i oś czasu.', ['minimal', 'technical'], {
    layout: 'sidebar-left', sidebarWidth: 30, sectionStyle: 'bar', skillStyle: 'levels',
    design: { sidebarStyle: 'line', entryStyle: 'timeline', skillMeter: 'bars', contactPlacement: 'sidebar' },
    colors: { accent: '#2563eb', text: '#0f172a', muted: '#64748b', separator: '#dbe2ea', sidebar: '#f1f5f9' },
    typography: { fontFamily: 'Roboto', headingFont: 'Roboto' },
    photo: { position: 'sidebar', shape: 'rounded', size: 30 },
  }),
  make('helvetica', 'Raster', 'Szwajcarska siatka: czerwony akcent, tytuły w lewej kolumnie i dużo bieli.', ['minimal'], {
    layout: 'single', headerStyle: 'accent', sectionStyle: 'side', skillStyle: 'inline',
    design: { nameStyle: 'stacked', contactIcons: false, entryStyle: 'aligned' },
    colors: { accent: '#e11d27', text: '#111111', muted: '#5f5f5f', separator: '#e5e5e5', sidebar: '#f5f5f5' },
    typography: { nameSize: 34, tracking: -0.1 },
    photo: { position: 'right', shape: 'square', size: 26 },
    geometry: { sectionGap: 10, radius: 0 },
  }),
  make('linea', 'Linea', 'Szeroki nagłówek i prawa kolumna oddzielona linią. Spokojna, czytelna typografia.', ['minimal'], {
    layout: 'sidebar-right', sidebarWidth: 30, headerStyle: 'centered', sectionStyle: 'plain', skillStyle: 'inline',
    design: { sidebarStyle: 'line', entryStyle: 'aligned' },
    colors: { accent: '#3b5b6e', text: '#1d2b33', muted: '#667780', separator: '#dbe3e7', sidebar: '#eef3f5' },
    typography: { fontFamily: 'SourceSans3', headingFont: 'SourceSans3', baseSize: 9.2, headingSize: 10.5 },
    photo: { position: 'left', shape: 'circle', size: 25 },
  }),

  // — Klasyczne —
  make('executive', 'Executive', 'Ponadczasowy szeryf, wyśrodkowany nagłówek i daty wyrównane do prawej.', ['classic'], {
    layout: 'single', headerStyle: 'centered', sectionStyle: 'underline', skillStyle: 'inline',
    design: { entryStyle: 'aligned', contactIcons: false },
    colors: { accent: '#1e3a5f', text: '#1c2733', muted: '#5f6b78', separator: '#cfd8e2', sidebar: '#eef2f7' },
    typography: { fontFamily: 'Lora', headingFont: 'Lora', baseSize: 8.9, nameSize: 30 },
    photo: { position: 'left', shape: 'square', size: 24, borderWidth: 1, borderColor: 'separator' },
    geometry: { sectionGap: 9, margins: { top: 13, right: 18, bottom: 12, left: 18 } },
  }),
  make('cambridge', 'Cambridge', 'Ramka strony, bordowe akcenty i pionowy portret. Akademicka elegancja.', ['classic'], {
    layout: 'single', headerStyle: 'accent', sectionStyle: 'rail', skillStyle: 'inline',
    design: { decoration: 'frame', entryStyle: 'timeline', contactIcons: false },
    colors: { accent: '#6b2737', background: '#fffdfa', text: '#2a1d1f', muted: '#76656a', separator: '#eadfdf', sidebar: '#f5ecec' },
    typography: { fontFamily: 'Lora', headingFont: 'CormorantGaramond', nameSize: 34, headingSize: 12 },
    photo: { position: 'right', shape: 'portrait', size: 24, borderWidth: 1, borderColor: 'accent' },
    geometry: { margins: { top: 15, right: 18, bottom: 14, left: 18 } },
  }),
  make('botanika', 'Botanika', 'Szałwiowa kolumna, szeryfowe nagłówki i pionowy portret jak z albumu.', ['classic'], {
    layout: 'sidebar-left', sidebarWidth: 33, sectionStyle: 'bar',
    design: { sidebarStyle: 'bleed', nameStyle: 'split', contactPlacement: 'sidebar', entryStyle: 'timeline' },
    colors: { accent: '#3f6b4b', background: '#fffefa', text: '#1f2a21', muted: '#69766b', separator: '#dbe5d8', sidebar: '#e6eee2' },
    typography: { fontFamily: 'SourceSans3', headingFont: 'CormorantGaramond', nameSize: 33, headingSize: 11.5, baseSize: 9 },
    photo: { position: 'sidebar', shape: 'portrait-rounded', size: 32 },
  }),
  make('oxford', 'Oxford', 'Szeryfowa kolumna po lewej oddzielona linią, granat i uporządkowane daty.', ['classic'], {
    layout: 'sidebar-left', sidebarWidth: 29, sectionStyle: 'underline', skillStyle: 'text',
    design: { sidebarStyle: 'line', entryStyle: 'aligned', contactPlacement: 'sidebar', nameStyle: 'stacked' },
    colors: { accent: '#24365a', background: '#ffffff', text: '#1b2230', muted: '#5f6878', separator: '#d8dde6', sidebar: '#eef1f6' },
    typography: { fontFamily: 'Lora', headingFont: 'PlayfairDisplay', nameSize: 30, baseSize: 8.8 },
    photo: { position: 'sidebar', shape: 'square', size: 28, borderWidth: 1, borderColor: 'separator' },
  }),

  // — Biznesowe —
  make('modern', 'Modern Navy', 'Granatowa kolumna do krawędzi strony, okrągłe zdjęcie i daty po prawej.', ['business'], {
    layout: 'sidebar-left', sidebarWidth: 32, sectionStyle: 'underline',
    design: { sidebarStyle: 'bleed', entryStyle: 'aligned', contactPlacement: 'sidebar' },
    colors: { accent: '#1e3a5f', text: '#1e293b', muted: '#64748b', separator: '#dbe3ee', sidebar: '#172e4d' },
    photo: { position: 'sidebar', shape: 'circle', size: 32, borderWidth: 2.5, borderColor: 'white' },
  }),
  make('atlas-hero', 'Meridian', 'Granatowy nagłówek na całą szerokość i dwie kolumny rozdzielone linią.', ['business'], {
    layout: 'sidebar-right', sidebarWidth: 31, headerStyle: 'hero', sectionStyle: 'numbered', skillStyle: 'tags',
    design: { sidebarStyle: 'line', entryStyle: 'timeline' },
    colors: { accent: '#1c2c4c', text: '#18202e', muted: '#646f82', separator: '#dde3ec', sidebar: '#eef2f8' },
    typography: { headingFont: 'Montserrat', nameSize: 31 },
    photo: { position: 'left', shape: 'circle', size: 28, borderWidth: 2, borderColor: 'white' },
  }),
  make('monolith', 'Monolith', 'Czarny nagłówek na całą szerokość, numerowane sekcje i plakatowe nazwisko.', ['signature', 'business'], {
    layout: 'single', headerStyle: 'hero', sectionStyle: 'numbered', skillStyle: 'inline',
    design: { nameStyle: 'uppercase', contactIcons: false, entryStyle: 'aligned' },
    colors: { accent: '#111111', text: '#161616', muted: '#6b6b6b', separator: '#dedede', sidebar: '#f2f2f2' },
    typography: { headingFont: 'Oswald', nameSize: 40, headingSize: 11 },
    photo: { position: 'right', shape: 'square', size: 28, borderWidth: 2, borderColor: 'white' },
    geometry: { sectionGap: 9 },
  }),
  make('boardroom', 'Boardroom', 'Grafitowa kolumna po prawej, złote detale i szeryfowe nazwisko. Dla kadry zarządzającej.', ['business'], {
    layout: 'sidebar-right', sidebarWidth: 31, sectionStyle: 'bar',
    design: { sidebarStyle: 'bleed', entryStyle: 'aligned', contactPlacement: 'sidebar', nameStyle: 'stacked' },
    colors: { accent: '#9a7440', text: '#1d232b', muted: '#626b76', separator: '#e4ddd2', sidebar: '#1f2a37' },
    typography: { fontFamily: 'SourceSans3', headingFont: 'PlayfairDisplay', nameSize: 32, baseSize: 9 },
    photo: { position: 'sidebar', shape: 'portrait', size: 31, borderWidth: 1, borderColor: 'accent' },
  }),
  make('consult', 'Konsultant', 'Morski baner, tytuły sekcji na kolorowym tle i przejrzysta prawa kolumna.', ['business'], {
    layout: 'sidebar-right', sidebarWidth: 30, headerStyle: 'banner', sectionStyle: 'filled', skillStyle: 'tags',
    design: { sidebarStyle: 'line', entryStyle: 'aligned' },
    icons: { style: 'circle', size: 14 },
    colors: { accent: '#0f4c5c', text: '#14262b', muted: '#5c7076', separator: '#d6e4e7', sidebar: '#e6f0f2' },
    typography: { headingFont: 'Montserrat', nameSize: 28 },
    photo: { position: 'left', shape: 'rounded', size: 26, borderWidth: 2, borderColor: 'white' },
    geometry: { radius: 6 },
  }),

  // — Kreatywne —
  make('aurora', 'Aurora', 'Granatowa kolumna od krawędzi do krawędzi, dwukolorowe nazwisko i oś czasu z węzłami.', ['signature', 'creative'], {
    layout: 'sidebar-left', sidebarWidth: 33, sectionStyle: 'bar', skillStyle: 'tags',
    design: { sidebarStyle: 'bleed', nameStyle: 'split', entryStyle: 'timeline', contactPlacement: 'sidebar' },
    colors: { accent: '#e2553f', text: '#18202e', muted: '#677185', separator: '#e6e9ef', sidebar: '#16233b' },
    typography: { headingFont: 'Montserrat', nameSize: 30 },
    photo: { position: 'sidebar', shape: 'circle', size: 32, borderWidth: 3, borderColor: '#e2553f' },
  }),
  make('terracotta-hero', 'Terakota', 'Ciepły nagłówek na całą szerokość, szeryfowe nazwisko w dwóch tonach i okrągły portret.', ['signature', 'creative'], {
    layout: 'single', headerStyle: 'hero', sectionStyle: 'numbered', skillStyle: 'inline',
    design: { nameStyle: 'split', entryStyle: 'aligned' },
    colors: { accent: '#a8492a', background: '#fffaf6', text: '#2b1d17', muted: '#7a6458', separator: '#ecdcd2', sidebar: '#f6e9e1' },
    typography: { fontFamily: 'SourceSans3', headingFont: 'Lora', nameSize: 32, baseSize: 9 },
    photo: { position: 'left', shape: 'circle', size: 30, borderWidth: 2.5, borderColor: 'white' },
  }),
  make('cobalt-hero', 'Kobalt', 'Intensywny kobaltowy nagłówek, dwie kolumny i wyraźne tagi.', ['creative'], {
    layout: 'sidebar-left', sidebarWidth: 31, headerStyle: 'hero', sectionStyle: 'bar', skillStyle: 'tags',
    design: { sidebarStyle: 'line', nameStyle: 'uppercase', entryStyle: 'aligned' },
    colors: { accent: '#1d4ed8', text: '#0f172a', muted: '#5b6b85', separator: '#dbe4f5', sidebar: '#eaf0ff' },
    typography: { headingFont: 'Oswald', nameSize: 32, headingSize: 10.5 },
    photo: { position: 'right', shape: 'circle', size: 26, borderWidth: 2.5, borderColor: 'white' },
  }),
  make('sorbet', 'Sorbet', 'Jedna kolumna z miękkimi plamami koloru, dwukolorowym nazwiskiem i tagami.', ['creative'], {
    layout: 'single', headerStyle: 'accent', sectionStyle: 'bar', skillStyle: 'tags',
    design: { decoration: 'blob', nameStyle: 'split', entryStyle: 'aligned' },
    colors: { accent: '#c2410c', text: '#2a1a12', muted: '#80675a', separator: '#f6dccd', sidebar: '#fdebe1' },
    typography: { headingFont: 'Montserrat', nameSize: 32 },
    photo: { position: 'right', shape: 'circle', size: 30, borderWidth: 3, borderColor: 'accent' },
    geometry: { radius: 8 },
  }),
  make('lagoon-bleed', 'Laguna', 'Jasna turkusowa kolumna na całą wysokość, numerowane sekcje i miękkie plamy koloru.', ['creative'], {
    layout: 'sidebar-right', sidebarWidth: 32, sectionStyle: 'numbered', skillStyle: 'tags',
    design: { sidebarStyle: 'bleed', decoration: 'blob', contactPlacement: 'sidebar' },
    colors: { accent: '#0f766e', text: '#12302c', muted: '#5f7a76', separator: '#cfe5e1', sidebar: '#e7f3f1' },
    typography: { headingFont: 'Montserrat', nameSize: 31 },
    photo: { position: 'sidebar', shape: 'circle', size: 32, borderWidth: 3, borderColor: 'white' },
  }),
  make('kafle', 'Kafle', 'Dwie równe kolumny, wpisy na lawendowych kartach i świeża, geometryczna typografia.', ['creative'], {
    layout: 'grid', headerStyle: 'accent', sectionStyle: 'bar', skillStyle: 'tags',
    design: { entryStyle: 'cards', nameStyle: 'split', sidebarStyle: 'line' },
    colors: { accent: '#6d28d9', text: '#1e1530', muted: '#6b6280', separator: '#e4dcf5', sidebar: '#f3effc' },
    typography: { headingFont: 'Montserrat', nameSize: 30 },
    photo: { position: 'right', shape: 'rounded', size: 26 },
    geometry: { radius: 8, columnGap: 16 },
  }),

  // — Eleganckie —
  make('broadsheet', 'Broadsheet', 'Redakcyjny układ z tytułami sekcji na marginesie, jak w dobrym magazynie.', ['signature', 'editorial', 'classic'], {
    layout: 'single', headerStyle: 'accent', sectionStyle: 'side', skillStyle: 'inline',
    design: { nameStyle: 'split', decoration: 'rule', contactIcons: false, entryStyle: 'aligned' },
    colors: { accent: '#9f1d20', background: '#fffdf9', text: '#1f1a17', muted: '#6f655d', separator: '#e7dfd5', sidebar: '#f4ede4' },
    typography: { fontFamily: 'SourceSans3', headingFont: 'PlayfairDisplay', nameSize: 36, baseSize: 9.1 },
    photo: { position: 'right', shape: 'portrait', size: 26 },
    geometry: { sectionGap: 10, margins: { top: 13, right: 17, bottom: 12, left: 17 } },
  }),
  make('noir-gold', 'Noir', 'Ciemny papier, złoty akcent i elegancki szeryf. Do wysyłki cyfrowej.', ['signature', 'editorial'], {
    layout: 'sidebar-left', sidebarWidth: 32, sectionStyle: 'bar', skillStyle: 'inline',
    design: { sidebarStyle: 'bleed', nameStyle: 'split', contactPlacement: 'sidebar', entryStyle: 'aligned' },
    colors: { accent: '#d4b26a', background: '#161514', text: '#f1ece2', muted: '#a59e90', separator: '#36322c', sidebar: '#1f1d1b' },
    typography: { fontFamily: 'SourceSans3', headingFont: 'CormorantGaramond', nameSize: 33, headingSize: 11, baseSize: 9 },
    photo: { position: 'sidebar', shape: 'portrait', size: 32, borderWidth: 1, borderColor: 'accent' },
  }),
  make('magazine', 'Magazyn', 'Dwie równe kolumny, wielkie szeryfowe nazwisko i linia akcentu jak w nagłówku gazety.', ['editorial'], {
    layout: 'grid', headerStyle: 'accent', sectionStyle: 'underline', skillStyle: 'inline',
    design: { decoration: 'rule', nameStyle: 'split', entryStyle: 'plain', contactIcons: false, sidebarStyle: 'line' },
    colors: { accent: '#1f4d3a', background: '#fffefb', text: '#1b2420', muted: '#66716b', separator: '#dfe5e1', sidebar: '#eef3f0' },
    typography: { fontFamily: 'SourceSans3', headingFont: 'PlayfairDisplay', nameSize: 36, baseSize: 9 },
    photo: { position: 'right', shape: 'portrait', size: 25 },
    geometry: { columnGap: 18 },
  }),
  make('rose-letter', 'List', 'Odręczne nazwisko, pudrowa kolumna do krawędzi i szeryfowe nagłówki. Osobiście, ale z klasą.', ['editorial', 'artistic'], {
    layout: 'sidebar-right', sidebarWidth: 32, sectionStyle: 'bar', skillStyle: 'inline',
    design: { sidebarStyle: 'bleed', contactPlacement: 'sidebar', entryStyle: 'aligned' },
    colors: { accent: '#8c4b53', background: '#fffdfc', text: '#2b1e20', muted: '#7a686a', separator: '#efdfdc', sidebar: '#f6e7e4' },
    typography: { fontFamily: 'Lora', headingFont: 'Caveat', nameSize: 42, headingSize: 15, baseSize: 8.8 },
    photo: { position: 'sidebar', shape: 'portrait-rounded', size: 31, borderWidth: 2, borderColor: 'white' },
  }),

  // — Techniczne —
  make('commit', 'Commit', 'Dla programistów: tytuły na marginesie, tagi technologii i diagonalny akcent.', ['technical'], {
    layout: 'single', headerStyle: 'accent', sectionStyle: 'side', skillStyle: 'tags',
    design: { decoration: 'diagonal', entryStyle: 'timeline' },
    colors: { accent: '#059669', text: '#0f1d17', muted: '#5d6f67', separator: '#dcebe4', sidebar: '#ecf7f2' },
    typography: { fontFamily: 'Roboto', headingFont: 'Roboto', nameSize: 32 },
    photo: { position: 'right', shape: 'rounded', size: 26 },
    geometry: { sectionGap: 9 },
  }),
  make('indigo-bleed', 'Indygo', 'Głęboka indygo kolumna po prawej, poziomy umiejętności w kropkach i numerowane sekcje.', ['technical'], {
    layout: 'sidebar-right', sidebarWidth: 31, sectionStyle: 'numbered', skillStyle: 'levels',
    design: { sidebarStyle: 'bleed', skillMeter: 'dots', contactPlacement: 'sidebar', entryStyle: 'aligned' },
    colors: { accent: '#4f46e5', text: '#1b1a33', muted: '#686784', separator: '#e3e2f3', sidebar: '#24215c' },
    typography: { fontFamily: 'Roboto', headingFont: 'Montserrat', nameSize: 30 },
    photo: { position: 'sidebar', shape: 'rounded', size: 31, borderWidth: 2, borderColor: 'white' },
  }),
  make('terminal-night', 'Terminal', 'Ciemny dokument z miętowym akcentem, tytułami na marginesie i osią czasu. Do wysyłki cyfrowej.', ['technical'], {
    layout: 'single', headerStyle: 'accent', sectionStyle: 'side', skillStyle: 'tags',
    design: { nameStyle: 'uppercase', entryStyle: 'timeline', decoration: 'dots' },
    colors: { accent: '#5eead4', background: '#0f1d22', text: '#e6f4f1', muted: '#9bb5b0', separator: '#26404a', sidebar: '#16303a' },
    typography: { fontFamily: 'Roboto', headingFont: 'Oswald', nameSize: 34, headingSize: 11 },
    photo: { position: 'right', shape: 'square', size: 26, borderWidth: 1, borderColor: 'accent' },
  }),
  make('blueprint', 'Blueprint', 'Niebieski baner, kolumna z tagami po lewej i przejrzyste daty po prawej.', ['technical'], {
    layout: 'sidebar-left', sidebarWidth: 30, headerStyle: 'banner', sectionStyle: 'rail', skillStyle: 'tags',
    design: { sidebarStyle: 'line', entryStyle: 'aligned' },
    icons: { style: 'outline', size: 13 },
    colors: { accent: '#1e40af', text: '#0f1b33', muted: '#5b6b86', separator: '#d9e3f5', sidebar: '#eef3fc' },
    typography: { fontFamily: 'Roboto', headingFont: 'Roboto', nameSize: 29 },
    photo: { position: 'right', shape: 'rounded', size: 26, borderWidth: 2, borderColor: 'white' },
    geometry: { radius: 6 },
  }),

  // — Artystyczne —
  make('sketchbook', 'Szkicownik', 'Ciepły papier, odręczne nagłówki, ramka i kropkowe poziomy umiejętności.', ['artistic'], {
    layout: 'grid', headerStyle: 'accent', sectionStyle: 'plain', skillStyle: 'levels',
    design: { decoration: 'frame', skillMeter: 'dots', nameStyle: 'natural' },
    colors: { accent: '#9a4f3c', background: '#fff9ea', text: '#33261f', muted: '#7d6a5c', separator: '#ecdcc0', sidebar: '#f5ead0' },
    typography: { fontFamily: 'SourceSans3', headingFont: 'Caveat', nameSize: 42, headingSize: 16, baseSize: 9 },
    photo: { position: 'right', shape: 'square', size: 26, borderWidth: 2, borderColor: 'white' },
    geometry: { margins: { top: 15, right: 17, bottom: 14, left: 17 }, columnGap: 18 },
  }),
  make('bauhaus', 'Bauhaus', 'Czysta geometria, mocna czerwień, numeracja i plakatowe wersaliki.', ['artistic'], {
    layout: 'single', headerStyle: 'accent', sectionStyle: 'numbered', skillStyle: 'tags',
    design: { decoration: 'corner', nameStyle: 'uppercase', entryStyle: 'aligned' },
    colors: { accent: '#d62828', background: '#fffcf5', text: '#1d1b18', muted: '#6d675d', separator: '#ebe4d6', sidebar: '#f6efdf' },
    typography: { headingFont: 'Montserrat', nameSize: 30 },
    photo: { position: 'left', shape: 'circle', size: 28, borderWidth: 3, borderColor: 'accent' },
    geometry: { radius: 0 },
  }),
  make('midnight-gallery', 'Galeria nocą', 'Nocny błękit i miedź, łuki w tle i szeryfowe nazwisko w dwóch tonach. Do wysyłki cyfrowej.', ['artistic'], {
    layout: 'sidebar-right', sidebarWidth: 32, sectionStyle: 'bar', skillStyle: 'inline',
    design: { sidebarStyle: 'bleed', decoration: 'arch', nameStyle: 'split', contactPlacement: 'sidebar', entryStyle: 'timeline' },
    colors: { accent: '#e1b992', background: '#1b2b3f', text: '#fcf4e9', muted: '#b6c2d0', separator: '#3b4f66', sidebar: '#22364d' },
    typography: { fontFamily: 'SourceSans3', headingFont: 'CormorantGaramond', nameSize: 34, headingSize: 11.5, baseSize: 9 },
    photo: { position: 'sidebar', shape: 'portrait-rounded', size: 31, borderWidth: 2, borderColor: 'accent' },
  }),
];
export const defaultTheme = structuredClone(base);
