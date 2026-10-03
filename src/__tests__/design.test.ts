import { describe, expect, it } from 'vitest';
import { Packer } from 'docx';
import JSZip from 'jszip';
import { presets, defaultTheme } from '../data/presets';
import { categoriesFor, templateCategories } from '../data/templateCategories';
import { sampleResume } from '../data/sampleResume';
import { resumeThemeSchema, templateSchema } from '../types/resume';
import { createDocxDocument } from '../services/exportDocx';

describe('Style catalogue and editable export', () => {
  it('covers every category with valid, distinct designs', () => {
    for (const preset of presets) expect(templateSchema.safeParse(preset).success, preset.id).toBe(true);
    for (const category of templateCategories) expect(presets.filter(preset => categoriesFor(preset).includes(category.id)).length).toBeGreaterThanOrEqual(4);
    expect(new Set(presets.map(preset => JSON.stringify(preset.theme))).size).toBe(presets.length);
    expect(new Set(presets.map(preset => preset.theme.design.entryStyle)).size).toBe(4);
    expect(new Set(presets.map(preset => preset.theme.design.decoration)).size).toBe(6);
  });
  it('loads older themes and rejects unsafe geometry', () => {
    const { design: _design, ...old } = defaultTheme;
    expect(resumeThemeSchema.parse(old).design.sidebarPadding).toBe(12);
    expect(resumeThemeSchema.safeParse({ ...old, design: { ...defaultTheme.design, continuationGap: 0 } }).success).toBe(false);
  });
  it('exports native date tables and removes them in ATS', async () => {
    const theme = presets.find(preset => preset.id === 'mono-ledger')!.theme;
    for (const ats of [false, true]) {
      const zip = await JSZip.loadAsync(await Packer.toBuffer(createDocxDocument(sampleResume, theme, ats)));
      const xml = await zip.file('word/document.xml')!.async('string');
      expect(xml.includes('<w:tbl>')).toBe(!ats);
      expect(xml).toContain('Docplanner'); expect(xml).toContain('Uniwersytet SWPS');
      expect(xml).toContain('mar 2022'); expect(xml).toContain('rezerwacji wizyt');
    }
  });
  it('keeps all contacts when moved to the sidebar and preserves multiline names', async () => {
    const theme = presets.find(preset => preset.id === 'burgundy-archive')!.theme;
    const zip = await JSZip.loadAsync(await Packer.toBuffer(createDocxDocument(sampleResume, theme)));
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('KONTAKT'); expect(xml).toContain('<w:br/>');
    for (const value of [sampleResume.personal.email, sampleResume.personal.phone]) expect(xml.split(value)).toHaveLength(2);
  });
  it('exports dark templates as readable plain text in ATS', async () => {
    const theme = presets.find(preset => preset.id === 'terminal-night')!.theme;
    const zip = await JSZip.loadAsync(await Packer.toBuffer(createDocxDocument(sampleResume, theme, true)));
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).not.toContain('<w:tbl>'); expect(xml).not.toContain('F0FAF8');
    expect(xml).toContain('w:color="ffffff"'); expect(xml).toContain('w:val="182322"');
  });
});
