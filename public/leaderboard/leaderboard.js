import { getClient } from '/games/shared/net.js';
import * as acc from '/assets/account.js';
import { mountAccount } from '/assets/account-ui.js';

const $ = s => document.querySelector(s);
const el = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); } for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k)); return e; };
const fmt = n => Number(n).toLocaleString('en-US');
const TABS = [
  { id: 'chips', label: 'Richest', what: 'Play chips in the wallet right now.', unit: 'chips' },
  { id: 'serpent', label: 'Serpent Zone', what: 'Best verified solo run: peak length + 50 per kill + 500 for winning the round.', unit: 'pts' },
  { id: 'wins', label: 'Card tables', what: 'Games won at the server tables (vs bots and online).', unit: 'wins' }
];
const GAMES = [['', 'All games'], ['chess', 'Chess'], ['last-one', 'Last One'], ['durak', 'Durak (not the durak)'], ['domino', 'Domino'], ['poker', 'Poker']];
let tab = new URL(location.href).searchParams.get('tab') || 'chips';
if (!TABS.some(t => t.id === tab)) tab = 'chips';

mountAccount($('#acc'));
GAMES.forEach(([v, l]) => $('#game').append(el('option', { value: v }, l)));
$('#game').addEventListener('change', load);
function paintTabs() {
  $('#tabs').replaceChildren(...TABS.map(t => el('button', { class: 'key', role: 'tab', type: 'button', 'aria-selected': String(t.id === tab), 'aria-checked': String(t.id === tab), onclick: () => { tab = t.id; history.replaceState(null, '', '?tab=' + tab); paintTabs(); load(); } }, el('span', { class: 'led' }), t.label)));
  $('#filter').hidden = tab !== 'wins';
}
async function load() {
  const t = TABS.find(x => x.id === tab), list = $('#list');
  $('#what').textContent = t.what;
  list.replaceChildren(el('li', { class: 'lb-empty' }, 'Loading…'));
  try {
    await acc.init();
    const sb = await getClient();
    const kind = tab === 'wins' && $('#game').value ? 'wins:' + $('#game').value : tab;
    const { data, error } = await sb.rpc('leaderboard', { kind, lim: 50 });
    if (error) throw error;
    if (!data.length) { list.replaceChildren(el('li', { class: 'lb-empty' }, 'Nobody here yet. Play a game to claim the top spot.')); return; }
    let prev = 0;
    list.replaceChildren(...data.flatMap(r => {
      const gap = r.rank > prev + 1 && prev ? el('li', { class: 'lb-gap', 'aria-hidden': 'true' }, '⋯') : null; prev = r.rank;
      return [gap, el('li', { class: 'lb-row' + (r.is_me ? ' me' : '') + (r.rank <= 3 ? ' top' + r.rank : '') },
        el('span', { class: 'lb-rank' }, '#' + r.rank), el('span', { class: 'lb-name' }, r.username, r.is_me ? el('em', {}, ' you') : null),
        el('span', { class: 'lb-detail' }, r.detail || ''), el('b', { class: 'lb-score' }, fmt(r.score) + ' ' + t.unit))];
    }));
  } catch (e) { list.replaceChildren(el('li', { class: 'lb-empty' }, 'The leaderboard is offline right now.')); }
}
paintTabs(); load();
