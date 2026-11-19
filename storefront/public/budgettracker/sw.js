// The build replaces both tokens with a versioned, complete dependency graph.
const CACHE='bt-__BT_VERSION__';
const SHELL=/*__BT_SHELL__*/['/budgettracker/'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const own=(await caches.keys()).filter(key=>key.startsWith('bt-'));
  const obsolete=own.filter(key=>key!==CACHE).slice(0,-1);
  await Promise.all(obsolete.map(key=>caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||request.headers.has('range'))return;
  if(url.pathname.endsWith('.apk')||url.pathname.endsWith('/sw.js'))return;
  if(request.mode==='navigate'&&/^\/budgettracker(?:\/|$)/.test(url.pathname)){
    event.respondWith(fetch(request).then(response=>response.ok?response:caches.open(CACHE).then(c=>c.match('/budgettracker/')).then(hit=>hit||response)).catch(()=>caches.open(CACHE).then(c=>c.match('/budgettracker/'))));return;
  }
  if(SHELL.includes(url.pathname))event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(request,{ignoreSearch:true,ignoreVary:true}))||fetch(request)));
});
