// Renders a real first-page thumbnail for every built-in template into
// public/thumbnails/<id>.webp. Run after changing templates or the renderer:
//   npm run thumbnails            (all)    node scripts/render-thumbnails.mjs aurora monolith
import { createServer } from 'vite';
import { Font, renderToBuffer } from '@react-pdf/renderer';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const require = createRequire(import.meta.resolve('pdfjs-dist/package.json'));
const { createCanvas } = require('@napi-rs/canvas');
const output = resolve('public', 'thumbnails');
await mkdir(output, { recursive: true });
const ids = process.argv.slice(2);
const width = 360;
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { sampleResume } = await vite.ssrLoadModule('/src/data/sampleResume.ts');
  const { presets } = await vite.ssrLoadModule('/src/data/presets.ts');
  const { renderResume } = await vite.ssrLoadModule('/src/services/renderResume.tsx');
  const { breakLongWord } = await vite.ssrLoadModule('/src/lib/format.ts');
  const { fontNames } = await vite.ssrLoadModule('/src/types/resume.ts');
  for (const family of fontNames) Font.register({ family, fonts: [400, 700].map(fontWeight => ({ src: resolve('public/fonts', `${family}-${fontWeight}.ttf`), fontWeight })) });
  Font.registerHyphenationCallback(breakLongWord);
  // An abstract portrait keeps thumbnails neutral without using a real person's photo.
  const photo = createCanvas(512, 512); const p = photo.getContext('2d');
  p.fillStyle = '#cfd8de'; p.fillRect(0, 0, 512, 512);
  p.fillStyle = '#5b6d7a'; p.beginPath(); p.ellipse(256, 590, 250, 230, 0, 0, Math.PI * 2); p.fill();
  p.fillStyle = '#e9d2c0'; p.beginPath(); p.ellipse(256, 236, 92, 112, 0, 0, Math.PI * 2); p.fill();
  p.fillStyle = '#3d342f'; p.beginPath(); p.ellipse(256, 160, 100, 62, 0, Math.PI, Math.PI * 2); p.fill();
  const data = { ...structuredClone(sampleResume), personal: { ...sampleResume.personal, photo: photo.toDataURL('image/jpeg', 0.9) } };
  const selected = ids.length ? presets.filter(preset => ids.includes(preset.id)) : presets;
  for (const preset of selected) {
    const { output: buffer } = await renderResume(data, preset.theme, renderToBuffer);
    const document = await getDocument({ data: new Uint8Array(buffer) }).promise;
    const page = await document.getPage(1);
    const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
    const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
    await page.render({ canvas, canvasContext: canvas.getContext('2d'), viewport }).promise;
    await writeFile(resolve(output, `${preset.id}.webp`), canvas.toBuffer('image/webp', 82));
    await document.destroy();
    process.stdout.write('.');
  }
  console.log(`\n${selected.length} thumbnail(s) in public/thumbnails`);
} finally { await vite.close(); }
