const CACHE_NAME = "rota-kamishibai-v2";

const FILES_TO_CACHE = [
  "./",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// Instalação e cache de arquivos essenciais
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Ativação
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

// Estratégia fetch: network first, fallback cache
self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("jspdf") || e.request.url.includes("heic2any") || e.request.url.endsWith("index.html")) {
    // Network first para scripts e HTML
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // Atualiza cache
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache first para ícones, manifest e outros assets
    e.respondWith(
      caches.match(e.request).then(res => res || fetch(e.request))
    );
  }
});
