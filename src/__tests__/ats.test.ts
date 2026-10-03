import { describe, expect, it } from 'vitest';
import { sampleResume } from '../data/sampleResume';
import { defaultTheme, presets } from '../data/presets';
import { createDocxDocument } from '../services/exportDocx';
import { Packer } from 'docx';
import JSZip from 'jszip';

describe('Optymalizator ATS (Applicant Tracking System)', () => {
  it('kolekcja zawiera także proste presety ze zdjęciem i warianty z ikonami', () => {
    expect(presets).toHaveLength(100);
    // All 12 presets must place the photo on the left or in the left sidebar
    for (const preset of presets.slice(0, 12)) {
      expect(['sidebar', 'left', 'top-left']).toContain(preset.theme.photo.position);
      expect(preset.theme.photo.size).toBeGreaterThanOrEqual(28);
      expect(preset.theme.photo.isVisible).toBe(true);
    }
    expect(presets.every(p => p.theme.photo.isVisible)).toBe(true);
    expect(presets.some(p => p.theme.icons.style !== 'none')).toBe(true);
    // Verify several templates feature large photos (>= 42mm)
    const largePhotos = presets.filter(p => p.theme.photo.size >= 42);
    expect(largePhotos.length).toBeGreaterThanOrEqual(6);
  });

  it('generuje dokument DOCX w trybie ATS bez tabel i bez rysunków graficznych', async () => {
    const doc = createDocxDocument(sampleResume, defaultTheme, true);
    const buffer = await Packer.toBuffer(doc);
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file('word/document.xml')!.async('string');

    // ATS mode must not include drawing or table elements
    expect(xml).not.toContain('<w:drawing>');
    expect(xml).not.toContain('<w:tbl>');
    // Must contain plain text headings and candidate details
    expect(xml).toContain('Aleksandra Nowak');
    expect(xml).toContain('DOŚWIADCZENIE');
    expect(xml).toContain('Docplanner');
    expect(xml).toContain('EDUKACJA');
  });

  it('dopasowuje słowa kluczowe z ogłoszenia o pracę do treści CV', () => {
    const resumeText = [
      sampleResume.personal.firstName,
      sampleResume.personal.lastName,
      sampleResume.summary,
      ...sampleResume.experience.flatMap(e => [e.company, e.role, e.description, ...e.bullets.map(b => b.text)]),
      ...sampleResume.skills.flatMap(c => [c.name, ...c.skills.map(s => s.name)]),
    ].join(' ').toLowerCase();

    const sampleJob = `
      Poszukujemy Senior Product Designera.
      Wymagania:
      - Znajomość Figma, Design Systems, UI/UX
      - Doświadczenie w pracy w metodyce Scrum / Agile
      - Mile widziana znajomość Docker oraz Kubernetes
    `;

    const knownSkills = ['Figma', 'UI/UX', 'Design Systems', 'Scrum', 'Agile', 'Docker', 'Kubernetes'];
    const matched: string[] = [];
    const missing: string[] = [];

    for (const skill of knownSkills) {
      const regex = new RegExp(`\\b${skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(sampleJob)) {
        if (regex.test(resumeText)) {
          matched.push(skill);
        } else {
          missing.push(skill);
        }
      }
    }

    // Figma, UI/UX, Design Systems, Scrum, Agile are in sampleResume
    expect(matched).toContain('Figma');
    expect(matched).toContain('Design Systems');
    // Docker, Kubernetes are not in sample designer resume
    expect(missing).toContain('Docker');
    expect(missing).toContain('Kubernetes');
  });
});
