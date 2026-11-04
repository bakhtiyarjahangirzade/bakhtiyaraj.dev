// Post-build step: turns the built Azerbaijani storefront pages into /az/, /ru/ and /en/ copies.
// Text nodes and selected attributes are looked up in storefront/src/i18n/strings.js; in-site links get a language prefix.
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {rows} from '../storefront/src/i18n/strings.js';
import {products} from '../storefront/src/product-data.js';
import {serviceContent,serviceIds,processSteps,processNote,serviceCases} from '../storefront/src/services-content.js';
import {cases} from '../storefront/src/cases.js';
import {concepts,conceptIds,conceptMeta,renderConcept} from '../storefront/src/concepts.js';
import {projects} from '../storefront/src/projects.js';

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
function serviceBody(id,lang){
 const T=makeT(lang),p=products[id],c=serviceContent[id],L=x=>`/${lang}${x}`,e=encodeText,ea=encodeAttr;
 const title=T(p.title),price=T('{n} AZN-dən',{n:p.price}),config=L('/product.html?service='+id);
 const related=conceptIds.filter(x=>id==='website'?concepts[x].kind==='site':id==='system'?concepts[x].kind==='app':false);
 const relatedHtml=()=>related.length?`<section class="service-section"><h2>${e(T('Konsept nümunələri'))}</h2><p class="option-note">${e(T('Konseptlərdəki adlar və məlumatlar nümunədir. Dizayn sizin biznesinizə uyğunlaşdırılır.'))}</p><div class="service-more-list">${related.map(x=>`<a href="${L('/concepts/'+x+'.html')}"><strong>${e(concepts[x].brand)}</strong><span>${e(T(projects.find(q=>q.id===x).category))}</span></a>`).join('')}</div>${catalogueLink}</section>`:'';
 const options=p.options.map(o=>`<div class="option-row"><strong>${e(T(o.label))}</strong><span>${e(T(o.help))}</span><b>+${o.price} AZN</b></div>`).join('')+c.extras.map(([k,v])=>`<div class="option-row"><strong>${e(T(k))}</strong><span></span><b>+${v} AZN</b></div>`).join('');
 const steps=processSteps.map(([h,d,give,get],i)=>`<article><span>0${i+1}</span><h3>${e(T(h))}</h3><p>${e(T(d))}</p><dl><dt>${e(T('Sizdən'))}</dt><dd>${e(T(give))}</dd><dt>${e(T('Sizə'))}</dt><dd>${e(T(get))}</dd></dl></article>`).join('');
 const realWork=serviceCases[id].map(x=>projects.find(q=>q.id===x));
 const realHtml=realWork.length?`<section class="service-section"><h2>${e(T('Real layihələr'))}</h2><div class="service-cases">${realWork.map(r=>`<a href="${L('/#case-'+r.id)}"><img src="${cases[r.id].shots[0].base}-640.jpg" alt="" width="640" height="400" loading="lazy" decoding="async"><strong>${e(r.name)}</strong><span>${e(T(r.category))}: ${e(cases[r.id].domain)}</span></a>`).join('')}</div></section>`:'';
 const catalogueLink=related.length?`<a class="service-all" href="${L('/catalogue.html?filter='+(id==='system'?'system':'website'))}">${e(T('Kataloqda hamısına baxın'))} ↗</a>`:'';
 const faq=c.faq.map(([q,a,v],i)=>`<details${i===0?' open':''}><summary>${e(T(q))}</summary><p>${e(T(a,v))}</p></details>`).join('');
 const more=serviceIds.filter(x=>x!==id).map(x=>`<a href="${L('/services/'+x+'.html')}"><strong>${e(T(products[x].title))}</strong><span>${e(T('{n} AZN-dən',{n:products[x].price}))}</span></a>`).join('');
 const actions=`<div class="service-actions"><a class="button primary" href="${config}">${e(T('Fərdiləşdir və qiyməti hesabla'))} <span>↗</span></a><a class="button outline" href="${WA}" target="_blank" rel="noopener">${e(T('WhatsApp-da yaz'))} <span>↗</span></a></div>`;
 const body=
  `<nav class="service-crumbs" aria-label="${ea(T('Səhifə yolu'))}"><a href="${L('/')}">${e(T('Ana səhifə'))}</a><span>/</span><a href="${L('/#pricing')}">${e(T('Xidmətlər'))}</a><span>/</span><span>${e(title)}</span></nav>`+
  `<section class="service-hero"><div><p class="eyebrow">${e(T(p.group))}</p><h1>${e(title)}</h1></div><div><p class="service-lead">${e(T(p.desc))}</p><div class="service-price"><strong>${e(price)}</strong><span>${e(T('birdəfəlik, başlayan qiymət'))}</span></div>${actions}</div></section>`+
  `<section class="service-band"><div class="service-grid"><div><h2>${e(T('Başlanğıc paketinə daxildir'))}</h2><ul class="service-list">${p.included.map(i=>`<li>${e(T(i))}</li>`).join('')}</ul></div><div><h2>${e(T('Kimlər üçün uyğundur?'))}</h2><ul class="service-list">${c.audience.map(a=>`<li>${e(T(a))}</li>`).join('')}</ul></div></div></section>`+
  `<section class="service-section"><h2>${e(T('Əlavə imkanlar və qiymətlər'))}</h2><p class="option-note">${e(T('Qiymətlər başlanğıc qiymətə əlavə olunur. Yekun məbləğ konfiqurator ilə hesablanır.'))}</p><div class="option-table">${options}</div></section>`+
  realHtml+relatedHtml()+
  `<section class="service-section"><h2>${e(T('İş necə gedir?'))}</h2><div class="service-steps">${steps}</div><p class="option-note">${e(T(processNote))}</p></section>`+
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

// ---- concept mini-sites: themed shell from dist/concept.html, body rendered in the target language ----
const conceptTemplate=await readFile(new URL('concept.html',dist),'utf8');
// Per-concept bundles (src/k/<id>/app.js) from the Vite manifest: CSS in <head>, module script at the end of <body>.
const viteManifest=JSON.parse(await readFile(new URL('.vite/manifest.json',dist),'utf8'));
function conceptBundle(id){
 const entry=viteManifest[`src/k/${id}/app.js`];
 if(!entry)return {head:'',body:''};
 const css=[...(entry.css||[]),...(entry.imports||[]).flatMap(i=>viteManifest[i]?.css||[])];
 return {head:[...new Set(css)].map(f=>`<link rel="stylesheet" href="/${f}">`).join(''),body:`<script type="module" src="/${entry.file}"></script>`};
}
const conceptFiles=[];
for(const id of conceptIds){
 const file=`concepts/${id}.html`;conceptFiles.push(file);
 for(const lang of LANGS){
  const T=makeT(lang),meta=conceptMeta(id,T),body=renderConcept(id,T,lang),bundle=conceptBundle(id);
  // Redesigned concepts bring their own reset + ribbon CSS, so the legacy shared concept bundle is dropped for them.
  const shell=concepts[id].k?conceptTemplate.replace(/<link rel="(?:stylesheet|modulepreload)"[^>]*>/g,'').replace(/<script type="module"[^>]*><\/script>/g,''):conceptTemplate;
  const out=build(shell.replace('</head>',()=>bundle.head+'</head>').replace('</body>',()=>bundle.body+'</body>'),lang,`concept:${id}`,file).replaceAll('@@TITLE@@',encodeAttr(meta.title)).replaceAll('@@DESC@@',encodeAttr(meta.desc)).replaceAll('@@EXTRA@@',concepts[id].k?'k-page':concepts[id].custom?'concept-showroom':'').replaceAll('@@ID@@',id).replaceAll('@@SERVICE@@',meta.service).replaceAll('@@DESIGN@@',meta.design?`&amp;design=${meta.design}`:'').replace('@@CONTENT@@',()=>body);
  await mkdir(new URL(`${lang}/concepts/`,dist),{recursive:true});
  await writeFile(new URL(`${lang}/${file}`,dist),out);
 }
}
await rm(new URL('concept.html',dist));
await rm(new URL('.vite/',dist),{recursive:true,force:true});

// ---- sitemap with hreflang alternates ----
const urls=[...PAGES.map(p=>p[2]),...serviceFiles,...conceptFiles];
const sitemap=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
 ...urls.flatMap(f=>LANGS.map(l=>`<url><loc>${pageUrl(l,f)}</loc>${LANGS.map(a=>`<xhtml:link rel="alternate" hreflang="${a}" href="${pageUrl(a,f)}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl('az',f)}"/></url>`)),`<url><loc>${ORIGIN}/Luna</loc></url>`,'</urlset>',''].join('\n');
await writeFile(new URL('sitemap.xml',dist),sitemap);

if(asciiNotes.size)console.log('i18n: kept as-is (ASCII, please confirm):',[...asciiNotes].join(' | '));
if(missing.size||missingContent.size){
 console.error('i18n: missing translations:\n  '+[...missing,...[...missingContent].map(k=>`service content: ${k}`)].join('\n  '));
 process.exit(1);
}
console.log(`i18n: generated ${LANGS.join(', ')} for ${PAGES.length} pages, ${serviceIds.length} service pages and ${conceptIds.length} concept sites`);
