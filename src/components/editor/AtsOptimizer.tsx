import { tr } from '../../lib/i18n';
import { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Wand2, 
  Plus, 
  FileText, 
  FileDown, 
  Search, 
  Check, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { exportPdf } from '../../services/exportPdf';
import { uid } from '../../lib/format';

// Common technical, professional and soft skill keywords in PL and EN
const COMMON_KEYWORDS = [
  'React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Node.js', 'Python', 'Java', 'SQL', 
  'PostgreSQL', 'MySQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Git', 'CI/CD', 
  'Figma', 'UI/UX', 'Design Systems', 'Scrum', 'Agile', 'Jira', 'Confluence', 'REST API', 
  'GraphQL', 'Excel', 'PowerBI', 'SEO', 'Google Analytics', 'Photoshop', 'Illustrator', 
  'Tailwind CSS', 'Next.js', 'Vue.js', 'Angular', 'C#', '.NET', 'Linux', 'Microservices', 
  'Unit Testing', 'Jest', 'Cypress', 'Playwright', 'Redux', 'Zustand', 'Sass', 'Webpack', 
  'Vite', 'BHP', 'SAP', 'Salesforce', 'Copywriting', 'E-commerce', 'Lead Generation',
  'Zarządzanie projektem', 'Project Management', 'Analiza biznesowa', 'Business Analysis',
  'Obsługa klienta', 'Customer Service', 'Kierowanie zespołem', 'Team Leadership',
  'Budżetowanie', 'Negocjacje', 'Prezentacje', 'Angielski C1', 'Angielski B2', 'Niemiecki'
];

export function AtsOptimizer({ notify }: { notify: (message: string) => void }) {
  const store = useResumeStore();
  const { data, theme } = store;
  const [jobText, setJobText] = useState('');
  const [busyExport, setBusyExport] = useState<'pdf' | 'docx' | null>(null);

  // 1. Gather all resume text for keyword & content analysis
  const resumeText = useMemo(() => {
    const parts: string[] = [
      data.personal.firstName,
      data.personal.lastName,
      data.personal.title,
      data.personal.location,
      data.personal.email,
      data.summary,
      ...data.experience.flatMap(e => [e.company, e.role, e.description, ...e.bullets.map(b => b.text)]),
      ...data.education.flatMap(ed => [ed.institution, ed.degree, ed.field, ed.description]),
      ...data.skills.flatMap(c => [c.name, ...c.skills.map(s => s.name)]),
      ...data.projects.flatMap(p => [p.name, p.description, p.role, ...p.technologies, ...p.bullets.map(b => b.text)]),
      ...data.certificates.flatMap(c => [c.name, c.issuer]),
      ...data.languages.flatMap(l => [l.name, l.level]),
      data.consent,
    ];
    return parts.filter(Boolean).join(' ').toLowerCase();
  }, [data]);

  // 2. Metrics check in experience bullets
  const metricsFound = useMemo(() => {
    const bulletTexts = [
      ...data.experience.flatMap(e => e.bullets.map(b => b.text)),
      ...data.projects.flatMap(p => p.bullets.map(b => b.text))
    ].join(' ');
    // Match numbers, percentages, currency, metrics
    const matches = bulletTexts.match(/\b\d+(\s?%|\s?(?:zł|pln|\$|€|k|h|godz|osób|klientów|projektów))?\b/gi);
    return matches ? matches.length : 0;
  }, [data]);

  // 3. ATS Audit Criteria & Score Calculation
  const audit = useMemo(() => {
    const isSingleColumn = theme.layout === 'single';
    const isFontSafe = theme.typography.fontFamily !== 'Lora'; // Sans-serif (Inter, Roboto) parses cleanly
    const hasContact = Boolean(data.personal.email && data.personal.phone && data.personal.location);
    const hasSummary = Boolean(data.summary && data.summary.trim().length >= 40);
    const hasExperience = data.experience.length > 0;
    const hasSkills = data.skills.some(c => c.skills.length >= 3);
    const hasMetrics = metricsFound >= 2;
    const hasConsent = Boolean(data.consent && data.consent.trim().length >= 25);
    const noPhoto = !theme.photo.isVisible;

    let score = 0;
    if (isSingleColumn) score += 25; else score += 10;
    if (isFontSafe) score += 10; else score += 6;
    if (hasContact) score += 15; else score += 7;
    if (hasSummary) score += 10; else score += 4;
    if (hasExperience) score += 15; else score += 5;
    if (hasSkills) score += 10; else score += 4;
    if (hasMetrics) score += 10; else score += 3;
    if (hasConsent) score += 5;

    return {
      score: Math.min(100, Math.max(0, score)),
      isSingleColumn,
      isFontSafe,
      hasContact,
      hasSummary,
      hasExperience,
      hasSkills,
      hasMetrics,
      hasConsent,
      noPhoto,
    };
  }, [theme, data, metricsFound]);

  // 4. Job Description Keywords Scanner
  const keywordAnalysis = useMemo(() => {
    if (!jobText.trim()) return null;

    const foundKeywords: string[] = [];
    
    // Check known keyword set
    for (const kw of COMMON_KEYWORDS) {
      const regex = new RegExp(`\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(jobText)) {
        foundKeywords.push(kw);
      }
    }

    // Extract custom potential acronyms / tech terms (2-12 upper/mixed letters)
    const extraTokens = jobText.match(/\b[A-Z][a-zA-Z0-9+#.]{1,12}\b/g) || [];
    for (const token of extraTokens) {
      if (token.length >= 2 && !foundKeywords.some(k => k.toLowerCase() === token.toLowerCase()) && !['Wymagania', tr("Obowiązki"), tr("Firma"), 'Praca', 'CV', 'Oferujemy', 'Mile', 'Widziane', tr("Znajomość"), tr("Doświadczenie")].includes(token)) {
        foundKeywords.push(token);
      }
    }

    const matched: string[] = [];
    const missing: string[] = [];

    for (const kw of foundKeywords) {
      const regex = new RegExp(`\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(resumeText)) {
        matched.push(kw);
      } else {
        missing.push(kw);
      }
    }

    const total = foundKeywords.length;
    const matchPercentage = total > 0 ? Math.round((matched.length / total) * 100) : 0;

    return {
      total,
      matched,
      missing,
      matchPercentage
    };
  }, [jobText, resumeText]);

  // 5. Simplify the layout for recruitment parsers
  const applyAtsOptimization = () => {
    store.updateTheme({
      layout: 'single',
      icons: { style: 'none', size: 14 },
      design: { ...theme.design, entryStyle: 'plain', decoration: 'none', nameStyle: 'natural', contactPlacement: 'header', contactIcons: false },
      headerStyle: 'accent',
      sectionStyle: 'underline',
      typography: {
        ...theme.typography,
        fontFamily: 'Roboto',
        headingFont: 'Roboto',
        baseSize: 9.5,
        headingSize: 11,
        lineHeight: 1.4,
      },
      colors: {
        accent: '#1e3a5f',
        background: '#ffffff',
        text: '#111827',
        muted: '#4b5563',
        separator: '#cbd5e1',
        sidebar: '#f8fafc',
      },
      geometry: {
        ...theme.geometry,
        margins: { top: 18, right: 18, bottom: 18, left: 18 },
        sectionGap: 10,
        blockGap: 4,
        lineWidth: 0.8,
      },
      photo: {
        ...theme.photo,
        isVisible: false, // Recommended default for strict corporate ATS
      },
    });
    notify(tr("Zastosowano prosty, czytelny układ dla ATS."));
  };

  // 6. Quick add missing keyword to skills
  const addKeywordToSkills = (keyword: string) => {
    const skills = structuredClone(data.skills);
    if (skills.length === 0) {
      skills.push({
        id: uid(),
        name: 'Umiejętności',
        skills: [{ id: uid(), name: keyword }]
      });
    } else {
      // Find category with matching name or add to first category
      const targetCategory = skills.find(c => c.name.toLowerCase().includes('techniczn') || c.name.toLowerCase().includes(tr("umiejętno"))) || skills[0];
      if (!targetCategory.skills.some(s => s.name.toLowerCase() === keyword.toLowerCase())) {
        targetCategory.skills.push({ id: uid(), name: keyword });
      }
    }
    store.setData({ ...data, skills });
    notify(`Dodano "${keyword}" do Twoich umiejętności!`);
  };

  // 7. Direct download handlers
  const handleDownloadDocx = async () => {
    setBusyExport('docx');
    try {
      const { exportDocx } = await import('../../services/exportDocx');
      await exportDocx(data, theme, true); // ats = true
      notify('Pobrano plik ATS .DOCX');
    } catch (err) {
      notify(tr("Błąd podczas generowania pliku DOCX"));
    } finally {
      setBusyExport(null);
    }
  };

  const handleDownloadPdf = async () => {
    setBusyExport('pdf');
    try {
      await exportPdf(data, theme);
      notify('Pobrano plik ATS .PDF');
    } catch (err) {
      notify(tr("Błąd podczas generowania pliku PDF"));
    } finally {
      setBusyExport(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'var(--ui-success)'; // Green
    if (score >= 65) return 'var(--ui-warning)'; // Amber
    return 'var(--ui-danger)'; // Red
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'var(--ui-success-bg)';
    if (score >= 65) return 'var(--ui-warning-bg)';
    return 'var(--ui-danger-bg)';
  };

  return (
    <div className="ats-optimizer-view" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Score Summary Banner */}
      <section className="ats-score-banner" style={{ background: getScoreBg(audit.score), borderColor: `color-mix(in srgb, ${getScoreColor(audit.score)} 25%, transparent)` }} aria-label={tr('Ocena czytelności ATS')}>
        <div className="ats-score-heading">
          <div className="ats-score-gauge" style={{ borderColor: getScoreColor(audit.score), color: getScoreColor(audit.score) }}><strong>{audit.score}</strong><span>/ 100</span></div>
          <div className="ats-score-copy"><h3>{tr('Ocena czytelności ATS')}</h3><p>{audit.score >= 85 ? tr('Czytelny układ i dobrze uzupełniona treść.') : audit.score >= 65 ? tr('Dobry początek. Kilka zmian ułatwi odczyt CV.') : tr('Uprość układ i uzupełnij wskazane informacje.')}</p></div>
        </div>
        <div className="ats-score-progress" role="progressbar" aria-label={tr('Ocena czytelności ATS')} aria-valuenow={audit.score} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${audit.score}%`, background: getScoreColor(audit.score) }} /></div>
        <p className="ats-score-note">{tr('Ocena orientacyjna — wynik zależy też od systemu rekrutacyjnego.')}</p>
        <button className="primary-button ats-simplify" onClick={applyAtsOptimization} title={tr("Automatycznie ustawia 1 kolumnę, czytelny font, standardowe marginesy i ukrywa zdjęcie")}><Wand2 size={16} /><span>{tr('Uprość układ dla ATS')}</span></button>
      </section>

      {/* 2. Job Description & Keyword Matcher */}
      <div 
        className="ats-card"
        style={{ 
          background: 'var(--ui-surface)',
          border: '1px solid var(--ui-border)',
          borderRadius: 10, 
          padding: 16 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Search size={16} color="var(--ui-blue)" />
          <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--ui-text)', margin: 0 }}>{tr("Dopasowanie do ogłoszenia o pracę")}</h3>
        </div>
        <p style={{ fontSize: 10, color: 'var(--ui-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>{tr("Wklej treść oferty lub wymagania stanowiska, aby sprawdzić, czy Twoje CV zawiera kluczowe frazy poszukiwane przez systemy ATS.")}</p>

        <textarea
          value={jobText}
          onChange={e => setJobText(e.target.value)}
          placeholder={tr("Wklej tutaj wymagania z oferty pracy (np. 'Wymagana znajomość React, TypeScript, Docker, doświadczenie z REST API, dobra znajomość języka angielskiego...')")}
          style={{
            width: '100%',
            height: 80,
            fontSize: 11,
            padding: '9px 11px',
            border: '1px solid var(--ui-input-border)',
            borderRadius: 6,
            marginBottom: 12,
            fontFamily: 'inherit'
          }}
        />

        {keywordAnalysis && (
          <div style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ui-secondary)' }}>{tr("Współczynnik dopasowania:")}{keywordAnalysis.matchPercentage}%
              </span>
              <span style={{ fontSize: 10, color: 'var(--ui-muted)' }}>
                {keywordAnalysis.matched.length}{tr("z")}{keywordAnalysis.total}{tr("wykrytych słów kluczowych")}</span>
            </div>

            <div style={{ height: 5, background: 'var(--ui-border)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
              <div 
                style={{ 
                  width: `${keywordAnalysis.matchPercentage}%`, 
                  height: '100%', 
                  background: keywordAnalysis.matchPercentage >= 70 ? 'var(--ui-success)' : 'var(--ui-progress-warning)',
                  transition: 'width 0.3s ease' 
                }} 
              />
            </div>

            {/* Matched Keywords */}
            {keywordAnalysis.matched.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--ui-success)', display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>{tr("ZNALEZIONE W TWOIM CV (")}{keywordAnalysis.matched.length}):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {keywordAnalysis.matched.map(kw => (
                    <span 
                      key={kw}
                      style={{ 
                        fontSize: 9, 
                        background: 'var(--ui-success-bg)',
                        color: 'var(--ui-success-text)',
                        border: '1px solid var(--ui-success-border)',
                        borderRadius: 4, 
                        padding: '3px 7px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Check size={11} strokeWidth={2.5} />
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Keywords with 1-click Add */}
            {keywordAnalysis.missing.length > 0 && (
              <div>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--ui-warning)', display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>{tr("BRAKUJĄCE SŁOWA KLUCZOWE (KLIKNIJ, ABY DODAĆ DO UMIEJĘTNOŚCI):")}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {keywordAnalysis.missing.map(kw => (
                    <button
                      key={kw}
                      onClick={() => addKeywordToSkills(kw)}
                      className="secondary-button"
                      style={{ 
                        fontSize: 9, 
                        background: 'var(--ui-warning-bg)',
                        color: 'var(--ui-warning-text)',
                        borderColor: 'var(--ui-warning-border)',
                        borderRadius: 4, 
                        padding: '3px 8px',
                        minHeight: 25,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                      title={tr("Kliknij, aby automatycznie dodać to słowo do sekcji umiejętności")}
                    >
                      <Plus size={11} />
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Interactive ATS Checklist & Controls */}
      <div 
        className="ats-card"
        style={{ 
          background: 'var(--ui-surface)',
          border: '1px solid var(--ui-border)',
          borderRadius: 10, 
          padding: 16 
        }}
      >
        <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--ui-text)', margin: '0 0 12px' }}>{tr("Lista kontrolna parserów ATS")}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Item 1: Layout */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: '1px solid var(--ui-border-soft)' }}>
            <div style={{ display: 'flex', gap: 9 }}>
              {audit.isSingleColumn ? <CheckCircle2 size={16} color="var(--ui-success)" /> : <AlertCircle size={16} color="var(--ui-warning)" />}
              <div>
                <strong style={{ fontSize: 11, color: 'var(--ui-text)', display: 'block' }}>{tr("Układ jednokolumnowy")}</strong>
                <span style={{ fontSize: 9.5, color: 'var(--ui-muted)', lineHeight: 1.4 }}>
                  {audit.isSingleColumn 
                    ? tr("Optymalny układ liniowy. Parsery czytają tekst płynnie bez mieszania kolumn.") 
                    : tr("Układy wielokolumnowe mogą być dzielone przez starsze systemy OCR.")}
                </span>
              </div>
            </div>
            {!audit.isSingleColumn && (
              <button 
                className="secondary-button" 
                onClick={() => { store.updateTheme({ layout: 'single' }); notify(tr("Zmieniono układ na 1 kolumnę")); }}
                style={{ fontSize: 9, padding: '4px 8px', minHeight: 27, whiteSpace: 'nowrap' }}
              >{tr("Ustaw 1 kolumnę")}</button>
            )}
          </div>

          {/* Item 2: Photo */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: '1px solid var(--ui-border-soft)' }}>
            <div style={{ display: 'flex', gap: 9 }}>
              {audit.noPhoto ? <CheckCircle2 size={16} color="var(--ui-success)" /> : <AlertCircle size={16} color="var(--ui-warning)" />}
              <div>
                <strong style={{ fontSize: 11, color: 'var(--ui-text)', display: 'block' }}>
                  {audit.noPhoto ? tr("Brak zdjęcia (zalecane dla ATS)") : tr("Zdjęcie widoczne")}
                </strong>
                <span style={{ fontSize: 9.5, color: 'var(--ui-muted)', lineHeight: 1.4 }}>{tr("Systemy ATS w korporacjach (szczególnie USA/UK) preferują brak zdjęć. W Polsce dopuszcza się oba warianty.")}</span>
              </div>
            </div>
            <button 
              className="secondary-button" 
              onClick={() => { 
                store.updateTheme({ photo: { ...theme.photo, isVisible: !theme.photo.isVisible } }); 
                notify(theme.photo.isVisible ? tr("Ukryto zdjęcie") : tr("Włączono zdjęcie")); 
              }}
              style={{ fontSize: 9, padding: '4px 8px', minHeight: 27, whiteSpace: 'nowrap' }}
            >
              {theme.photo.isVisible ? <><EyeOff size={11} />{tr("Ukryj zdjęcie")}</> : <><Eye size={11} />{tr("Włącz zdjęcie")}</>}
            </button>
          </div>

          {/* Item 3: Contact info */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: '1px solid var(--ui-border-soft)' }}>
            <div style={{ display: 'flex', gap: 9 }}>
              {audit.hasContact ? <CheckCircle2 size={16} color="var(--ui-success)" /> : <AlertCircle size={16} color="var(--ui-warning)" />}
              <div>
                <strong style={{ fontSize: 11, color: 'var(--ui-text)', display: 'block' }}>{tr("Kompletne dane kontaktowe")}</strong>
                <span style={{ fontSize: 9.5, color: 'var(--ui-muted)', lineHeight: 1.4 }}>
                  {audit.hasContact ? tr("Imię, nazwisko, telefon, email i lokalizacja są obecne.") : tr("Uzupełnij telefon, email i lokalizację w nagłówku.")}
                </span>
              </div>
            </div>
          </div>

          {/* Item 4: Quantified results */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: '1px solid var(--ui-border-soft)' }}>
            <div style={{ display: 'flex', gap: 9 }}>
              {audit.hasMetrics ? <CheckCircle2 size={16} color="var(--ui-success)" /> : <AlertCircle size={16} color="var(--ui-warning)" />}
              <div>
                <strong style={{ fontSize: 11, color: 'var(--ui-text)', display: 'block' }}>{tr("Mierzalne rezultaty (")}{metricsFound}{tr("znalezionych)")}</strong>
                <span style={{ fontSize: 9.5, color: 'var(--ui-muted)', lineHeight: 1.4 }}>
                  {audit.hasMetrics 
                    ? tr("Świetnie! Liczby i procenty w punktach doświadczenia zwiększają scoring rekrutacyjny.") 
                    : tr("Dodaj liczby i procenty (np. \"wzrost o 25%\", \"zarządzanie zespołem 6 osób\").")}
                </span>
              </div>
            </div>
          </div>

          {/* Item 5: RODO Consent */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', gap: 9 }}>
              {audit.hasConsent ? <CheckCircle2 size={16} color="var(--ui-success)" /> : <AlertCircle size={16} color="var(--ui-warning)" />}
              <div>
                <strong style={{ fontSize: 11, color: 'var(--ui-text)', display: 'block' }}>{tr("Klauzula zgodna z RODO")}</strong>
                <span style={{ fontSize: 9.5, color: 'var(--ui-muted)', lineHeight: 1.4 }}>
                  {audit.hasConsent 
                    ? 'Zgoda na przetwarzanie danych osobowych jest obecna.' 
                    : tr("Uzupełnij treść klauzuli RODO na dole dokumentu.")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Direct ATS Export Buttons */}
      <div 
        className="ats-card"
        style={{ 
          background: 'var(--ui-surface)',
          border: '1px solid var(--ui-border)',
          borderRadius: 10, 
          padding: 16 
        }}
      >
        <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--ui-text)', margin: '0 0 4px' }}>{tr("Eksport zoptymalizowany dla ATS")}</h3>
        <p style={{ fontSize: 10, color: 'var(--ui-muted)', margin: '0 0 12px', lineHeight: 1.4 }}>{tr("Pobierz gotowy dokument sformatowany bezpośrednio pod systemy selekcji kandydatów.")}</p>

        <div className="ats-export-actions" style={{ display: 'flex', gap: 10 }}>
          <button 
            className="primary-button" 
            onClick={handleDownloadDocx}
            disabled={busyExport !== null}
            style={{ flex: 1, fontSize: 10, padding: '10px 12px' }}
          >
            <FileDown size={14} />
            <span>{busyExport === 'docx' ? 'Generowanie...' : 'Pobierz ATS (.DOCX)'}</span>
          </button>

          <button 
            className="secondary-button" 
            onClick={handleDownloadPdf}
            disabled={busyExport !== null}
            style={{ flex: 1, fontSize: 10, padding: '10px 12px' }}
          >
            <FileText size={14} />
            <span>{busyExport === 'pdf' ? 'Generowanie...' : 'Pobierz ATS (.PDF)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
