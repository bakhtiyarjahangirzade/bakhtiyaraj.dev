// Post-build step: turns the built Azerbaijani storefront pages into /az/, /ru/ and /en/ copies.
// Text nodes and selected attributes are looked up in storefront/src/i18n/strings.js; in-site links get a language prefix.
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {rows} from '../storefront/src/i18n/strings.js';
import {products} from '../storefront/src/product-data.js';
import {serviceContent,serviceIds} from '../storefront/src/services-content.js';

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
  if(core.startsWith('@@'))return raw;
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
// ---- per-service promotion pages: shell from dist/service.html, body generated in the target language ----
const missingContent=new Set();
function makeT(lang){
 return (key,vars)=>{
  const row=table.get(key);
  if(!row){missingContent.add(key);return key}
  const text=lang==='az'?key:row[index[lang]];
  return vars?text.replace(/\{(\w+)\}/g,(m,k)=>k in vars?vars[k]:m):text;
 };
}
const WA='https://wa.me/48571572697';
const STEPS=[['01','TANIŞLIQ','Nə yaratmaq istəyirsiniz? Məqsədi, funksiyaları və büdcəni birlikdə dəqiqləşdiririk.'],['02','DİZAYN','Struktur və vizual istiqamət. Dizaynı rəyinizlə birlikdə formalaşdırırıq.'],['03','HAZIRLANMA','Sayt, sistem və inteqrasiyalar. Hər ekranı və funksiyanı işləyən məhsula çeviririk.'],['04','YAYIM','Mobil və masaüstü yoxlamalar, domeninizdə yayım və istifadə üçün təhvil.']];
function serviceBody(id,lang){
 const T=makeT(lang),p=products[id],c=serviceContent[id],L=x=>`/${lang}${x}`,e=encodeText,ea=encodeAttr;
 const title=T(p.title),price=T('{n} AZN-dən',{n:p.price}),config=L('/product.html?service='+id);
 const options=p.options.map(o=>`<div class="option-row"><strong>${e(T(o.label))}</strong><span>${e(T(o.help))}</span><b>+${o.price} AZN</b></div>`).join('')+c.extras.map(([k,v])=>`<div class="option-row"><strong>${e(T(k))}</strong><span></span><b>+${v} AZN</b></div>`).join('');
 const steps=STEPS.map(([n,h,d])=>`<article><span>${n}</span><h3>${e(T(h))}</h3><p>${e(T(d))}</p></article>`).join('');
 const faq=c.faq.map(([q,a,v],i)=>`<details${i===0?' open':''}><summary>${e(T(q))}</summary><p>${e(T(a,v))}</p></details>`).join('');
 const more=serviceIds.filter(x=>x!==id).map(x=>`<a href="${L('/services/'+x+'.html')}"><strong>${e(T(products[x].title))}</strong><span>${e(T('{n} AZN-dən',{n:products[x].price}))}</span></a>`).join('');
 const actions=`<div class="service-actions"><a class="button primary" href="${config}">${e(T('Fərdiləşdir və qiyməti hesabla'))} <span>↗</span></a><a class="button outline" href="${WA}" target="_blank" rel="noopener">${e(T('WhatsApp-da yaz'))} <span>↗</span></a></div>`;
 const body=
  `<nav class="service-crumbs" aria-label="${ea(T('Səhifə yolu'))}"><a href="${L('/')}">${e(T('Ana səhifə'))}</a><span>/</span><a href="${L('/#pricing')}">${e(T('Xidmətlər'))}</a><span>/</span><span>${e(title)}</span></nav>`+
  `<section class="service-hero"><div><p class="eyebrow">${e(T(p.group))}</p><h1>${e(title)}</h1></div><div><p class="service-lead">${e(T(p.desc))}</p><div class="service-price"><strong>${e(price)}</strong><span>${e(T('birdəfəlik, başlayan qiymət'))}</span></div>${actions}</div></section>`+
  `<section class="service-band"><div class="service-grid"><div><h2>${e(T('Başlanğıc paketinə daxildir'))}</h2><ul class="service-list">${p.included.map(i=>`<li>${e(T(i))}</li>`).join('')}</ul></div><div><h2>${e(T('Kimlər üçün uyğundur?'))}</h2><ul class="service-list">${c.audience.map(a=>`<li>${e(T(a))}</li>`).join('')}</ul></div></div></section>`+
  `<section class="service-section"><h2>${e(T('Əlavə imkanlar və qiymətlər'))}</h2><p class="option-note">${e(T('Qiymətlər başlanğıc qiymətə əlavə olunur. Yekun məbləğ konfiqurator ilə hesablanır.'))}</p><div class="option-table">${options}</div></section>`+
  `<section class="service-section"><h2>${e(T('İş necə gedir?'))}</h2><div class="service-steps">${steps}</div></section>`+
  `<section class="service-section service-faq"><h2>${e(T('Tez-tez verilən suallar'))}</h2><div class="faq-list">${faq}</div></section>`+
  `<section class="service-cta"><h2>${e(T('Başlamağa hazırsınız?'))}</h2><p>${e(T('Seçimlərinizi edin və qiyməti görün, ya da birbaşa mənə yazın.'))}</p>${actions}</section>`+
  `<section class="service-section"><h2>${e(T('Digər xidmətlər'))}</h2><div class="service-more-list">${more}</div></section>`;
 return {title:`${title} — BAKHY`,desc:T(p.desc),body};
}
const template=await readFile(new URL('service.html',dist),'utf8');
const serviceFiles=[];
for(const id of serviceIds){
 const file=`services/${id}.html`;serviceFiles.push(file);
 for(const lang of LANGS){
  const {title,desc,body}=serviceBody(id,lang);
  const out=build(template,lang,`service:${id}`,file).replaceAll('@@TITLE@@',encodeAttr(title)).replaceAll('@@DESC@@',encodeAttr(desc)).replace('@@CONTENT@@',()=>body);
  await mkdir(new URL(`${lang}/services/`,dist),{recursive:true});
  await writeFile(new URL(`${lang}/${file}`,dist),out);
 }
}
await rm(new URL('service.html',dist));

// ---- sitemap with hreflang alternates ----
const urls=[...PAGES.map(p=>p[2]),...serviceFiles];
const sitemap=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
 ...urls.flatMap(f=>LANGS.map(l=>`<url><loc>${pageUrl(l,f)}</loc>${LANGS.map(a=>`<xhtml:link rel="alternate" hreflang="${a}" href="${pageUrl(a,f)}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl('az',f)}"/></url>`)),'</urlset>',''].join('\n');
await writeFile(new URL('sitemap.xml',dist),sitemap);

if(asciiNotes.size)console.log('i18n: kept as-is (ASCII, please confirm):',[...asciiNotes].join(' | '));
if(missing.size||missingContent.size){
 console.error('i18n: missing translations:\n  '+[...missing,...[...missingContent].map(k=>`service content: ${k}`)].join('\n  '));
 process.exit(1);
}
console.log(`i18n: generated ${LANGS.join(', ')} for ${PAGES.length} pages and ${serviceIds.length} service pages`);
