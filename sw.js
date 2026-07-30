/* Shell cache only. Market data is cross-origin and is never intercepted,
   so the model always talks to Coinbase live. Network-first so a new build
   lands immediately; cache is purely the offline fallback.
   BUMP CACHE ON EVERY PUBLISH or phones keep the old build. */
const CACHE="edge-v5";
const SHELL=["./","./index.html","./manifest.webmanifest",
             "./icon-180.png","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys()
    .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return;          // Coinbase / news / sentiment: hands off
  e.respondWith(
    fetch(e.request).then(r=>{
      const copy=r.clone();
      caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
      return r;
    }).catch(()=>caches.match(e.request).then(m=>m||caches.match("./index.html")))
  );
});
