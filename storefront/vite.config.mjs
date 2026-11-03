import {defineConfig} from 'vite';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readdirSync,existsSync} from 'node:fs';
const root=dirname(fileURLToPath(import.meta.url));
// Each redesigned concept (src/k/<id>/app.js) is its own entry so a concept page only loads its own CSS and script.
// scripts/i18n-pages.mjs reads the manifest to link them into /<lang>/concepts/<id>.html.
const kdir=resolve(root,'src/k');
const kEntries=Object.fromEntries(readdirSync(kdir,{withFileTypes:true}).filter(d=>d.isDirectory()&&existsSync(resolve(kdir,d.name,'app.js'))).map(d=>[`k-${d.name}`,resolve(kdir,d.name,'app.js')]));
export default defineConfig({root,build:{outDir:resolve(root,'../dist'),emptyOutDir:false,manifest:true,rollupOptions:{input:{main:resolve(root,'index.html'),product:resolve(root,'product.html'),catalogue:resolve(root,'catalogue.html'),service:resolve(root,'service.html'),concept:resolve(root,'concept.html'),budget:resolve(root,'budgettracker/index.html'),...kEntries}}}});
