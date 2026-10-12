import { getClient } from '/games/shared/net.js';
import * as acc from '/assets/account.js';
import { mountAccount } from '/assets/account-ui.js';

const $ = s => document.querySelector(s);
const fmt = n => Number(n).toLocaleString('en-US');
const el = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v); } for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k)); return e; };
mountAccount($('#acc'));
let users = [];
acc.onChange(async s => {
  if (!s.ready) return;
  if (!s.profile) { $('#gate').textContent = 'Sign in with the admin account (top right) to open the control room.'; $('#panel').hidden = true; return; }
  if (s.profile.role !== 'admin') { $('#gate').textContent = 'This account is not an admin.'; $('#panel').hidden = true; return; }
  $('#gate').hidden = true; $('#panel').hidden = false;
  if (!users.length) load();
});
acc.init();
$('#reload').onclick = load;
$('#q').oninput = render;
async function load() {
  const sb = await getClient();
  const { data, error } = await sb.from('profiles').select('id,username,chips,role,banned,games_played,created_at').order('chips', { ascending: false }).limit(500);
  if (error) { $('#gate').hidden = false; $('#gate').textContent = error.message; return; }
  users = data;
  const total = users.reduce((a, u) => a + Number(u.chips), 0);
  $('#stats').replaceChildren(...[['Players', users.length], ['Chips in play', fmt(total)], ['Admins', users.filter(u => u.role === 'admin').length], ['Banned', users.filter(u => u.banned).length]].map(([k, v]) => el('div', { class: 'adm-stat' }, el('span', {}, k), el('b', {}, String(v)))));
  render();
  const { data: log } = await sb.from('chip_log').select('at,user_id,delta,balance,reason').order('at', { ascending: false }).limit(60);
  const name = id => users.find(u => u.id === id)?.username || id.slice(0, 8);
  $('#log').replaceChildren(...(log || []).map(r => el('tr', {}, el('td', {}, new Date(r.at).toLocaleString()), el('td', {}, name(r.user_id)), el('td', { class: r.delta > 0 ? 'up' : 'down' }, (r.delta > 0 ? '+' : '') + fmt(r.delta)), el('td', {}, fmt(r.balance)), el('td', {}, r.reason))));
}
function render() {
  const q = $('#q').value.trim().toLowerCase();
  $('#rows').replaceChildren(...users.filter(u => !q || u.username.toLowerCase().includes(q)).map(u => {
    const chips = el('input', { class: 'g-input', type: 'number', min: '0', step: '100', value: String(u.chips), 'aria-label': 'Chips for ' + u.username });
    const role = el('select', { class: 'g-input', 'aria-label': 'Role for ' + u.username }, ['user', 'admin'].map(r => el('option', { value: r, selected: u.role === r }, r)));
    const ban = el('input', { type: 'checkbox', checked: u.banned, 'aria-label': 'Ban ' + u.username });
    const save = el('button', { class: 'key key--sm key--amber', type: 'button', onclick: async () => {
      save.disabled = true; const sb = await getClient();
      const { data, error } = await sb.rpc('admin_update_user', { target: u.id, new_chips: Math.max(0, Math.floor(+chips.value)), new_role: role.value, new_banned: ban.checked });
      save.disabled = false; save.textContent = error ? 'Error' : 'Saved'; if (error) alert0(error.message); else Object.assign(u, data);
      setTimeout(() => save.textContent = 'Save', 1500);
    } }, 'Save');
    return el('tr', {}, el('td', {}, u.username), el('td', {}, chips), el('td', {}, role), el('td', {}, ban), el('td', {}, String(u.games_played)), el('td', {}, new Date(u.created_at).toLocaleDateString()), el('td', {}, save));
  }));
}
function alert0(m) { $('#gate').hidden = false; $('#gate').textContent = m; }
