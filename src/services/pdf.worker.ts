import { pdf } from '@react-pdf/renderer';
import { renderResume } from './renderResume';
import { registerFonts } from '../components/preview/fonts';
import type { ResumeData, ResumeTheme } from '../types/resume';

registerFonts();
let queue = Promise.resolve();
self.onmessage = (event: MessageEvent<{ id: number; data: ResumeData; theme: ResumeTheme }>) => {
  const { id, data, theme } = event.data;
  queue = queue.then(async () => {
    try {
      const { output: blob, regions } = await renderResume(data, theme, document => pdf(document).toBlob());
      const buffer = await blob.arrayBuffer();
      self.postMessage({ id, buffer, regions }, { transfer: [buffer] });
    } catch (error) { self.postMessage({ id, error: error instanceof Error ? error.message : 'Nie udało się wygenerować PDF.' }); }
  });
};
