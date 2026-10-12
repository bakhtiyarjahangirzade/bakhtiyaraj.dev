// Account plate (chip balance + sign in/register dialog) used in the hub and every game header.
import * as acc from '/assets/account.js';

const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v); }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
};
const fmt = n => Math.floor(n).toLocaleString('en-US');

export function mountAccount(host) {
  const coin = el('span', { class: 'acc-coin', 'aria-hidden': 'true' }, 'B');
  const bal = el('b', { class: 'acc-bal' }, '…');
  const who = el('span', { class: 'acc-who' }, 'Guest');
  const btn = el('button', { class: 'acc-plate', type: 'button', 'aria-haspopup': 'dialog' }, coin, el('span', { class: 'acc-txt' }, bal, who));
  host.append(btn);
  const dlg = el('dialog', { class: 'acc-dlg', 'aria-label': 'Account' });
  document.body.append(dlg);
  let lastBal = null;
  acc.onChange(s => {
    const b = acc.balance();
    if (lastBal != null && b !== lastBal) { bal.classList.remove('up', 'down'); void bal.offsetWidth; bal.classList.add(b > lastBal ? 'up' : 'down'); countTo(bal, lastBal, b); } else bal.textContent = fmt(b);
    lastBal = b;
    who.textContent = s.profile ? s.profile.username + (s.profile.role === 'admin' ? ' · admin' : '') : 'Guest · sign in';
    if (dlg.open) render();
  });
  acc.init();
  btn.addEventListener('click', () => { render(); dlg.showModal(); });
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  let tab = 'in', msg = '';
  function render() {
    const s = acc.current();
    dlg.replaceChildren();
    const add = (...k) => dlg.append(...k.filter(x => x != null && x !== false));
    const close = el('button', { class: 'acc-x', type: 'button', 'aria-label': 'Close', onclick: () => dlg.close() }, '×');
    if (s.profile) {
      const today = new Date().toISOString().slice(0, 10);
      add(close, el('div', { class: 'acc-head' }, el('span', { class: 'acc-coin big' }, 'B'), el('div', {}, el('p', { class: 'acc-name' }, s.profile.username), el('p', { class: 'acc-chips' }, fmt(s.profile.chips) + ' chips'))),
        el('p', { class: 'acc-note' }, 'Play chips only — they have no money value and cannot be bought or cashed out.'),
        el('div', { class: 'acc-actions' },
          el('button', { class: 'key key--amber', type: 'button', disabled: s.profile.last_bonus === today, onclick: async () => { try { await acc.claimBonus(); msg = '+1,000 chips added.'; } catch (e) { msg = e.message; } render(); } }, s.profile.last_bonus === today ? 'Bonus claimed today' : 'Claim daily +1,000'),
          s.profile.role === 'admin' ? el('a', { class: 'key', href: '/admin/' }, 'Admin panel') : null,
          el('button', { class: 'key', type: 'button', onclick: async () => { await acc.signOut(); msg = ''; render(); } }, 'Sign out')),
        el('form', { class: 'acc-form row', onsubmit: async e => { e.preventDefault(); try { await acc.rename(e.target.uname.value.trim()); msg = 'Name updated.'; } catch (er) { msg = er.message; } render(); } },
          el('label', { for: 'acc-uname' }, 'Display name'), el('input', { id: 'acc-uname', name: 'uname', value: s.profile.username, minlength: '3', maxlength: '20', pattern: '[A-Za-z0-9_.\\-]{3,20}', required: true }), el('button', { class: 'key key--sm', type: 'submit' }, 'Save')),
        msg ? el('p', { class: 'acc-msg', role: 'status' }, msg) : null);
      return;
    }
    const tabs = el('div', { class: 'bank acc-tabs', role: 'tablist' },
      ...[['in', 'Sign in'], ['up', 'Register']].map(([k, l]) => el('button', { class: 'key', role: 'tab', type: 'button', 'aria-selected': String(tab === k), 'aria-checked': String(tab === k), onclick: () => { tab = k; msg = ''; render(); } }, l)));
    const form = el('form', { class: 'acc-form', onsubmit: async e => {
      e.preventDefault(); const f = e.target; const submit = f.querySelector('[type=submit]'); submit.disabled = true;
      try {
        if (tab === 'in') { await acc.signIn(f.email.value.trim(), f.pw.value); msg = ''; }
        else if (tab === 'up') { const r = await acc.signUp(f.email.value.trim(), f.pw.value, f.uname.value.trim()); msg = r.needsConfirm ? 'Check your email and open the confirmation link, then sign in.' : 'Welcome! 5,000 chips are on the house.'; if (r.needsConfirm) tab = 'in'; }
        else { await acc.resetPassword(f.email.value.trim()); msg = 'If that email has an account, a reset link is on its way.'; tab = 'in'; }
      } catch (er) { msg = er.message; }
      render();
    } },
      tab === 'up' ? [el('label', { for: 'acc-u' }, 'Display name'), el('input', { id: 'acc-u', name: 'uname', autocomplete: 'nickname', minlength: '3', maxlength: '20', pattern: '[A-Za-z0-9_.\\-]{3,20}', required: true, placeholder: 'e.g. bakhy' })] : null,
      el('label', { for: 'acc-e' }, 'Email'), el('input', { id: 'acc-e', name: 'email', type: 'email', autocomplete: 'email', required: true }),
      tab !== 'reset' ? [el('label', { for: 'acc-p' }, 'Password'), el('input', { id: 'acc-p', name: 'pw', type: 'password', autocomplete: tab === 'up' ? 'new-password' : 'current-password', minlength: '6', required: true })] : null,
      el('button', { class: 'key key--amber', type: 'submit' }, tab === 'in' ? 'Sign in' : tab === 'up' ? 'Create account' : 'Send reset link'),
      tab === 'in' ? el('button', { class: 'acc-link', type: 'button', onclick: () => { tab = 'reset'; msg = ''; render(); } }, 'Forgot password?') : null);
    add(close, el('p', { class: 'acc-title' }, 'Your BAKHY account'), el('p', { class: 'acc-note' }, `Keep your chips across games and devices. Guests play with ${fmt(acc.balance())} chips saved in this browser. Play chips only, no real money.`), tabs, form, msg ? el('p', { class: 'acc-msg', role: 'status' }, msg) : null);
    setTimeout(() => dlg.querySelector('input')?.focus(), 30);
  }
}
function countTo(node, a, b) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { node.textContent = fmt(b); return; }
  const t0 = performance.now(), T = 700;
  const step = t => { const k = Math.min(1, (t - t0) / T), e = 1 - Math.pow(1 - k, 3); node.textContent = fmt(a + (b - a) * e); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
