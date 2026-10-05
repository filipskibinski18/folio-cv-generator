import { describe, expect, it } from 'vitest';
import { Packer } from 'docx';
import JSZip from 'jszip';
import { sampleResume } from '../data/sampleResume';
import { defaultTheme, presets } from '../data/presets';
import { resumeDataSchema, resumeThemeSchema } from '../types/resume';
import { parseProjectJson } from '../services/projectJson';
import { createDocxDocument } from '../services/exportDocx';
import { contrastColor, cropRectangle, defaultCrop, minPhotoZoom, panCrop, photoAspect } from '../lib/photo';

export const testPhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6N8AAAAASUVORK5CYII=';

describe('Zdjęcie i zgodność zapisanych projektów', () => {
  it('uzupełnia starsze dane i szablony bez kasowania ich treści', () => {
    const legacyData = JSON.parse(JSON.stringify(sampleResume)); delete legacyData.personal.photo;
    const legacyTheme = JSON.parse(JSON.stringify(defaultTheme)); delete legacyTheme.photo; delete legacyTheme.headerStyle; delete legacyTheme.sectionStyle;
    const project = parseProjectJson(JSON.stringify({ kind: 'folio-resume', version: 1, name: 'Starsze CV', data: legacyData, theme: legacyTheme }));
    expect(project.kind).toBe('folio-resume');
    if (project.kind !== 'folio-resume') throw new Error('Unexpected project kind');
    expect(project.data.personal.photo).toBe(''); expect(project.data.experience).toEqual(sampleResume.experience);
    expect(project.theme.photo.isVisible).toBe(true); expect(project.theme.headerStyle).toBe('accent');
    const template = parseProjectJson(JSON.stringify({ kind: 'folio-template', version: 1, template: { ...presets[0], theme: legacyTheme, builtIn: false } }));
    expect(template.kind === 'folio-template' && template.template.theme.photo.size).toBe(26);
  });
  it('zapisuje zdjęcie razem z projektem JSON i akceptuje lokalny PNG', () => {
    const data = { ...sampleResume, personal: { ...sampleResume.personal, photo: testPhoto } };
    expect(resumeDataSchema.parse(data)).toEqual(data);
    const project = parseProjectJson(JSON.stringify({ kind: 'folio-resume', version: 1, name: 'Ze zdjęciem', data, theme: defaultTheme }));
    expect(project.kind === 'folio-resume' && project.data.personal.photo).toBe(testPhoto);
  });
  it('odrzuca zdjęcia zewnętrzne, SVG, uszkodzone dane i niedozwolony rozmiar ramki', () => {
    for (const photo of ['https://example.com/photo.jpg', 'data:image/svg+xml;base64,PHN2Zz4=', 'data:image/jpeg;base64,invalid', testPhoto.replace('image/png', 'image/jpeg'), 'data:image/png;base64,' + 'x'.repeat(800001)]) {
      expect(resumeDataSchema.safeParse({ ...sampleResume, personal: { ...sampleResume.personal, photo } }).success).toBe(false);
    }
    expect(resumeThemeSchema.safeParse({ ...defaultTheme, photo: { ...defaultTheme.photo, size: 200 } }).success).toBe(false);
  });
  it('kolekcja obejmuje różne kompozycje ze zdjęciem', () => {
    expect(presets).toHaveLength(31); expect(new Set(presets.map(preset => preset.id)).size).toBe(31);
    expect(presets.slice(0, 12).every(preset => preset.theme.photo.isVisible)).toBe(true);
    expect(new Set(presets.map(preset => preset.theme.headerStyle)).size).toBe(4);
    expect(new Set(presets.map(preset => preset.theme.layout)).size).toBe(4);
  });
  it('utrzymuje kwadratowy kadr wewnątrz obrazu przy powiększeniu i przesunięciu', () => {
    expect(cropRectangle(800, 1200, defaultCrop)).toEqual({ width: 800, height: 800, x: 0, y: 200 });
    expect(cropRectangle(800, 1200, { zoom: 2, x: 100, y: 0 })).toEqual({ width: 400, height: 400, x: 400, y: 0 });
    expect(cropRectangle(1200, 800, { zoom: 3, x: 200, y: -10 })).toEqual({ width: 800 / 3, height: 800 / 3, x: 1200 - 800 / 3, y: 0 });
  });
  it('kadruje portret w proporcjach ramki i pozwala oddalić zdjęcie', () => {
    expect(photoAspect('portrait')).toBe(1.28); expect(photoAspect('circle')).toBe(1);
    const portrait = cropRectangle(1000, 1000, defaultCrop, 1.28);
    expect(portrait.height).toBeCloseTo(1000); expect(portrait.width).toBeCloseTo(1000 / 1.28);
    // Zoomed out the window is larger than the photo, so the photo can move inside it.
    const zoom = minPhotoZoom(800, 1200, 1);
    expect(zoom).toBeCloseTo(800 / 1200);
    expect(cropRectangle(800, 1200, { zoom: 0.1, x: 50, y: 50 })).toEqual({ width: 1200, height: 1200, x: -200, y: 0 });
  });
  it('przesuwa kadr przeciągnięciem w obu osiach', () => {
    const zoomed = { zoom: 2, x: 50, y: 50 };
    // Dragging the photo right/down reveals what is left/above, so the window moves left/up.
    const moved = panCrop(1000, 1000, zoomed, 1, 250, 50, 50);
    expect(moved.x).toBeLessThan(50); expect(moved.y).toBeLessThan(50);
    expect(panCrop(1000, 1000, zoomed, 1, 250, -10_000, 0).x).toBe(100);
    // Without spare room on an axis the position stays put instead of jumping.
    expect(panCrop(800, 1200, defaultCrop, 1, 250, 40, 0).x).toBe(50);
    const zoomedOut = { zoom: minPhotoZoom(800, 1200), x: 50, y: 50 };
    // Zoomed out, the photo itself moves inside the frame in the drag direction.
    expect(cropRectangle(800, 1200, panCrop(800, 1200, zoomedOut, 1, 250, 40, 0)).x).toBeLessThan(cropRectangle(800, 1200, zoomedOut).x);
    expect(contrastColor('#ffffff')).toBe('#182322'); expect(contrastColor('#244967')).toBe('#ffffff');
  });
});

describe('Zdjęcie w edytowalnym dokumencie Word', () => {
  it('osadza obraz jako natywny ImageRun zamiast rasteryzować CV', async () => {
    const data = { ...sampleResume, personal: { ...sampleResume.personal, photo: testPhoto } };
    for (const preset of presets.filter(p => p.theme.photo.isVisible)) {
      const zip = await JSZip.loadAsync(await Packer.toBuffer(createDocxDocument(data, preset.theme)));
      const xml = await zip.file('word/document.xml')!.async('string');
      expect(xml).toContain('<w:drawing>'); expect(xml).toContain('Zdjęcie profilowe'); expect(xml).toContain('Aleksandra Nowak');
      const pictures = Object.keys(zip.files).filter(path => /^word\/media\/.*\.png$/.test(path));
      expect(pictures).toHaveLength(1); expect(await zip.file(pictures[0])!.async('base64')).toBe(testPhoto.split(',')[1]);
    }
  }, 15000);
  it('pomija obraz i ramkę w ATS oraz po wyłączeniu zdjęcia', async () => {
    const data = { ...sampleResume, personal: { ...sampleResume.personal, photo: testPhoto } };
    const ats = await JSZip.loadAsync(await Packer.toBuffer(createDocxDocument(data, presets[3].theme, true)));
    const atsXml = await ats.file('word/document.xml')!.async('string');
    expect(atsXml).not.toContain('<w:drawing>'); expect(atsXml).not.toContain('<w:tbl>'); expect(atsXml).not.toContain('MIEJSCE NA ZDJĘCIE'); expect(atsXml).toContain('Docplanner');
    const hidden = await JSZip.loadAsync(await Packer.toBuffer(createDocxDocument(data, { ...defaultTheme, photo: { ...defaultTheme.photo, isVisible: false } })));
    expect(await hidden.file('word/document.xml')!.async('string')).not.toContain('<w:drawing>');
  });
});
