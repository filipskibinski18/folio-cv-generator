import type { ResumeData, ResumeTheme } from '../types/resume';
import { documentFilename, downloadBlob } from '../lib/format';

let worker: Worker | undefined;
let sequence = 0;
const pending = new Map<number, { resolve: (blob: Blob) => void; reject: (error: Error) => void }>();
const cache = new Map<string, Promise<Blob>>();
function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./pdf.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<{ id: number; buffer?: ArrayBuffer; error?: string }>) => {
      const item = pending.get(event.data.id); if (!item) return;
      pending.delete(event.data.id);
      if (event.data.error) item.reject(new Error(event.data.error));
      else if (event.data.buffer) item.resolve(new Blob([event.data.buffer], { type: 'application/pdf' }));
    };
    worker.onerror = event => {
      const detail = event.message || 'Nieznany błąd';
      console.error('Folio PDF worker:', detail);
      pending.forEach(item => item.reject(new Error(`Błąd renderera PDF: ${detail}`)));
      pending.clear(); cache.clear(); worker?.terminate(); worker = undefined;
    };
  }
  return worker;
}
export function createPdfBlob(data: ResumeData, theme: ResumeTheme): Promise<Blob> {
  const key = JSON.stringify({ data, theme });
  const cached = cache.get(key); if (cached) return cached;
  const result = new Promise<Blob>((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject }); getWorker().postMessage({ id, data, theme });
  }).catch(error => { cache.delete(key); throw error; });
  cache.set(key, result);
  if (cache.size > 3) cache.delete(cache.keys().next().value!);
  return result;
}
export async function exportPdf(data: ResumeData, theme: ResumeTheme) {
  downloadBlob(await createPdfBlob(data, theme), documentFilename(data, 'pdf'));
}
