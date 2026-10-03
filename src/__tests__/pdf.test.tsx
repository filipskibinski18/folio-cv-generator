import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { realpathSync } from 'node:fs';
import { Font, renderToBuffer } from '@react-pdf/renderer';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { ResumeDocument } from '../components/preview/ResumeDocument';
import { sampleResume } from '../data/sampleResume';
import { defaultTheme, presets } from '../data/presets';
import type { ResumeData, ResumeTheme } from '../types/resume';
import { mmToPt } from '../lib/format';
import { continuationHeadings, extractPreviewRegions, type PreviewRegion } from '../lib/previewTargets';

import { renderResume } from '../services/renderResume';

const testPhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6N8AAAAASUVORK5CYII=';

for (const family of ['Inter', 'Lora', 'Roboto', 'Montserrat', 'PlayfairDisplay', 'SourceSans3', 'Oswald', 'CormorantGaramond', 'Caveat']) Font.register({ family, fonts: [400, 700].map(fontWeight => ({ src: resolve('public/fonts', `${family}-${fontWeight}.ttf`), fontWeight })) });
Font.registerHyphenationCallback(word => [word]);
async function inspect(data: ResumeData, theme: ResumeTheme) {
  const { output: buffer, regions, sectionHeights } = await renderResume(data, theme, renderToBuffer);
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  let text = ''; let count = 0; let images = 0; const pageTexts: string[] = [];
  const outOfBounds: { page: number; text: string; y: number }[] = [];
  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number); const items = (await page.getTextContent()).items.filter((item): item is TextItem => 'str' in item);
    const projectTitle = items.find(item => item.str === 'Careflow');
    const projectDescription = items.find(item => item.str.includes('Koncepcja aplikacji'));
    if (projectTitle && projectDescription) expect(projectTitle.transform[5] - projectDescription.transform[5]).toBeGreaterThan(5);
    const pageText = items.map(item => item.str).join(' '); text += pageText; pageTexts.push(pageText.replace(/\s/g, '')); count += items.length;
    const pageRegions = regions.filter(region => region.page === number);
    for (const region of pageRegions) {
      if (number > 1 && region.target.section !== 'consent') expect(region.top).toBeGreaterThanOrEqual(mmToPt(theme.geometry.margins.top) + theme.design.continuationGap + (region.column === 'sidebar' ? theme.design.sidebarPadding : 0) - 1);
      expect(region.left).toBeGreaterThanOrEqual(0); expect(region.top).toBeGreaterThanOrEqual(0);
      expect(region.left + region.width).toBeLessThanOrEqual(595.29);
      expect(region.top + region.height).toBeLessThanOrEqual(841.90);
      for (const other of pageRegions) {
        if (other === region) continue;
        const overlapWidth = Math.min(region.left + region.width, other.left + other.width) - Math.max(region.left, other.left);
        const overlapHeight = Math.min(region.top + region.height, other.top + other.height) - Math.max(region.top, other.top);
        expect(Math.max(0, overlapWidth) * Math.max(0, overlapHeight)).toBeLessThan(0.1);
      }
    }
    for (const experience of data.experience) {
      const company = items.find(item => item.str === experience.company);
      if (!company || !theme.sections.find(section => section.id === 'experience')?.isVisible) continue;
      const x = company.transform[4]; const y = page.view[3] - company.transform[5];
      expect(pageRegions.some(region => region.target.section === 'experience' && region.target.itemId === experience.id && x >= region.left - 1 && x <= region.left + region.width + 1 && y >= region.top - 1 && y <= region.top + region.height + 1)).toBe(true);
    }
    for (const item of items) {
      if (item.str.includes('CV — ciąg dalszy') || item.str.includes('CV — continued')) continue;
      if (!item.str.trim() || /^\d+\s*\/\s*\d+$/.test(item.str)) continue;
      const y = item.transform[5];
      if (y < mmToPt(theme.geometry.margins.bottom) - 3 || y > 842 - mmToPt(theme.geometry.margins.top) + 2) outOfBounds.push({ page: number, text: item.str, y });
    }
    const operators = await page.getOperatorList();
    const imageCount = operators.fnArray.filter(op => op === OPS.paintImageXObject).length;
    images += imageCount;
    if (!data.personal.photo || !theme.photo.isVisible) expect(imageCount).toBe(0);
    expect(page.view[2]).toBeCloseTo(595.28, 1); expect(page.view[3]).toBeCloseTo(841.89, 1);
  }
  const pages = pdf.numPages; await pdf.destroy();
  return { text: text.replace(/\s/g, ''), pageTexts, pages, count, images, outOfBounds, regions, sectionHeights };
}
describe('Wektorowy PDF A4 i podział stron', () => {
  it('nie dodaje jasnych pasków pod zdjęciem bez ramki i zachowuje włączoną ramkę', async () => {
    const require = createRequire(realpathSync(resolve('node_modules/pdfjs-dist/package.json')));
    const { createCanvas } = require('@napi-rs/canvas');
    const source = createCanvas(512, 512);
    const context = source.getContext('2d');
    context.fillStyle = '#ff0000';
    // Transparent top and bottom edges expose any unwanted placeholder shading.
    context.fillRect(0, 128, 512, 256);
    const data = { ...sampleResume, personal: { ...sampleResume.personal, photo: source.toDataURL('image/png') } };
    const theme = structuredClone(defaultTheme);
    theme.photo.shape = 'portrait-rounded'; theme.photo.borderColor = 'white';
    const sidebar = theme.colors.sidebar.slice(1).match(/../g)!.map(value => parseInt(value, 16));
    // Render with a border first, then remove it, as in the editor.
    for (const borderWidth of [4, 0]) {
      theme.photo.borderWidth = borderWidth;
      let regions: PreviewRegion[] = [];
      const capture = (result: unknown) => { regions = extractPreviewRegions(result); };
  let buffer = await renderToBuffer(<ResumeDocument data={data} theme={theme} onRender={capture} />);
  const continuations = continuationHeadings(regions, theme);
  const sidebarPages = [...new Set(regions.filter(region => region.column === 'sidebar').map(region => region.page))];
  if (regions.some(region => region.page > 1)) buffer = await renderToBuffer(<ResumeDocument data={data} theme={theme} continuations={continuations} sidebarPages={sidebarPages} onRender={capture} />);
      const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
      try {
        const page = await pdf.getPage(1);
        const scale = 3;
        const viewport = page.getViewport({ scale });
        const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
        const pixels = canvas.getContext('2d');
        await page.render({ canvas, canvasContext: pixels, viewport }).promise;
        const photo = regions.find(region => region.target.mode === 'photo')!;
        const sample = (offset: number) => Array.from(pixels.getImageData(Math.round((photo.left + photo.width / 2) * scale), Math.round((photo.top + offset) * scale), 1, 1).data).slice(0, 3);
        expect(sample(1)).toEqual(borderWidth ? [255, 255, 255] : sidebar);
        expect(sample(photo.height - 1)).toEqual(borderWidth ? [255, 255, 255] : sidebar);
        expect(sample(photo.height / 2)).toEqual([255, 0, 0]);
      } finally { await pdf.destroy(); }
    }
  }, 30000);
  it('zachowuje polskie znaki i mieści domyślne CV na stronie A4', async () => {
    const result = await inspect(sampleResume, defaultTheme);
    expect(result.text).toContain('AleksandraNowak'); expect(result.text).toContain('użytkownika'); expect(result.text).toContain('Wyrażamzgodę');
    expect(result.text).toContain('1/1');
    expect(result.outOfBounds).toEqual([]); expect(result.pages).toBe(1);
  }, 30000);
  it('eksportuje wszystkie presety oraz font Roboto bez błędów', async () => {
    for (const preset of presets.slice(1)) {
      const result = await inspect(sampleResume, preset.theme); expect(result.text).toContain('Docplanner'); expect(result.text).toContain('example.com/portfolio'); expect(result.outOfBounds).toEqual([]);
      expect(result.pageTexts.find(text => text.includes('PROJEKTY'))).toContain('Careflow');
    }
    const theme = structuredClone(defaultTheme); theme.typography.fontFamily = 'Roboto'; theme.typography.headingFont = 'Roboto';
    const result = await inspect(sampleResume, theme); expect(result.text).toContain('Warszawa,Polska');
  }, 60000);
  it('przenosi długie kolumny i wszystkie punkty na kolejne strony bez utraty tekstu', async () => {
    const data = structuredClone(sampleResume);
    data.experience = Array.from({ length: 12 }, (_, index) => ({ ...structuredClone(sampleResume.experience[0]), id: `long-${index}`, company: `MAINMARKER${index}`, bullets: [{ id: `b-${index}`, text: `BULLETMARKER${index} ${'Wdrażanie dostępnych komponentów i mierzenie wyników. '.repeat(5)}`, children: [{ id: `c-${index}`, text: `CHILDMARKER${index}`, children: [] }] }] }));
    data.languages = Array.from({ length: 25 }, (_, index) => ({ id: `language-${index}`, name: `SIDEMARKER${index}`, level: 'Poziom biegły' }));
    const result = await inspect(data, defaultTheme);
    for (let i = 0; i < 12; i++) { expect(result.text).toContain(`MAINMARKER${i}`); expect(result.text).toContain(`BULLETMARKER${i}`); expect(result.text).toContain(`CHILDMARKER${i}`); }
    for (let i = 0; i < 25; i++) expect(result.text).toContain(`SIDEMARKER${i}`);
    expect(result.pages).toBeGreaterThan(2); expect(result.outOfBounds).toEqual([]);
  }, 30000);
  it('dzieli bardzo długi akapit po całych liniach', async () => {
    const data = structuredClone(sampleResume); data.summary = `${'Projektowanie złożonych rozwiązań dla użytkowników. '.repeat(120)} ENDOFLONGPARAGRAPH`;
    const theme = structuredClone(defaultTheme); theme.layout = 'single';
    const result = await inspect(data, theme); expect(result.text).toContain('ENDOFLONGPARAGRAPH'); expect(result.text).toContain('Docplanner'); expect(result.outOfBounds).toEqual([]);
  }, 60000);
  it('przenosi długi projekt na kolejne strony bez ucinania jego opisu', async () => {
    const data = structuredClone(sampleResume);
    data.projects[0].description = `Koncepcja aplikacji. ${'Projektowanie i wdrażanie dostępnych rozwiązań. '.repeat(150)} ENDOFLONGPROJECT`;
    const result = await inspect(data, presets.find(preset => preset.id === 'midnight')!.theme);
    expect(result.text).toContain('ENDOFLONGPROJECT'); expect(result.text).toContain('Careflow');
    expect(result.pages).toBeGreaterThan(2); expect(result.outOfBounds).toEqual([]);
    expect(result.pageTexts.find(text => text.includes('PROJEKTY'))).toContain('Careflow');
  }, 30000);
  it('respektuje pozycję klauzuli i ukrycie sekcji w jednej kolumnie', async () => {
    const theme = structuredClone(defaultTheme); theme.layout = 'single';
    const clause = theme.sections.pop()!; theme.sections.unshift(clause);
    theme.sections.find(section => section.id === 'education')!.isVisible = false;
    const result = await inspect(sampleResume, theme);
    expect(result.text.indexOf('Wyrażamzgodę')).toBeLessThan(result.text.indexOf('Docplanner'));
    expect(result.text).not.toContain('UniwersytetSWPS');
  }, 30000);
  it('umieszcza końcową klauzulę na ostatniej stronie razem z treścią CV', async () => {
    const result = await inspect(sampleResume, presets.find(preset => preset.id === 'rose')!.theme);
    const last = result.pageTexts.at(-1)!;
    expect(last).toContain('Wyrażamzgodę');
    expect(last).toContain('Careflow');
    expect(result.pageTexts.slice(0, -1).every(text => !text.includes('Wyrażamzgodę'))).toBe(true);
    expect(result.regions.filter(region => region.target.section === 'consent').map(region => region.page)).toEqual([result.pages]);
    expect(result.outOfBounds).toEqual([]);
  }, 30000);
  it('nie ucina wielowierszowej klauzuli przy zwiększonym odstępie liter', async () => {
    const data = structuredClone(sampleResume);
    data.consent = 'Pierwszy wiersz zgody.\nDrugi wiersz zgody.\nOstatni wiersz zgody.';
    const theme = structuredClone(defaultTheme); theme.typography.tracking = 1.2;
    const result = await inspect(data, theme);
    expect(result.pageTexts.at(-1)).toContain('Pierwszywierszzgody.');
    expect(result.pageTexts.at(-1)).toContain('Ostatniwierszzgody.');
    expect(result.outOfBounds).toEqual([]);
  }, 30000);
  it('osadza zdjęcie we wszystkich szablonach, zachowując natywny tekst i marginesy', async () => {
    const data = { ...sampleResume, personal: { ...sampleResume.personal, photo: testPhoto } };
    for (const preset of presets) {
      const result = await inspect(data, preset.theme);
      expect(result.images).toBe(preset.theme.photo.isVisible ? 1 : 0); expect(result.count).toBeGreaterThan(70); expect(result.text.toLowerCase()).toContain('aleksandranowak'); expect(result.text).toContain('Docplanner'); expect(result.outOfBounds).toEqual([]);
    }
    const hidden = await inspect(data, { ...defaultTheme, photo: { ...defaultTheme.photo, isVisible: false } });
    expect(hidden.images).toBe(0); expect(hidden.text).not.toContain('TWOJEZDJĘCIE');
  }, 60000);
});
