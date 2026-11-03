// Copies browser builds of third-party libraries into public/vendor (run automatically after npm install).
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
const out = new URL('../public/vendor/', import.meta.url);
await mkdir(out, { recursive: true });
const nm = p => new URL('../node_modules/' + p, import.meta.url);
await cp(nm('@supabase/supabase-js/dist/umd/supabase.js'), new URL('supabase.js', out));
await cp(nm('@supabase/supabase-js/LICENSE'), new URL('SUPABASE-LICENSE.txt', out));
const chess = (await readFile(nm('chess.js/dist/esm/chess.js'), 'utf8')).replace(/\n\/\/# sourceMappingURL=.*$/m, '');
await writeFile(new URL('chess.mjs', out), chess);
await cp(nm('chess.js/LICENSE'), new URL('CHESSJS-LICENSE.txt', out));
console.log('vendor libraries copied to public/vendor');
// Leaflet (maps for /budgettracker)
await mkdir(new URL('leaflet/', out), { recursive: true });
await cp(nm('leaflet/dist/leaflet.js'), new URL('leaflet/leaflet.js', out));
await cp(nm('leaflet/dist/leaflet.css'), new URL('leaflet/leaflet.css', out));
await cp(nm('leaflet/LICENSE'), new URL('leaflet/LICENSE.txt', out));
console.log('leaflet copied');
// PDF.js for Luna's editor panel (/Luna?bolme=redaktor): the worker and its data files are served from our own
// origin under a versioned path. The library itself is bundled by Vite from the same pinned pdfjs-dist package
// (storefront/Luna/src/importer.js checks that both versions match). Nothing is loaded from a CDN.
{
  const pkg = JSON.parse(await readFile(nm('pdfjs-dist/package.json'), 'utf8'));
  const dest = new URL(`../storefront/public/Luna/vendor/pdfjs-${pkg.version}/`, import.meta.url);
  await mkdir(dest, { recursive: true });
  await cp(nm('pdfjs-dist/build/pdf.worker.min.mjs'), new URL('pdf.worker.min.mjs', dest));
  for (const dir of ['cmaps', 'standard_fonts', 'iccs']) await cp(nm(`pdfjs-dist/${dir}`), new URL(`${dir}/`, dest), { recursive: true });
  // Only the pure-JS decoders: Luna runs PDF.js with useWasm: false, so no 'wasm-unsafe-eval' is needed in the CSP.
  await mkdir(new URL('wasm/', dest), { recursive: true });
  for (const f of ['openjpeg_nowasm_fallback.js', 'jbig2_nowasm_fallback.js', 'LICENSE_PDFJS_OPENJPEG', 'LICENSE_OPENJPEG', 'LICENSE_PDFJS_JBIG2', 'LICENSE_JBIG2']) await cp(nm(`pdfjs-dist/wasm/${f}`), new URL(`wasm/${f}`, dest));
  await cp(nm('pdfjs-dist/LICENSE'), new URL('LICENSE.txt', dest));
  console.log(`pdf.js ${pkg.version} copied to storefront/public/Luna/vendor/`);
}
