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
    expect(new Set(presets.map(preset => preset.theme.design.decoration)).size).toBe(12);
    // Every new composition option is used by at least one built-in template.
    expect(new Set(presets.map(preset => preset.theme.design.sidebarStyle))).toEqual(new Set(['box', 'bleed', 'line']));
    for (const style of ['bar', 'numbered', 'side'] as const) expect(presets.some(preset => preset.theme.sectionStyle === style), style).toBe(true);
    expect(presets.some(preset => preset.theme.headerStyle === 'hero')).toBe(true);
    expect(presets.some(preset => preset.theme.design.nameStyle === 'split')).toBe(true);
  });
  it('loads older themes and rejects unsafe geometry', () => {
    const { design: _design, keepSectionsTogether: _keep, ...old } = defaultTheme;
    expect(resumeThemeSchema.parse(old).keepSectionsTogether).toBe(true);
    expect(resumeThemeSchema.parse({ ...old, keepSectionsTogether: false }).keepSectionsTogether).toBe(false);
    expect(resumeThemeSchema.parse(old).design.sidebarPadding).toBe(12);
    expect(resumeThemeSchema.safeParse({ ...old, design: { ...defaultTheme.design, continuationGap: 0 } }).success).toBe(false);
  });
  it('keeps section paragraphs together inside Word columns only when enabled', async () => {
    for (const enabled of [true, false]) {
      const zip = await JSZip.loadAsync(await Packer.toBuffer(createDocxDocument(sampleResume, { ...defaultTheme, keepSectionsTogether: enabled })));
      const xml = await zip.file('word/document.xml')!.async('string');
      const paragraph = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g)!.find(value => value.includes('Przeprojektowanie procesu'))!;
      expect(paragraph.includes('<w:keepNext/>')).toBe(enabled);
      expect(xml).toContain('HTML / CSS');
    }
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

describe('Miniatury szablonów', () => {
  it('każdy wbudowany szablon ma wyrenderowaną miniaturę (npm run thumbnails)', async () => {
    const { existsSync } = await import('node:fs');
    const { presets } = await import('../data/presets');
    const missing = presets.filter(preset => !existsSync(`public/thumbnails/${preset.id}.webp`)).map(preset => preset.id);
    expect(missing).toEqual([]);
  });
});
