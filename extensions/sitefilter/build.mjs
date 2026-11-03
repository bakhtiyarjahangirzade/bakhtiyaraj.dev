// Packs the SiteFilter Chrome extension into BAKHY-SiteFilter.zip for /downloads/.
// Usage: node extensions/sitefilter/build.mjs [outDir]   (default: $BAKHY_DOWNLOADS or dist/downloads)
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.argv[2] || process.env.BAKHY_DOWNLOADS || fileURLToPath(new URL('../../dist/downloads/', import.meta.url));
const INCLUDE = ['manifest.json', 'src', 'icons', '_locales', 'LICENSE'];

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(p));
    else out.push(p);
  }
  return out;
}

const files = {};
for (const item of INCLUDE) {
  const p = join(root, item);
  const list = (await stat(p)).isDirectory() ? await walk(p) : [p];
  for (const f of list) files['SiteFilter/' + relative(root, f).split(sep).join('/')] = new Uint8Array(await readFile(f));
}
const { version } = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8'));
await mkdir(outDir, { recursive: true });
const zip = zipSync(files, { level: 9, mtime: new Date('2026-01-01T00:00:00Z') });
await writeFile(join(outDir, 'BAKHY-SiteFilter.zip'), zip);
console.log(`SiteFilter ${version}: ${Object.keys(files).length} files, ${(zip.length / 1024).toFixed(1)} KB → ${join(outDir, 'BAKHY-SiteFilter.zip')}`);
