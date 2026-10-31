// BAKHY Budget service worker: caches the app shell and static assets; never touches API calls (Supabase) or audio-range requests.
const CACHE = 'bt-v1';
const SHELL = ['/budgettracker/', '/budgettracker/manifest.webmanifest', '/budgettracker/icon.svg', '/vendor/supabase.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || req.headers.has('range')) return;
  const ok = url.pathname.startsWith('/budgettracker/') || url.pathname.startsWith('/assets/') || url.pathname === '/vendor/supabase.js';
  if (!ok || url.pathname.endsWith('.apk')) return;
  // navigation: network first, fall back to the cached shell so the app opens offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put('/budgettracker/', copy)); return r; }).catch(() => caches.match('/budgettracker/')));
    return;
  }
  // everything else: stale-while-revalidate
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req);
    const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
