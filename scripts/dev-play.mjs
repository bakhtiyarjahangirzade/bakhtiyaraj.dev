// Local development server: serves public/ and runs the game server core in memory at /__play,
// so every game can be played and tested offline (one dev player, no Supabase). npm run dev:play
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { handle, viewsFor, UserError } from '../server/core.mjs';
import { doSpin, freshSeeds } from '../server/slots.mjs';
import { replaySolo } from '../public/games/serpent/sim.js';
import { SKINS } from '../public/games/serpent/skins.js';

const root = resolve('public');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.wav': 'audio/wav', '.ico': 'image/x-icon', '.json': 'application/json' };
const port = +(process.env.PORT || 3000);
const DEV = { id: '00000000-0000-4000-8000-000000000001', name: 'dev' };
const db = { tables: new Map(), views: new Map(), chips: 5000, seeds: { ...freshSeeds() }, runs: new Map(), skins: new Set(), reveals: [] };

function tableOp(op, body, tableId) {
  const t = op === 'create' ? null : db.tables.get(tableId) || null;
  const r = handle(t, { op, user: DEV, body, now: Date.now(), balances: { [DEV.id]: db.chips } });
  for (const w of r.wallet) { db.chips += w.delta; if (db.chips < 0) throw new UserError('Not enough chips in your wallet.'); }
  db.tables.set(r.table.id, r.table);
  db.reveals.push(...r.reveals);
  const views = viewsFor(r.table, r.steps);
  const mine = views.find(v => v.user_id === DEV.id);
  if (mine) db.views.set(r.table.id, mine);
  return { view: mine ? mine.data : { id: r.table.id, status: 'closed', left: true }, balance: db.chips };
}
function play(body) {
  const op = String(body.op || '');
  if (op === 'create') { for (const [id, v] of db.views) if (v.open) { try { tableOp('leave', {}, id); } catch {} } return tableOp('create', body); }
  if (op === 'join') { const t = [...db.tables.values()].find(x => x.code === body.code && x.status !== 'closed'); if (!t) throw new UserError(`No open room ${body.code}.`); return tableOp('join', body, t.id); }
  if (op === 'mine') return { tables: [...db.views.entries()].filter(([, v]) => v.open).map(([id]) => id) };
  if (['sync', 'bot', 'unbot', 'opts', 'start', 'again', 'act', 'tick', 'leave'].includes(op)) return tableOp(op, body, body.table);
  if (op === 'seeds') return { seeds: { commit: db.seeds.commit, clientSeed: db.seeds.client_seed, nonce: db.seeds.nonce, free: db.seeds.free }, balance: db.chips };
  if (op === 'spin') { const r = doSpin(db.seeds, body.machine, body.lineBet, db.chips); db.seeds = r.row; db.chips += r.delta; return { result: r.result, nonce: r.spin.nonce, seeds: { commit: r.row.commit, clientSeed: r.row.client_seed, nonce: r.row.nonce, free: r.row.free }, balance: db.chips }; }
  if (op === 'rotate') { const old = db.seeds; db.seeds = freshSeeds(); return { seeds: { commit: db.seeds.commit, clientSeed: db.seeds.client_seed, nonce: 0 }, revealed: { commit: old.commit, seed: old.seed, clientSeed: old.client_seed, spins: old.nonce } }; }
  if (op === 'clientseed') { db.seeds.client_seed = String(body.clientSeed); return { seeds: { commit: db.seeds.commit, clientSeed: db.seeds.client_seed, nonce: db.seeds.nonce } }; }
  if (op === 'serpent-start') { const id = crypto.randomUUID(), seed = crypto.getRandomValues(new Uint32Array(1))[0]; db.runs.set(id, { seed, at: Date.now() }); return { run: id, seed }; }
  if (op === 'serpent-submit') { const run = db.runs.get(body.run); if (!run) throw new UserError('Unknown run.'); db.runs.delete(body.run); const res = replaySolo(run.seed, body.inputs); return { ...res, best: res.score, rank: 1 }; }
  if (op === 'skins') return { owned: [...db.skins] };
  if (op === 'buy-skin') { const sk = SKINS.find(s => s.id === body.skin); if (!sk?.price) throw new UserError('Unknown skin.'); if (db.chips < sk.price) throw new UserError('Not enough chips.'); db.chips -= sk.price; db.skins.add(sk.id); return { ok: true, balance: db.chips }; }
  throw new UserError('Unknown request.');
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/__play' && req.method === 'POST') {
      let raw = ''; for await (const c of req) raw += c;
      try { res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(play(JSON.parse(raw || '{}')))); }
      catch (e) { res.writeHead(e instanceof UserError ? 400 : 500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: e.message })); if (!(e instanceof UserError)) console.error(e); }
      return;
    }
    if (url.pathname === '/__profile') { res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ id: DEV.id, username: DEV.name, chips: db.chips, role: 'user', banned: false, last_bonus: null })); return; }
    const pathname = decodeURIComponent(url.pathname);
    const file = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(root + sep)) { res.writeHead(403).end('Forbidden'); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`BAKHY dev (local game server): http://127.0.0.1:${port}`));
