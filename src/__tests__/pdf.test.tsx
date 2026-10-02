import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { Font, renderToBuffer } from '@react-pdf/renderer';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { ResumeDocument } from '../components/preview/ResumeDocument';
import { sampleResume } from '../data/sampleResume';
import { defaultTheme, presets } from '../data/presets';
import type { ResumeData, ResumeTheme } from '../types/resume';
import { mmToPt } from '../lib/format';

for (const family of ['Inter', 'Lora', 'Roboto']) Font.register({ family, fonts: [400, 700].map(fontWeight => ({ src: resolve('public/fonts', `${family}-${fontWeight}.ttf`), fontWeight })) });
Font.registerHyphenationCallback(word => [word]);
async function inspect(data: ResumeData, theme: ResumeTheme) {
  const buffer = await renderToBuffer(<ResumeDocument data={data} theme={theme} />);
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  let text = ''; let count = 0;
  const outOfBounds: { page: number; text: string; y: number }[] = [];
  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number); const items = (await page.getTextContent()).items.filter((item): item is TextItem => 'str' in item);
    text += items.map(item => item.str).join(' '); count += items.length;
    for (const item of items) {
      if (!item.str.trim() || /^\d+\s*\/\s*\d+$/.test(item.str)) continue;
      const y = item.transform[5];
      if (y < mmToPt(theme.geometry.margins.bottom) - 3 || y > 842 - mmToPt(theme.geometry.margins.top) + 2) outOfBounds.push({ page: number, text: item.str, y });
    }
    const operators = await page.getOperatorList();
    expect(operators.fnArray).not.toContain(OPS.paintImageXObject);
    expect(page.view[2]).toBeCloseTo(595.28, 1); expect(page.view[3]).toBeCloseTo(841.89, 1);
  }
  const pages = pdf.numPages; await pdf.destroy();
  return { text: text.replace(/\s/g, ''), pages, count, outOfBounds };
}
describe('Wektorowy PDF A4 i podział stron', () => {
  it('zachowuje polskie znaki i mieści domyślne CV na stronie A4', async () => {
    const result = await inspect(sampleResume, defaultTheme);
    expect(result.text).toContain('AleksandraNowak'); expect(result.text).toContain('użytkownika'); expect(result.text).toContain('Wyrażamzgodę');
    expect(result.text).toContain('1/1');
    expect(result.outOfBounds).toEqual([]); expect(result.pages).toBe(1);
  }, 30000);
  it('eksportuje wszystkie presety oraz font Roboto bez błędów', async () => {
    for (const preset of presets.slice(1)) {
      const result = await inspect(sampleResume, preset.theme); expect(result.text).toContain('Docplanner'); expect(result.text).toContain('example.com/portfolio'); expect(result.outOfBounds).toEqual([]);
    }
    const theme = structuredClone(defaultTheme); theme.typography.fontFamily = 'Roboto'; theme.typography.headingFont = 'Roboto';
    const result = await inspect(sampleResume, theme); expect(result.text).toContain('Warszawa,Polska');
  }, 30000);
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
  }, 30000);
  it('respektuje pozycję klauzuli i ukrycie sekcji w jednej kolumnie', async () => {
    const theme = structuredClone(defaultTheme); theme.layout = 'single';
    const clause = theme.sections.pop()!; theme.sections.unshift(clause);
    theme.sections.find(section => section.id === 'education')!.isVisible = false;
    const result = await inspect(sampleResume, theme);
    expect(result.text.indexOf('Wyrażamzgodę')).toBeLessThan(result.text.indexOf('Docplanner'));
    expect(result.text).not.toContain('UniwersytetSWPS');
  }, 30000);
});
