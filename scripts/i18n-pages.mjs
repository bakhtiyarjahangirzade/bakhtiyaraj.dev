// Post-build step: turns the built Azerbaijani storefront pages into /az/, /ru/ and /en/ copies.
// Text nodes and selected attributes are looked up in storefront/src/i18n/strings.js; in-site links get a language prefix.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {rows} from '../storefront/src/i18n/strings.js';

const dist=new URL('../dist/',import.meta.url);
const ORIGIN='https://www.bakhtiyaraj.dev';
const LANGS=['az','ru','en'];
const LOCALE={az:'az_AZ',ru:'ru_RU',en:'en_US'};
const PAGES=[['index','index.html',''],['catalogue','catalogue.html','catalogue.html'],['product','product.html','product.html']];
const index={az:0,ru:1,en:2};
const table=new Map(rows.map(r=>[r[0],r]));
const missing=new Set(),asciiNotes=new Set();

const decode=s=>s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
const encodeText=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const encodeAttr=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');

// Split "← text ↗" into decoration + core so arrows never end up in the dictionary.
function translate(raw,lang,where){
 const text=decode(raw);
 const m=/^(\s*(?:←\s*)?)([\s\S]*?)((?:\s*[↗↘↑↓→✳×]+)?\s*)$/.exec(text);
 const [,pre,core,post]=m;
 if(!/\p{L}/u.test(core))return raw;
 const row=table.get(core);
 if(!row){
  if(/^[\x00-\x7F]+$/.test(core))asciiNotes.add(core);else missing.add(`${where}: ${core}`);
  return raw;
 }
 return lang==='az'?raw:encodeText(pre+row[index[lang]]+post);
}

const ATTR=/\b(aria-label|placeholder|alt|title|content)="([^"]*)"/g;
function translateTag(tag,lang,where){
 const meta=/^<meta\b/i.test(tag);
 if(meta&&!/(name="description"|property="og:(title|description|image:alt)")/.test(tag))return tag;
 return tag.replace(ATTR,(all,name,value)=>{
  if(name==='content'&&!meta)return all;
  if(!value.trim()||!/\p{L}/u.test(value))return all;
  const out=translate(encodeText(decode(value)),lang,where+' @'+name);
  return lang==='az'||out===value?all:`${name}="${encodeAttr(decode(out))}"`;
 });
}

function prefixLinks(tag,lang){
 return tag.replace(/\bhref="(\/|\/#[^"]*|\/catalogue\.html[^"]*|\/product\.html[^"]*)"/g,(m,h)=>`href="/${lang}${h}"`);
}

function pageUrl(lang,file){return `${ORIGIN}/${lang}/${file}`}

function headBlock(lang,file){
 const alts=LANGS.map(l=>`<link rel="alternate" hreflang="${l}" href="${pageUrl(l,file)}">`).join('');
 return `<link rel="canonical" href="${pageUrl(lang,file)}">${alts}<link rel="alternate" hreflang="x-default" href="${pageUrl('az',file)}"><meta property="og:url" content="${pageUrl(lang,file)}"><meta property="og:locale" content="${LOCALE[lang]}">`;
}

function build(html,lang,page,file){
 let out=html
  .replace(/<link rel="canonical"[^>]*>/,'')
  .replace(/<meta property="og:(url|locale)"[^>]*>/g,'')
  .replace(/<html lang="[^"]*"/,`<html lang="${lang}"`);
 out=out.replace('<title>',headBlock(lang,file)+'<title>');
 const parts=out.split(/(<[^>]*>)/);
 let insideSwitch=false;
 for(let i=0;i<parts.length;i++){
  const p=parts[i];
  if(p.startsWith('<')){
   let tag=translateTag(p,lang,page);
   if(/^<nav class="lang-switch"/.test(tag))insideSwitch=true;
   if(insideSwitch&&/^<a\b/.test(tag)){
    const l=/hreflang="(\w+)"/.exec(tag)[1];
    tag=tag.replace(/href="[^"]*"/,`href="/${l}/${file}"`).replace(/ aria-current="true"/,'');
    if(l===lang)tag=tag.replace(/^<a /,'<a aria-current="true" ');
   }else tag=prefixLinks(tag,lang);
   if(/^<\/nav>/.test(tag))insideSwitch=false;
   parts[i]=tag;
  }else if(!insideSwitch&&!/^<(script|style)/i.test(parts[i-1]||'')){
   parts[i]=translate(p,lang,page);
  }
 }
 return parts.join('');
}

for(const [page,source,file] of PAGES){
 const html=await readFile(new URL(source,dist),'utf8');
 for(const lang of LANGS){
  const out=build(html,lang,page,file);
  await mkdir(new URL(`${lang}/`,dist),{recursive:true});
  await writeFile(new URL(`${lang}/${source}`,dist),out);
  if(lang==='az')await writeFile(new URL(source,dist),out); // root stays Azerbaijani, canonical points to /az/
 }
}
if(asciiNotes.size)console.log('i18n: kept as-is (ASCII, please confirm):',[...asciiNotes].join(' | '));
if(missing.size){
 console.error('i18n: missing translations:\n  '+[...missing].join('\n  '));
 process.exit(1);
}
console.log(`i18n: generated ${LANGS.join(', ')} for ${PAGES.length} pages`);
