const CACHE_NAME = "rota-kamishibai-v3";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  "https://unpkg.com/heic2any/dist/heic2any.min.js"
];

// Instalação
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação (Limpa caches antigos)
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

// Estratégia Fetch
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request).then(fetchRes => {
        return caches.open(CACHE_NAME).then(cache => {
          // Opcional: colocar novos requests no cache
          if(e.request.method === 'GET') cache.put(e.request, fetchRes.clone());
          return fetchRes;
        });
      });
    }).catch(() => {
      // Se estiver offline e sem cache
      if (e.request.mode === 'navigate') return caches.match("./index.html");
    })
  );
});
