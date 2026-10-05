import { createServer } from 'vite';
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { presets } = await vite.ssrLoadModule('/src/data/presets.ts');
const { categoriesFor } = await vite.ssrLoadModule('/src/data/templateCategories.ts');
const rows = presets.map((p, i) => { const t = p.theme, d = t.design; return { i, id: p.id, cat: categoriesFor(p)[0], key: [t.layout, t.headerStyle, t.sectionStyle, d.entryStyle, d.sidebarStyle, d.decoration, d.nameStyle, d.contactPlacement, t.photo.position, t.photo.shape, t.icons.style, t.skillStyle, t.typography.headingFont, t.typography.fontFamily].join('|') }; });
console.log(JSON.stringify(rows));
await vite.close();
