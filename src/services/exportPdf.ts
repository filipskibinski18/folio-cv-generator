import type { ResumeData, ResumeTheme } from '../types/resume';
import { documentFilename, downloadBlob } from '../lib/format';
import type { PreviewRegion } from '../lib/previewTargets';

export interface PdfPreviewResult { blob: Blob; regions: PreviewRegion[] }

let worker: Worker | undefined;
let sequence = 0;
const pending = new Map<number, { resolve: (result: PdfPreviewResult) => void; reject: (error: Error) => void }>();
const cache = new Map<string, Promise<PdfPreviewResult>>();
function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./pdf.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<{ id: number; buffer?: ArrayBuffer; error?: string; regions?: PreviewRegion[] }>) => {
      const item = pending.get(event.data.id); if (!item) return;
      pending.delete(event.data.id);
      if (event.data.error) item.reject(new Error(event.data.error));
      else if (event.data.buffer) item.resolve({ blob: new Blob([event.data.buffer], { type: 'application/pdf' }), regions: event.data.regions ?? [] });
    };
    worker.onerror = event => {
      const detail = event.message || 'Nieznany błąd';
      console.error('Folio PDF worker:', detail, `${event.filename}:${event.lineno}:${event.colno}`);
      pending.forEach(item => item.reject(new Error(`Błąd renderera PDF: ${detail}`)));
      pending.clear(); cache.clear(); worker?.terminate(); worker = undefined;
    };
  }
  return worker;
}
export function createPdfPreview(data: ResumeData, theme: ResumeTheme): Promise<PdfPreviewResult> {
  const key = JSON.stringify({ data, theme });
  const cached = cache.get(key); if (cached) return cached;
  const result = new Promise<PdfPreviewResult>((resolve, reject) => {
    const id = ++sequence;
    try { getWorker().postMessage({ id, data, theme }); pending.set(id, { resolve, reject }); }
    catch (error) { reject(error instanceof Error ? error : new Error('Nie udało się uruchomić renderera PDF.')); }
  }).catch(error => { cache.delete(key); throw error; });
  cache.set(key, result);
  if (cache.size > 3) cache.delete(cache.keys().next().value!);
  return result;
}
export async function createPdfBlob(data: ResumeData, theme: ResumeTheme): Promise<Blob> {
  return (await createPdfPreview(data, theme)).blob;
}
export async function exportPdf(data: ResumeData, theme: ResumeTheme) {
  downloadBlob(await createPdfBlob(data, theme), documentFilename(data, 'pdf'));
}
