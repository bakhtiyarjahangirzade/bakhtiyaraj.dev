// Local stand-in for the Supabase HTTP APIs Luna uses, for browser tests only (scripts/luna/e2e-publishing.mjs).
// It is NOT the real service: auth, PostgREST and Storage are re-implemented minimally here. What it does keep real
// is the database: every request runs the repository's actual SQL (supabase/luna.sql + luna-publishing.sql) in
// PGlite under the caller's role and JWT claims, and Storage decisions are the same INSERT/SELECT/DELETE on
// storage.objects that Supabase Storage performs with row level security. Playwright routes requests for the
// production project URL here, so the built site, its CSP and its code paths are unchanged.
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { createDb, as } from '../../tests/support/supabase-stub.mjs';

const SECRET = 'local-test-secret-not-a-real-key';
const b64u = b => Buffer.from(b).toString('base64url');
function sign(payload) {
  const head = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' })), body = b64u(JSON.stringify(payload));
  return `${head}.${body}.${createHmac('sha256', SECRET).update(`${head}.${body}`).digest('base64url')}`;
}
function verify(tok) {
  const [h, b, s] = String(tok || '').split('.');
  if (!s) return null;
  const want = createHmac('sha256', SECRET).update(`${h}.${b}`).digest();
  const got = Buffer.from(s, 'base64url');
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  const p = JSON.parse(Buffer.from(b, 'base64url').toString());
  return p.exp && p.exp * 1000 < Date.now() ? null : p;
}

export async function createGateway({ origin = 'https://yxiedrrahclzqukfnqrn.supabase.co' } = {}) {
  const db = await createDb();
  const users = new Map(); // email -> { id, password }
  const blobs = new Map(); // bucket/name -> { body, type }
  const tus = new Map();
  const log = [];
  const faults = []; // { match: RegExp, status, times }

  async function addUser(email, password, { confirmed = true } = {}) {
    const id = randomUUID();
    users.set(email, { id, password });
    await db.query('insert into auth.users (id, email, email_confirmed_at) values ($1, $2, $3)', [id, email, confirmed ? new Date() : null]);
    return id;
  }
  const session = u => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const user = { id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, is_anonymous: false, app_metadata: {}, user_metadata: {}, email_confirmed_at: new Date().toISOString(), created_at: new Date().toISOString() };
    return { access_token: sign({ sub: u.id, role: 'authenticated', aud: 'authenticated', email: u.email, is_anonymous: false, exp }), token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: `r.${u.id}`, user };
  };

  const json = (status, body, extra = {}) => ({ status, headers: { 'content-type': 'application/json', ...extra }, body: body === undefined ? '' : JSON.stringify(body) });
  function claimsOf(headers) {
    const auth = headers.authorization || '';
    const tok = auth.replace(/^Bearer\s+/i, '');
    if (!tok || tok.startsWith('sb_publishable_')) return null;
    const c = verify(tok);
    return c ? c : 'invalid';
  }
  const pgErr = e => {
    const status = e.code === '42501' ? 403 : e.code === 'P0002' ? 404 : 400;
    return json(status, { code: e.code, message: e.message, details: null, hint: null });
  };

  async function rpc(fn, args, claims) {
    if (!/^luna_[a-z_]+$/.test(fn)) return json(404, { code: 'PGRST202', message: `Could not find the function public.${fn}` });
    const exists = (await db.query(`select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = $1`, [fn])).rows.length;
    if (!exists) return json(404, { code: 'PGRST202', message: `Could not find the function public.${fn}` });
    const keys = Object.keys(args || {});
    const sql = `select public.${fn}(${keys.map((k, i) => `${k} => $${i + 1}`).join(', ')}) as r`;
    const vals = keys.map(k => (args[k] !== null && typeof args[k] === 'object' ? JSON.stringify(args[k]) : args[k]));
    try {
      const rows = await as(db, claims, tx => tx.query(sql, vals).then(r => r.rows));
      return json(200, rows[0]?.r ?? null);
    } catch (e) { return pgErr(e); }
  }

  async function table(method, name, url, body, headers, claims) {
    if (!/^luna_(library|progress)$/.test(name)) return json(404, { code: 'PGRST205', message: 'not found' });
    try {
      if (method === 'GET') {
        const cols = (url.searchParams.get('select') || '*').split(',').map(c => c.replace(/[^a-z_*]/g, '')).join(', ');
        return json(200, await as(db, claims, tx => tx.query(`select ${cols} from public.${name}`).then(r => r.rows)));
      }
      if (method === 'POST') {
        const rows = Array.isArray(body) ? body : [body];
        const conflict = (url.searchParams.get('on_conflict') || 'user_id,comic_slug').split(',');
        await as(db, claims, async tx => {
          for (const r of rows) {
            const cols = Object.keys(r);
            const upd = cols.filter(c => !conflict.includes(c));
            await tx.query(`insert into public.${name} (${cols.join(', ')}) values (${cols.map((_, i) => `$${i + 1}`).join(', ')})
              on conflict (${conflict.join(', ')}) do ${upd.length ? `update set ${upd.map(c => `${c} = excluded.${c}`).join(', ')}` : 'nothing'}`, cols.map(c => r[c]));
          }
        });
        return json(201, undefined);
      }
      if (method === 'DELETE') {
        const f = [...url.searchParams].filter(([k]) => k !== 'select').map(([k, v]) => [k.replace(/[^a-z_]/g, ''), v.replace(/^eq\./, '')]);
        await as(db, claims, tx => tx.query(`delete from public.${name} where ${f.map(([k], i) => `${k} = $${i + 1}`).join(' and ') || 'false'}`, f.map(x => x[1])));
        return json(204, undefined);
      }
    } catch (e) { return pgErr(e); }
    return json(405, { message: 'method' });
  }

  const bucketOf = id => db.query('select * from storage.buckets where id = $1', [id]).then(r => r.rows[0]);
  async function putObject(bucket, name, bodyBuf, type, claims, upsert) {
    const b = await bucketOf(bucket);
    if (!b) return json(400, { statusCode: '404', error: 'Bucket not found', message: 'Bucket not found' });
    if (b.file_size_limit && bodyBuf.length > Number(b.file_size_limit)) return json(413, { statusCode: '413', error: 'Payload too large', message: 'The object exceeded the maximum allowed size' });
    if (b.allowed_mime_types && !b.allowed_mime_types.includes(type)) return json(400, { statusCode: '415', error: 'invalid_mime_type', message: `mime type ${type} is not supported` });
    try {
      await as(db, claims, tx => tx.query(`insert into storage.objects (bucket_id, name, owner_id, metadata) values ($1, $2, $3, $4)
        on conflict (bucket_id, name) do ${upsert ? `update set updated_at = now(), metadata = excluded.metadata` : 'nothing'}`, [bucket, name, claims?.sub ?? null, JSON.stringify({ size: bodyBuf.length, mimetype: type })]));
    } catch (e) {
      return json(403, { statusCode: '403', error: 'Unauthorized', message: /row-level security/.test(e.message) ? 'new row violates row-level security policy' : e.message });
    }
    blobs.set(`${bucket}/${name}`, { body: bodyBuf, type });
    return json(200, { Key: `${bucket}/${name}`, Id: randomUUID() });
  }
  const canSee = (bucket, name, claims) => as(db, claims, tx => tx.query('select 1 from storage.objects where bucket_id = $1 and name = $2', [bucket, name]).then(r => r.rows.length === 1));
  const signToken = (bucket, name, expiresIn) => sign({ url: `${bucket}/${name}`, exp: Math.floor(Date.now() / 1000) + Number(expiresIn || 60) });

  async function storage(method, rest, url, buf, headers, claims) {
    let m;
    if (method === 'POST' && (m = rest.match(/^object\/sign\/([^/]+)$/))) {
      const { expiresIn, paths } = JSON.parse(buf.toString() || '{}');
      const out = [];
      for (const p of paths || []) {
        const ok = await canSee(m[1], p, claims);
        out.push(ok ? { error: null, path: p, signedURL: `/object/sign/${m[1]}/${p}?token=${signToken(m[1], p, expiresIn)}` } : { error: 'Either the object does not exist or you do not have access to it', path: p, signedURL: null });
      }
      return json(200, out);
    }
    if (method === 'GET' && (m = rest.match(/^object\/sign\/([^/]+)\/(.+)$/))) {
      const name = decodeURIComponent(m[2]);
      const p = verify(url.searchParams.get('token'));
      if (!p || p.url !== `${m[1]}/${name}`) return json(400, { statusCode: '400', error: 'InvalidJWT', message: 'invalid signature' });
      const o = blobs.get(`${m[1]}/${name}`);
      if (!o) return json(400, { statusCode: '404', error: 'not_found', message: 'Object not found' });
      return { status: 200, headers: { 'content-type': o.type, 'cache-control': 'max-age=3600' }, body: o.body };
    }
    if (method === 'GET' && (m = rest.match(/^object\/public\/([^/]+)\/(.+)$/))) {
      const b = await bucketOf(m[1]);
      if (!b?.public) return json(400, { statusCode: '404', error: 'Bucket not found', message: 'Bucket not found' });
    }
    if (method === 'GET' && (m = rest.match(/^object\/(?:authenticated\/)?([^/]+)\/(.+)$/))) {
      const name = decodeURIComponent(m[2]);
      if (!(await canSee(m[1], name, claims))) return json(400, { statusCode: '404', error: 'not_found', message: 'Object not found' });
      const o = blobs.get(`${m[1]}/${name}`);
      return { status: 200, headers: { 'content-type': o.type }, body: o.body };
    }
    if ((method === 'POST' || method === 'PUT') && (m = rest.match(/^object\/([^/]+)\/(.+)$/)) && !rest.startsWith('object/sign/') && !rest.startsWith('object/list/')) {
      return putObject(m[1], decodeURIComponent(m[2]), buf, headers['content-type'] || 'application/octet-stream', claims, headers['x-upsert'] === 'true');
    }
    if (method === 'DELETE' && (m = rest.match(/^object\/([^/]+)$/))) {
      const { prefixes } = JSON.parse(buf.toString() || '{}');
      const gone = [];
      try {
        await as(db, claims, async tx => { for (const p of prefixes || []) { const r = await tx.query('delete from storage.objects where bucket_id = $1 and name = $2 returning name', [m[1], p]); if (r.rows.length) gone.push(p); } });
      } catch (e) { return json(403, { statusCode: '403', error: 'Unauthorized', message: e.message }); }
      gone.forEach(p => blobs.delete(`${m[1]}/${p}`));
      return json(200, gone.map(name => ({ name, bucket_id: m[1] })));
    }
    if (method === 'POST' && (m = rest.match(/^object\/list\/([^/]+)$/))) {
      const { prefix = '' } = JSON.parse(buf.toString() || '{}');
      const rows = await as(db, claims, tx => tx.query(`select name from storage.objects where bucket_id = $1 and name like $2 order by name`, [m[1], `${prefix}%`]).then(r => r.rows));
      return json(200, rows.map(r => ({ name: r.name.slice(prefix.length) })));
    }
    // TUS resumable uploads
    if (method === 'POST' && rest === 'upload/resumable') {
      const meta = Object.fromEntries((headers['upload-metadata'] || '').split(',').filter(Boolean).map(kv => { const [k, v] = kv.trim().split(' '); return [k, Buffer.from(v || '', 'base64').toString()]; }));
      const len = Number(headers['upload-length']);
      const b = await bucketOf(meta.bucketName);
      if (!b) return json(404, { message: 'Bucket not found' });
      if (b.file_size_limit && len > Number(b.file_size_limit)) return json(413, { message: 'The object exceeded the maximum allowed size' });
      if (b.allowed_mime_types && !b.allowed_mime_types.includes(meta.contentType)) return json(400, { message: `mime type ${meta.contentType} is not supported` });
      // Supabase checks the insert permission when the upload is created.
      try {
        await as(db, claims, async tx => { await tx.query('savepoint p'); await tx.query('insert into storage.objects (bucket_id, name) values ($1, $2) on conflict (bucket_id, name) do update set updated_at = now()', [meta.bucketName, meta.objectName]); await tx.query('rollback to savepoint p'); });
      } catch (e) { return json(403, { message: 'new row violates row-level security policy' }); }
      const id = randomUUID();
      tus.set(id, { meta, len, parts: [], offset: 0, claims, upsert: headers['x-upsert'] === 'true' });
      return { status: 201, headers: { Location: `${origin}/storage/v1/upload/resumable/${id}`, 'Tus-Resumable': '1.0.0' }, body: '' };
    }
    if ((m = rest.match(/^upload\/resumable\/([0-9a-f-]+)$/))) {
      const u = tus.get(m[1]);
      if (!u) return { status: 404, headers: {}, body: '' };
      if (method === 'HEAD') return { status: 200, headers: { 'Upload-Offset': String(u.offset), 'Upload-Length': String(u.len), 'Tus-Resumable': '1.0.0' }, body: '' };
      if (method === 'PATCH') {
        if (Number(headers['upload-offset']) !== u.offset) return { status: 409, headers: {}, body: '' };
        u.parts.push(buf); u.offset += buf.length;
        if (u.offset >= u.len) {
          const r = await putObject(u.meta.bucketName, u.meta.objectName, Buffer.concat(u.parts), u.meta.contentType, claims, true);
          if (r.status !== 200) return r;
          tus.delete(m[1]);
        }
        return { status: 204, headers: { 'Upload-Offset': String(u.offset), 'Tus-Resumable': '1.0.0' }, body: '' };
      }
    }
    return json(400, { message: `unsupported storage call ${method} ${rest}` });
  }

  async function handle({ method, url: href, headers: rawHeaders, body }) {
    const headers = Object.fromEntries(Object.entries(rawHeaders || {}).map(([k, v]) => [k.toLowerCase(), v]));
    const url = new URL(href);
    const path = url.pathname;
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', 'access-control-expose-headers': 'Location, Upload-Offset, Upload-Length, Tus-Resumable, Content-Range' };
    const done = r => { log.push({ method, path, status: r.status }); return { ...r, headers: { ...cors, ...r.headers } }; };
    if (method === 'OPTIONS') return done({ status: 204, headers: {}, body: '' });
    for (const f of faults) if (f.times > 0 && f.match.test(`${method} ${path}`)) { f.times -= 1; return done(json(f.status, { message: 'simulated outage' })); }
    const buf = Buffer.isBuffer(body) ? body : Buffer.from(body || '');
    const claims = claimsOf(headers);
    if (claims === 'invalid') return done(json(401, { message: 'invalid JWT', code: 'PGRST301' }));
    if (path === '/auth/v1/token') {
      const b = JSON.parse(buf.toString() || '{}');
      if (url.searchParams.get('grant_type') === 'password') {
        const u = users.get(b.email);
        if (!u || u.password !== b.password) return done(json(400, { error: 'invalid_grant', error_description: 'Invalid login credentials', msg: 'Invalid login credentials', code: 'invalid_credentials' }));
        return done(json(200, session({ ...u, email: b.email })));
      }
      const id = String(b.refresh_token || '').slice(2);
      const e = [...users].find(([, u]) => u.id === id);
      return done(e ? json(200, session({ ...e[1], email: e[0] })) : json(400, { error: 'invalid_grant' }));
    }
    if (path === '/auth/v1/user') {
      if (!claims) return done(json(401, { message: 'no session' }));
      const e = [...users].find(([, u]) => u.id === claims.sub);
      return done(json(200, session({ ...e[1], email: e[0] }).user));
    }
    if (path === '/auth/v1/logout') return done({ status: 204, headers: {}, body: '' });
    let m;
    if ((m = path.match(/^\/rest\/v1\/rpc\/([a-z_]+)$/))) return done(await rpc(m[1], JSON.parse(buf.toString() || '{}'), claims));
    if ((m = path.match(/^\/rest\/v1\/([a-z_]+)$/))) return done(await table(method, m[1], url, buf.length ? JSON.parse(buf.toString()) : null, headers, claims));
    if ((m = path.match(/^\/storage\/v1\/(.+)$/))) return done(await storage(method, m[1], url, buf, headers, claims));
    return done(json(404, { message: 'not emulated' }));
  }
  return { db, handle, addUser, blobs, log, faults };
}
