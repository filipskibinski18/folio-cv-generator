import { projectFileSchema } from '../types/resume';
import type { ProjectFile, ResumeData, ResumeTemplate, ResumeTheme } from '../types/resume';
import { downloadBlob } from '../lib/format';

export function parseProjectJson(content: string): ProjectFile {
  if (new TextEncoder().encode(content).byteLength > 2 * 1024 * 1024) throw new Error('Plik jest za duży. Maksymalny rozmiar to 2 MB.');
  let raw: unknown;
  try { raw = JSON.parse(content); } catch { throw new Error('Nieprawidłowy JSON. Wybierz plik wyeksportowany z Folio.'); }
  const result = projectFileSchema.safeParse(raw);
  if (!result.success) { const issue = result.error.issues[0]; throw new Error(`Nieprawidłowy plik Folio: ${issue.path.join('.') || 'struktura pliku'}. Sprawdź wersję, dane i wartości motywu.`); }
  return result.data;
}
export function exportProjectJson(name: string, data: ResumeData, theme: ResumeTheme) {
  const file: ProjectFile = { kind: 'folio-resume', version: 1, name, data, theme };
  downloadBlob(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }), `${name.replace(/[^\p{L}\p{N} _-]/gu, '') || 'CV'}.json`);
}
export function exportTemplateJson(template: ResumeTemplate) {
  const file: ProjectFile = { kind: 'folio-template', version: 1, template };
  downloadBlob(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }), `Folio_${template.name.replace(/[^\p{L}\p{N} _-]/gu, '')}.json`);
}
