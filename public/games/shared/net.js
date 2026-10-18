// Online rooms over Supabase Realtime broadcast + presence. No tables, no stored data.
// One channel per room: bakhy:<game>:<CODE>. The host runs the game engine; everyone else sends actions.
const SUPABASE_URL = 'https://yxiedrrahclzqukfnqrn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_n0X-RVe8A6z9HviK4qsWAg_FgTTKJq2';

let client = null;
export async function getClient() {
  if (client) return client;
  if (!window.supabase) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = '/vendor/supabase.js'; s.onload = res; s.onerror = () => rej(new Error('Could not load the online module.'));
      document.head.append(s);
    });
  }
  client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'bakhy-auth' },
    realtime: { params: { eventsPerSecond: 20 } }
  });
  return client;
}

export function myId() {
  try {
    let id = localStorage.getItem('bakhy.id');
    if (!id) { id = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2); localStorage.setItem('bakhy.id', id); }
    return id;
  } catch { return (window.__bakhyId ||= String(Math.random()).slice(2)); }
}

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newCode() { let s = ''; const r = crypto.getRandomValues(new Uint8Array(4)); for (const b of r) s += ALPHA[b % ALPHA.length]; return s; }
export function cleanCode(s) { return (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4); }

export class Room {
  constructor(game, code, me) {
    this.game = game; this.code = code; this.me = me; this.handlers = {}; this.status = 'idle';
  }
  on(ev, fn) { (this.handlers[ev] ||= []).push(fn); return this; }
  emit(ev, ...a) { (this.handlers[ev] || []).forEach(f => f(...a)); }
  async connect() {
    const sb = await getClient();
    this.ch = sb.channel(`bakhy:${this.game}:${this.code}`, { config: { broadcast: { self: false }, presence: { key: this.me.id } } });
    this.ch.on('broadcast', { event: 'msg' }, ({ payload }) => this.emit('msg', payload));
    this.ch.on('presence', { event: 'sync' }, () => this.emit('presence', this.peers()));
    this.ch.on('presence', { event: 'leave' }, ({ key }) => this.emit('leave', key));
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('The room server did not answer. Check your connection and try again.')), 12000);
      this.ch.subscribe(async st => {
        this.status = st; this.emit('status', st);
        if (st === 'SUBSCRIBED') { clearTimeout(timer); await this.ch.track({ name: this.me.name, at: Date.now(), chips: this.me.chips }); resolve(); }
        if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') { clearTimeout(timer); reject(new Error('Could not open the room. Try again in a moment.')); }
      });
    });
  }
  peers() {
    const st = this.ch ? this.ch.presenceState() : {};
    return Object.entries(st).map(([id, metas]) => ({ id, name: metas[0]?.name || 'Player', at: metas[0]?.at || 0, chips: metas[0]?.chips })).sort((a, b) => a.at - b.at);
  }
  send(payload) { if (this.ch) return this.ch.send({ type: 'broadcast', event: 'msg', payload }); }
  async leave() { try { await this.ch?.untrack(); await this.ch?.unsubscribe(); } catch {} this.ch = null; }
}

/* ---------- Game server (Supabase Edge Function "play") ---------- */
// Every card game and casino table runs on the server; the browser only sends moves and receives
// its own seat's view. ensurePlayer() (account.js) must have produced a session first.
// Local development: scripts/dev-play.mjs runs the same server core in memory at /__play.
let devP = null;
export function devServer() {
  if (!/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) return Promise.resolve(false);
  return devP ||= fetch('/__profile').then(r => r.ok && (r.headers.get('content-type') || '').includes('json')).catch(() => false);
}
export async function api(op, body = {}) {
  if (await devServer()) {
    const r = await fetch('/__play', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op, ...body }) });
    const j = await r.json(); if (j.error) throw new Error(j.error); return j;
  }
  const sb = await getClient();
  const { data, error } = await sb.functions.invoke('play', { body: { op, ...body } });
  if (error) {
    let msg = 'The game server did not answer. Check your connection and try again.';
    try { const j = await error.context?.json?.(); if (j?.error) msg = j.error; } catch {}
    const e = new Error(msg); e.status = error.context?.status; throw e;
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
// Live updates of this player's seat view for one table (row-level security: only your own row arrives).
export async function watchTable(tableId, onView, onStatus) {
  if (await devServer()) { setTimeout(() => onStatus?.('SUBSCRIBED'), 0); return () => {}; }
  const sb = await getClient();
  const ch = sb.channel('seat:' + tableId + ':' + Math.random().toString(36).slice(2, 7))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'seat_views', filter: 'table_id=eq.' + tableId }, p => { if (p.new?.data) onView(p.new.data); })
    .subscribe(st => onStatus?.(st));
  return () => { try { sb.removeChannel(ch); } catch {} };
}
