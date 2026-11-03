// Serves dist/ like production for Luna checks: the Content-Security-Policy and /Luna rewrites from vercel.json,
// exact-case paths and directory index files. Usage: node scripts/luna/preview.mjs [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
const root = resolve('dist');
const vercel = JSON.parse(await readFile('vercel.json', 'utf8'));
const csp = vercel.headers[0].headers.find(h => h.key === 'Content-Security-Policy').value;
const rewrites = new Map((vercel.rewrites || []).map(r => [r.source, r.destination]));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.xml': 'application/xml' };
const port = Number(process.argv[2] || 4173);
createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let p = decodeURIComponent(url.pathname);
  if (rewrites.has(p)) p = rewrites.get(p);
  let file = resolve(root, '.' + p);
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try { if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html'); } catch { /* 404 below */ }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Content-Security-Policy': csp, 'X-Content-Type-Options': 'nosniff' }).end(body);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Luna preview: http://127.0.0.1:${port}/Luna`));
