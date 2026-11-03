// Concept mini-sites (Node only, used by scripts/i18n-pages.mjs and tests).
// Every concept is an independent module in src/k/<id>/: index.js renders the page body per language,
// app.js (a Vite entry) brings its own CSS and prototype script. Names and data inside concepts are samples.
import {readdirSync,existsSync} from 'node:fs';
import {projects} from './projects.js';
import {showroomMeta} from './showroom-copy.js';
import {makeCtx} from './k/kit.js';

const original=['casa','olio','aurea','forma','atelier','flow','reserve','stock'];
export const conceptIds=[...original,...Object.keys(showroomMeta)];

const kdir=new URL('./k/',import.meta.url);
export const kModules={};
for(const id of readdirSync(kdir,{withFileTypes:true}).filter(d=>d.isDirectory()&&existsSync(new URL(`${d.name}/index.js`,kdir))).map(d=>d.name)){
 if(!conceptIds.includes(id))throw new Error(`k/${id}: not a known concept id`);
 kModules[id]=(await import(new URL(`${id}/index.js`,kdir).href)).default;
}
for(const id of conceptIds)if(!kModules[id])throw new Error(`concept ${id} has no module in src/k/${id}/`);

// custom: the ten later concepts (own showroom metadata). Since the business upgrade every site concept is also a configurator design.
export const concepts=Object.fromEntries(conceptIds.map(id=>[id,{kind:kModules[id].kind,brand:kModules[id].brand,custom:!original.includes(id),k:true}]));

// Shared strings used by the shell/ribbon and by service pages.
export const conceptUi=['Nümunə','Bu, BAKHY tərəfindən hazırlanmış konsept nümunəsidir. Real müştəri və ya xidməti təsvir etmir.','Bu konsepti fərdiləşdir','Bütün konseptlər','Konsept nümunələri','Konsept saytını aç'];

export function conceptMeta(id,T){
 const p=projects.find(x=>x.id===id),c=concepts[id];
 return {title:T('{name} — konsept nümunəsi | BAKHY',{name:c.brand}),desc:T(p.desc),service:c.kind==='app'?'system':'website',design:c.kind==='app'?'':id};
}
export function renderConcept(id,T,lang='az'){
 return kModules[id].render(makeCtx(lang));
}
