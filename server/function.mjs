// Supabase Edge Function "play": the only place game state and chips change.
// Bundled into supabase/functions/play/index.js by scripts/build-function.mjs (npm run build:function).
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { handle, viewsFor, UserError } from './core.mjs';
import { GAMES } from '../public/games/shared/fair.js';
import { doSpin, freshSeeds, cleanClientSeed } from './slots.mjs';
import { replaySolo, TICK } from '../public/games/serpent/sim.js';
import { SKINS } from '../public/games/serpent/skins.js';

const db = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const STALE_MS = 15 * 60 * 1000;
const fail = m => { throw new UserError(m); };

async function rpc(p) {
  const { data, error } = await db.rpc('commit_play', { p });
  if (error) {
    if (/conflict/.test(error.message)) { const e = new Error('conflict'); e.conflict = true; throw e; }
    if (/insufficient chips/.test(error.message)) fail('Not enough chips in your wallet.');
    if (/already owned/.test(error.message)) fail('You already own that skin.');
    if (/run already used/.test(error.message)) fail('This run was already scored.');
    if (/game_tables_open_code/.test(error.message)) { const e = new Error('code'); e.code = true; throw e; }
    throw new Error(error.message);
  }
  return data;
}
async function loadTable(id) {
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id)) fail('That table does not exist any more.');
  const { data, error } = await db.from('game_tables').select('body, seq, status').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? data.body : null;
}
async function balancesOf(t) {
  const ids = (t?.seats || []).filter(s => s.uid && !s.bot).map(s => s.uid);
  if (!ids.length) return {};
  const { data } = await db.from('profiles').select('id, chips, banned').in('id', ids);
  return Object.fromEntries((data || []).map(p => [p.id, p.banned ? 0 : Number(p.chips)]));
}
// Run one table operation with optimistic concurrency; returns the caller's view.
async function tableOp(op, user, body, tableId) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const t = op === 'create' ? null : await loadTable(tableId);
    const balances = await balancesOf(t);
    const now = Date.now();
    const r = handle(t, { op, user, body, now, balances });
    const views = viewsFor(r.table, r.steps).map(v => ({ table_id: r.table.id, ...v }));
    try {
      const res = await rpc({ table: r.table, insert: op === 'create', expected_seq: t ? t.seq : null, wallet: r.wallet, views, gone: r.gone, reveals: r.reveals, results: r.results });
      const mine = views.find(v => v.user_id === user.id);
      return { view: mine ? mine.data : { id: r.table.id, status: 'closed', left: true }, balance: res?.balances?.[user.id] };
    } catch (e) {
      if (e.conflict && t && t.seq === r.table.seq) return { view: views.find(v => v.user_id === user.id)?.data || null }; // nothing changed (e.g. a no-op sync)
      if (e.conflict || e.code) { await new Promise(res => setTimeout(res, 40 + attempt * 60)); continue; }
      throw e;
    }
  }
  fail('The table is busy. Try again.');
}
// Finish tables nobody has touched for a while so no chips stay locked on them.
async function reapStale() {
  const cutoff = new Date(Date.now() - STALE_MS).toISOString();
  const { data } = await db.from('game_tables').select('id').neq('status', 'closed').lt('updated_at', cutoff).limit(3);
  for (const row of data || []) { try { await tableOp('reap', { id: 'system', name: 'system' }, {}, row.id); } catch (e) { console.warn('reap', row.id, e.message); } }
}
async function myOpenTables(uid) {
  const { data } = await db.from('seat_views').select('table_id').eq('user_id', uid).eq('open', true);
  return (data || []).map(r => r.table_id);
}

/* ---------------- slots ---------------- */
async function seedRow(uid) {
  let { data } = await db.from('user_seeds').select('*').eq('user_id', uid).maybeSingle();
  if (!data) { const s = { user_id: uid, ...freshSeeds() }; await rpc({ seeds: s }); ({ data } = await db.from('user_seeds').select('*').eq('user_id', uid).maybeSingle()); }
  return data;
}
const publicSeeds = row => ({ commit: row.commit, clientSeed: row.client_seed, nonce: row.nonce, free: row.free });
async function slotsOp(op, user, body, profile) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const row = await seedRow(user.id);
    try {
      if (op === 'seeds') return { seeds: publicSeeds(row), balance: profile.chips };
      if (op === 'clientseed') {
        const cs = cleanClientSeed(body.clientSeed); if (!cs) fail('Use letters, numbers, dash or underscore.');
        const next = { ...row, client_seed: cs };
        await rpc({ seeds: next, expected_nonce: row.nonce, expected_commit: row.commit });
        return { seeds: publicSeeds(next) };
      }
      if (op === 'rotate') {
        const next = { user_id: user.id, ...freshSeeds(cleanClientSeed(body.clientSeed) || undefined), free: row.free };
        await rpc({ seeds: next, expected_nonce: row.nonce, expected_commit: row.commit, seed_reveal: { user_id: user.id, commit: row.commit, seed: row.seed, client_seed: row.client_seed, spins: row.nonce } });
        return { seeds: publicSeeds(next), revealed: { commit: row.commit, seed: row.seed, clientSeed: row.client_seed, spins: row.nonce } };
      }
      if (op === 'spin') {
        const { data: p } = await db.from('profiles').select('chips').eq('id', user.id).single();
        const r = doSpin(row, String(body.machine || ''), body.lineBet, Number(p.chips));
        const wallet = r.delta ? [{ uid: user.id, delta: r.delta, reason: 'slots:' + r.spin.machine }] : [];
        const res = await rpc({ seeds: { ...r.row, user_id: user.id }, expected_nonce: row.nonce, expected_commit: row.commit, wallet, spin: { ...r.spin, user_id: user.id } });
        return { result: r.result, nonce: r.spin.nonce, seeds: publicSeeds(r.row), balance: res?.balances?.[user.id] ?? Number(p.chips) };
      }
      fail('Unknown request.');
    } catch (e) { if (e.conflict) continue; throw e; }
  }
  fail('Too many spins at once. Try again.');
}

/* ---------------- Serpent Zone: ranked solo runs and skins ---------------- */
async function serpentOp(op, user, body, profile) {
  if (op === 'serpent-start') {
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    const id = crypto.randomUUID();
    await rpc({ run_new: { id, user_id: user.id, seed } });
    return { run: id, seed };
  }
  if (op === 'serpent-submit') {
    const inputs = String(body.inputs || '');
    if (inputs.length > 120000 || !/^[0-9:;]*$/.test(inputs)) fail('That run log is not valid.');
    if (typeof body.run !== 'string' || !/^[0-9a-f-]{36}$/.test(body.run)) fail('Unknown run.');
    const { data: run } = await db.from('serpent_runs').select('id, seed, started_at, finished').eq('id', body.run).eq('user_id', user.id).maybeSingle();
    if (!run) fail('Unknown run.');
    if (run.finished) fail('This run was already scored.');
    const res = replaySolo(Number(run.seed), inputs);
    const elapsed = Date.now() - new Date(run.started_at).getTime();
    if (res.ticks * TICK * 1000 > elapsed + 3000) fail('That run finished faster than real time, so it was not ranked.');
    await rpc({ run_finish: { id: run.id, user_id: user.id, score: res.score, peak: res.peak, kills: res.kills, won: res.won, ticks: res.ticks } });
    const { data: best } = await db.from('serpent_runs').select('score').eq('user_id', user.id).eq('finished', true).order('score', { ascending: false }).limit(1);
    const top = best?.[0]?.score ?? res.score;
    const { data: above } = await db.from('serpent_runs').select('user_id').eq('finished', true).gt('score', top).limit(2000);
    const rank = new Set((above || []).map(r => r.user_id)).size + 1;
    return { ...res, best: top, rank: user.anon ? null : rank, guest: !!user.anon };
  }
  if (op === 'skins') {
    const { data } = await db.from('user_skins').select('skin').eq('user_id', user.id);
    return { owned: (data || []).map(r => r.skin) };
  }
  if (op === 'buy-skin') {
    const sk = SKINS.find(s => s.id === body.skin);
    if (!sk || !sk.price) fail('That skin is free or does not exist.');
    if (Number(profile.chips) < sk.price) fail(`You need ${sk.price.toLocaleString('en-US')} chips for ${sk.name}.`);
    const res = await rpc({ skin: { user_id: user.id, skin: sk.id, price: sk.price }, wallet: [{ uid: user.id, delta: -sk.price, reason: 'skin:' + sk.id }] });
    return { ok: true, balance: res?.balances?.[user.id] };
  }
  fail('Unknown request.');
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  try {
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: auth } = await db.auth.getUser(token);
    const u = auth?.user; if (!u) return json({ error: 'Sign in to play.' }, 401);
    const { data: profile } = await db.from('profiles').select('id, username, chips, banned').eq('id', u.id).maybeSingle();
    if (!profile) return json({ error: 'Your account is still being set up. Try again in a moment.' }, 409);
    if (profile.banned) return json({ error: 'This account is suspended.' }, 403);
    const body = await req.json().catch(() => ({}));
    const op = String(body.op || '');
    if (JSON.stringify(body).length > (op === 'serpent-submit' ? 130000 : 4000)) return json({ error: 'Request too large.' }, 413);
    const user = { id: u.id, name: profile.username, anon: !!u.is_anonymous };
    reapStale().catch(() => {});

    if (['seeds', 'clientseed', 'rotate', 'spin'].includes(op)) return json(await slotsOp(op, user, body, profile));
    if (op.startsWith('serpent-') || op === 'skins' || op === 'buy-skin') return json(await serpentOp(op, user, body, profile));
    if (op === 'mine') return json({ tables: await myOpenTables(u.id) });
    // Guest (anonymous) accounts can play everything vs bots, but not casino tables with other people:
    // otherwise throwaway guests could feed their welcome chips to one account at a poker table.
    const casinoOnline = game => GAMES[game]?.casino && u.is_anonymous;
    if (op === 'create') {
      if (body.mode === 'online' && casinoOnline(String(body.game))) fail('Sign in with an email account to play casino games online.');
      // one table at a time: leave any other open table first (chips are cashed out at the next safe point)
      for (const id of await myOpenTables(u.id)) { try { await tableOp('leave', user, {}, id); } catch (e) { console.warn('leave', e.message); } }
      return json(await tableOp('create', user, body)); // the client starts it in a second call, after it has seen the seed commitment
    }
    if (op === 'join') {
      const code = String(body.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
      const { data } = await db.from('game_tables').select('id, game').eq('code', code).neq('status', 'closed').maybeSingle();
      if (!data) fail(`No open room ${code}.`);
      if (body.game && data.game !== body.game) fail(`Room ${code} is a different game.`);
      if (casinoOnline(data.game)) fail('Sign in with an email account to play casino games online.');
      for (const id of await myOpenTables(u.id)) if (id !== data.id) { try { await tableOp('leave', user, {}, id); } catch {} }
      return json(await tableOp('join', user, body, data.id));
    }
    if (['sync', 'bot', 'unbot', 'opts', 'start', 'again', 'act', 'tick', 'leave'].includes(op)) return json(await tableOp(op, user, body, body.table));
    fail('Unknown request.');
  } catch (e) {
    if (e instanceof UserError) return json({ error: e.message }, 400);
    console.error(e);
    return json({ error: 'Server error. Try again.' }, 500);
  }
});
