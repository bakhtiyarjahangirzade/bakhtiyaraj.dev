// Shared game shell: header, lobby (bots / same screen / online room), match controller, bots and online sync.
import { myId, cleanCode, api, watchTable } from './net.js';
import { pressFeedback, soundOn, setSound } from '/assets/sound.js';
import * as acc from '/assets/account.js';
import { mountAccount } from '/assets/account-ui.js';

const $ = (s, r = document) => r.querySelector(s);
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) el.append(k.nodeType ? k : document.createTextNode(k));
  return el;
};
export { h };
export const fill = (el, ...kids) => el.replaceChildren(...kids.flat().filter(k => k != null && k !== false));

const store = {
  get(k, d) { try { const v = localStorage.getItem('bakhy.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('bakhy.' + k, JSON.stringify(v)); } catch {} }
};
const BOT_NAMES = ['Relay', 'Diode', 'Valve', 'Fuse', 'Coil', 'Quartz'];

/* ---------------- Match controller ---------------- */
class Match {
  constructor(engine, seats, opts, onChange) {
    this.engine = engine; this.seats = seats; this.opts = opts; this.onChange = onChange;
    this.v = 0; this.timers = [];
    this.state = engine.setup(seats.length, { ...opts, stack: seats.map(s => s.bot ? undefined : s.chips) });
    this.changed();
  }
  dispatch(seat, action) {
    const next = this.engine.act(this.state, seat, action); // throws on illegal
    this.state = next; this.v++; this.changed();
  }
  changed() { this.onChange(this.state, this.v); this.scheduleBots(); }
  scheduleBots() {
    this.timers.forEach(clearTimeout); this.timers = [];
    if (this.engine.over(this.state)) return;
    const v = this.v;
    for (const seat of this.engine.toAct(this.state)) {
      if (!this.seats[seat]?.bot) continue;
      const delay = (this.engine.botDelay?.(this.state, seat) ?? 750) + Math.random() * 450;
      this.timers.push(setTimeout(async () => {
        if (this.v !== v) return;
        const a = await (this.engine.botAsync ? this.engine.botAsync(this.state, seat, this.opts) : this.engine.bot(this.state, seat, this.opts));
        if (this.v !== v || this.stopped) return;
        if (a == null) return;
        try { this.dispatch(seat, a); } catch (e) { console.warn('bot move rejected', e); if (this.v === v) this.timers.push(setTimeout(() => this.v === v && this.scheduleBots(), 1200)); }
      }, delay));
    }
  }
  stop() { this.stopped = true; this.timers.forEach(clearTimeout); }
}

/* ---------------- Shell ---------------- */
// Modes: 'bot' and 'online' run on the game server (cfg.serverModes); 'local' (same screen) and,
// for chess, 'bot' run in this browser because nothing is hidden and no chips are at stake.
export function mountGame(cfg) {
  const app = $('#app');
  const serverModes = cfg.serverModes || ['bot', 'online'];
  const me = { id: myId(), name: store.get('name', 'Player') };

  // Header unit
  const led = h('span', { class: 'led green', 'aria-hidden': 'true' });
  const roomPlate = h('span', { class: 'plate', hidden: true });
  const fairKey = h('button', { class: 'key key--sm', type: 'button', hidden: true, onclick: () => showFair() }, h('span', { class: 'led green' }), 'Fair play');
  const soundKey = h('button', { class: 'key key--sm snd', type: 'button', 'aria-label': 'Sound', 'aria-pressed': String(soundOn()), onclick: () => { setSound(!soundOn()); soundKey.setAttribute('aria-pressed', String(soundOn())); soundKey.lastChild.textContent = soundOn() ? 'Sound on' : 'Sound off'; } }, h('span', { class: 'led' }), soundOn() ? 'Sound on' : 'Sound off');
  const header = h('header', { class: 'g-head chassis' },
    window.BAKHY_DESKTOP ? h('span', { class: 'mark-mini' }, 'BAKHY') : h('a', { class: 'key key--sm', href: '/?category=games' }, '← Rack'),
    h('div', { class: 'g-title' }, led, h('h1', { class: 'engraved' }, cfg.title), h('span', { class: 'g-serial' }, cfg.serial)),
    h('div', { class: 'g-tools' }, roomPlate, fairKey, soundKey));
  app.before(header);
  mountAccount(header.querySelector('.g-tools'));
  acc.onChange(() => { const n = acc.displayName(); if (n) { me.name = n; const i = document.getElementById('pname'); if (i) i.value = n; } });

  const toast = h('p', { class: 'g-toast', role: 'status', 'aria-live': 'polite' });
  document.body.append(toast);
  let toastT;
  const say = (msg, ms = 2600) => { toast.textContent = msg; toast.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), ms); };

  let match = null, ui = null, session = null, tableEl = null, overShown = null;

  /* ---------- Lobby ---------- */
  function lobby(prefill) {
    teardown();
    app.replaceChildren();
    led.className = 'led green';
    roomPlate.hidden = true; fairKey.hidden = true;
    const modes = cfg.modes;
    let mode = prefill?.room ? 'online' : store.get(cfg.id + '.mode', modes[0]);
    if (!modes.includes(mode)) mode = modes[0];
    const opts = Object.assign({}, cfg.defaults, store.get(cfg.id + '.opts', {}));

    const nameIn = h('input', { id: 'pname', class: 'g-input', maxlength: '16', value: me.name, autocomplete: 'nickname', oninput: e => { me.name = e.target.value.trim() || 'Player'; store.set('name', me.name); } });
    const modeKeys = modes.map(m => h('button', { class: 'key', role: 'radio', type: 'button', 'data-mode': m, 'aria-checked': String(m === mode), onclick: () => { mode = m; store.set(cfg.id + '.mode', m); pressFeedback(); paint(); } }, h('span', { class: 'led' }), MODE_LABEL[m]));
    const optBox = h('div', { class: 'g-opts' });
    const body = h('div', { class: 'g-lobby-body' });
    const nameRow = h('div', { class: 'g-row' }, h('label', { class: 'label', for: 'pname' }, 'Your name'), nameIn);

    const screen = h('div', { class: 'bezel' }, h('div', { class: 'vfd g-marquee' },
      h('p', { class: 'g-big' }, cfg.title.toUpperCase()), h('p', { class: 'g-sub' }, cfg.tagline)));
    const panel = h('section', { class: 'g-lobby chassis' + (cfg.felt === 'red' ? ' red' : ''), 'aria-label': 'Game setup' },
      h('span', { class: 'screw tl' }), h('span', { class: 'screw tr' }), h('span', { class: 'screw bl' }), h('span', { class: 'screw br' }),
      screen, nameRow,
      h('div', { class: 'g-row' }, h('span', { class: 'label' }, 'Mode'), h('div', { class: 'bank', role: 'radiogroup', 'aria-label': 'Game mode' }, modeKeys)),
      optBox, body,
      h('details', { class: 'g-rules' }, h('summary', {}, 'How to play'), h('div', {}, ...cfg.rules.map(r => h('p', {}, r)), serverModes.length ? h('p', { class: 'g-fair-note' }, 'Cards are shuffled on the server from a sealed seed. Each player only ever receives their own cards, and after every hand the seed is revealed so you can re-check the deal under Fair play.') : null)));
    app.append(panel);

    function paint() {
      modeKeys.forEach(k => k.setAttribute('aria-checked', String(k.dataset.mode === mode)));
      nameRow.hidden = serverModes.includes(mode); // server tables use your account name
      optBox.replaceChildren(...optionControls(cfg, opts, mode));
      body.replaceChildren();
      if (mode === 'online') {
        const codeIn = h('input', { id: 'pcode', class: 'g-input g-code', maxlength: '4', placeholder: 'CODE', autocomplete: 'off', value: prefill?.room || '', 'aria-label': 'Room code', oninput: e => { e.target.value = cleanCode(e.target.value); } });
        body.append(
          h('div', { class: 'g-actions' },
            h('button', { class: 'key key--amber', type: 'button', onclick: e => { save(); guard(e.currentTarget, () => serverCreate('online', opts)); } }, 'Create room'),
            h('span', { class: 'g-or' }, 'or'),
            codeIn,
            h('button', { class: 'key', type: 'button', onclick: e => { const c = cleanCode(codeIn.value); if (c.length !== 4) { say('Room codes have 4 characters.'); codeIn.focus(); return; } save(); guard(e.currentTarget, () => serverJoin(c)); } }, 'Join')),
          h('p', { class: 'g-hint' }, 'Create a room and send the code or link to your friends. Empty seats can be filled with bots.'));
        if (prefill?.room) setTimeout(() => body.querySelector('.g-actions .key:not(.key--amber)')?.focus(), 50);
      } else {
        body.append(h('div', { class: 'g-actions' }, h('button', { class: 'key key--amber', type: 'button', onclick: e => { save(); if (serverModes.includes(mode)) guard(e.currentTarget, () => serverCreate(mode, opts)); else startLocal(mode, opts); } }, mode === 'local' ? 'Start on this screen' : 'Start game')));
      }
      if (serverModes.includes(mode)) body.append(h('p', { class: 'g-hint' }, cfg.casino ? 'You play with the chips in your wallet (top right). New visitors get 5,000 play chips.' : 'Plays on the BAKHY game server, so your hand stays private.'));
    }
    const save = () => store.set(cfg.id + '.opts', opts);
    paint();
    const saved = store.get(LOCAL_KEY, null);
    if (saved?.state && !prefill) {
      body.prepend(h('div', { class: 'g-actions g-resume' }, h('button', { class: 'key key--amber', type: 'button', onclick: () => resumeLocal(saved) }, 'Resume your game'), h('button', { class: 'key key--sm', type: 'button', onclick: e => { store.set(LOCAL_KEY, null); e.currentTarget.parentElement.remove(); } }, 'Discard')));
    }
  }
  // Disable a button while a server call runs; show errors as a toast.
  async function guard(btn, fn) {
    if (btn.disabled) return; btn.disabled = true; led.className = 'led amber blink';
    try { await fn(); } catch (e) { say(e.message || 'Something went wrong.', 5000); led.className = 'led red'; if (e.needLogin) document.querySelector('.acc-plate')?.click(); }
    finally { btn.disabled = false; if (led.className.includes('blink')) led.className = 'led green'; }
  }

  /* ---------- Local play (same screen, chess vs bot) ---------- */
  function startLocal(mode, opts) {
    const n = opts.players || cfg.minPlayers;
    const seats = [];
    for (let i = 0; i < n; i++) {
      if (i === 0) seats.push({ id: me.id, name: me.name, bot: false });
      else if (mode === 'local') seats.push({ id: 'local' + i, name: 'Player ' + (i + 1), bot: false });
      else seats.push({ id: 'bot' + i, name: BOT_NAMES[(i - 1) % BOT_NAMES.length], bot: true });
    }
    session = { kind: mode, seats, opts, local: true };
    begin();
    match = new Match(cfg.engine, seats, opts, st => { drawLocal(st); saveLocal(st); });
  }
  // Games played only in this browser are saved so a reload does not throw them away.
  const LOCAL_KEY = cfg.id + '.saved';
  function saveLocal(st) { if (cfg.engine.over(st)) store.set(LOCAL_KEY, null); else store.set(LOCAL_KEY, { kind: session.kind, seats: session.seats, opts: session.opts, state: st }); }
  function resumeLocal(saved) {
    session = { kind: saved.kind, seats: saved.seats, opts: saved.opts, local: true };
    begin();
    match = Object.create(Match.prototype);
    Object.assign(match, { engine: cfg.engine, seats: saved.seats, opts: saved.opts, v: 0, timers: [], state: saved.state, onChange: st => { drawLocal(st); saveLocal(st); } });
    match.changed();
  }
  function begin() {
    app.replaceChildren();
    tableEl = h('section', { class: 'g-table', 'aria-label': cfg.title + ' table' });
    app.append(tableEl);
    ui = cfg.ui(tableEl, { say, sound: pressFeedback });
  }
  function localSeat(st) {
    if (session.kind !== 'local') return 0;
    const acting = cfg.engine.toAct(st).filter(s => !session.seats[s].bot);
    return acting.length ? acting[0] : (session.lastSeat ?? 0);
  }
  function drawLocal(st) {
    const seat = localSeat(st); session.lastSeat = seat;
    ui.render(st, { mySeat: seat, seats: session.seats, local: session.kind === 'local', opts: session.opts, send: a => { try { match.dispatch(seat, a); } catch (e) { say(e.message || 'That move is not allowed.'); } } });
    const res = cfg.engine.over(st);
    if (res) showOver(res, seat); else hideOver();
  }

  /* ---------- Server tables ---------- */
  const seed = () => { const a = new Uint8Array(12); crypto.getRandomValues(a); return Array.from(a, b => b.toString(16).padStart(2, '0')).join(''); };
  async function serverCreate(mode, opts) {
    await acc.ensurePlayer();
    const r = await api('create', { game: cfg.id, mode, opts: { ...opts } });
    let view = r.view;
    if (mode !== 'online') view = (await api('start', { table: view.id, clientSeed: seed() })).view; // seed chosen after seeing the commitment
    if (r.balance != null) acc.setKnownBalance(r.balance);
    await attach(view);
    if (mode === 'online') history.replaceState(null, '', '?room=' + view.code);
    if (cfg.casino) acc.refresh();
  }
  async function serverJoin(code) {
    await acc.ensurePlayer();
    const r = await api('join', { code, game: cfg.id, clientSeed: seed() });
    history.replaceState(null, '', '?room=' + code);
    await attach(r.view);
  }
  async function attach(view) {
    teardown(true);
    session = { server: true, kind: view.mode, tableId: view.id, lastSeq: -1, queue: [], playing: false, view: null };
    roomPlate.hidden = view.mode !== 'online'; roomPlate.textContent = 'Room ' + view.code;
    fairKey.hidden = false;
    const s = session;
    s.unwatch = await watchTable(view.id, v => s === session && onView(v), st => { if (s !== session) return; if (st === 'SUBSCRIBED') { led.className = 'led green'; resync(); } if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') led.className = 'led red'; });
    onView(view);
  }
  function resync() { if (session?.server) api('sync', { table: session.tableId }).then(r => r.view && onView(r.view)).catch(() => {}); }
  function onView(view) {
    const s = session;
    if (!s?.server || view.id !== s.tableId) return;
    if (view.seq < s.lastSeq || (view.seq === s.lastSeq && view.status === s.view?.status && !view.left)) return;
    const first = s.lastSeq < 0;
    s.lastSeq = view.seq; s.view = view;
    if (view.left || view.status === 'closed') { if (!s.leaving) say('The table was closed.', 4000); if (cfg.casino) acc.refresh(); lobby(); return; }
    if (view.status === 'lobby') { hideOver(); waitingRoom(view); return; }
    if (!tableEl || s.inLobby) { s.inLobby = false; begin(); }
    const steps = view.steps || [];
    if (steps.some(st => st.label === 'buy-in' || st.label === 'cash-out' || st.label === 'deal') || view.status === 'done') acc.refresh();
    s.queue.push(...steps.map((st, i) => ({ ...st, view, instant: first || st.label === 'sync' || st.actor === view.you || i === 0 })));
    pump();
    armDeadline(view);
  }
  async function pump() {
    const s = session; if (s.playing) return; s.playing = true;
    while (s === session && s.queue.length) {
      const st = s.queue.shift();
      if (!st.instant && !matchMedia('(prefers-reduced-motion: reduce)').matches) await new Promise(r => setTimeout(r, Math.min(1100, cfg.engine.botDelay?.(st.state, st.actor) ?? 700) * (s.queue.length > 12 ? .35 : 1)));
      if (s !== session) return;
      drawServer(st.state, st.view);
    }
    s.playing = false;
  }
  function drawServer(st, view) {
    session.state = st;
    if (cfg.casino && st.chips) { const b = st.bets?.[view.you]; acc.setTableChips(view.left ? 0 : st.chips[view.you] + (st.phase === 'bet' ? (typeof b === 'number' ? b : Object.values(b || {}).reduce((x, y) => x + y, 0)) : 0)); }
    ui.render(st, { mySeat: view.you, seats: view.seats, local: false, opts: view.opts, send: a => act(a) });
    const res = cfg.engine.over(st);
    if (res) showOver(res, view.you, view); else hideOver();
  }
  async function act(action) {
    const s = session; if (!s?.server) return;
    if (s.busy) return; s.busy = true;
    try { const r = await api('act', { table: s.tableId, action, clientSeed: seed() }); if (r.balance != null) acc.setKnownBalance(r.balance); onView(r.view); }
    catch (e) { say(e.message || 'That move is not allowed.'); if (/not running|does not exist/.test(e.message)) resync(); }
    finally { s.busy = false; }
  }
  function armDeadline(view) {
    const s = session; clearTimeout(s.deadlineT);
    if (!view.deadline) return;
    const wait = Math.max(1500, view.deadline - Date.now() + 700 + Math.random() * 1200);
    s.deadlineT = setTimeout(async () => { if (s !== session) return; try { const r = await api('tick', { table: s.tableId }); onView(r.view); } catch {} if (s === session && s.view?.deadline) armDeadline({ deadline: Date.now() + 4000 }); }, wait);
  }
  async function leaveServer() {
    const s = session; if (!s?.server) return;
    s.leaving = true;
    try { const r = await api('leave', { table: s.tableId }); if (cfg.casino) { if (r.balance != null) acc.setKnownBalance(r.balance); acc.refresh(); } } catch (e) { say(e.message); }
  }
  // Pick up a table you were sitting at before a reload.
  async function resume() {
    await acc.init();
    if (!acc.current().user) return false;
    try {
      const { tables } = await api('mine');
      for (const id of tables || []) {
        const r = await api('sync', { table: id });
        if (r.view?.game === cfg.id && r.view.status !== 'closed' && !r.view.left) { await attach(r.view); say('Welcome back to your table.'); return true; }
      }
    } catch {}
    return false;
  }

  /* ---------- Game over ---------- */
  function hideOver() { if (overShown) { overShown.remove(); overShown = null; } }
  function showOver(res, mySeat, view) {
    if (overShown) return;
    const seats = view ? view.seats : session.seats;
    const nm = t => (t || '').replace(/Seat (\d)/g, (m, d) => seats[d - 1]?.name || m);
    const isLocal = !view && session.kind === 'local';
    res = { ...res, title: res.winner != null && !res.keepTitle && res.winner === mySeat && !isLocal ? 'You win!' : nm(res.title), detail: nm(res.detail) };
    const canAgain = !view || view.mode !== 'online' || view.host === view.you;
    const box = h('div', { class: 'g-over', role: 'dialog', 'aria-modal': 'false', 'aria-label': 'Game over' },
      h('div', { class: 'bezel' }, h('div', { class: 'vfd g-over-screen' },
        h('p', { class: 'g-big' }, res.title), h('p', { class: 'g-sub' }, res.detail || ''))),
      h('div', { class: 'g-actions' },
        canAgain ? h('button', { class: 'key key--amber', type: 'button', onclick: e => {
          if (view) guard(e.currentTarget, async () => { const r = await api('again', { table: session.tableId, clientSeed: seed() }); hideOver(); onView(r.view); });
          else { hideOver(); match.stop(); match = new Match(cfg.engine, session.seats, session.opts, match.onChange); }
        } }, 'Play again') : h('p', { class: 'g-hint' }, 'Waiting for the host to start a new game.'),
        h('button', { class: 'key', type: 'button', onclick: () => box.classList.toggle('peek') }, 'View table'),
        h('button', { class: 'key', type: 'button', onclick: async () => { await leaveServer(); lobby(); } }, 'Leave table')));
    overShown = box; app.append(box);
    sfxWin();
  }

  /* ---------- Waiting room (online lobby) ---------- */
  function waitingRoom(view) {
    session.inLobby = true; tableEl = null;
    const isHost = view.host === view.you;
    const link = location.origin + location.pathname + '?room=' + view.code;
    const g = { min: cfg.minPlayers, max: cfg.maxPlayers };
    const call = (op, body = {}) => e => guard(e.currentTarget, async () => { const r = await api(op, { table: view.id, ...body, clientSeed: seed() }); onView(r.view); });
    const seats = [];
    for (let i = 0; i < g.max; i++) {
      const s = view.seats[i];
      seats.push(h('li', { class: 'g-seat' + (s ? '' : ' empty') },
        h('span', { class: s ? (s.bot ? 'led amber' : 'led green') : 'led' }),
        h('span', { class: 'g-seat-name' }, s ? s.name + (i === view.you ? ' (you)' : '') + (i === view.host ? ' · host' : '') : 'Empty seat'),
        isHost && s?.bot ? h('button', { class: 'key key--sm', type: 'button', onclick: call('unbot', { seat: i }) }, 'Remove') : null,
        isHost && !s && i === view.seats.length ? h('button', { class: 'key key--sm', type: 'button', onclick: call('bot') }, '+ Bot') : null));
    }
    const enough = view.seats.length >= g.min;
    const opts = { ...view.opts };
    app.replaceChildren(h('section', { class: 'g-lobby chassis', 'aria-label': 'Room' },
      h('span', { class: 'screw tl' }), h('span', { class: 'screw tr' }), h('span', { class: 'screw bl' }), h('span', { class: 'screw br' }),
      h('div', { class: 'bezel' }, h('div', { class: 'vfd g-marquee' }, h('p', { class: 'label g-room-l' }, 'Room code'), h('p', { class: 'g-code-big' }, view.code))),
      h('div', { class: 'g-actions' },
        h('button', { class: 'key', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(link); say('Invite link copied.'); } catch { say(link, 6000); } } }, 'Copy invite link'),
        h('span', { class: 'g-hint g-link' }, link)),
      h('ol', { class: 'g-seats' }, seats),
      isHost ? h('div', { class: 'g-opts' }, ...optionControls(cfg, opts, 'online', () => api('opts', { table: view.id, opts }).then(r => onView(r.view)).catch(e => say(e.message)))) : null,
      h('div', { class: 'g-actions' },
        isHost ? h('button', { class: 'key key--amber', type: 'button', disabled: !enough, onclick: call('start') }, enough ? 'Start game' : `Need ${g.min - view.seats.length} more`) : h('p', { class: 'g-hint' }, 'Waiting for the host to start…'),
        h('button', { class: 'key', type: 'button', onclick: async () => { await leaveServer(); lobby(); } }, 'Leave room'))));
  }

  /* ---------- Fair play panel ---------- */
  async function showFair() {
    const v = session?.view; if (!v?.fair) return;
    const f = v.fair;
    const dlg = h('dialog', { class: 'acc-dlg g-fair' },
      h('button', { class: 'acc-x', type: 'button', 'aria-label': 'Close', onclick: () => dlg.close() }, '×'),
      h('p', { class: 'acc-title' }, 'Fair play'),
      h('p', { class: 'acc-note' }, 'Before each hand the server commits to a secret seed by publishing its SHA-256 fingerprint. Your browser adds its own random seed with your moves. Every card comes from those two seeds, and when the hand ends the secret seed is revealed so anyone can re-deal it and compare.'),
      h('dl', { class: 'g-fair-dl' },
        h('dt', {}, 'This hand · fingerprint'), h('dd', {}, h('code', {}, f.commit || '—')),
        h('dt', {}, 'Player seeds in this hand'), h('dd', {}, h('code', {}, f.clientSeed || '—')),
        h('dt', {}, 'Next hand · fingerprint'), h('dd', {}, h('code', {}, f.next || '—')),
        h('dt', {}, 'Hands revealed'), h('dd', {}, String(f.lastReveal || 0))),
      h('div', { class: 'acc-actions' }, h('a', { class: 'key key--amber', href: '/fair/?table=' + v.id, target: '_blank', rel: 'noopener' }, 'Verify revealed hands')));
    document.body.append(dlg); dlg.addEventListener('close', () => dlg.remove()); dlg.showModal();
  }

  function teardown(keepServer) {
    match?.stop(); match = null; hideOver();
    if (session?.server) { clearTimeout(session.deadlineT); session.unwatch?.(); }
    if (!keepServer) session = null;
    tableEl = null; acc.setTableChips(0);
    if (!keepServer && location.search) history.replaceState(null, '', location.pathname);
  }

  addEventListener('pagehide', () => {});
  const r = cleanCode(new URL(location.href).searchParams.get('room'));
  lobby(r.length === 4 ? { room: r } : null);
  if (r.length === 4) { acc.init().then(() => { if (acc.current().user) serverJoin(r).catch(e => say(e.message, 5000)); }); }
  else resume();
}

const MODE_LABEL = { bot: 'Vs bots', local: 'Same screen', online: 'Online room' };

function optionControls(cfg, opts, mode, onChange) {
  return (cfg.options || []).filter(o => !o.modes || o.modes.includes(mode)).map(o => {
    const id = 'opt-' + o.key;
    const sel = h('select', { id, class: 'g-input', onchange: e => { opts[o.key] = isNaN(+e.target.value) ? e.target.value : +e.target.value; pressFeedback(); onChange?.(); } },
      o.values.map(([v, label]) => h('option', { value: String(v), selected: String(opts[o.key]) === String(v) }, label)));
    return h('div', { class: 'g-row' }, h('label', { class: 'label', for: id }, o.label), sel);
  });
}

/* ---------- Tiny synthesized sfx ---------- */
let ac;
function ctx() { if (!ac) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ac = new A(); } if (ac.state === 'suspended') ac.resume(); return ac; }
export function sfxCard() {
  if (!soundOn()) return; const c = ctx(); if (!c) return; const t = c.currentTime;
  const n = c.sampleRate * .05, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = b; f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = .8; g.gain.value = .35;
  s.connect(f).connect(g).connect(c.destination); s.start(t);
}
export function sfxWin() {
  if (!soundOn()) return; const c = ctx(); if (!c) return; const t = c.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((fr, i) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = fr; g.gain.setValueAtTime(0, t + i * .12); g.gain.linearRampToValueAtTime(.12, t + i * .12 + .01); g.gain.exponentialRampToValueAtTime(.001, t + i * .12 + .6); o.connect(g).connect(c.destination); o.start(t + i * .12); o.stop(t + i * .12 + .7); });
}

/* ---------- FLIP helper for smooth card movement ---------- */
export function flip(root, update) {
  const before = new Map();
  root.querySelectorAll('[data-k]').forEach(el => before.set(el.dataset.k, el.getBoundingClientRect()));
  update();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const src = root.querySelector('[data-deal-from]')?.getBoundingClientRect();
  let n = 0;
  root.querySelectorAll('[data-k]').forEach(el => {
    const a = before.get(el.dataset.k), b = el.getBoundingClientRect();
    if (!a) {
      if (src && before.size && (el.classList.contains('card') || el.classList.contains('tile'))) {
        const dx = src.left + src.width / 2 - (b.left + b.width / 2), dy = src.top + src.height / 2 - (b.top + b.height / 2);
        el.animate([{ transform: `translate(${dx}px,${dy}px) rotate(-25deg) scale(.7)`, opacity: .3 }, { transform: 'none', opacity: 1 }], { duration: 460, delay: Math.min(n++, 10) * 70, easing: 'cubic-bezier(.2,.8,.25,1)', fill: 'backwards' });
      } else el.animate([{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'ease-out' });
      return;
    }
    const dx = a.left - b.left, dy = a.top - b.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.2,.8,.3,1)' });
  });
}
