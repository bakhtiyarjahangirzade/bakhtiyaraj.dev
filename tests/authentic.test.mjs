// Authentic detector: JS must match the Python training features (ml/authentic/feats.py).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { unzipSync } from 'fflate';
import { loadModel, prob, segments, features, analyze } from '../supabase/functions/authentic/detector.js';
import { extract, sniff } from '../supabase/functions/authentic/parse.js';
import { scanTraces } from '../supabase/functions/authentic/traces.js';

const read = (p) => fs.readFileSync(new URL(p, import.meta.url));
const model = loadModel(JSON.parse(read('../supabase/functions/authentic/model.json')));
const cases = JSON.parse(read('./fixtures/authentic-parity.json'));

test('features, segments and probabilities match Python', () => {
  for (const c of cases) {
    assert.equal(features(c.t).length, c.nf);
    assert.deepEqual(segments(c.t), c.segs);
    assert.ok(Math.abs(prob(model, c.t) - c.p) < 1e-4, `p ${prob(model, c.t)} vs ${c.p}`);
  }
});

test('analysis returns a calibrated range around the estimate', () => {
  const a = analyze(model, cases[0].t);
  assert.equal(a.status, 'ok');
  assert.ok(a.lo <= a.share && a.share <= a.hi);
  assert.equal(analyze(model, 'too short').status, 'too_short');
});

test('docx: hidden injection and ChatGPT link are reported as strong traces', async () => {
  const doc = await extract(new Uint8Array(read('./fixtures/ai_traces.docx')), 'x.docx', { unzip: unzipSync, pdf: null });
  assert.equal(doc.kind, 'docx');
  assert.equal(doc.hidden.length, 1);
  assert.ok(!doc.text.includes('AI grader'), 'hidden text stays out of the analysed text');
  const t = scanTraces(doc.text + '\n' + doc.hidden.map((h) => h.text).join('\n'), doc.hidden, doc.meta, 300);
  const labels = t.filter((x) => x.strength === 'strong').map((x) => x.label).join(' | ');
  assert.match(labels, /utm_source=chatgpt\.com/);
  assert.match(labels, /Hidden text that addresses AI/);
});

test('pptx: slide text is extracted in order', async () => {
  const doc = await extract(new Uint8Array(read('./fixtures/deck.pptx')), 'x.pptx', { unzip: unzipSync, pdf: null });
  assert.equal(doc.kind, 'pptx');
  assert.equal(doc.meta.slides, 3);
  assert.ok(doc.text.split(/\s+/).length > 200);
});

test('sniffing rejects legacy and unknown formats', () => {
  assert.equal(sniff(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0, 0, 0, 0])), 'legacy-office');
  assert.equal(sniff(new TextEncoder().encode('plain words here')), 'text');
  assert.equal(sniff(new Uint8Array([0, 1, 2, 0, 255]), 'a.bin'), 'unknown');
});

test('weak traces never escalate: invisible characters alone stay weak', () => {
  const t = scanTraces('word word and more text', [], {}, 10);
  assert.deepEqual(t.map((x) => x.strength), ['weak']);
});
