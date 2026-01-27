/**
 * ROTA KAMISHIBAI - Service Worker
 * Versão: 1.0.5
 */

const CACHE_NAME = "rota-kamishibai-v1.0.5";

// Arquivos essenciais para funcionamento offline
const STATIC_ASSETS = [
    "./",
    "./index.html",
    "./manifest.json",
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    "https://unpkg.com/heic2any/dist/heic2any.min.js"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    // AJUSTE NECESSÁRIO: Ignora chamadas do Firebase e Analytics para não quebrar o tempo real
    if (event.request.url.includes("firebase") || event.request.url.includes("google")) {
        return; 
    }

    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Falha de rede
            });

            return cachedResponse || fetchPromise;
        })
    );
});

