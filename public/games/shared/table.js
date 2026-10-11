// Shared game shell: header, lobby (bots / same screen / online room), match controller, bots and online sync.
import { Room, myId, newCode, cleanCode } from './net.js';
import { pressFeedback, soundOn, setSound } from '/assets/sound.js';

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
    this.state = engine.setup(seats.length, opts);
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
      this.timers.push(setTimeout(() => {
        if (this.v !== v) return;
        const a = this.engine.bot(this.state, seat, this.opts);
        if (a == null) return;
        try { this.dispatch(seat, a); } catch (e) { console.warn('bot move rejected', e); }
      }, delay));
    }
  }
  stop() { this.timers.forEach(clearTimeout); }
}

/* ---------------- Shell ---------------- */
export function mountGame(cfg) {
  const app = $('#app');
  const me = { id: myId(), name: store.get('name', 'Player ' + myId().slice(0, 3).toUpperCase()) };

  // Header unit
  const led = h('span', { class: 'led green', 'aria-hidden': 'true' });
  const roomPlate = h('span', { class: 'plate', hidden: true });
  const soundKey = h('button', { class: 'key key--sm', type: 'button', 'aria-pressed': String(soundOn()), onclick: () => { setSound(!soundOn()); soundKey.setAttribute('aria-pressed', String(soundOn())); soundKey.lastChild.textContent = soundOn() ? 'Sound on' : 'Sound off'; } }, h('span', { class: 'led' }), soundOn() ? 'Sound on' : 'Sound off');
  const header = h('header', { class: 'g-head chassis' },
    window.BAKHY_DESKTOP ? h('span', { class: 'mark-mini' }, 'BAKHY') : h('a', { class: 'key key--sm', href: '/?category=games' }, '← Rack'),
    h('div', { class: 'g-title' }, led, h('h1', { class: 'engraved' }, cfg.title), h('span', { class: 'g-serial' }, cfg.serial)),
    h('div', { class: 'g-tools' }, roomPlate, soundKey));
  app.before(header);

  const toast = h('p', { class: 'g-toast', role: 'status', 'aria-live': 'polite' });
  document.body.append(toast);
  let toastT;
  const say = (msg, ms = 2600) => { toast.textContent = msg; toast.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), ms); };

  let match = null, room = null, ui = null, session = null;

  /* ---------- Lobby ---------- */
  function lobby(prefill) {
    teardown();
    app.replaceChildren();
    led.className = 'led green';
    roomPlate.hidden = true;
    const modes = cfg.modes;
    let mode = prefill?.room ? 'online' : store.get(cfg.id + '.mode', modes[0]);
    if (!modes.includes(mode)) mode = modes[0];
    const opts = Object.assign({}, cfg.defaults, store.get(cfg.id + '.opts', {}));

    const nameIn = h('input', { id: 'pname', class: 'g-input', maxlength: '16', value: me.name, autocomplete: 'nickname', oninput: e => { me.name = e.target.value.trim() || 'Player'; store.set('name', me.name); } });
    const modeKeys = modes.map(m => h('button', { class: 'key', role: 'radio', type: 'button', 'data-mode': m, 'aria-checked': String(m === mode), onclick: () => { mode = m; store.set(cfg.id + '.mode', m); pressFeedback(); paint(); } }, h('span', { class: 'led' }), MODE_LABEL[m]));
    const optBox = h('div', { class: 'g-opts' });
    const body = h('div', { class: 'g-lobby-body' });

    const screen = h('div', { class: 'bezel' }, h('div', { class: 'vfd g-marquee' },
      h('p', { class: 'g-big' }, cfg.title.toUpperCase()), h('p', { class: 'g-sub' }, cfg.tagline)));
    const panel = h('section', { class: 'g-lobby chassis', 'aria-label': 'Game setup' },
      h('span', { class: 'screw tl' }), h('span', { class: 'screw tr' }), h('span', { class: 'screw bl' }), h('span', { class: 'screw br' }),
      screen,
      h('div', { class: 'g-row' }, h('label', { class: 'label', for: 'pname' }, 'Your name'), nameIn),
      h('div', { class: 'g-row' }, h('span', { class: 'label' }, 'Mode'), h('div', { class: 'bank', role: 'radiogroup', 'aria-label': 'Game mode' }, modeKeys)),
      optBox, body,
      h('details', { class: 'g-rules' }, h('summary', {}, 'How to play'), h('div', {}, ...cfg.rules.map(r => h('p', {}, r)))));
    app.append(panel);

    function paint() {
      modeKeys.forEach(k => k.setAttribute('aria-checked', String(k.dataset.mode === mode)));
      optBox.replaceChildren(...optionControls(cfg, opts, mode));
      body.replaceChildren();
      if (mode === 'online') {
        const codeIn = h('input', { id: 'pcode', class: 'g-input g-code', maxlength: '4', placeholder: 'CODE', autocomplete: 'off', value: prefill?.room || '', 'aria-label': 'Room code', oninput: e => { e.target.value = cleanCode(e.target.value); } });
        body.append(
          h('div', { class: 'g-actions' },
            h('button', { class: 'key key--amber', type: 'button', onclick: () => { save(); hostRoom(opts); } }, 'Create room'),
            h('span', { class: 'g-or' }, 'or'),
            codeIn,
            h('button', { class: 'key', type: 'button', onclick: () => { const c = cleanCode(codeIn.value); if (c.length !== 4) { say('Room codes have 4 characters.'); codeIn.focus(); return; } save(); joinRoom(c); } }, 'Join')),
          h('p', { class: 'g-hint' }, 'Create a room and send the code or link to your friends. Empty seats can be filled with bots.'));
        if (prefill?.room) setTimeout(() => body.querySelector('.g-actions .key:not(.key--amber)')?.focus(), 50);
      } else {
        body.append(h('div', { class: 'g-actions' }, h('button', { class: 'key key--amber', type: 'button', onclick: () => { save(); startLocal(mode, opts); } }, mode === 'local' ? 'Start on this screen' : 'Start game')));
      }
    }
    const save = () => store.set(cfg.id + '.opts', opts);
    paint();
  }

  /* ---------- Local / bots ---------- */
  function startLocal(mode, opts) {
    const n = mode === 'local' ? (opts.players || cfg.minPlayers) : (opts.players || cfg.minPlayers);
    const seats = [];
    for (let i = 0; i < n; i++) {
      if (i === 0) seats.push({ id: me.id, name: me.name, bot: false });
      else if (mode === 'local') seats.push({ id: 'local' + i, name: 'Player ' + (i + 1), bot: false });
      else seats.push({ id: 'bot' + i, name: BOT_NAMES[(i - 1) % BOT_NAMES.length], bot: true });
    }
    session = { kind: mode, seats, opts, host: true };
    begin();
  }
  function begin() {
    app.replaceChildren();
    const tableEl = h('section', { class: 'g-table', 'aria-label': cfg.title + ' table' });
    app.append(tableEl);
    ui = cfg.ui(tableEl, { say, sound: pressFeedback });
    if (session.host) {
      match = new Match(cfg.engine, session.seats, session.opts, (st, v) => {
        draw(st);
        if (session.kind === 'online') room?.send({ t: 'state', v, state: st, seats: session.seats });
      });
    }
  }
  function mySeat() {
    if (session.kind === 'local') {
      const acting = cfg.engine.toAct(session.state ?? match.state).filter(s => !session.seats[s].bot);
      return acting.length ? acting[0] : (session.lastSeat ?? 0);
    }
    return session.seats.findIndex(s => s.id === me.id);
  }
  function draw(st) {
    session.state = st;
    const seat = mySeat(); session.lastSeat = seat;
    ui.render(st, {
      mySeat: seat, seats: session.seats, local: session.kind === 'local', opts: session.opts,
      send: action => act(seat, action)
    });
    const res = cfg.engine.over(st);
    if (res) showOver(res);
    else if (overShown) { overShown.remove(); overShown = null; }
  }
  function act(seat, action) {
    if (session.host) {
      try { match.dispatch(seat, action); }
      catch (e) { say(e.message || 'That move is not allowed.'); }
    } else room?.send({ t: 'act', id: me.id, action });
  }

  /* ---------- Game over ---------- */
  let overShown = null;
  function showOver(res) {
    if (overShown) return;
    const nm = t => (t || '').replace(/Seat (\d)/g, (m, d) => session.seats[d - 1]?.name || m);
    res = { ...res, title: res.winner != null && !res.keepTitle && res.winner === mySeat() && session.kind !== 'local' ? 'You win!' : nm(res.title), detail: nm(res.detail) };
    const box = h('div', { class: 'g-over', role: 'dialog', 'aria-modal': 'false', 'aria-label': 'Game over' },
      h('div', { class: 'bezel' }, h('div', { class: 'vfd g-over-screen' },
        h('p', { class: 'g-big' }, res.title), h('p', { class: 'g-sub' }, res.detail || ''))),
      h('div', { class: 'g-actions' },
        session.host ? h('button', { class: 'key key--amber', type: 'button', onclick: () => { box.remove(); overShown = null; match.stop(); match = new Match(cfg.engine, session.seats, session.opts, match.onChange); } }, 'Play again') : h('p', { class: 'g-hint' }, 'Waiting for the host to start a new game.'),
        h('button', { class: 'key', type: 'button', onclick: () => lobby() }, 'Leave table')));
    overShown = box; app.append(box);
    sfxWin();
  }

  /* ---------- Online: host ---------- */
  async function hostRoom(opts) {
    const code = newCode();
    session = { kind: 'online', host: true, code, opts, seats: [{ id: me.id, name: me.name, bot: false }], started: false };
    await openRoom(code);
    if (!room) return;
    history.replaceState(null, '', '?room=' + code);
    waitingRoom();
    room.on('presence', peers => {
      if (session.started) return;
      // keep seats in join order, drop people who left, add newcomers
      session.seats = session.seats.filter(s => s.bot || peers.some(p => p.id === s.id));
      for (const p of peers) if (!session.seats.some(s => s.id === p.id) && session.seats.length < cfg.maxPlayers) session.seats.push({ id: p.id, name: p.name, bot: false });
      for (const s of session.seats) { const p = peers.find(q => q.id === s.id); if (p) s.name = p.name; }
      broadcastLobby(); waitingRoom();
    });
    room.on('leave', id => {
      if (!session.started) return;
      const s = session.seats.find(q => q.id === id);
      if (s && !s.bot) { s.bot = true; s.name += ' (bot)'; say(`${s.name.replace(' (bot)', '')} left. A bot took the seat.`); match?.scheduleBots(); room.send({ t: 'state', v: match.v, state: match.state, seats: session.seats }); draw(match.state); }
    });
    room.on('msg', m => {
      if (m.t === 'hello') { broadcastLobby(); if (session.started) room.send({ t: 'state', v: match.v, state: match.state, seats: session.seats }); }
      if (m.t === 'act' && session.started) {
        const seat = session.seats.findIndex(s => s.id === m.id && !s.bot);
        if (seat < 0) return;
        try { match.dispatch(seat, m.action); } catch (e) { room.send({ t: 'error', to: m.id, msg: e.message || 'That move is not allowed.' }); }
      }
    });
  }
  function broadcastLobby() { room?.send({ t: 'lobby', seats: session.seats, opts: session.opts, started: session.started, host: me.id, max: cfg.maxPlayers }); }

  /* ---------- Online: guest ---------- */
  async function joinRoom(code) {
    session = { kind: 'online', host: false, code, seats: [], started: false };
    await openRoom(code);
    if (!room) return;
    history.replaceState(null, '', '?room=' + code);
    let heard = false;
    app.replaceChildren(h('section', { class: 'g-lobby chassis' }, h('p', { class: 'g-hint' }, `Looking for room ${code}…`)));
    room.on('msg', m => {
      if (m.t === 'lobby') {
        heard = true; session.hostId = m.host; session.seats = m.seats; session.opts = m.opts;
        if (!m.seats.some(s => s.id === me.id) && !m.started) { app.replaceChildren(h('section', { class: 'g-lobby chassis' }, h('p', { class: 'g-hint' }, 'This room is full.'), h('button', { class: 'key', onclick: () => lobby() }, 'Back'))); return; }
        if (!session.started) waitingRoom();
      }
      if (m.t === 'state') {
        heard = true; session.seats = m.seats;
        if (!session.started) { session.started = true; begin(); }
        if (session.seats.findIndex(s => s.id === me.id) < 0) say('You are watching this game.');
        draw(m.state);
      }
      if (m.t === 'restart') { overShown?.remove(); overShown = null; }
      if (m.t === 'error' && m.to === me.id) say(m.msg);
    });
    room.on('leave', id => { if (id === session.hostId) { say('The host left the room.', 6000); led.className = 'led red'; } });
    room.send({ t: 'hello' });
    setTimeout(() => { if (!heard) room?.send({ t: 'hello' }); }, 2000);
    setTimeout(() => { if (!heard) { app.replaceChildren(h('section', { class: 'g-lobby chassis' }, h('p', { class: 'g-hint' }, `No host found for room ${code}. Check the code, or ask your friend to keep the room open.`), h('button', { class: 'key', onclick: () => lobby() }, 'Back'))); } }, 7000);
  }

  async function openRoom(code) {
    led.className = 'led amber blink';
    roomPlate.hidden = false; roomPlate.textContent = 'Room ' + code;
    room = new Room(cfg.id, code, me);
    room.on('status', st => { if (st === 'SUBSCRIBED') led.className = 'led green'; if (st === 'CLOSED' || st === 'CHANNEL_ERROR') led.className = 'led red'; });
    try { await room.connect(); }
    catch (e) { say(e.message, 5000); room = null; led.className = 'led red'; lobby(); }
  }

  function waitingRoom() {
    const isHost = session.host;
    const link = location.origin + location.pathname + '?room=' + session.code;
    const seats = [];
    for (let i = 0; i < cfg.maxPlayers; i++) {
      const s = session.seats[i];
      seats.push(h('li', { class: 'g-seat' + (s ? '' : ' empty') },
        h('span', { class: s ? (s.bot ? 'led amber' : 'led green') : 'led' }),
        h('span', { class: 'g-seat-name' }, s ? s.name + (s.id === me.id ? ' (you)' : '') : 'Empty seat'),
        isHost && s?.bot ? h('button', { class: 'key key--sm', type: 'button', onclick: () => { session.seats.splice(i, 1); broadcastLobby(); waitingRoom(); } }, 'Remove') : null,
        isHost && !s && i === session.seats.length ? h('button', { class: 'key key--sm', type: 'button', onclick: () => { session.seats.push({ id: 'bot' + i + Date.now(), name: BOT_NAMES[i % BOT_NAMES.length], bot: true }); broadcastLobby(); waitingRoom(); } }, '+ Bot') : null));
    }
    const enough = session.seats.length >= cfg.minPlayers;
    app.replaceChildren(h('section', { class: 'g-lobby chassis', 'aria-label': 'Room' },
      h('span', { class: 'screw tl' }), h('span', { class: 'screw tr' }), h('span', { class: 'screw bl' }), h('span', { class: 'screw br' }),
      h('div', { class: 'bezel' }, h('div', { class: 'vfd g-marquee' }, h('p', { class: 'label g-room-l' }, 'Room code'), h('p', { class: 'g-code-big' }, session.code))),
      h('div', { class: 'g-actions' },
        h('button', { class: 'key', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(link); say('Invite link copied.'); } catch { say(link, 6000); } } }, 'Copy invite link'),
        h('span', { class: 'g-hint g-link' }, link)),
      h('ol', { class: 'g-seats' }, seats),
      isHost ? h('div', { class: 'g-opts' }, ...optionControls(cfg, session.opts, 'online', () => broadcastLobby())) : null,
      h('div', { class: 'g-actions' },
        isHost ? h('button', { class: 'key key--amber', type: 'button', disabled: !enough, onclick: () => { session.started = true; broadcastLobby(); begin(); } }, enough ? 'Start game' : `Need ${cfg.minPlayers - session.seats.length} more`) : h('p', { class: 'g-hint' }, 'Waiting for the host to start…'),
        h('button', { class: 'key', type: 'button', onclick: () => lobby() }, 'Leave room'))));
  }

  function teardown() {
    match?.stop(); match = null; overShown?.remove(); overShown = null;
    if (room) { room.leave(); room = null; }
    if (location.search) history.replaceState(null, '', location.pathname);
  }

  addEventListener('pagehide', () => room?.leave());
  const r = cleanCode(new URL(location.href).searchParams.get('room'));
  lobby(r.length === 4 ? { room: r } : null);
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
  root.querySelectorAll('[data-k]').forEach(el => {
    const a = before.get(el.dataset.k), b = el.getBoundingClientRect();
    if (!a) { el.animate([{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'ease-out' }); return; }
    const dx = a.left - b.left, dy = a.top - b.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.3,1)' });
  });
}
