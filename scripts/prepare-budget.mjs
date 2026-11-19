import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..'),dist=join(root,'dist'),paths=new Set();
async function collect(url){
  const key=url.split(/[?#]/)[0];if(paths.has(key)||!key.startsWith('/'))return;
  paths.add(key);const file=join(dist,key==='/budgettracker/'?'budgettracker/index.html':key);
  const body=await readFile(file);
  if(!/\.(?:html|css|js)$/.test(file))return;
  const text=body.toString();
  const pattern=file.endsWith(".html")?/(?:src|href)=["']([^"']+)["']/g:file.endsWith(".css")?/url\(\s*["']?([^\s)'"#]+)/g:/(?:from\s*|import\s*\(?)["']([^"']+\.(?:js|css))["']/g;
  const refs=[...text.matchAll(pattern)];
  for(const match of refs){const ref=match[1]||match[2]||match[3];if(/^(https?:|data:|blob:|#)/.test(ref))continue;await collect(new URL(ref,'https://local'+key).pathname);}
}
await collect('/budgettracker/');
for(const url of ['/budgettracker/icon-192.png','/budgettracker/icon-512.png','/vendor/leaflet/leaflet.js','/vendor/leaflet/leaflet.css'])await collect(url);
const shell=[...paths].sort(),hash=createHash('sha256');
for(const url of shell){hash.update(url);hash.update(await readFile(join(dist,url==='/budgettracker/'?'budgettracker/index.html':url)));}
const template=await readFile(join(root,'storefront/public/budgettracker/sw.js'),'utf8');
await writeFile(join(dist,'budgettracker/sw.js'),template.replace('__BT_VERSION__',hash.digest('hex').slice(0,16)).replace("/*__BT_SHELL__*/['/budgettracker/']",JSON.stringify(shell)));
// Bundle exactly the same tested assets inside the APK.
const native=resolve(root,'apk','www');
if(native!==join(root,'apk','www'))throw new Error('Unexpected generated-assets path');
await rm(native,{recursive:true,force:true});await mkdir(native,{recursive:true});
for(const url of shell){const relative=url==='/budgettracker/'?'budgettracker/index.html':url.slice(1);await mkdir(dirname(join(native,relative)),{recursive:true});await cp(join(dist,relative),join(native,relative));}
await cp(join(dist,'budgettracker/index.html'),join(native,'index.html'));
await writeFile(join(native,'asset-manifest.json'),JSON.stringify({files:shell},null,2));
console.log(`KuryeBro: ${shell.length} dependencies precached and bundled for Android.`);
