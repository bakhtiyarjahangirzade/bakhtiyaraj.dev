// Online rooms over Supabase Realtime broadcast + presence. No tables, no stored data.
// One channel per room: bakhy:<game>:<CODE>. The host runs the game engine; everyone else sends actions.
const SUPABASE_URL = 'https://yxiedrrahclzqukfnqrn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_n0X-RVe8A6z9HviK4qsWAg_FgTTKJq2';

let client = null;
async function getClient() {
  if (client) return client;
  if (!window.supabase) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = '/vendor/supabase.js'; s.onload = res; s.onerror = () => rej(new Error('Could not load the online module.'));
      document.head.append(s);
    });
  }
  client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
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
        if (st === 'SUBSCRIBED') { clearTimeout(timer); await this.ch.track({ name: this.me.name, at: Date.now() }); resolve(); }
        if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') { clearTimeout(timer); reject(new Error('Could not open the room. Try again in a moment.')); }
      });
    });
  }
  peers() {
    const st = this.ch ? this.ch.presenceState() : {};
    return Object.entries(st).map(([id, metas]) => ({ id, name: metas[0]?.name || 'Player', at: metas[0]?.at || 0 })).sort((a, b) => a.at - b.at);
  }
  send(payload) { if (this.ch) return this.ch.send({ type: 'broadcast', event: 'msg', payload }); }
  async leave() { try { await this.ch?.untrack(); await this.ch?.unsubscribe(); } catch {} this.ch = null; }
}
