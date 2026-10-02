import { createServer } from 'vite';
import { Font, renderToBuffer } from '@react-pdf/renderer';
import { Packer } from 'docx';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';

const require = createRequire(import.meta.resolve('pdfjs-dist/package.json'));
const { createCanvas } = require('@napi-rs/canvas');
const output = resolve('test-results');
await mkdir(output, { recursive: true });
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { sampleResume } = await vite.ssrLoadModule('/src/data/sampleResume.ts');
  const { presets } = await vite.ssrLoadModule('/src/data/presets.ts');
  const { ResumeDocument } = await vite.ssrLoadModule('/src/components/preview/ResumeDocument.tsx');
  const { createDocxDocument } = await vite.ssrLoadModule('/src/services/exportDocx.ts');
  for (const family of ['Inter', 'Lora', 'Roboto']) Font.register({ family, fonts: [400, 700].map(fontWeight => ({ src: resolve('public/fonts', `${family}-${fontWeight}.ttf`), fontWeight })) });
  Font.registerHyphenationCallback(word => [word]);
  const long = structuredClone(sampleResume);
  long.experience = Array.from({ length: 12 }, (_, i) => ({ ...structuredClone(sampleResume.experience[0]), id: `exp-${i}`, company: `Zespół produktowy ${i + 1}`, bullets: [{ id: `bullet-${i}`, text: `Realizacja projektu ${i + 1}. ${'Projektowanie dostępnych rozwiązań i analiza wyników. '.repeat(5)}`, children: [{ id: `child-${i}`, text: `Wynik: poprawa konwersji o ${i + 10}%.`, children: [] }] }] }));
  long.languages = Array.from({ length: 18 }, (_, i) => ({ id: `lang-${i}`, name: `Język ${i + 1}`, level: 'C1 · zaawansowany' }));
  const jobs = [...presets.map(preset => ({ name: preset.id, data: sampleResume, theme: preset.theme })), { name: 'stress', data: long, theme: presets[0].theme }];
  for (const job of jobs) {
    const buffer = await renderToBuffer(ResumeDocument(job));
    await writeFile(resolve(output, `${job.name}.pdf`), buffer);
    const fonts = await Promise.all([...new Set([job.theme.typography.fontFamily, job.theme.typography.headingFont])].map(async name => ({ name, data: await readFile(resolve('public/fonts', `${name}-400.ttf`)) })));
    await writeFile(resolve(output, `${job.name}.docx`), await Packer.toBuffer(createDocxDocument(job.data, job.theme, false, fonts)));
    await writeFile(resolve(output, `${job.name}.json`), JSON.stringify({ kind: 'folio-resume', version: 1, name: `CV ${job.name}`, data: job.data, theme: job.theme }, null, 2));
    const document = await getDocument({ data: new Uint8Array(buffer) }).promise;
    for (let i = 1; i <= document.numPages; i++) {
      const page = await document.getPage(i);
      const viewport = page.getViewport({ scale: 1.3 });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      await page.render({ canvas, canvasContext: canvas.getContext('2d'), viewport }).promise;
      await writeFile(resolve(output, `${job.name}-${i}.png`), canvas.toBuffer('image/png'));
      if ((await page.getOperatorList()).fnArray.includes(OPS.paintImageXObject)) throw new Error(`${job.name}: document unexpectedly rasterized`);
    }
    console.log(`${job.name}: ${document.numPages} A4 page(s), vector PDF + editable DOCX + JSON, fonts embedded`);
    await document.destroy();
  }
} finally { await vite.close(); }
