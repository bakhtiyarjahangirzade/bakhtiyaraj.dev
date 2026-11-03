import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = vm.createContext({ URL, console });
for (const f of ['lib.js', 'presets.js']) {
  vm.runInContext(readFileSync(new URL(`../extensions/sitefilter/src/${f}`, import.meta.url), 'utf8'), ctx);
}
const SF = ctx.SiteFilter;
const { presetFor } = ctx.SiteFilterPresets;

test('norm folds case, Turkish/Azerbaijani letters and accents', () => {
  assert.equal(SF.norm('KIRIK  Ekran'), 'kirik ekran');
  assert.equal(SF.norm('İstanbul'), 'istanbul');
  assert.equal(SF.norm('Sınıq Ərazi Şüşə Çəkic Ğ'), 'siniq erazi suse cekic g');
});

test('keyword syntax: substring, whole word, AND, regex', () => {
  const m = (k, text) => SF.compileKeyword(k).test(SF.norm(text), text);
  assert.ok(m('kırık', 'Ekranı KIRIK telefon'));
  assert.ok(m('kirik', 'Ekranı kırık telefon'));
  assert.ok(!m('"kira"', 'Kiralık daire'));
  assert.ok(m('"kira"', 'Aylık kira 500 TL'));
  assert.ok(m('iphone & kırık', 'iPhone 13, arka cam kırık'));
  assert.ok(!m('iphone & kırık', 'iPhone 13 temiz'));
  assert.ok(m('/\\bv\\d{2}\\b/', 'Motor V12 orijinal'));
  assert.equal(SF.compileKeyword('/[unclosed/'), null);
  assert.equal(SF.compileKeyword('   '), null);
});

test('parsePrice reads common marketplace formats', () => {
  assert.equal(SF.parsePrice('BMW 320 · 18 500 AZN · Bakı'), 18500);
  assert.equal(SF.parsePrice('Fiyat: 1.250.000 TL'), 1250000);
  assert.equal(SF.parsePrice('₺1.250,50 peşin'), 1250.5);
  assert.equal(SF.parsePrice('$ 999 only'), 999);
  assert.equal(SF.parsePrice('450 ₼'), 450);
  assert.equal(SF.parsePrice('2019 model, 120000 km'), null);
  assert.equal(SF.parsePrice('2019 model', '12 300'), 12300);
});

test('normalizeLink drops tracking params and hashes', () => {
  assert.equal(SF.normalizeLink('https://www.tap.az/elanlar/1/2?utm_source=x#top'), 'tap.az/elanlar/1/2');
  assert.equal(SF.normalizeLink('/item?id=5&ref=home', 'https://shop.example.com/list'), 'shop.example.com/item?id=5');
  assert.equal(SF.normalizeLink('javascript:void(0)'), '');
});

test('site rules fall back to the parent domain', () => {
  const s = SF.normalizeSettings({ sites: { 'www.tap.az': { keywords: ['a'] } } });
  assert.deepEqual(Object.keys(s.sites), ['tap.az']);
  assert.equal(SF.findSiteKey(s, 'm.tap.az'), 'tap.az');
  assert.equal(SF.findSiteKey(s, 'turbo.az'), null);
});

test('matcher: keywords, only-mode, links, sponsored, price', () => {
  const settings = SF.normalizeSettings({
    globalKeywords: ['replika'],
    hideSponsored: true,
    sites: { 'tap.az': { keywords: ['kirayə'], priceMin: 100, priceMax: 1000, hiddenLinks: ['tap.az/elanlar/9'] } }
  });
  const { evaluate } = SF.buildMatcher(settings, 'tap.az');
  assert.equal(evaluate({ text: 'Rolex replika 200 AZN' }).reason, 'keyword');
  assert.equal(evaluate({ text: 'Mənzil KİRAYƏ 500 AZN' }).reason, 'keyword');
  assert.equal(evaluate({ text: 'Telefon 50 AZN' }).reason, 'price');
  assert.equal(evaluate({ text: 'Telefon 5000 AZN' }).reason, 'price');
  assert.equal(evaluate({ text: 'Telefon 500 AZN' }), null);
  assert.equal(evaluate({ text: 'Telefon razılaşma ilə' }), null, 'no price → keep');
  assert.equal(evaluate({ text: 'x 500 AZN', links: ['tap.az/elanlar/9'] }).reason, 'link');
  assert.equal(evaluate({ text: 'x 500 AZN', badges: ['VIP'] }).reason, 'sponsored');

  const only = SF.buildMatcher(SF.normalizeSettings({ sites: { 'tap.az': { mode: 'only', allow: ['iphone'] } } }), 'tap.az');
  assert.equal(only.evaluate({ text: 'Samsung S23' }).reason, 'only');
  assert.equal(only.evaluate({ text: 'iPhone 15' }), null);

  const off = SF.buildMatcher(SF.normalizeSettings({ enabled: false, globalKeywords: ['x'] }), 'a.com');
  assert.equal(off.evaluate({ text: 'x' }), null);
});

test('presets recognise marketplaces', () => {
  assert.equal(presetFor('tap.az').name, 'Tap.az');
  assert.equal(presetFor('m.sahibinden.com').name, 'Sahibinden');
  assert.equal(presetFor('www.olx.pl').name, 'OLX');
  assert.equal(presetFor('example.com'), null);
});

test('locales define every message the extension uses', () => {
  const root = new URL('../extensions/sitefilter/', import.meta.url);
  const en = JSON.parse(readFileSync(new URL('_locales/en/messages.json', root), 'utf8'));
  for (const loc of ['tr', 'az']) {
    const m = JSON.parse(readFileSync(new URL(`_locales/${loc}/messages.json`, root), 'utf8'));
    assert.deepEqual(Object.keys(m).sort(), Object.keys(en).sort(), loc);
    assert.ok(m.extDesc.message.length <= 132, `${loc} description too long`);
  }
  const files = ['src/content.js', 'src/popup.js', 'src/options.js', 'src/background.js', 'src/popup.html', 'src/options.html', 'manifest.json'];
  const used = new Set();
  for (const f of files) {
    const src = readFileSync(new URL(f, root), 'utf8');
    for (const re of [/SF\.t\('([A-Za-z_]+)'(?!\s*\+)/g, /data-i18n(?:-placeholder|-title)?="([A-Za-z_]+)"/g, /__MSG_([A-Za-z]+)__/g]) {
      for (const m of src.matchAll(re)) used.add(m[1]);
    }
  }
  const missing = [...used].filter((k) => !en[k]);
  assert.deepEqual(missing, []);
});
