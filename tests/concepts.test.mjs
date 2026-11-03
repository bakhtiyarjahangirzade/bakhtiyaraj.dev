import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {conceptIds,kModules,renderConcept,conceptMeta} from '../storefront/src/concepts.js';
import {Tx,makeCtx} from '../storefront/src/k/kit.js';

const placeholders=s=>(s.match(/\{\w+\}/g)||[]).sort().join(',');
const pub=new URL('../storefront/public/',import.meta.url);

test('redesigned concept modules keep known ids and kinds', () => {
  for(const [id,m] of Object.entries(kModules)){
    assert.ok(conceptIds.includes(id),id);
    assert.equal(m.id,id);
    assert.ok(['site','app'].includes(m.kind),`${id}: kind`);
    assert.ok(m.brand,`${id}: brand`);
  }
});

test('every concept copy leaf has az, ru and en with matching placeholders', () => {
  for(const leaf of Tx.all){
    const [az,ru,en]=leaf.v;
    assert.ok(az&&ru&&en,`empty translation: ${JSON.stringify(leaf.v)}`);
    assert.equal(placeholders(ru),placeholders(az),`RU placeholders differ: ${az}`);
    assert.equal(placeholders(en),placeholders(az),`EN placeholders differ: ${az}`);
  }
});

test('concept pages render in all languages within the CSP and with local assets', () => {
  for(const id of Object.keys(kModules))for(const lang of ['az','ru','en']){
    const html=renderConcept(id,s=>s,lang);
    assert.ok(html.length>2000,`${id}/${lang}: page body looks empty`);
    assert.doesNotMatch(html,/\sstyle="/,`${id}/${lang}: inline style attribute (blocked by CSP)`);
    assert.doesNotMatch(html,/<script(?![^>]*type="application\/json")/,`${id}/${lang}: inline executable script`);
    assert.doesNotMatch(html,/\s(?:src|srcset)="https?:/,`${id}/${lang}: external media`);
    for(const m of html.matchAll(/\s(?:src|srcset)="([^"]+)"/g))for(const part of m[1].split(',')){
      const path=part.trim().split(/\s+/)[0];
      if(path.startsWith('/assets/'))assert.ok(existsSync(new URL('.'+path,pub)),`${id}: missing ${path}`);
    }
    for(const m of html.matchAll(/\shref="(\/[^"]*)"/g)){
      const h=m[1];
      if(h.startsWith('/assets/'))continue;
      assert.ok(h.startsWith(`/${lang}/`),`${id}/${lang}: in-site link without language prefix: ${h}`);
    }
    if(lang!=='az')assert.ok(!html.includes('lang="az"'),`${id}/${lang}`);
  }
});

test('concept configurator links stay canonical', () => {
  const T=s=>s;
  for(const id of conceptIds){
    const meta=conceptMeta(id,T);
    assert.ok(['website','system'].includes(meta.service),id);
  }
  assert.ok(makeCtx('ru').azn(1250).endsWith('AZN'));
});
