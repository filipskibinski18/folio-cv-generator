import type { ResumeData } from '../types/resume';
export const uid = () => crypto.randomUUID();
export const fullName = (data: ResumeData) => `${data.personal.firstName} ${data.personal.lastName}`.trim() || 'Twoje CV';
export const dateLabel = (value: string) => {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value;
  const months = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
  return `${months[Number(match[2]) - 1] ?? match[2]} ${match[1]}`;
};
export const dateRange = (start: string, end: string, current = false) => [dateLabel(start), current ? 'obecnie' : dateLabel(end)].filter(Boolean).join(' — ');
export const safeUrl = (url: string): string | undefined => {
  if (!url.trim()) return undefined;
  const value = /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`;
  try { const parsed = new URL(value); return ['https:', 'http:', 'mailto:', 'tel:'].includes(parsed.protocol) ? value : undefined; } catch { return undefined; }
};
export const urlLabel = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
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
