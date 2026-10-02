import { pdf } from '@react-pdf/renderer';
import { ResumeDocument } from '../components/preview/ResumeDocument';
import { registerFonts } from '../components/preview/fonts';
import type { ResumeData, ResumeTheme } from '../types/resume';

registerFonts();
let queue = Promise.resolve();
self.onmessage = (event: MessageEvent<{ id: number; data: ResumeData; theme: ResumeTheme }>) => {
  const { id, data, theme } = event.data;
  queue = queue.then(async () => {
    try {
      const blob = await pdf(ResumeDocument({ data, theme })).toBlob();
      const buffer = await blob.arrayBuffer();
      self.postMessage({ id, buffer }, { transfer: [buffer] });
    } catch (error) { self.postMessage({ id, error: error instanceof Error ? error.message : 'Nie udało się wygenerować PDF.' }); }
  });
};
