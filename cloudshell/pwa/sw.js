// Service worker do OmegaShell: torna o app instalável. Não guarda nada em cache — o HTML do ttyd tem que vir
// sempre do servidor (passa pelo login do LoginHUB).
// Sem rede (30/10/2026, troca de Wi-Fi): abrir ou recarregar a página sem conexão dava o erro do navegador e o PWA
// ficava parado nele. Agora uma navegação que falha recebe uma tela do próprio OmegaShell que tenta de novo
// sozinha a cada 3 s e volta direto ao terminal quando o servidor responde. Só navegação: o resto segue normal.
// Documentação: "Projeto - Astral Wave ／ CloudShell", pasta awldocs do Drive.
const SEM_REDE = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>OmegaShell · sem rede</title>
<style>html,body{height:100%;margin:0;background:#0b0b14;color:#f2f2f7;font:500 15px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}
.w{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;box-sizing:border-box;text-align:center}
i{width:12px;height:12px;border-radius:50%;background:#ff5c7a;box-shadow:0 0 10px #ff5c7a;animation:p 1s infinite alternate}
@keyframes p{from{opacity:.35}to{opacity:1}} small{color:rgba(242,242,247,.55)}</style></head>
<body><div class="w"><i></i><b>Sem rede</b><small>As sessões continuam rodando no servidor.<br>O OmegaShell volta sozinho quando a conexão voltar.</small></div>
<script>
function tenta(){fetch('/rede.js',{method:'HEAD',cache:'no-store'}).then(function(r){if(r.ok){try{sessionStorage.setItem('cs-recarga','1')}catch(e){}location.reload()}}).catch(function(){})}
setInterval(tenta,3000);addEventListener('online',tenta);
</script></body></html>`;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() =>
    new Response(SEM_REDE, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })));
});
