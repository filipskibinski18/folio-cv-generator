import { describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';
import { parseDateRange, parseCvText, extractTextFromDocx, parseCvFile } from '../services/cvParser';

describe('CV Parser - Heuristics & Extraction', () => {
  it('oddziela firmę i lokalizację w nagłówku oraz nie przenosi umiejętności do kolejnego pracodawcy', () => {
    const parsed = parseCvText('Anna Nowak\nanna.nowak@example.com\nEXPERIENCE\nData Analyst Comarch - Wrocław, Poland\n08/2022 – Current\n• Analysis of complex datasets and automation.\nSkills: SQL, Python\nUser Support Technician 3M – Wrocław, Poland\n07/2021 - 09/2021\n• Hardware and software support.');
    expect(parsed.data.experience.map(({ role, company, location }) => ({ role, company, location }))).toEqual([
      { role: 'Data Analyst', company: 'Comarch', location: 'Wrocław, Poland' },
      { role: 'User Support Technician', company: '3M', location: 'Wrocław, Poland' },
    ]);
    expect(parsed.data.experience[0].bullets.some(bullet => bullet.text === 'Skills: SQL, Python')).toBe(true);
  });
  it('importuje DOCX bez wysyłania dokumentu i respektuje anulowanie', async () => {
    const zip = new JSZip();
    zip.file('word/document.xml', '<w:document><w:body><w:p><w:r><w:t>Anna Nowak</w:t></w:r></w:p><w:p><w:r><w:t>anna.nowak@example.com</w:t></w:r></w:p><w:p><w:r><w:t>SUMMARY</w:t></w:r></w:p><w:p><w:r><w:t>Projektowanie dostępnych interfejsów.</w:t></w:r></w:p></w:body></w:document>');
    const file = new File([await zip.generateAsync({ type: 'arraybuffer' })], 'resume.docx');
    const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Import cannot use a network service'));
    try {
      expect((await parseCvFile(file)).data.personal.lastName).toBe('Nowak');
      const controller = new AbortController(); controller.abort();
      await expect(parseCvFile(file, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
      expect(network).not.toHaveBeenCalled();
    } finally { network.mockRestore(); }
  });
  it('łączy projekt, metadane certyfikatów i poziomy języków, szuka nazwiska poza nagłówkiem', () => {
    const parsed = parseCvText(`CONTACT
Wrocław, 54-402
505582078
filipskibinski@example.com
SKILLS
• Graph Engineering
• Microsoft Office
LANGUAGES
Polish: First Language
English: C2
Proficient
Filip Skibiński
PROJECTS
Melodict – Mobile Music Quiz Application
06/2026 – Current
https://play.google.com/store/apps/details?id=com.example&hl=en
Full-Stack Mobile Development: Engineered and published a cross-platform application.
Real-Time Multiplayer & Cloud Backend: Integrated Firebase.
Monetization: Implemented AdMob.
CERTIFICATIONS
• Artificial Intelligence (AI) in Workflow Automation – Technical Training (2026), Comarch
• Machine Learning with Python – Foundational Training (2024), Comarch
EDUCATION
Master of Science : ICT
WROCŁAW UNIVERSITY OF SCIENCE AND TECHNOLOGY - Wrocław, 2024
• Master's thesis: Comparison of models
• GPA: 5.0
Bachelor of Science : ICT
WROCŁAW UNIVERSITY OF SCIENCE AND TECHNOLOGY - Wrocław, 2022
• Bachelor thesis: Piano application
• GPA: 4.5
DRIVING LICENCE
• Category B`);
    expect(parsed.data.personal.firstName).toBe('Filip'); expect(parsed.data.personal.lastName).toBe('Skibiński');
    expect(parsed.data.personal.phone).toBe('505582078'); expect(parsed.data.personal.website).toBe('');
    expect(parsed.data.personal.title).not.toContain('Graph');
    expect(parsed.data.projects).toHaveLength(1); expect(parsed.data.projects[0].bullets).toHaveLength(3);
    expect(parsed.data.projects[0].url).toContain('&hl=en'); expect(parsed.data.projects[0].role).toBe('');
    expect(parsed.data.certificates).toHaveLength(2); expect(parsed.data.certificates[0].date).toBe('2026'); expect(parsed.data.certificates[0].issuer).not.toContain('2026');
    expect(parsed.data.languages).toHaveLength(2); expect(parsed.data.languages[1].level).toBe('C2 · Proficient');
    expect(parsed.data.education).toHaveLength(2); expect(parsed.data.education[0].description).toContain("Master's thesis");
  });
  it('pozostawia brakujące dane puste, bez dopisywania tożsamości i kompetencji', () => {
    const minimal = parseCvText('Anna Nowak\nUX Designer\nanna@example.com');
    expect(minimal.data.skills).toEqual([]);
    expect(minimal.data.languages).toEqual([]);
    expect(minimal.data.consent).toBe('');
    expect(minimal.detectedCount.skills).toBe(0);
    expect(minimal.detectedCount.languages).toBe(0);
    const contactOnly = parseCvText('contact@example.com');
    expect(contactOnly.data.personal.firstName).toBe('');
    expect(contactOnly.data.personal.lastName).toBe('');
    expect(contactOnly.data.personal.title).toBe('');
  });
  it('poprawnie parsuje zakresy dat po polsku i angielsku', () => {
    expect(parseDateRange('03.2022 - obecnie')).toEqual({
      startDate: '2022-03',
      endDate: '',
      current: true,
    });

    expect(parseDateRange('czerwiec 2019 - luty 2022')).toEqual({
      startDate: '2019-06',
      endDate: '2022-02',
      current: false,
    });

    expect(parseDateRange('2014 - 2019')).toEqual({
      startDate: '2014',
      endDate: '2019',
      current: false,
    });

    expect(parseDateRange('May 2020 – Present')).toEqual({
      startDate: '2020-05',
      endDate: '',
      current: true,
    });
  });

  it('rozpoznaje dane osobowe, podsumowanie, doświadczenie i umiejętności ze zwykłego tekstu CV', () => {
    const sampleCvText = `
Marek Kowalski
Senior Fullstack Developer
marek.kowalski@example.com | +48 600 700 800 | Warszawa, Polska
linkedin.com/in/mkowalski

O MNIE
Doświadczony programista aplikacji internetowych z ponad 8-letnim stażem. Specjalizuję się w React, Node.js i architekturze chmurowej.

DOŚWIADCZENIE ZAWODOWE
TechCorp Sp. z o.o.
Lead Developer
01.2021 - obecnie
• Architektura mikroserwisów oparta o TypeScript i Docker.
• Kierowanie 6-osobowym zespołem programistów.
• Zwiększenie wydajności bazy danych o 35%.

StartupLab
Frontend Developer
2018 - 2020
• Budowa interfejsów w React i Redux.
• Optymalizacja Core Web Vitals.

EDUKACJA
Politechnika Warszawska
Inżynier
Informatyka
2014 - 2018

UMIEJĘTNOŚCI
Frontend: React, TypeScript, Next.js, Tailwind CSS
Backend: Node.js, Express, PostgreSQL, Redis
Narzędzia: Git, Docker, AWS, Jest

JĘZYKI
Angielski - C1 (zaawansowany)
Niemiecki - B1

CERTYFIKATY
AWS Certified Solutions Architect, Amazon, 2023

KLAUZULA RODO
Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji.
    `.trim();

    const result = parseCvText(sampleCvText);

    expect(result.data.personal.firstName).toBe('Marek');
    expect(result.data.personal.lastName).toBe('Kowalski');
    expect(result.data.personal.title).toBe('Senior Fullstack Developer');
    expect(result.data.personal.email).toBe('marek.kowalski@example.com');
    expect(result.data.personal.phone).toContain('600 700 800');
    expect(result.data.personal.location).toContain('Warszawa');
    expect(result.data.personal.website).toBe('linkedin.com/in/mkowalski');

    expect(result.data.summary).toContain('Doświadczony programista');

    expect(result.detectedCount.experience).toBeGreaterThanOrEqual(2);
    expect(result.data.experience[0].current).toBe(true);
    expect(result.data.experience[0].bullets.length).toBeGreaterThanOrEqual(2);

    expect(result.detectedCount.education).toBeGreaterThanOrEqual(1);
    expect(result.data.education[0].institution).toContain('Politechnika');

    expect(result.detectedCount.skills).toBeGreaterThanOrEqual(5);
    expect(result.detectedCount.languages).toBe(2);
    expect(result.data.consent).toContain('Wyrażam zgodę');
  });

  it('ekstrahuje tekst z pliku DOCX', async () => {
    const zip = new JSZip();
    const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Anna Nowak</w:t></w:r></w:p>
    <w:p><w:r><w:t>UX Designer</w:t></w:r></w:p>
    <w:p><w:pPr><w:numPr><w:ilvl w:val="0"/></w:numPr></w:pPr><w:r><w:t>Projektowanie makiet</w:t></w:r></w:p>
  </w:body>
</w:document>`;
    zip.file('word/document.xml', docXml);
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });

    const extracted = await extractTextFromDocx(buffer);
    expect(extracted).toContain('Anna Nowak');
    expect(extracted).toContain('UX Designer');
    expect(extracted).toContain('• Projektowanie makiet');
  });
  it('zachowuje języki po tabulatorach i ręcznych podziałach wierszy DOCX', async () => {
    const zip = new JSZip();
    zip.file('word/document.xml', '<w:document><w:body><w:p><w:r><w:t>LANGUAGES</w:t></w:r></w:p><w:p><w:r><w:t>Polish: First Language</w:t><w:br/></w:r></w:p><w:p><w:pPr><w:tabs><w:tab w:val="left" w:pos="720"/></w:tabs></w:pPr><w:r><w:t>English:</w:t><w:tab/><w:t>C2</w:t><w:br/><w:t>Proficient</w:t></w:r></w:p></w:body></w:document>');
    const text = await extractTextFromDocx(await zip.generateAsync({ type: 'arraybuffer' }));
    expect(text).not.toContain('<w:');
    expect(parseCvText(text).data.languages.map(({ name, level }) => ({ name, level }))).toEqual([{ name: 'Polish', level: 'First Language' }, { name: 'English', level: 'C2 · Proficient' }]);
  });

  it('ekstrahuje tekst z pliku PDF i parsuje CV', async () => {
    const { renderToBuffer, Font } = await import('@react-pdf/renderer');
    const { resolve } = await import('node:path');
    const { ResumeDocument } = await import('../components/preview/ResumeDocument');
    const { sampleResume } = await import('../data/sampleResume');
    const { defaultTheme } = await import('../data/presets');
    const { extractTextFromPdf } = await import('../services/cvParser');

    for (const family of ['Inter', 'Lora', 'Roboto', 'Montserrat', 'PlayfairDisplay', 'SourceSans3', 'Oswald', 'CormorantGaramond', 'Caveat']) {
      Font.register({
        family,
        fonts: [400, 700].map(fontWeight => ({
          src: resolve('public/fonts', `${family}-${fontWeight}.ttf`),
          fontWeight,
        })),
      });
    }

    const pdfBuffer = await renderToBuffer(<ResumeDocument data={sampleResume} theme={defaultTheme} />);
    const extracted = await extractTextFromPdf(pdfBuffer);

    expect(extracted).toContain('Aleksandra Nowak');
    expect(extracted).toContain('Docplanner');

    const parsed = parseCvText(extracted);
    expect(parsed.data.personal.firstName).toBe('Aleksandra');
    expect(parsed.data.personal.lastName).toBe('Nowak');
    expect(parsed.detectedCount.experience).toBeGreaterThanOrEqual(1);
  }, 30000);
});
