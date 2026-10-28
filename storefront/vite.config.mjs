import {defineConfig} from 'vite';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
export default defineConfig({root,build:{outDir:resolve(root,'../dist'),emptyOutDir:false,rollupOptions:{input:{main:resolve(root,'index.html'),product:resolve(root,'product.html'),catalogue:resolve(root,'catalogue.html')}}}});
