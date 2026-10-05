import { createServer } from 'vite';
import { Font, renderToBuffer } from '@react-pdf/renderer';
import { Packer } from 'docx';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';

const require = createRequire(import.meta.resolve('pdfjs-dist/package.json'));
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const output = resolve('test-results');
await mkdir(output, { recursive: true });
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { sampleResume } = await vite.ssrLoadModule('/src/data/sampleResume.ts');
  const { presets } = await vite.ssrLoadModule('/src/data/presets.ts');
  const { renderResume } = await vite.ssrLoadModule('/src/services/renderResume.tsx');
  const { sectionIconSvg } = await vite.ssrLoadModule('/src/lib/sectionIcons.ts');
  const { createDocxDocument } = await vite.ssrLoadModule('/src/services/exportDocx.ts');
  for (const family of ['Inter', 'Lora', 'Roboto', 'Montserrat', 'PlayfairDisplay', 'SourceSans3', 'Oswald', 'CormorantGaramond', 'Caveat']) Font.register({ family, fonts: [400, 700].map(fontWeight => ({ src: resolve('public/fonts', `${family}-${fontWeight}.ttf`), fontWeight })) });
  Font.registerHyphenationCallback(word => [word]);
  // A generated diagnostic portrait exercises uploads without using personal photos.
  const sourcePhoto = createCanvas(640, 960); const photoContext = sourcePhoto.getContext('2d');
  photoContext.fillStyle = '#dce6ea'; photoContext.fillRect(0, 0, 640, 960);
  photoContext.fillStyle = '#274b61'; photoContext.beginPath(); photoContext.ellipse(320, 840, 290, 390, 0, 0, Math.PI * 2); photoContext.fill();
  photoContext.fillStyle = '#dfb796'; photoContext.beginPath(); photoContext.ellipse(320, 330, 130, 155, 0, 0, Math.PI * 2); photoContext.fill();
  photoContext.fillStyle = '#473b34'; photoContext.beginPath(); photoContext.ellipse(320, 213, 135, 67, 0, Math.PI, Math.PI * 2); photoContext.fill();
  await writeFile(resolve(output, 'photo-source.png'), sourcePhoto.toBuffer('image/png'));
  const normalizedPhoto = createCanvas(512, 512); normalizedPhoto.getContext('2d').drawImage(sourcePhoto, 0, 160, 640, 640, 0, 0, 512, 512);
  const photoData = { ...sampleResume, personal: { ...sampleResume.personal, photo: normalizedPhoto.toDataURL('image/jpeg', 0.86) } };
  const long = structuredClone(sampleResume);
  long.experience = Array.from({ length: 12 }, (_, i) => ({ ...structuredClone(sampleResume.experience[0]), id: `exp-${i}`, company: `Zespół produktowy ${i + 1}`, bullets: [{ id: `bullet-${i}`, text: `Realizacja projektu ${i + 1}. ${'Projektowanie dostępnych rozwiązań i analiza wyników. '.repeat(5)}`, children: [{ id: `child-${i}`, text: `Wynik: poprawa konwersji o ${i + 10}%.`, children: [] }] }] }));
  long.languages = Array.from({ length: 18 }, (_, i) => ({ id: `lang-${i}`, name: `Język ${i + 1}`, level: 'C1 · zaawansowany' }));
  const jobs = [...presets.map(preset => ({ name: preset.id, data: photoData, theme: preset.theme })), ...['modern', 'aurora', 'blueprint', 'monolith'].map(id => ({ name: `${id}-photo`, data: photoData, theme: presets.find(preset => preset.id === id).theme })), { name: 'stress', data: long, theme: presets[0].theme }];
  for (const job of jobs) {
    const { output: buffer } = await renderResume(job.data, job.theme, renderToBuffer);
    await writeFile(resolve(output, `${job.name}.pdf`), buffer);
    const fonts = await Promise.all([...new Set([job.theme.typography.fontFamily, job.theme.typography.headingFont])].map(async name => ({ name, data: await readFile(resolve('public/fonts', `${name}-400.ttf`)) })));
    let portrait;
    if (job.data.personal.photo) {
      const canvas = createCanvas(512, 512); const context = canvas.getContext('2d');
      const radius = job.theme.photo.shape === 'circle' ? 256 : job.theme.photo.shape === 'rounded' ? 512 * 0.12 : 0;
      context.beginPath(); context.roundRect(0, 0, 512, 512, radius); context.clip(); context.drawImage(await loadImage(job.data.personal.photo), 0, 0, 512, 512);
      portrait = canvas.toBuffer('image/png');
    }
    const icons = {};
    for (const section of job.theme.sections) { const svg = sectionIconSvg(section, job.theme); if (!svg) continue; const icon = createCanvas(96, 96); icon.getContext('2d').drawImage(await loadImage(Buffer.from(svg)), 0, 0, 96, 96); icons[section.id] = icon.toBuffer('image/png'); }
    await writeFile(resolve(output, `${job.name}.docx`), await Packer.toBuffer(createDocxDocument(job.data, job.theme, false, fonts, portrait, icons)));
    await writeFile(resolve(output, `${job.name}.json`), JSON.stringify({ kind: 'folio-resume', version: 1, name: `CV ${job.name}`, data: job.data, theme: job.theme }, null, 2));
    const document = await getDocument({ data: new Uint8Array(buffer) }).promise;
    for (let i = 1; i <= document.numPages; i++) {
      const page = await document.getPage(i);
      const viewport = page.getViewport({ scale: 1.3 });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      await page.render({ canvas, canvasContext: canvas.getContext('2d'), viewport }).promise;
      await writeFile(resolve(output, `${job.name}-${i}.png`), canvas.toBuffer('image/png'));
      const operators = await page.getOperatorList();
      if (!job.data.personal.photo && operators.fnArray.includes(OPS.paintImageXObject)) throw new Error(`${job.name}: document unexpectedly rasterized`);
      if (!(await page.getTextContent()).items.some(item => 'str' in item && item.str.toLowerCase().includes('nowak')) && i === 1) throw new Error(`${job.name}: missing native text`);
    }
    console.log(`${job.name}: ${document.numPages} A4 page(s), vector PDF + editable DOCX + JSON, fonts embedded`);
    await document.destroy();
  }
} finally { await vite.close(); }
