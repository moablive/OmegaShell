// Service worker mínimo: torna o CloudShell instalável. Não guarda nada em cache —
// terminal sem rede não tem utilidade, e o HTML do ttyd tem que vir sempre do servidor.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
