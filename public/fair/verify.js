// Fair play verifier: re-deals revealed hands and recomputes slot spins in the browser.
import { getClient } from '/games/shared/net.js';
import { replay } from '/games/shared/fair.js';
import { seeded, withRng, commitOf } from '/games/shared/rng.js';
import { MACHINES, spin } from '/games/slots/machines.js';
import * as acc from '/assets/account.js';
import { mountAccount } from '/assets/account-ui.js';

const $ = s => document.querySelector(s);
const el = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); } for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k)); return e; };
const badge = ok => el('span', { class: 'fair-ok' + (ok ? '' : ' fair-bad') }, ok ? 'Verified' : 'Mismatch');
const NAMES = { chess: 'Chess', 'last-one': 'Last One', durak: 'Durak', domino: 'Domino', blackjack: 'Blackjack', roulette: 'Roulette', poker: 'Poker' };
export const recompute = (seed, cs, nonce, machine) => withRng(seeded(seed, cs + ':' + nonce, 0), () => spin(MACHINES.find(m => m.id === machine)));

mountAccount($('#acc'));
MACHINES.forEach(m => $('#m-m').append(el('option', { value: m.id }, m.name)));
$('#manual').addEventListener('submit', e => {
  e.preventDefault(); const f = e.target;
  const g = recompute(f.seed.value.trim(), f.cs.value.trim(), +f.n.value, f.m.value);
  $('#manual-out').textContent = 'Fingerprint of this seed: ' + commitOf(f.seed.value.trim()) + '\n\nReels (top to bottom):\n' + g.map((col, i) => `Reel ${i + 1}: ${col.join(' · ')}`).join('\n');
});

async function main() {
  const out = $('#out');
  await acc.init();
  const q = new URL(location.href).searchParams;
  if (!acc.current().user) { out.replaceChildren(el('p', { class: 'g-hint' }, 'Sign in (or play a game as a guest) to see the hands and spins you played.')); return; }
  const sb = await getClient();
  if (q.get('table')) {
    const { data, error } = await sb.from('fair_reveals').select('seg, game, data, created_at').eq('table_id', q.get('table')).order('seg');
    if (error) { out.replaceChildren(el('p', {}, error.message)); return; }
    if (!data.length) { out.replaceChildren(el('h2', {}, 'No hands revealed yet'), el('p', {}, 'A hand is revealed as soon as it ends. Finish a hand and reload this page.')); return; }
    out.replaceChildren(el('h2', {}, `${NAMES[data[0].game] || data[0].game} table · ${data.length} revealed ${data.length === 1 ? 'hand' : 'hands'}`));
    for (const r of data) {
      let ok = true, why = '';
      try { replay(r.data); } catch (e) { ok = false; why = e.message; }
      out.append(el('div', { class: 'fair-row' }, el('b', {}, 'Hand ' + r.seg),
        el('dl', {}, el('dt', {}, 'Fingerprint'), el('dd', {}, el('code', {}, r.data.commit)), el('dt', {}, 'Server seed'), el('dd', {}, el('code', {}, r.data.seed)),
          el('dt', {}, 'Client seeds'), el('dd', {}, el('code', {}, r.data.clientSeed)), el('dt', {}, 'Moves replayed'), el('dd', {}, String(r.data.actions.length)), why ? [el('dt', {}, 'Problem'), el('dd', {}, why)] : null),
        badge(ok)));
    }
    return;
  }
  // Slots: recompute every spin of every revealed seed.
  const [{ data: reveals }, { data: spins }] = await Promise.all([
    sb.from('seed_reveals').select('commit, seed, client_seed, spins, created_at').order('id', { ascending: false }).limit(20),
    sb.from('slot_spins').select('machine, grid, nonce, commit, client_seed, win, cost').order('id', { ascending: false }).limit(1000)]);
  out.replaceChildren(el('h2', {}, 'Your slot seeds'));
  if (!reveals?.length) { out.append(el('p', {}, 'No revealed seeds yet. On the slots page open "Fair play" and press "Reveal seed" to check your spins here.')); return; }
  for (const r of reveals) {
    const mine = (spins || []).filter(s => s.commit === r.commit);
    let good = commitOf(r.seed) === r.commit, bad = 0;
    for (const s of mine) if (JSON.stringify(recompute(r.seed, s.client_seed, s.nonce, s.machine)) !== JSON.stringify(s.grid)) bad++;
    good = good && !bad;
    out.append(el('div', { class: 'fair-row' }, el('b', {}, `${r.spins} spins`),
      el('dl', {}, el('dt', {}, 'Fingerprint'), el('dd', {}, el('code', {}, r.commit)), el('dt', {}, 'Server seed'), el('dd', {}, el('code', {}, r.seed)),
        el('dt', {}, 'Rechecked here'), el('dd', {}, `${mine.length - bad} of ${mine.length} spins match`)),
      badge(good)));
  }
}
main().catch(e => { $('#out').replaceChildren(el('p', {}, e.message)); });
