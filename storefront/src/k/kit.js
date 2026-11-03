// Shared, DOM-free helpers for the concept mini-sites in src/k/<id>/.
// A concept renders static HTML per language at build time (scripts/i18n-pages.mjs) and may hydrate with its own app.js.
// Build-time only (Node): runtime scripts in app.js must not import this file.
import {readdirSync,readFileSync,existsSync} from 'node:fs';

// Photo manifests written by scripts/concept-assets/process.py, one per concept: k/<id>/assets.json.
const kdir=new URL('./',import.meta.url);
export const assets={};
for(const d of readdirSync(kdir,{withFileTypes:true}))if(d.isDirectory()&&existsSync(new URL(`${d.name}/assets.json`,kdir)))Object.assign(assets,JSON.parse(readFileSync(new URL(`${d.name}/assets.json`,kdir),'utf8')));

const IDX={az:0,ru:1,en:2};
// az uses the ru-RU grouping (space thousands, decimal comma): browsers often lack az number data, so build and runtime agree.
const LOCALE={az:'ru-RU',ru:'ru-RU',en:'en-GB'};

// A translatable leaf. Every leaf ever created is registered so tests can check all three languages exist.
export class Tx{constructor(az,ru,en){this.v=[az,ru,en];Tx.all.push(this)}}
Tx.all=[];
export const L=(az,ru,en)=>new Tx(az,ru,en);

export const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const fill=(s,vars)=>vars?s.replace(/\{(\w+)\}/g,(m,k)=>k in vars?vars[k]:m):s;

export function makeCtx(lang){
 const i=IDX[lang]??0,loc=LOCALE[lang]||LOCALE.az;
 const raw=(leaf,vars)=>fill(leaf instanceof Tx?leaf.v[i]:String(leaf??''),vars);
 const num=(n,o)=>new Intl.NumberFormat(loc,o).format(n);
 // Deeply replace Tx leaves with plain strings, for JSON handed to the runtime script.
 const resolve=x=>x instanceof Tx?x.v[i]:Array.isArray(x)?x.map(resolve):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,resolve(v)])):x;
 const ctx={lang,i,locale:loc,raw,num,resolve,
  t:(leaf,vars)=>esc(raw(leaf,vars)),
  href:p=>`/${lang}${p}`,
  azn:(n,o)=>`${num(n,o)} AZN`,
  date:(d,o)=>new Intl.DateTimeFormat({az:'az-AZ',ru:'ru-RU',en:'en-GB'}[lang]||'az-AZ',o).format(d),
  // <script type="application/json"> payload; CSP allows it because it is never executed.
  data:(obj,id='k-data')=>`<script type="application/json" id="${id}">${JSON.stringify(resolve(obj)).replace(/</g,'\\u003c')}</script>`,
  img:(key,alt,opt={})=>img(ctx,key,alt,opt),
  credits:(keys,label)=>credits(ctx,keys,label)
 };
 return ctx;
}

// Responsive local image from the generated asset manifest (src/k/assets.js). No inline styles: CSP forbids them.
export function img(ctx,key,alt,{cls='',sizes='100vw',eager=false,attrs=''}={}){
 const a=assets[key];
 if(!a)throw new Error(`unknown concept asset: ${key}`);
 const srcset=a.widths.map(w=>`/assets/k/${key}-${w}.webp ${w}w`).join(', ');
 const big=a.widths[a.widths.length-1];
 return `<img${cls?` class="${cls}"`:''} src="/assets/k/${key}-${big}.webp" srcset="${srcset}" sizes="${sizes}" width="${a.w}" height="${a.h}" alt="${esc(alt instanceof Tx?ctx.raw(alt):alt??'')}" ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async"${attrs?' '+attrs:''}>`;
}

export const imageKeys=prefix=>Object.keys(assets).filter(k=>k.startsWith(prefix+'/'));

const CREDIT=L('Fotoşəkillər','Фотографии','Photographs');
// Photo credits: CC0 needs no attribution, the authors are credited anyway.
export function credits(ctx,keys,label=CREDIT){
 const seen=new Map();
 for(const k of keys){const a=assets[k];if(a&&!seen.has(a.page))seen.set(a.page,a)}
 const list=[...seen.values()].map(a=>`<a href="${esc(a.page)}" rel="noopener" target="_blank">${esc(a.creator||'—')}</a>`).join(', ');
 return list?`<p class="k-credits">${ctx.t(label)}: ${list} (${esc([...new Set([...seen.values()].map(a=>`${a.license}, ${a.sourceName}`))].join('; '))}).</p>`:'';
}
