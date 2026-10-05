// Renders CV templates to PNG for visual review: node scripts/render-png.mjs [templateId…] [--long]
import { createServer } from 'vite';
import { Font, renderToBuffer } from '@react-pdf/renderer';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const require = createRequire(import.meta.resolve('pdfjs-dist/package.json'));
const { createCanvas } = require('@napi-rs/canvas');
const output = resolve('test-results', 'png');
await mkdir(output, { recursive: true });
const args = process.argv.slice(2);
const long = args.includes('--long');
const ids = args.filter(arg => !arg.startsWith('--'));
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { sampleResume } = await vite.ssrLoadModule('/src/data/sampleResume.ts');
  const { presets } = await vite.ssrLoadModule('/src/data/presets.ts');
  const { renderResume } = await vite.ssrLoadModule('/src/services/renderResume.tsx');
  const { breakLongWord } = await vite.ssrLoadModule('/src/lib/format.ts');
  const { fontNames } = await vite.ssrLoadModule('/src/types/resume.ts');
  for (const family of fontNames) Font.register({ family, fonts: [400, 700].map(fontWeight => ({ src: resolve('public/fonts', `${family}-${fontWeight}.ttf`), fontWeight })) });
  Font.registerHyphenationCallback(breakLongWord);
  // A generated diagnostic portrait instead of a personal photo.
  const photo = createCanvas(512, 512); const p = photo.getContext('2d');
  p.fillStyle = '#d9e2e6'; p.fillRect(0, 0, 512, 512);
  p.fillStyle = '#35546a'; p.beginPath(); p.ellipse(256, 560, 230, 210, 0, 0, Math.PI * 2); p.fill();
  p.fillStyle = '#e0b897'; p.beginPath(); p.ellipse(256, 230, 95, 115, 0, 0, Math.PI * 2); p.fill();
  p.fillStyle = '#4a3a30'; p.beginPath(); p.ellipse(256, 140, 100, 52, 0, Math.PI, Math.PI * 2); p.fill();
  const data = structuredClone(sampleResume);
  data.personal.photo = photo.toDataURL('image/jpeg', 0.9);
  if (long) {
    data.certificates.push({ id: 'cert-long', name: 'CISCO CCNA Networking 1 and 2', issuer: 'Certification', date: '2021', url: 'https://www.credly.com/badges/c0bfb8ab-09f0-4bc8-be16-0f1d4a5b7e2c/public_url' });
    data.projects[0].url = 'https://play.google.com/store/apps/details?id=com.melodict.mobile.music.quiz&hl=pl';
    data.links.push({ id: 'link-raw', label: '', url: 'https://www.linkedin.com/in/aleksandra-nowak-kowalska-1a2b3c4d/?utm_source=share' });
    data.personal.email = 'aleksandra.nowak-kowalska@przyklad-firmy.com.pl';
  }
  const selected = ids.length ? presets.filter(preset => ids.includes(preset.id)) : presets;
  for (const preset of selected) {
    const { output: buffer } = await renderResume(data, preset.theme, renderToBuffer);
    const document = await getDocument({ data: new Uint8Array(buffer) }).promise;
    for (let i = 1; i <= document.numPages; i++) {
      const page = await document.getPage(i);
      const viewport = page.getViewport({ scale: 1.6 });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      await page.render({ canvas, canvasContext: canvas.getContext('2d'), viewport }).promise;
      await writeFile(resolve(output, `${preset.id}${long ? '-long' : ''}-${i}.png`), canvas.toBuffer('image/png'));
    }
    console.log(`${preset.id}: ${document.numPages} page(s)`);
    await document.destroy();
  }
} finally { await vite.close(); }
