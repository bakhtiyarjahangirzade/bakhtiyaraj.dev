// Published owner comics: the public catalogue (public.luna_catalogue) and short-lived signed page URLs.
// Plain fetch with the publishable key, so anonymous readers never download the Supabase client.
// Storage policies decide what can be signed: visitors only get the cover and the pages the title's access
// rule makes public; drafts, sources and paid non-preview pages are refused by the server, not hidden here.
import { SB_URL, SB_KEY, PAGES_BUCKET, SIGN_SECONDS } from './config.js';
import { toTitle } from './published.js';

const headers = token => ({ apikey: SB_KEY, Authorization: `Bearer ${token || SB_KEY}`, 'Content-Type': 'application/json' });

export async function fetchCatalogue({ signal } = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/rpc/luna_catalogue`, { method: 'POST', headers: headers(), body: '{}', signal });
  const body = await r.json().catch(() => null);
  if (!r.ok) { const e = new Error(body?.message || `HTTP ${r.status}`); e.code = body?.code || String(r.status); throw e; }
  return (Array.isArray(body) ? body : []).map(row => toTitle(row));
}

// Signs paths in one request. Returns Map(path -> absolute URL); paths the server refuses are left out.
export async function signPaths(paths, { token, signal } = {}) {
  const out = new Map();
  const list = [...new Set(paths.filter(Boolean))];
  for (let i = 0; i < list.length; i += 100) {
    const chunk = list.slice(i, i + 100);
    const r = await fetch(`${SB_URL}/storage/v1/object/sign/${PAGES_BUCKET}`, { method: 'POST', headers: headers(token), body: JSON.stringify({ expiresIn: SIGN_SECONDS, paths: chunk }), signal });
    const body = await r.json().catch(() => null);
    if (!r.ok) { const e = new Error(body?.message || `HTTP ${r.status}`); e.code = body?.error || String(r.status); throw e; }
    for (const item of body || []) if (item?.signedURL && !item.error) out.set(item.path, `${SB_URL}/storage/v1${item.signedURL}`);
  }
  return out;
}

// Gives a remote title live URLs: t.urls (Map) plus t.refresh() for expiry/long reading sessions.
// `token` is an editor access token for draft previews; visitors sign anonymously.
export function attachSigner(t, getToken = async () => null) {
  let expires = 0, pending = null;
  t.urls ||= new Map();
  const wanted = () => [t.cover?.path, t.cover?.sm, ...t.pages];
  t.refresh = (force = true) => {
    if (!force && Date.now() < expires - 5 * 60e3 && wanted().every(p => !p || t.urls.has(p))) return Promise.resolve(t);
    pending ||= (async () => {
      const token = await getToken();
      const urls = await signPaths(wanted(), { token });
      for (const [k, v] of urls) t.urls.set(k, v);
      expires = Date.now() + SIGN_SECONDS * 1000;
      return t;
    })().finally(() => { pending = null; });
    return pending;
  };
  t.ensure = () => t.refresh(false);
  return t;
}

// Signs only covers for a list of titles (catalogue cards) in one request.
export async function signCovers(list) {
  const urls = await signPaths(list.flatMap(t => [t.cover?.path, t.cover?.sm]));
  for (const t of list) for (const p of [t.cover?.path, t.cover?.sm]) if (urls.has(p)) t.urls.set(p, urls.get(p));
}
