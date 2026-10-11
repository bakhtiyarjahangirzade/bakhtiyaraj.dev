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
