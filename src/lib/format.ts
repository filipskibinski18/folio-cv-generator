import type { ResumeData } from '../types/resume';
export const uid = () => crypto.randomUUID();
export const fullName = (data: ResumeData, language: 'pl' | 'en' = 'pl') => `${data.personal.firstName} ${data.personal.lastName}`.trim() || (language === 'en' ? 'Your CV' : 'Twoje CV');
export const dateLabel = (value: string, language: 'pl' | 'en' = 'pl') => {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value;
  const months = language === 'en' ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] : ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
  return `${months[Number(match[2]) - 1] ?? match[2]} ${match[1]}`;
};
export const dateRange = (start: string, end: string, current = false, language: 'pl' | 'en' = 'pl') => [dateLabel(start, language), current ? (language === 'en' ? 'Present' : 'obecnie') : dateLabel(end, language)].filter(Boolean).join(' — ');
export const safeUrl = (url: string): string | undefined => {
  if (!url.trim()) return undefined;
  const value = /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`;
  try { const parsed = new URL(value); return ['https:', 'http:', 'mailto:', 'tel:'].includes(parsed.protocol) ? value : undefined; } catch { return undefined; }
};
/**
 * Readable label for a link: no scheme, "www.", query or fragment. When a column
 * is too narrow the label is shortened with an ellipsis; the link keeps the full URL.
 */
export const urlLabel = (url: string, maxChars = Infinity) => {
  const plain = url.trim().replace(/^(?:[a-z][a-z0-9+.-]*:\/\/|mailto:|tel:)/i, '').replace(/^www\./i, '').replace(/[?#].*$/, '').replace(/\/+$/, '');
  if (plain.length <= maxChars) return plain;
  return plain.slice(0, Math.max(6, Math.floor(maxChars) - 1)).replace(/[/.\-_]+$/, '') + '…';
};
const trackingParam = /^(utm_|fbclid$|gclid$|dclid$|msclkid$|mc_[ce]id$|igshid$|si$|trk|ref$|ref_src$|originalSubdomain$)/i;
/** Normalizes a pasted URL: trims stray whitespace/line breaks and drops tracking parameters. */
export const cleanUrl = (url: string) => {
  const trimmed = url.replace(/\s+/g, '');
  const href = safeUrl(trimmed);
  if (!href || !/^https?:/i.test(href)) return trimmed;
  try {
    const parsed = new URL(href);
    const tracked = [...parsed.searchParams.keys()].filter(key => trackingParam.test(key));
    if (!tracked.length) return trimmed;
    tracked.forEach(key => parsed.searchParams.delete(key));
    const cleaned = parsed.toString().replace(/\?$/, '');
    return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? cleaned : cleaned.replace(/^https:\/\//, '');
  } catch { return trimmed; }
};
const knownProfiles: [RegExp, string][] = [[/(^|\.)linkedin\.com$/, 'LinkedIn'], [/(^|\.)github\.com$/, 'GitHub'], [/(^|\.)gitlab\.com$/, 'GitLab'], [/(^|\.)behance\.net$/, 'Behance'], [/(^|\.)dribbble\.com$/, 'Dribbble'], [/(^|\.)credly\.com$/, 'Credly'], [/(^|\.)stackoverflow\.com$/, 'Stack Overflow'], [/(^|\.)medium\.com$/, 'Medium'], [/(^|\.)youtube\.com$|^youtu\.be$/, 'YouTube'], [/(^|\.)x\.com$|(^|\.)twitter\.com$/, 'X'], [/(^|\.)instagram\.com$/, 'Instagram'], [/(^|\.)kaggle\.com$/, 'Kaggle'], [/(^|\.)figma\.com$/, 'Figma']];
/** Suggests a profile name for a pasted URL, e.g. "LinkedIn" for linkedin.com/in/…. */
export const profileName = (url: string) => {
  const host = urlLabel(url).split('/')[0].toLowerCase();
  return knownProfiles.find(([pattern]) => pattern.test(host))?.[1] ?? '';
};
/**
 * react-pdf never breaks inside a word, so one long token (a URL or e-mail in a
 * narrow column) would overflow into the next column. Offer break points after
 * separators, and every 12 characters as a last resort. Short words stay whole.
 */
export const breakLongWord = (word: string): string[] => {
  if (word.length <= 24) return [word];
  return (word.match(/[^/.@_?&=-]*[/.@_?&=-]*/g) ?? [word]).filter(Boolean).flatMap(part => part.match(/.{1,12}/gsu) ?? [part]);
};
export interface InlineRun { text: string; bold: boolean }
export const inlineRuns = (value: string): InlineRun[] => value.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map(part => ({ text: part.startsWith('**') && part.endsWith('**') ? part.slice(2, -2) : part, bold: part.startsWith('**') && part.endsWith('**') }));
export const downloadBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};
export const documentFilename = (data: ResumeData, extension: string) => `${fullName(data).replace(/[^\p{L}\p{N} -]/gu, '').replace(/\s+/g, '_')}_CV.${extension}`;
export const mmToPt = (mm: number) => mm * 72 / 25.4;
export const mmToTwip = (mm: number) => Math.round(mm * 1440 / 25.4);
