const CACHE="aapkidhun-v3";
const ASSETS=[
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icon.svg"
];

self.addEventListener("install",(e)=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>{
      return c.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate",(e)=>{
  e.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.map(k=>k!==CACHE?caches.delete(k):null))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch",(e)=>{
  e.respondWith(
    caches.match(e.request).then(r=>{
      if(r) return r;
      return fetch(e.request).then(response=>{
        if(!response||response.status!==200) return response;
        const clone=response.clone();
        caches.open(CACHE).then(c=>c.put(e.request,clone));
        return response;
      }).catch(()=>caches.match("./index.html"));
    })
  );
});
