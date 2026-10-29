import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {rows} from '../storefront/src/i18n/strings.js';
import {projects} from '../storefront/src/projects.js';
import {products,designs,workflowNames,printTypes} from '../storefront/src/product-data.js';

const keys=new Set(rows.map(r=>r[0]));
const placeholders=s=>(s.match(/\{\w+\}/g)||[]).sort().join(',');

test('every row has Russian and English text with matching placeholders', () => {
  for(const [az,ru,en] of rows){
    assert.ok(ru&&en,`empty translation for: ${az}`);
    assert.equal(placeholders(ru),placeholders(az),`RU placeholders differ: ${az}`);
    assert.equal(placeholders(en),placeholders(az),`EN placeholders differ: ${az}`);
  }
});

test('duplicate source strings agree', () => {
  const seen=new Map();
  for(const r of rows){
    const prev=seen.get(r[0]);
    if(prev)assert.deepEqual(prev,r,`conflicting rows for: ${r[0]}`);
    seen.set(r[0],r);
  }
});

test('t() literals in the storefront sources are translated', () => {
  const dir=new URL('../storefront/src/',import.meta.url);
  for(const f of readdirSync(dir).filter(n=>n.endsWith('.js'))){
    const src=readFileSync(new URL(f,dir),'utf8');
    for(const m of src.matchAll(/\bt\('((?:[^'\\]|\\.)*)'/g))assert.ok(keys.has(m[1]),`${f}: missing translation for "${m[1]}"`);
  }
});

test('project, product and offer data strings are translated', () => {
  const need=s=>assert.ok(keys.has(s),`missing translation for "${s}"`);
  for(const p of projects){need(p.category);need(p.desc);p.tags.forEach(need)}
  for(const d of designs)need(d.category);
  for(const p of Object.values(products)){need(p.title);need(p.group);need(p.desc);p.included.forEach(need);for(const o of p.options){need(o.label);need(o.help)}}
  Object.values(workflowNames).forEach(need);
  Object.values(printTypes).forEach(v=>need(v.name));
  const offers=readFileSync(new URL('../storefront/src/offers.js',import.meta.url),'utf8');
  const block=/const descriptions=\{([^}]*)\}/.exec(offers)[1];
  for(const m of block.matchAll(/:'((?:[^'\\]|\\.)*)'/g))need(m[1]);
});

test('service page copy is translated and quoted extras match the calculator', async () => {
  const {serviceContent,serviceIds,EXTRA}=await import('../storefront/src/services-content.js');
  const {calculate,readConfig}=await import('../storefront/src/product-data.js');
  const need=s=>assert.ok(keys.has(s),`missing translation for "${s}"`);
  for(const id of serviceIds){
    const c=serviceContent[id];
    c.audience.forEach(need);c.extras.forEach(([k])=>need(k));
    for(const [q,a] of c.faq){need(q);need(a)}
  }
  const price=(query,label)=>calculate(readConfig(new URLSearchParams(query))).items.find(i=>i.label.startsWith(label))?.price;
  assert.equal(price('service=website&pages=2','Əlavə səhifələr'),EXTRA.page);
  assert.equal(price('service=website&languages=az,en','Əlavə dillər'),EXTRA.language);
  assert.equal(price('service=system&modules=1','Əlavə modullar'),EXTRA.module);
  assert.equal(price('service=print&sheets=2','Əlavə səhifələr'),EXTRA.sheet);
  assert.equal(price('service=video&raw=10','İlkin material'),EXTRA.raw);
});

test('concept mini-site copy is translated', async () => {
  const {concepts,conceptUi}=await import('../storefront/src/concepts.js');
  const need=s=>assert.ok(keys.has(s),`missing translation for "${s}"`);
  conceptUi.forEach(need);need('{name} — konsept nümunəsi | BAKHY');
  for(const c of Object.values(concepts)){
    need(c.headline);if(c.cta)need(c.cta);need(c.section);c.nav.forEach(need);
    for(const [h,d] of c.cards){need(h);need(d)}
    (c.items||[]).forEach(need);
    const board=c.board||{};
    if(board.columns)for(const [h,items] of board.columns){need(h);items.forEach(need)}
    if(board.days)board.days.forEach(need);
    if(board.head){board.head.forEach(need);for(const [n,,s] of board.rows){need(n);need(s)}}
  }
});
