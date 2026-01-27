/**
 * ROTA KAMISHIBAI - Service Worker
 * Versão: 1.0.1 (Mude este número para forçar atualização nos clientes)
 */

const CACHE_NAME = "rota-kamishibai-v1.0.1";

// Arquivos essenciais para funcionamento offline
const STATIC_ASSETS = [
    "./",
    "./index.html",
    "./manifest.json",
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    "https://unpkg.com/heic2any/dist/heic2any.min.js"
];

/**
 * INSTALAÇÃO: Cria o cache e armazena os arquivos estáticos
 */
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("[SW] Instalando e cacheando ativos estáticos");
            return cache.addAll(STATIC_ASSETS);
        })
    );
    // Força o Service Worker a se tornar ativo imediatamente
    self.skipWaiting();
});

/**
 * ATIVAÇÃO: Limpa versões antigas do cache para liberar espaço
 */
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log("[SW] Removendo cache antigo:", cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    // Garante que o SW controle a página imediatamente
    self.clients.claim();
});

/**
 * ESTRATÉGIA DE FETCH:
 * 1. Para arquivos do App (index/CSS/JS): Stale-While-Revalidate (Usa cache, mas atualiza no fundo)
 * 2. Para outros: Cache First
 */
self.addEventListener("fetch", (event) => {
    // Ignora requisições que não sejam GET (como envios de formulário, se houvesse)
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Atualiza o cache com a nova versão encontrada na rede
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Silencioso: falha de rede ao tentar atualizar o fundo
            });

            // Retorna o que estiver no cache IMEDIATAMENTE, ou espera a rede se não houver cache
            return cachedResponse || fetchPromise;
        })
    );
});
