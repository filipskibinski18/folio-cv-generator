import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist');
const mime: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm', '.css': 'text/css', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
createServer((req, res) => { void (async () => {
  if (req.url?.startsWith('/api/')) { res.writeHead(404); res.end(); return; }
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url ?? '/', 'http://local').pathname));
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    let file = path === root ? resolve(root, 'index.html') : path;
    let data;
    try { data = await readFile(file); } catch { if (extname(file)) { res.writeHead(404); res.end(); return; } file = resolve(root, 'index.html'); data = await readFile(file); }
    res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' }); res.end(data);
  } catch { res.writeHead(400); res.end(); }
})() }).listen(Number(process.env.PORT ?? 4173), process.env.HOST ?? '127.0.0.1', () => console.log('Folio server ready'));
