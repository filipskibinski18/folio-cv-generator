import { describe, it, expect } from 'vitest';
import { Packer } from 'docx';
import JSZip from 'jszip';
import { readFileSync } from 'node:fs';
import { sampleResume } from '../data/sampleResume';
import { defaultTheme, presets } from '../data/presets';
import { parseProjectJson } from '../services/projectJson';
import { resumeDataSchema, resumeThemeSchema } from '../types/resume';
import { createDocxDocument } from '../services/exportDocx';
import { dateRange, inlineRuns, safeUrl } from '../lib/format';

describe('Pliki projektu i model danych', () => {
  it('przenosi pełny projekt JSON bez utraty danych', () => {
    const file = { kind: 'folio-resume', version: 1, name: 'CV', data: sampleResume, theme: defaultTheme };
    expect(parseProjectJson(JSON.stringify(file))).toEqual(file);
  });
  it('waliduje wszystkie presety i przykładowe dane', () => {
    expect(resumeDataSchema.safeParse(sampleResume).success).toBe(true);
    presets.forEach(preset => expect(resumeThemeSchema.safeParse(preset.theme).success).toBe(true));
  });
  it('odrzuca uszkodzone, obce i zbyt duże pliki', () => {
    expect(() => parseProjectJson('{broken')).toThrow('JSON');
    expect(() => parseProjectJson('{"kind":"other"}')).toThrow('Nieprawidłowy plik');
    expect(() => parseProjectJson('x'.repeat(2 * 1024 * 1024 + 1))).toThrow('za duży');
  });
  it('odrzuca niebezpieczne kolory, marginesy i powtórzone sekcje', () => {
    const theme = structuredClone(defaultTheme); theme.sections[1].id = 'summary';
    expect(resumeThemeSchema.safeParse(theme).success).toBe(false);
    expect(resumeThemeSchema.safeParse({ ...defaultTheme, colors: { ...defaultTheme.colors, accent: 'url(http://example.com)' } }).success).toBe(false);
    expect(resumeThemeSchema.safeParse({ ...defaultTheme, geometry: { ...defaultTheme.geometry, margins: { top: 200, left: 10, right: 10, bottom: 10 } } }).success).toBe(false);
  });
  it('zachowuje zagnieżdżone punkty i opcjonalne poziomy', () => {
    const data = structuredClone(sampleResume); data.experience[0].bullets[0].children = [{ id: 'nested', text: 'Zażółć gęślą jaźń', children: [] }];
    delete data.skills[0].skills[0].level;
    expect(resumeDataSchema.parse(data)).toEqual(data);
  });
  it('odrzuca powtórzone identyfikatory z importu', () => {
    const data = structuredClone(sampleResume); data.experience[1].id = data.experience[0].id;
    expect(resumeDataSchema.safeParse(data).success).toBe(false);
  });
});
describe('Formatowanie', () => {
  it('odrzuca wykonywalne adresy i zachowuje linki kontaktowe', () => {
    expect(safeUrl('javascript:alert(1)')).toBeUndefined(); expect(safeUrl('data:text/html,test')).toBeUndefined();
    expect(safeUrl('example.com')).toBe('https://example.com'); expect(safeUrl('mailto:a@example.com')).toBe('mailto:a@example.com');
  });
  it('zachowuje pogrubienia i polskie daty', () => {
    expect(inlineRuns('Wzrost **24%** rocznie')).toEqual([{ text: 'Wzrost ', bold: false }, { text: '24%', bold: true }, { text: ' rocznie', bold: false }]);
    expect(dateRange('2022-03', '', true)).toBe('mar 2022 — obecnie');
  });
});
describe('Natywny dokument Word', () => {
  const unzip = async (theme = defaultTheme, ats = false, data = sampleResume) => {
    const buffer = await Packer.toBuffer(createDocxDocument(data, theme, ats));
    return JSZip.loadAsync(buffer);
  };
  it('generuje edytowalny DOCX z polskim tekstem, listami i prawdziwymi kolumnami', async () => {
    const zip = await unzip(); const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('Aleksandra Nowak'); expect(xml).toContain('Doświadczenie'.toLocaleUpperCase('pl'));
    expect(xml).toContain('rezerwacji wizyt'); expect(xml).toContain('24%'); expect(xml).not.toContain('**24%**');
    expect(xml).toContain('<w:tbl>'); expect(xml).toContain('<w:numPr>'); expect(xml).toContain('Wyrażam zgodę');
    expect(xml).not.toContain('<w:drawing>'); expect(xml).toContain('w:w="11906"');
    expect(await zip.file('word/styles.xml')!.async('string')).toContain('Inter');
  });
  it('tryb ATS linearyzuje kolumny i respektuje kolejność oraz ukrycie sekcji', async () => {
    const theme = structuredClone(defaultTheme); theme.sections.find(s => s.id === 'education')!.isVisible = false;
    theme.sections.reverse(); const zip = await unzip(theme, true); const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).not.toContain('<w:tbl>'); expect(xml).not.toContain('Uniwersytet SWPS');
    expect(xml.indexOf('Careflow')).toBeLessThan(xml.indexOf('Docplanner'));
    expect(xml.indexOf('Wyrażam zgodę')).toBeLessThan(xml.indexOf('Careflow'));
  });
  it('nie gubi końca długiego CV i eksportuje poziom zagnieżdżenia', async () => {
    const data = structuredClone(sampleResume);
    data.experience = Array.from({ length: 35 }, (_, i) => ({ ...structuredClone(sampleResume.experience[0]), id: `long-${i}`, company: `Firma ${i}`, bullets: [{ id: `nested-${i}`, text: `Osiągnięcie ${i}`, children: [{ id: `child-${i}`, text: `Podpunkt ${i}`, children: [] }] }] }));
    const zip = await unzip(defaultTheme, false, data); const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('Firma 34'); expect(xml).toContain('Podpunkt 34'); expect(xml).toContain('w:ilvl w:val="1"');
  });
  it('osadza prawdziwy font TTF w pliku Worda', async () => {
    const document = createDocxDocument(sampleResume, defaultTheme, false, [{ name: 'Inter', data: readFileSync('public/fonts/Inter-400.ttf') }]);
    const zip = await JSZip.loadAsync(await Packer.toBuffer(document));
    expect(zip.file('word/fonts/font1.odttf')).not.toBeNull();
    expect(await zip.file('word/fontTable.xml')!.async('string')).toContain('w:embedRegular');
  });
});
