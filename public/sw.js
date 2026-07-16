// Service worker minimo do CA.RO Clinic - existe principalmente para que o
// Chrome/Edge (desktop e Android) e o Safari (iOS) considerem o site
// instalavel como app (icone na Dock/tela inicial, abrindo em janela
// propria sem barra de navegador). Nao faz cache agressivo de nada: todas as
// chamadas de API (/api/...) e o HTML/JS/CSS sempre vao direto pra rede, pra
// nunca servir dados de paciente desatualizados ou stale. O unico cache e o
// dos icones do proprio app (que nao mudam), so pra abrir mais rapido.

const CACHE_NAME = "caro-clinic-shell-v1";
const SHELL_ASSETS = [
    "/icons/icon-192.png",
    "/icons/icon-512.png",
  ];

self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
          caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {})
        );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
          caches.keys().then((keys) =>
                  Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
                                 )
        );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

                        if (url.pathname.startsWith("/api/")) return;

                        if (url.pathname.startsWith("/icons/")) {
                              event.respondWith(
                                      caches.match(event.request).then((cached) => cached || fetch(event.request))
                                    );
                              return;
                        }
});
