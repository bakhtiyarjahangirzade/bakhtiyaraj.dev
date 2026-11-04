import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {projects,groupOf,serviceOf} from '../storefront/src/projects.js';
import {cases} from '../storefront/src/cases.js';
import {products,designs,readConfig,calculate,configParams,invalidParams} from '../storefront/src/product-data.js';
import {processSteps,processNote,serviceCases,EXTRA,serviceIds} from '../storefront/src/services-content.js';
import {conceptIds,concepts,conceptMeta} from '../storefront/src/concepts.js';
import {rows} from '../storefront/src/i18n/strings.js';

const pub=new URL('../storefront/public/',import.meta.url);
const home=readFileSync(new URL('../storefront/index.html',import.meta.url),'utf8');
const text=html=>html.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ');
const q=s=>new URLSearchParams(s);

test('real work and concepts are separated', () => {
  const real=projects.filter(p=>groupOf(p)==='real').map(p=>p.id);
  assert.deepEqual(real.sort(),['isoclub','promox','savor']);
  const velvet=projects.find(p=>p.id==='velvet');
  assert.equal(groupOf(velvet),'website','Velvet is a concept, not live client work');
  assert.ok(!velvet.url,'Velvet must not link to the placeholder domain');
  for(const id of conceptIds)assert.notEqual(groupOf(projects.find(p=>p.id===id)),'real',id);
});

test('every case study has local screenshots and translated copy', () => {
  const keys=new Set(rows.map(r=>r[0]));
  for(const [id,c] of Object.entries(cases)){
    const p=projects.find(x=>x.id===id);
    assert.ok(p?.real&&p.url.includes(c.domain),id);
    for(const s of c.shots){for(const w of s.widths)assert.ok(existsSync(new URL(`.${s.base}-${w}.jpg`,pub)),`${id}: ${s.base}-${w}.jpg`);assert.ok(keys.has(s.alt)&&keys.has(s.caption),id)}
    if(c.mobile)assert.ok(existsSync(new URL('.'+c.mobile,pub)),c.mobile);
    for(const s of [c.context,...c.scope,...c.decisions])assert.ok(keys.has(s),`missing translation: ${s}`);
  }
});

test('homepage copy quotes the canonical prices and rates', () => {
  const page=text(home);
  for(const id of ['website','system','integrated'])assert.match(page,new RegExp(`${products[id].price} AZN-dən`),id);
  assert.match(page,new RegExp(`səhifə \\+${EXTRA.page} AZN`));
  assert.match(page,new RegExp(`dil \\+${EXTRA.language} AZN`));
  assert.match(page,new RegExp(`modulu \\+${EXTRA.module} AZN`));
  assert.match(page,new RegExp(`fərdi dizayn \\+${products.website.options.find(o=>o.id==='custom').price} AZN`));
});

test('homepage process matches the shared process used by service pages', () => {
  const page=text(home);
  for(const [title,what,give,get] of processSteps){
    assert.ok(page.includes(` ${title} `),title);
    for(const s of [what,give,get])assert.ok(page.includes(s),s);
  }
  assert.ok(page.includes(processNote));
  for(const id of serviceIds)for(const ref of serviceCases[id])assert.ok(cases[ref],`${id}: ${ref}`);
});

test('configurator offers every website concept as a design and keeps concept links valid', () => {
  for(const id of conceptIds){
    const meta=conceptMeta(id,s=>s);
    if(concepts[id].kind==='site'){assert.ok(designs.some(d=>d.id===id),`${id} missing as design`);assert.equal(meta.design,id)}
    else assert.equal(meta.design,'');
  }
  for(const d of designs)assert.ok(existsSync(new URL('.'+d.image,pub)),d.image);
});

test('a reference preselects its own design or workflow unless the link says otherwise', () => {
  assert.equal(readConfig(q('service=website&reference=gym')).design,'gym');
  assert.equal(readConfig(q('service=website&reference=gym&design=olio')).design,'olio');
  assert.equal(readConfig(q('service=website&reference=savor')).design,'casa');
  assert.equal(readConfig(q('service=system&reference=reserve')).workflow,'booking');
  assert.equal(readConfig(q('service=system&reference=stock')).workflow,'orders');
  assert.equal(readConfig(q('service=system&reference=reserve&workflow=crm')).workflow,'crm');
  for(const p of projects)assert.ok(Object.hasOwn(products,serviceOf(p)),p.id);
});

test('invalid link parameters are reported, valid ones are not', () => {
  const ok='service=integrated&design=estate&pages=5&workflow=orders&modules=2&languages=az,en,ru&options=cms,roles&reference=isoclub';
  assert.deepEqual(invalidParams(q(ok)),[]);
  assert.deepEqual(invalidParams(configParams(readConfig(q(ok)))),[]);
  assert.deepEqual(invalidParams(q('service=website&pages=99&options=cms,nope&reference=unknown')).sort(),['options','pages','reference']);
  assert.deepEqual(invalidParams(q('service=print&workflow=crm')),['workflow']);
  assert.deepEqual(invalidParams(q('service=shop')),['service']);
});

test('the homepage example estimate is the canonical sum', () => {
  const c=readConfig(q('service=website&design=olio&pages=3&languages=az,en&options=form'));
  assert.equal(calculate(c).total,products.website.price+2*EXTRA.page+EXTRA.language+products.website.options.find(o=>o.id==='form').price);
});
