// KERVAN online sunucusu (Supabase Edge Function, Deno). Paylaşılan sim kodu _shared/ altında.
// Odalar: her gün bir açık oda (bir tur = 1 dk; pg_cron ile akar) + oyuncuların kurduğu co-op odalar
// (yalnızca içinde biri varken akar; sahibi kaydeder, kayıttan yeni oda açar).
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { actBots } from './_shared/bots.ts';
import { C, fmtYear, yearOfTurn } from './_shared/defs.ts';
import { CULTURES } from './_shared/cultures.ts';
import { addRealm, applyAction, getMap, newGame, tick, type Action, type GameState } from './_shared/sim.ts';

const SB_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const admin = createClient(SB_URL, SERVICE, { auth: { persistSession: false } });

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-kervan-cron',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const PUBLIC_TURN_MS = 60000;
const PUBLIC_BOTS = 10;
const COOP_BOTS = 6;
const ONLINE_MS = 2 * 60000;
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

async function cronSecret() {
  const { data } = await admin.from('kervan_config').select('value').eq('key', 'cron_secret').maybeSingle();
  return data?.value as string | undefined;
}

function pack(s: GameState): GameState {
  if (s.log.length > 220) s.log = s.log.slice(-220);
  if (s.trades.length > 150) s.trades = s.trades.slice(-150);
  return s;
}

function summary(s: GameState) {
  const humans = s.realms.filter((r) => r.kind === 'player');
  const top = [...s.realms].filter((r) => r.alive).sort((a, b) => b.score - a.score).slice(0, 5)
    .map((r) => ({ name: r.name, culture: r.culture, human: r.kind === 'player', score: r.score, era: r.era }));
  const own = Object.entries(s.own).map(([h, r]) => `${h},${r}`).join(';');
  const wars = s.realms.reduce((t, r) => t + r.wars.length, 0) / 2;
  return {
    turn: s.turn, year: fmtYear(yearOfTurn(s.turn)), players: humans.length, realms: s.realms.length, colors: s.realms.map((r) => r.color),
    top, own, seed: s.seed, news: s.log.filter((l) => l.kind === 'news').slice(-3).map((l) => l.text), wars,
  };
}

const today = () => new Date().toISOString().slice(0, 10);
function hashStr(t: string) { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function newCode() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c = ''; for (let i = 0; i < 6; i++) c += A[Math.floor(Math.random() * A.length)]; return c; }

/** Bugünün açık odası yoksa kurar; dünden kalan ve gerçek oyuncusu olmayan odaları siler. */
async function housekeeping() {
  const d = today();
  const id = `gun-${d.replaceAll('-', '')}`;
  const { data: ex } = await admin.from('kervan_worlds').select('id').eq('id', id).maybeSingle();
  if (!ex) {
    const dt = new Date(d + 'T00:00:00Z');
    const name = `Günün Odası · ${dt.getUTCDate()} ${AYLAR[dt.getUTCMonth()]}`;
    const s = newGame({ seed: hashStr(id) % 1e6, bots: PUBLIC_BOTS, mode: 'public', roomName: name });
    await admin.from('kervan_worlds').upsert({ id, name, seed: s.seed, mode: 'public', state: pack(s), summary: summary(s), day: 0, players: 0, turn_ms: PUBLIC_TURN_MS, created_on: d, last_tick: new Date().toISOString() });
  }
  await admin.from('kervan_worlds').delete().eq('mode', 'public').lt('created_on', d).eq('players', 0);
  const old = new Date(Date.now() - 14 * 86400000).toISOString();
  await admin.from('kervan_worlds').delete().eq('mode', 'coop').lt('last_tick', old);
}

async function mutate(roomId: string, fn: (s: GameState) => unknown) {
  for (let i = 0; i < 4; i++) {
    const { data, error } = await admin.from('kervan_worlds').select('state, version').eq('id', roomId).single();
    if (error || !data) throw new Error('Oda bulunamadı');
    const s = data.state as GameState;
    getMap(s.seed);
    const out = fn(s);
    const players = s.realms.filter((r) => r.kind === 'player').length;
    const { data: upd } = await admin.from('kervan_worlds')
      .update({ state: pack(s), version: data.version + 1, day: s.turn, players, summary: summary(s) })
      .eq('id', roomId).eq('version', data.version).select('version');
    if (upd && upd.length) return { s, out, version: data.version + 1 };
  }
  throw new Error('Sunucu yoğun, tekrar dene');
}

async function broadcast(roomId: string, turn: number) {
  try { await admin.channel(`kervan:${roomId}`).send({ type: 'broadcast', event: 'tick', payload: { turn } }); } catch { /* yoksay */ }
}

/** Gerekirse odayı ilerletir. Açık oda: her zaman; co-op: yalnızca içeride biri varken (birikim yok). */
async function advance(room: { id: string; mode: string; last_tick: string; turn_ms: number }) {
  const now = Date.now();
  const last = new Date(room.last_tick).getTime();
  let n = Math.floor((now - last) / room.turn_ms);
  if (n <= 0) return null;
  const { data: seen } = await admin.from('kervan_players').select('house_id, last_seen').eq('world_id', room.id);
  const online = new Map((seen ?? []).map((p) => [p.house_id as number, now - new Date(p.last_seen).getTime() < ONLINE_MS]));
  if (room.mode === 'coop' && ![...online.values()].some(Boolean)) {
    await admin.from('kervan_worlds').update({ last_tick: new Date(now).toISOString() }).eq('id', room.id);
    return null;
  }
  n = Math.min(3, n);
  const r = await mutate(room.id, (st) => {
    for (const R of st.realms) if (R.kind === 'player') R.away = !(online.get(R.id) ?? false);
    for (let k = 0; k < n; k++) tick(st, actBots);
  });
  const next = room.mode === 'coop' ? Math.max(last + n * room.turn_ms, now - room.turn_ms) : last + n * room.turn_ms;
  await admin.from('kervan_worlds').update({ last_tick: new Date(next).toISOString() }).eq('id', room.id);
  room.last_tick = new Date(next).toISOString();
  await broadcast(room.id, r.s.turn);
  return r;
}

const ROOM_COLS = 'id, name, mode, players, max_players, last_tick, turn_ms, created_on, code, owner, summary';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json('ok');
  let body: Record<string, unknown> = {};
  try { body = req.method === 'POST' ? await req.json() : {}; } catch { /* boş */ }
  const op = (body.op as string) ?? new URL(req.url).searchParams.get('op') ?? 'list';
  try {
    if (op === 'tick') {
      const secret = await cronSecret();
      const given = req.headers.get('x-kervan-cron') ?? (body.secret as string | undefined);
      if (!secret || given !== secret) return json({ error: 'yetkisiz', s: !!secret, g: !!given }, 401);
      await housekeeping();
      const { data: rooms } = await admin.from('kervan_worlds').select('id, mode, last_tick, turn_ms').eq('mode', 'public');
      const out: Record<string, number> = {};
      for (const r of rooms ?? []) { const a = await advance(r); if (a) out[r.id] = a.s.turn; }
      return json({ ok: true, out });
    }

    // --- oyuncu istekleri: giriş gerekli ---
    const auth = req.headers.get('Authorization') ?? '';
    const userClient = createClient(SB_URL, ANON, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Giriş yapmalısın' }, 401);

    const roomView = async (r: Record<string, unknown>) => {
      const { data: m } = await admin.from('kervan_players').select('house_id, culture, name').eq('world_id', r.id as string).eq('user_id', user.id).maybeSingle();
      const isOwner = r.owner === user.id;
      return { ...r, code: r.mode === 'coop' && (m || isOwner) ? r.code : null, owner: isOwner ? user.id : null, mine: m ? { realm: m.house_id, culture: m.culture, name: m.name } : null };
    };

    if (op === 'list') {
      await housekeeping();
      const { data: pub } = await admin.from('kervan_worlds').select(ROOM_COLS).eq('mode', 'public').order('created_on', { ascending: false }).limit(4);
      const { data: mem } = await admin.from('kervan_players').select('world_id').eq('user_id', user.id);
      const ids = [...new Set((mem ?? []).map((m) => m.world_id as string))].filter((x) => x.startsWith('coop-'));
      const { data: own } = await admin.from('kervan_worlds').select(ROOM_COLS).eq('mode', 'coop').or(`owner.eq.${user.id}${ids.length ? `,id.in.(${ids.join(',')})` : ''}`);
      const rooms = await Promise.all([...(pub ?? []), ...(own ?? [])].map(roomView));
      return json({ rooms });
    }
    if (op === 'create') {
      const { count } = await admin.from('kervan_worlds').select('id', { count: 'exact', head: true }).eq('owner', user.id).eq('mode', 'coop');
      if ((count ?? 0) >= 3) return json({ error: 'En fazla 3 co-op odan olabilir' }, 409);
      const name = String(body.name ?? 'Co-op oda').slice(0, 32) || 'Co-op oda';
      const speed = [15, 30, 60].includes(Number(body.speed)) ? Number(body.speed) : 30;
      const s = newGame({ bots: COOP_BOTS, mode: 'coop', roomName: name });
      const id = `coop-${crypto.randomUUID().slice(0, 8)}`;
      const { data, error } = await admin.from('kervan_worlds').insert({ id, name, seed: s.seed, mode: 'coop', owner: user.id, code: newCode(), state: pack(s), summary: summary(s), day: 0, players: 0, turn_ms: speed * 1000, last_tick: new Date().toISOString() }).select(ROOM_COLS).single();
      if (error) throw new Error(error.message);
      return json({ room: await roomView(data) });
    }
    if (op === 'code') {
      const { data } = await admin.from('kervan_worlds').select(ROOM_COLS).eq('code', String(body.code ?? '').toUpperCase()).maybeSingle();
      if (!data) return json({ error: 'Bu kodla oda bulunamadı' }, 404);
      const v = await roomView(data);
      return json({ room: { ...v, code: data.code } });
    }
    if (op === 'saves') {
      const { data } = await admin.from('kervan_saves').select('id, name, turn, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
      return json({ saves: data ?? [] });
    }
    if (op === 'delsave') {
      await admin.from('kervan_saves').delete().eq('id', String(body.save)).eq('user_id', user.id);
      return json({ ok: true });
    }
    if (op === 'load') {
      const { data: sv } = await admin.from('kervan_saves').select('name, state').eq('id', String(body.save)).eq('user_id', user.id).maybeSingle();
      if (!sv) return json({ error: 'Kayıt bulunamadı' }, 404);
      const s = sv.state as GameState;
      const id = `coop-${crypto.randomUUID().slice(0, 8)}`;
      const name = String(sv.name).split(' · ')[0].slice(0, 32);
      s.roomName = name;
      const { data, error } = await admin.from('kervan_worlds').insert({ id, name, seed: s.seed, mode: 'coop', owner: user.id, code: newCode(), state: s, summary: summary(s), day: s.turn, players: s.realms.filter((r) => r.kind === 'player').length, turn_ms: 30000, last_tick: new Date().toISOString() }).select(ROOM_COLS).single();
      if (error) throw new Error(error.message);
      const rows = s.realms.filter((r) => r.kind === 'player' && r.user).map((r) => ({ world_id: id, user_id: r.user!, house_id: r.id, nation: 0, culture: r.culture, name: r.name }));
      if (rows.length) await admin.from('kervan_players').insert(rows);
      return json({ room: await roomView(data) });
    }

    const roomId = String(body.room ?? '').slice(0, 40);
    if (!roomId) return json({ error: 'Oda seçilmedi' }, 400);
    const { data: room } = await admin.from('kervan_worlds').select('id, name, mode, owner, code, last_tick, turn_ms, version, players, max_players').eq('id', roomId).maybeSingle();
    if (!room) return json({ error: 'Oda kapanmış' }, 404);
    const meta = (version: number) => ({ lastTick: room.last_tick, turnMs: room.turn_ms, version, room: { id: room.id, mode: room.mode, code: room.mode === 'coop' ? room.code : null, owner: room.owner === user.id } });
    let { data: me } = await admin.from('kervan_players').select('house_id').eq('world_id', roomId).eq('user_id', user.id).maybeSingle();

    if (op === 'join') {
      if (!me) {
        const culture = Math.max(0, Math.min(CULTURES.length - 1, Number(body.culture) || 0));
        const name = String(body.name ?? user.email?.split('@')[0] ?? 'Kabile').slice(0, 32) || 'Kabile';
        const r = await mutate(roomId, (st) => {
          const prev = st.realms.find((x) => x.kind === 'player' && x.user === user.id);
          if (prev) return prev.id;
          if (st.realms.filter((x) => x.kind === 'player').length >= (st.maxPlayers ?? C.MAX_PLAYERS)) return -1;
          return addRealm(st, { name, culture, kind: 'player', user: user.id });
        });
        const realm = r.out as number;
        if (realm < 0) return json({ error: `Oda dolu (${C.MAX_PLAYERS}/${C.MAX_PLAYERS})` }, 409);
        await admin.from('kervan_players').insert({ world_id: roomId, user_id: user.id, house_id: realm, nation: 0, culture, name });
        me = { house_id: realm };
      }
      await admin.from('kervan_players').update({ last_seen: new Date().toISOString() }).eq('world_id', roomId).eq('user_id', user.id);
      const { data: w } = await admin.from('kervan_worlds').select('state, version, last_tick').eq('id', roomId).single();
      return json({ state: w!.state, realmId: me!.house_id, ...meta(w!.version), lastTick: w!.last_tick });
    }
    if (!me) return json({ error: 'Bu odada kabilen yok' }, 403);
    await admin.from('kervan_players').update({ last_seen: new Date().toISOString() }).eq('world_id', roomId).eq('user_id', user.id);

    if (op === 'state') {
      const adv = await advance(room);
      const { data: w } = await admin.from('kervan_worlds').select('version, last_tick').eq('id', roomId).single();
      const since = Number(body.since ?? -1);
      const lt = w!.last_tick;
      if (!adv && w!.version === since) return json({ unchanged: true, realmId: me.house_id, ...meta(w!.version), lastTick: lt });
      const { data: full } = await admin.from('kervan_worlds').select('state, version').eq('id', roomId).single();
      return json({ state: full!.state, realmId: me.house_id, ...meta(full!.version), lastTick: lt });
    }
    if (op === 'action') {
      const action = body.action as Action;
      const r = await mutate(roomId, (st) => {
        const R = st.realms[me!.house_id]; if (R) R.away = false;
        return applyAction(st, me!.house_id, action);
      });
      const result = r.out as ReturnType<typeof applyAction>;
      await admin.from('kervan_actions').insert({ world_id: roomId, user_id: user.id, house_id: me.house_id, action, ok: result.ok, err: result.ok ? null : result.err });
      return json({ result, state: r.s, version: r.version });
    }
    if (op === 'save') {
      if (room.mode !== 'coop' || room.owner !== user.id) return json({ error: 'Yalnızca co-op odanın sahibi kaydedebilir' }, 403);
      const { data: w } = await admin.from('kervan_worlds').select('state').eq('id', roomId).single();
      const s = w!.state as GameState;
      const name = `${room.name} · ${fmtYear(yearOfTurn(s.turn))}`;
      await admin.from('kervan_saves').insert({ user_id: user.id, name, turn: s.turn, state: s });
      const { data: all } = await admin.from('kervan_saves').select('id').eq('user_id', user.id).order('created_at', { ascending: false });
      const extra = (all ?? []).slice(10).map((x) => x.id);
      if (extra.length) await admin.from('kervan_saves').delete().in('id', extra);
      return json({ name });
    }
    return json({ error: 'Geçersiz istek' }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
