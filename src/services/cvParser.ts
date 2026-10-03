import JSZip from 'jszip';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import type { ResumeData, Experience, Education, SkillCategory, Language, Certificate, Project, ResumeLink } from '../types/resume';
import { resumeDataSchema } from '../types/resume';
import { uid } from '../lib/format';

export interface ParsedCvResult {
  data: ResumeData;
  detectedCount: {
    experience: number;
    education: number;
    skills: number;
    languages: number;
    certificates: number;
    projects: number;
    hasSummary: boolean;
    hasConsent: boolean;
  };
  rawText: string;
  sourceLanguage?: 'pl' | 'en';
  warnings?: string[];
}

/**
 * Extracts plain text with preserved line breaks and bullets from a DOCX file.
 */
export async function extractTextFromDocx(fileOrBuffer: File | ArrayBuffer | Uint8Array): Promise<string> {
  const buffer = fileOrBuffer instanceof File ? await fileOrBuffer.arrayBuffer() : fileOrBuffer;
  const zip = await JSZip.loadAsync(buffer);
  const docXml = await zip.file('word/document.xml')?.async('text');
  if (!docXml) {
    throw new Error('Nieprawidłowy plik DOCX — brak word/document.xml w archiwum.');
  }

  // Parse paragraphs <w:p>...</w:p>
  const paragraphMatches = Array.from(docXml.matchAll(/<w:p(?:\s+[^>]*)?>([\s\S]*?)<\/w:p>/gi));
  const lines: string[] = [];

  for (const pMatch of paragraphMatches) {
    const pContent = pMatch[1];
    const textMatches = Array.from(pContent.matchAll(/<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>|<w:(br|tab)\b[^>]*\/>/gi));
    const pText = textMatches.map(m => (m[2] === 'br' ? '\n' : m[2] === 'tab' ? ' ' : m[1])
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
    ).join('');

    const trimmed = pText.trim();
    if (trimmed) {
      const isBullet = /<w:numPr[\s\S]*?<\/w:numPr>/i.test(pContent);
      lines.push(isBullet ? `• ${trimmed}` : trimmed);
    }
  }

  return lines.join('\n');
}

function itemsToLines(items: TextItem[]): string[] {
  const sorted = [...items].sort((a, b) => {
    const yDiff = b.transform[5] - a.transform[5];
    if (Math.abs(yDiff) > 3) return yDiff;
    return a.transform[4] - b.transform[4];
  });

  const lines: string[] = [];
  let currentY: number | null = null;
  let currentLine: string[] = [];

  for (const item of sorted) {
    const y = item.transform[5];
    if (currentY === null || Math.abs(y - currentY) <= 3) {
      currentLine.push(item.str);
      if (currentY === null) currentY = y;
    } else {
      if (currentLine.length) lines.push(currentLine.join(' '));
      currentLine = [item.str];
      currentY = y;
    }
  }
  if (currentLine.length) lines.push(currentLine.join(' '));
  return lines;
}

/**
 * Extracts plain text from a PDF file preserving reading order across columns.
 */
export async function extractTextFromPdf(fileOrBuffer: File | ArrayBuffer | Uint8Array): Promise<string> {
  const data = fileOrBuffer instanceof File ? new Uint8Array(await fileOrBuffer.arrayBuffer()) : new Uint8Array(fileOrBuffer);

  const isNode = typeof window === 'undefined';
  const pdfjs = isNode 
    ? await import('pdfjs-dist/legacy/build/pdf.mjs')
    : await import('pdfjs-dist');

  if (!isNode && 'GlobalWorkerOptions' in pdfjs) {
    const pdfWorkerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  }

  const pdf = await pdfjs.getDocument({ data }).promise;
  const pageTexts: string[] = [];
  try {
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items.filter((item): item is TextItem => 'str' in item && Boolean(item.str.trim()));

    if (items.length === 0) continue;

    const pageHeight = page.view[3] || 841.89;
    const pageWidth = page.view[2] || 595.28;

    // Detect column splitX:
    // Look at items in the middle 75% vertical range
    const middleItems = items.filter(it => it.transform[5] < pageHeight * 0.88 && it.transform[5] > pageHeight * 0.12);
    let bestSplitX: number | null = null;
    let minCrossings = 999;
    let maxBalancedCount = -1;

    for (let testX = pageWidth * 0.25; testX <= pageWidth * 0.75; testX += 8) {
      let crossings = 0;
      let left = 0;
      let right = 0;

      for (const it of middleItems) {
        const leftEdge = it.transform[4];
        const rightEdge = it.transform[4] + it.width;
        if (leftEdge < testX && rightEdge > testX) {
          crossings++;
        } else if (rightEdge <= testX) {
          left++;
        } else if (leftEdge >= testX) {
          right++;
        }
      }

      // We want minimal crossings and substantial presence on both sides
      if (left >= 6 && right >= 6) {
        if (crossings < minCrossings || (crossings === minCrossings && (left + right) > maxBalancedCount)) {
          minCrossings = crossings;
          maxBalancedCount = left + right;
          bestSplitX = testX;
        }
      }
    }

    // Only apply column split if crossings are very few (≤ 2)
    const hasColumns = bestSplitX !== null && minCrossings <= 2;

    if (!hasColumns) {
      pageTexts.push(itemsToLines(items).join('\n'));
      continue;
    }

    // Find header boundary: highest Y where items are on BOTH left and right
    const splitX = bestSplitX!;
    let columnTopY = 0;
    for (const it of middleItems) {
      const y = it.transform[5];
      // Check if around this Y there are items on both sides
      const nearbyLeft = middleItems.some(other => Math.abs(other.transform[5] - y) < 25 && other.transform[4] + other.width <= splitX);
      const nearbyRight = middleItems.some(other => Math.abs(other.transform[5] - y) < 25 && other.transform[4] >= splitX);
      if (nearbyLeft && nearbyRight && y > columnTopY) {
        columnTopY = y;
      }
    }
    // Add small buffer above columns
    const headerCutoffY = columnTopY > 0 ? columnTopY + 12 : pageHeight * 0.82;
    const footerCutoffY = pageHeight * 0.08;

    const headerItems = items.filter(it => it.transform[5] >= headerCutoffY);
    const footerItems = items.filter(it => it.transform[5] < footerCutoffY);
    const columnItems = items.filter(it => it.transform[5] < headerCutoffY && it.transform[5] >= footerCutoffY);

    const leftItems = columnItems.filter(it => it.transform[4] + it.width <= splitX + 4);
    const rightItems = columnItems.filter(it => it.transform[4] > splitX - 4);

    const pageLines: string[] = [];
    if (headerItems.length > 0) pageLines.push(...itemsToLines(headerItems));
    if (leftItems.length > 0) pageLines.push(...itemsToLines(leftItems));
    if (rightItems.length > 0) pageLines.push(...itemsToLines(rightItems));
    if (footerItems.length > 0) pageLines.push(...itemsToLines(footerItems));

    pageTexts.push(pageLines.join('\n'));
  }

  } finally { await pdf.destroy(); }
  return pageTexts.join('\n\n');
}

const MONTHS: Record<string, string> = {
  'styczeń': '01', 'stycznia': '01', 'sty': '01', 'jan': '01', 'january': '01',
  'luty': '02', 'lutego': '02', 'lut': '02', 'feb': '02', 'february': '02',
  'marzec': '03', 'marca': '03', 'mar': '03', 'march': '03',
  'kwiecień': '04', 'kwietnia': '04', 'kwi': '04', 'apr': '04', 'april': '04',
  'maj': '05', 'maja': '05', 'may': '05',
  'czerwiec': '06', 'czerwca': '06', 'cze': '06', 'jun': '06', 'june': '06',
  'lipiec': '07', 'lipca': '07', 'lip': '07', 'jul': '07', 'july': '07',
  'sierpień': '08', 'sierpnia': '08', 'sie': '08', 'aug': '08', 'august': '08',
  'wrzesień': '09', 'września': '09', 'wrz': '09', 'sep': '09', 'september': '09',
  'październik': '10', 'października': '10', 'paź': '10', 'oct': '10', 'october': '10',
  'listopad': '11', 'listopada': '11', 'lis': '11', 'nov': '11', 'november': '11',
  'grudzień': '12', 'grudnia': '12', 'gru': '12', 'dec': '12', 'december': '12',
};

function normalizeDatePart(part: string): string {
  const p = part.trim().toLowerCase();
  if (['obecnie', 'teraz', 'nadal', 'aktualnie', 'present', 'current', 'now'].includes(p)) {
    return 'obecnie';
  }
  // format MM.YYYY or MM/YYYY
  const mmYyyy = p.match(/^(\d{1,2})[./\-](\d{4})$/);
  if (mmYyyy) {
    const month = mmYyyy[1].padStart(2, '0');
    return `${mmYyyy[2]}-${month}`;
  }
  // format YYYY.MM or YYYY-MM
  const yyyyMm = p.match(/^(\d{4})[./\-](\d{1,2})$/);
  if (yyyyMm) {
    const month = yyyyMm[2].padStart(2, '0');
    return `${yyyyMm[1]}-${month}`;
  }
  // Month name YYYY
  for (const [mName, mNum] of Object.entries(MONTHS)) {
    if (p.includes(mName)) {
      const yearMatch = p.match(/\b(19\d\d|20\d\d)\b/);
      if (yearMatch) return `${yearMatch[1]}-${mNum}`;
    }
  }
  // Just YYYY
  const justYear = p.match(/\b(19\d\d|20\d\d)\b/);
  if (justYear) return justYear[1];
  return p;
}

export function parseDateRange(raw: string): { startDate: string; endDate: string; current: boolean } {
  const parts = raw.split(/\s*(?:[-–—]|do|\bto\b)\s*/i);
  if (parts.length >= 2) {
    const start = normalizeDatePart(parts[0]);
    const end = normalizeDatePart(parts[1]);
    const isCurrent = end === 'obecnie' || /obecnie|teraz|nadal|present|current/i.test(parts[1]);
    return {
      startDate: start,
      endDate: isCurrent ? '' : end,
      current: isCurrent,
    };
  }
  if (parts.length === 1 && parts[0].trim()) {
    const start = normalizeDatePart(parts[0]);
    return { startDate: start, endDate: '', current: false };
  }
  return { startDate: '', endDate: '', current: false };
}

type SectionKey = 'summary' | 'experience' | 'education' | 'skills' | 'languages' | 'certificates' | 'projects' | 'links' | 'consent' | 'unknown';

const SECTION_PATTERNS: { key: SectionKey; regex: RegExp }[] = [
  { key: 'summary', regex: /^(?:o mnie|profil(?: zawodowy)?|podsumowanie(?: zawodowe)?|about(?: me)?|summary|professional summary|bio)$/i },
  { key: 'experience', regex: /^(?:doświadczenie(?: zawodowe)?|historia zatrudnienia|kariera|praca|work experience|experience|employment history|zatrudnienie)$/i },
  { key: 'education', regex: /^(?:edukacja|wykształcenie|szkoły|studia|education|academic background|nauka)$/i },
  { key: 'skills', regex: /^(?:umiejętności(?: i technologie)?|kompetencje(?: twarde i miękkie)?|technologie|narzędzia|skills|technical skills|key skills|abilities)$/i },
  { key: 'languages', regex: /^(?:języki(?: obce)?|znajomość języków|languages|language skills)$/i },
  { key: 'certificates', regex: /^(?:certyfikaty|kursy(?: i szkolenia)?|szkolenia|uprawnienia|certificates|certifications|courses)$/i },
  { key: 'projects', regex: /^(?:projekty(?: i realizacje)?|portfolio|projects|key projects|wybrane projekty)$/i },
  { key: 'links', regex: /^(?:linki|profile(?: społecznościowe)?|social media|portfolio & linki)$/i },
  { key: 'unknown', regex: /^(?:contact|kontakt|hobbies(?: and interests)?|interests|zainteresowania|driving licen[cs]e|prawo jazdy)$/i },
  { key: 'consent', regex: /^(?:klauzula(?: rodo)?|zgoda na przetwarzanie danych|rodo|gdpr|consent)$/i },
];

function isHeading(line: string): SectionKey | null {
  let trimmed = line.trim().replace(/^[:#*\-_—•·]+\s*|\s*[:#*\-_—•·]+$/g, '');
  if (!trimmed || trimmed.length > 50) return null;

  // Handle letter-spaced headers (e.g. "D O Ś W I A D C Z E N I E" -> "DOŚWIADCZENIE")
  const tokens = trimmed.split(/\s+/);
  if (tokens.length >= 4 && tokens.every(t => t.length === 1)) {
    trimmed = tokens.join('');
  }

  for (const { key, regex } of SECTION_PATTERNS) {
    if (regex.test(trimmed)) return key;
  }
  return null;
}

const DATE_REGEX = /\b(?:(?:\d{1,2}[./\-])?(?:19\d\d|20\d\d)|(?:styczeń|luty|marzec|kwiecień|maj|czerwiec|lipiec|sierpień|wrzesień|październik|listopad|grudzień|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(?:19\d\d|20\d\d)?)\s*(?:[-–—]|do|\bto\b)\s*(?:(?:\d{1,2}[./\-])?(?:19\d\d|20\d\d)|obecnie|teraz|nadal|aktualnie|present|current|now)\b|\b(?:19\d\d|20\d\d)\s*[-–—]\s*(?:19\d\d|20\d\d|obecnie|present)\b/i;

const ROLE_WORDS = /(?:developer|engineer|designer|manager|analyst|technician|specjalista|analityk|programista|kierownik|lead|dyrektor|architekt)/i;
function splitRoleAndCompany(str: string): { role: string; company: string; location?: string } {
  // A trailing city/country is metadata, not the employer. Word resumes often
  // put "Data Analyst Comarch – Wrocław, Poland" in one paragraph.
  const place = str.match(/\s+[-–—]\s+([^–—]+)$/);
  if (place && /,|\b(?:Poland|Polska|remote|zdalnie|hybrid|hybrydowo)\b/i.test(place[1])) {
    const identity = splitRoleAndCompany(str.slice(0, place.index));
    return { ...identity, location: place[1].trim() };
  }
  const delimiters = [/\s*\|\s*/, /\s*·\s*/, /\s*–\s*/, /\s*-\s*/, /\s*,\s*/, /\s+w\s+/i, /\s+at\s+/i];
  for (const delim of delimiters) {
    const parts = str.split(delim);
    if (parts.length >= 2) {
      const part1 = parts[0].trim();
      const part2 = parts.slice(1).join(' ').trim();
      const isRole1 = /(?:developer|engineer|designer|manager|specjalista|lead|dyrektor|architekt)/i.test(part1);
      const isCompany2 = /(?:sp\. z o\.o\.|s\.a\.|inc|llc|gmbh|ltd|corp|agencja|software|lab)/i.test(part2);
      if (isRole1 || isCompany2) {
        return { role: part1, company: part2 };
      }
      return { role: part1, company: part2 };
    }
  }
  const combined = str.match(/^(.*?\b(?:developer|engineer|designer|manager|analyst|technician|specjalista|analityk|programista|kierownik|dyrektor|architekt))\s+(.+)$/i);
  return combined ? { role: combined[1], company: combined[2] } : { role: str, company: '' };
}

/**
 * Intelligent heuristics engine to extract structured CV data from raw text.
 */
export function parseCvText(fullText: string): ParsedCvResult {
  const lines = fullText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  // 1. Extract Personal Details
  let firstName = '';
  let lastName = '';
  let title = '';
  let email = '';
  let phone = '';
  let location = '';
  let website = '';

  const emailMatch = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) email = emailMatch[0];

  const phoneLine = lines.find(line => /^(?:tel(?:ephone|efon)?[:. ]*)?\+?[\d ()-]{9,22}$/i.test(line) && line.replace(/\D/g, '').length >= 9);
  if (phoneLine) phone = phoneLine.replace(/^tel(?:ephone|efon)?[:. ]*/i, '').trim();
  else phone = fullText.match(/\+\d{1,3}[ -]?\d{3}[ -]?\d{3}[ -]?\d{3}\b/)?.[0] ?? '';
  const personalLinks = fullText.match(/(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/in\/[\w-]+|github\.com\/[\w-]+|[\w-]+\.(?:pl|io|dev|org|net)(?:\/[\w-]*)*)/gi);
  website = personalLinks?.find(value => !email.includes(value) && !/google|apps\/details/.test(value)) ?? '';

  const locationRegex = /(?:Warszawa|Kraków|Wrocław|Poznań|Gdańsk|Gdynia|Sopot|Łódź|Katowice|Szczecin|Lublin|Białystok|Bydgoszcz|Polska|Poland|\b\d{2}-\d{3}\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)/i;
  for (const line of lines.slice(0, 15)) {
    const locMatch = line.match(locationRegex);
    if (locMatch && !location) {
      location = line.replace(/^[•\-\*·]\s*/, '').slice(0, 80);
    }
  }

  const nonNameMarkers = /^(?:curriculum vitae|cv|życiorys|resume|dane osobowe|kontakt|portfolio|z\s*d\s*j\s*ę\s*c\s*i\s*e)$/i;
  let nameScore = -1;
  for (let i = 0; i < lines.length; i++) {
    const candidate = lines[i].replace(/^[#*\-•_·]+\s*/, '');
    if (nonNameMarkers.test(candidate)) continue;
    if (/developer|engineer|designer|manager|training|language|support|analyst|certified|master|bachelor|technician|workflow|data|machine|networking/i.test(candidate)) continue;
    if (candidate.includes('@') || /\d{3}/.test(candidate)) continue;
    if (isHeading(candidate)) continue;

    const words = candidate.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && words.every(w => /^[A-ZĄĆĘŁŃÓŚŹŻ][\p{L}-]+$/u.test(w))) {
      const normalize = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').replace(/ł/g, 'l').toLowerCase();
      const score = (i < 6 ? 5 : 0) + (words.every(word => normalize(email).includes(normalize(word))) ? 30 : 0);
      if (score <= nameScore) continue;
      nameScore = score;
      title = '';
      firstName = words[0];
      lastName = words.slice(1).join(' ');

      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (!isHeading(nextLine) && !nextLine.includes('@') && !/\d{4}/.test(nextLine) && nextLine.length < 60) {
          title = nextLine;
        }
      }
    }
  }

  if (!title) {
    const titleRegex = /(?:developer|engineer|designer|manager|specjalista|architekt|konsultant|analityk|programista|kierownik|administrator|lead|senior|junior|mid)/i;
    for (const line of lines.slice(0, 10)) {
      if (titleRegex.test(line) && !lines.slice(0, lines.indexOf(line)).some(previous => isHeading(previous) === 'skills') && !line.includes('@') && line.length < 60 && !isHeading(line)) {
        title = line;
        break;
      }
    }
  }

  // 2. Segment lines into sections
  const sections: { key: SectionKey; lines: string[] }[] = [];
  let currentKey: SectionKey = 'unknown';
  let currentSectionLines: string[] = [];

  for (const line of lines) {
    const headingKey = isHeading(line);
    if (headingKey) {
      if (currentSectionLines.length > 0) {
        sections.push({ key: currentKey, lines: currentSectionLines });
      }
      currentKey = headingKey;
      currentSectionLines = [];
    } else {
      currentSectionLines.push(line);
    }
  }
  if (currentSectionLines.length > 0) {
    sections.push({ key: currentKey, lines: currentSectionLines });
  }

  // 3. Extract Summary
  let summary = '';
  const summarySec = sections.find(s => s.key === 'summary');
  if (summarySec && summarySec.lines.length > 0) {
    summary = summarySec.lines.join(' ');
  } else {
    const unknownSec = sections.find(s => s.key === 'unknown');
    if (unknownSec) {
      const candidates = unknownSec.lines.filter(l => 
        l.length > 60 && 
        !l.includes('@') && 
        !/(?:telefon|email|github|linkedin)/i.test(l) &&
        !/\d{4}\s*[-–]/i.test(l)
      );
      if (candidates.length > 0) {
        summary = candidates.slice(0, 3).join(' ');
      }
    }
  }

  // 4. Extract Experience
  const experience: Experience[] = [];
  const expSec = sections.find(s => s.key === 'experience');
  if (expSec) {
    const expLines = expSec.lines;
    const dateIndices: number[] = [];

    for (let i = 0; i < expLines.length; i++) {
      if (DATE_REGEX.test(expLines[i])) {
        dateIndices.push(i);
      }
    }

    if (dateIndices.length > 0) {
      for (let d = 0; d < dateIndices.length; d++) {
        const dateIdx = dateIndices[d];
        const dateLine = expLines[dateIdx];
        const dMatch = dateLine.match(DATE_REGEX)!;
        const { startDate, endDate, current } = parseDateRange(dMatch[0]);

        const prevBound = d > 0 ? dateIndices[d - 1] + 1 : 0;
        const preLines = expLines.slice(prevBound, dateIdx).filter(l => !/^[•\-\*–]\s*/.test(l) && !/^(?:skills|technologies|umiejętności)\s*:/i.test(l));

        let role = '';
        let company = '';
        let entryLocation = '';

        const lineWithoutDate = dateLine.replace(dMatch[0], '').replace(/[|•·,–-]$|^[|•·,–-]/g, '').trim();
        if (lineWithoutDate) {
          const split = splitRoleAndCompany(lineWithoutDate);
          role = split.role;
          company = split.company;
          entryLocation = split.location ?? '';
        }

        if (!role || !company) {
          const lastHeader = preLines.at(-1);
          const splitHeader = lastHeader ? splitRoleAndCompany(lastHeader) : undefined;
          if (splitHeader?.company && ROLE_WORDS.test(splitHeader.role)) {
            role = splitHeader.role; company = splitHeader.company; entryLocation = splitHeader.location ?? entryLocation;
          } else if (preLines.length >= 2) {
            const line1 = preLines[preLines.length - 2];
            const line2 = preLines[preLines.length - 1];
            if (ROLE_WORDS.test(line2)) {
              role = line2;
              company = line1;
            } else {
              company = line1;
              role = line2;
            }
          } else if (preLines.length === 1) {
            const split = splitRoleAndCompany(preLines[0]);
            if (split.company) {
              role = split.role;
              company = split.company;
              entryLocation = split.location ?? entryLocation;
            } else if (!role) {
              role = preLines[0];
            } else {
              company = preLines[0];
            }
          }
        }

        const nextBound = d + 1 < dateIndices.length ? dateIndices[d + 1] : expLines.length;
        let bulletEnd = nextBound;
        if (d + 1 < dateIndices.length) {
          let k = dateIndices[d + 1] - 1;
          while (k > dateIdx && !/^[•\-\*–]\s*/.test(expLines[k]) && !/^(?:skills|technologies|umiejętności)\s*:/i.test(expLines[k]) && expLines[k].length < 60) {
            k--;
          }
          bulletEnd = k + 1;
        }

        const postLines = expLines.slice(dateIdx + 1, bulletEnd);
        const bullets: string[] = [];
        let description = '';

        for (const pLine of postLines) {
          if (/^[•\-\*–]\s*/.test(pLine)) {
            bullets.push(pLine.replace(/^[•\-\*–]\s*/, ''));
          } else if (!description && pLine.length > 40) {
            description = pLine;
          } else {
            bullets.push(pLine);
          }
        }

        experience.push({
          id: uid(),
          company,
          role,
          location: entryLocation,
          startDate,
          endDate,
          current,
          description,
          bullets: bullets.map(text => ({ id: uid(), text, children: [] })),
        });
      }
    }
  }

  const education: Education[] = [];
  let currentEdu: Education | undefined;
  const institutionPattern = /uniwersytet|politechnika|akademia|szkoła|liceum|college|university/i;
  const degreePattern = /^(?:magister|inżynier|licencjat|doktor|bachelor|master|phd)/i;
  for (const raw of sections.filter(s => s.key === 'education').flatMap(s => s.lines)) {
    const bullet = /^[•\-*]/.test(raw); const line = raw.replace(/^[•\-*]\s*/, '');
    const university = !bullet && institutionPattern.test(line); const degree = !bullet && degreePattern.test(line);
    if (!currentEdu || (degree && currentEdu.degree) || (university && currentEdu.institution)) {
      currentEdu = { id: uid(), institution: '', degree: '', field: '', startDate: '', endDate: '', description: '' }; education.push(currentEdu);
    }
    const range = line.match(DATE_REGEX);
    const year = !bullet ? line.match(/\b(?:19|20)\d{2}\b/)?.[0] : undefined;
    if (range) { const dates = parseDateRange(range[0]); currentEdu.startDate = dates.startDate; currentEdu.endDate = dates.endDate; }
    else if (year) currentEdu.endDate = year;
    const clean = line.replace(range?.[0] ?? year ?? /$^/, '').replace(/[ ,–—-]+$/, '').trim();
    if (university) currentEdu.institution = clean;
    else if (degree) { const [name, ...field] = clean.split(/\s*:\s*/); currentEdu.degree = name; currentEdu.field = field.join(': '); }
    else if (!bullet && !currentEdu.field && !year && line.length < 50) currentEdu.field = clean;
    else if (clean) currentEdu.description = [currentEdu.description, clean].filter(Boolean).join('\n');
  }

  // 6. Extract Skills
  const skills: SkillCategory[] = [];
  const skillsSec = sections.find(s => s.key === 'skills');
  if (skillsSec) {
    const rawLines = skillsSec.lines;
    const catMap = new Map<string, string[]>();
    let currentCat = 'Kluczowe umiejętności';

    for (const line of rawLines) {
      if (line.includes(':')) {
        const [catTitle, skillList] = line.split(':');
        const items = skillList.split(/[,;•|]/).map(s => s.trim()).filter(Boolean);
        if (items.length > 0) {
          catMap.set(catTitle.trim(), (catMap.get(catTitle.trim()) || []).concat(items));
        }
      } else {
        const items = /^[•\-*]/.test(line) ? [line.replace(/^[•\-*]\s*/, '')] : line.split(/[,;•|](?![^()]*\))/).map(s => s.trim()).filter(Boolean);
        if (items.length === 1 && line.length < 30 && !line.startsWith('•')) {
          currentCat = line;
        } else {
          catMap.set(currentCat, (catMap.get(currentCat) || []).concat(items.length > 0 ? items : [line]));
        }
      }
    }

    if (catMap.size === 0 && rawLines.length > 0) {
      catMap.set('Umiejętności', rawLines.map(l => l.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean));
    }

    for (const [name, skillNames] of catMap.entries()) {
      skills.push({
        id: uid(),
        name,
        skills: skillNames.slice(0, 20).map(s => ({ id: uid(), name: s })),
      });
    }
  }

  const languages: Language[] = [];
  const langLines = sections.filter(s => s.key === 'languages').flatMap(s => s.lines);
  const languageName = /^(Polish|Polski|English|Angielski|German|Niemiecki|French|Francuski|Spanish|Hiszpański|Italian|Włoski|Ukrainian|Ukraiński|Russian|Rosyjski|Portuguese|Portugalski|Dutch|Niderlandzki|Chinese|Chiński|Japanese|Japoński)\b/i;
  for (const line of langLines) {
    const clean = line.replace(/^[•\-*]\s*/, ''); const match = clean.match(languageName);
    if (match) languages.push({ id: uid(), name: match[1], level: clean.slice(match[0].length).replace(/^\s*[-–—:|]\s*/, '').trim() });
    else if (languages.length && /^(?:[ABC][12]|proficient|native|fluent|first language|ojczysty|zaawansowany|średniozaawansowany)/i.test(clean)) { const last = languages.at(-1)!; last.level = [last.level, clean].filter(Boolean).join(' · '); }
  }
  const certificates: Certificate[] = [];
  for (const line of sections.filter(s => s.key === 'certificates').flatMap(s => s.lines)) {
    const clean = line.replace(/^[•\-*]\s*/, '');
    if (/^(?:\(?\d{4}\)?|Technical Training|Foundational Training|Certification|Comarch|Google|Amazon)(?:\s|$)/i.test(clean) && certificates.length) {
      const last = certificates.at(-1)!; last.date ||= clean.match(/\b(?:19|20)\d{2}\b/)?.[0] ?? '';
      last.issuer = [last.issuer, clean.replace(/\(?\b(?:19|20)\d{2}\b\)?/g, '').trim()].filter(Boolean).join(' · '); continue;
    }
    const [name, ...metadata] = clean.split(/\s+[–—]\s+|,\s*|\s+\|\s+/);
    certificates.push({ id: uid(), name, issuer: metadata.join(' · ').replace(/\(?\b(?:19|20)\d{2}\b\)?/g, '').replace(/Link to Certificate/i, '').replace(/^[ ·]+|[ ·]+$/g, '').trim(), date: clean.match(/\b(?:19|20)\d{2}\b/)?.[0] ?? '', url: clean.match(/https?:\/\/[^\s]+/)?.[0] ?? '' });
  }
  const projects: Project[] = [];
  const projLines = sections.filter(s => s.key === 'projects').flatMap(s => s.lines);
  for (let index = 0; index < projLines.length; index++) {
    const line = projLines[index]; const clean = line.replace(/^[•\-*–]\s*/, ''); const last = projects.at(-1);
    const url = clean.match(/^https?:\/\/\S+/)?.[0]; const date = DATE_REGEX.test(clean);
    const achievement = /^[•\-*–]\s/.test(line) || clean.includes(':') || clean.length > 110;
    const nextIsMetadata = DATE_REGEX.test(projLines[index + 1] ?? '') || /^https?:/.test(projLines[index + 1] ?? '');
    if (!last || (!url && !date && !achievement && nextIsMetadata)) projects.push({ id: uid(), name: clean, role: '', url: '', description: '', technologies: [], bullets: [] });
    else if (url) last.url = url;
    else if (date) last.description = [last.description, clean].filter(Boolean).join('\n');
    else if (achievement) last.bullets.push({ id: uid(), text: clean, children: [] });
    else last.description = [last.description, clean].filter(Boolean).join(' ');
  }

  // 10. Extract Links
  const links: ResumeLink[] = [];
  if (website) {
    links.push({ id: uid(), label: 'Portfolio / Profil', url: website.startsWith('http') ? website : `https://${website}` });
  }

  // 11. Extract Consent (RODO / GDPR)
  let consent = '';
  const consentSec = sections.find(s => s.key === 'consent');
  if (consentSec) {
    consent = consentSec.lines.join(' ');
  } else {
    const consentRegex = /Wyrażam zgodę na przetwarzanie.*?(?:rekrutacj|przyszłych procesów|danych osobowych).*?(?:\.|$)/is;
    const cMatch = fullText.match(consentRegex);
    if (cMatch) {
      consent = cMatch[0].trim().replace(/\s+/g, ' ');
    }
  }

  const resultData: ResumeData = {
    personal: {
      firstName,
      lastName,
      title,
      email: email || '',
      phone: phone || '',
      location: location || '',
      website: website || '',
      photo: '',
    },
    summary,
    experience: experience.length > 0 ? experience : [],
    education: education.length > 0 ? education : [],
    skills,
    projects,
    certificates,
    languages,
    links,
    consent,
  };

  const parsed = resumeDataSchema.safeParse(resultData);
  if (!parsed.success) throw new Error('Odczytane dane przekraczają obsługiwane limity CV. Wczytaj krótszy dokument lub uzupełnij dane w formularzu.');
  const validData = parsed.data;

  return {
    data: validData,
    detectedCount: {
      experience: validData.experience.length,
      education: validData.education.length,
      skills: validData.skills.reduce((acc, cat) => acc + cat.skills.length, 0),
      languages: validData.languages.length,
      certificates: validData.certificates.length,
      projects: validData.projects.length,
      hasSummary: Boolean(validData.summary),
      hasConsent: Boolean(validData.consent),
    },
    rawText: fullText, sourceLanguage: /\b(?:EXPERIENCE|SUMMARY|EDUCATION|PROJECTS)\b/.test(fullText) ? 'en' : 'pl', warnings: firstName ? [] : ['Nie udało się pewnie rozpoznać imienia i nazwiska. Uzupełnij je przed importem.'],
  };
}

/**
 * Top-level file parser handling both DOCX and PDF.
 */
export async function parseCvFile(file: File, signal?: AbortSignal): Promise<ParsedCvResult> {
  signal?.throwIfAborted();
  if (file.size > 15 * 1024 * 1024) throw new Error('Plik jest zbyt duży (maksymalny rozmiar to 15 MB).');
  const ext = file.name.split('.').pop()?.toLowerCase();
  let text = '';
  if (ext === 'docx') {
    text = await extractTextFromDocx(file);
  } else if (ext === 'pdf') {
    text = await extractTextFromPdf(file);
  } else {
    throw new Error('Obsługiwane są wyłącznie pliki .pdf oraz .docx.');
  }

  if (!text || text.trim().length < 20) {
    throw new Error('Nie udało się odczytać tekstu z tego dokumentu. Upewnij się, że plik nie jest pusty ani zabezpieczony hasłem.');
  }

  signal?.throwIfAborted();
  return parseCvText(text);
}
