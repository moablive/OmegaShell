// OmegaShell — conexão que não trava na troca de rede (30/10/2026, pedido do dono: "eu mudo muito de rede wifi
// [...] o omegashell trava"). Fonte da documentação: Google Doc "Projeto - Astral Wave ／ CloudShell", pasta
// awldocs do Drive.
//
// Por que trava: ao trocar de Wi-Fi o WebSocket do ttyd fica meio aberto. O navegador não percebe que ele morreu
// (o ping do ttyd é invisível para a página) e o ttyd só reconecta depois do fechamento, que demora minutos.
// O que este arquivo faz:
//   1. Batimento: o tmux redesenha a 2ª linha da barra a cada 5 s (tmux.conf: status-interval 5 e os segundos
//      escondidos no fim da linha). Qualquer escrita no terminal conta como sinal de vida.
//   2. Conexão morta (12 s sem nada com a aba à vista), rede que voltou, troca de rede (navigator.connection) ou
//      aba que volta do segundo plano sem receber nada: recarrega a página. A sessão tmux continua no servidor;
//      a recarga volta direto ao terminal (sessionStorage cs-recarga, o mesmo do inicio.js), sem a página inicial.
//   3. Antes de recarregar confere se o servidor responde (HEAD /rede.js); sem rede, mostra a faixa e tenta de
//      novo com espera crescente (2, 4, 8, até 10 s); rede que volta no meio da espera tenta na hora. Nunca recarrega sem rede: a página sumiria.
//   4. Faixa "Sem rede · reconectando…" por cima da última tela, no lugar da tela congelada.
(function () {
  'use strict';

  var MORTA_MS = 12000;        // sem nenhuma escrita por este tempo, com a aba à vista = conexão morta
  var VOLTA_MS = 30000;        // aba escondida por mais que isso: confere ao voltar
  var t = null, ultimo = Date.now(), escondida = 0, tentando = false, espera = 2000, timer = null, faixa = null;

  function css() {
    var s = document.createElement('style');
    s.textContent = [
      '#csr{position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:40;display:none;align-items:center;gap:10px;',
      'padding:9px 16px;border-radius:14px;background:rgba(36,36,46,.94);border:1px solid rgba(255,212,59,.55);',
      'color:#f2f2f7;font:600 13px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;',
      'box-shadow:0 10px 30px rgba(0,0,0,.45);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}',
      '#csr.on{display:flex}',
      '#csr i{width:9px;height:9px;border-radius:50%;background:#ffd43b;box-shadow:0 0 8px #ffd43b;animation:csr-p 1s infinite alternate}',
      '#csr.fora i{background:#ff5c7a;box-shadow:0 0 8px #ff5c7a}',
      '@keyframes csr-p{from{opacity:.35}to{opacity:1}}',
      '@media (prefers-reduced-motion:reduce){#csr i{animation:none}}'
    ].join('');
    document.head.appendChild(s);
  }
  function mostra(txt, fora) {
    if (!faixa) {
      faixa = document.createElement('div'); faixa.id = 'csr';
      faixa.appendChild(document.createElement('i'));
      faixa.appendChild(document.createElement('span'));
      document.body.appendChild(faixa);
    }
    faixa.lastChild.textContent = txt;
    faixa.classList.toggle('fora', !!fora);
    faixa.classList.add('on');
  }
  function esconde() { if (faixa) faixa.classList.remove('on'); }

  function vivo() { ultimo = Date.now(); if (!tentando) esconde(); }

  // O servidor responde? HEAD com prazo curto: rede nova pode ficar pendurada no DNS ou no portal do Wi-Fi.
  function servidorResponde() {
    var c = window.AbortController ? new AbortController() : null;
    var prazo = setTimeout(function () { if (c) c.abort(); }, 5000);
    return fetch('/rede.js', { method: 'HEAD', cache: 'no-store', signal: c ? c.signal : undefined })
      .then(function (r) { clearTimeout(prazo); return r.ok; })
      .catch(function () { clearTimeout(prazo); return false; });
  }

  function reconecta(motivo) {
    // Já tentando: rede voltou ou trocou no meio da espera — tenta agora, sem esperar o próximo intervalo.
    if (tentando) { espera = 2000; tenta(); return; }
    tentando = true;
    mostra(motivo + ' · reconectando…', false);
    tenta();
  }
  function tenta() {
      clearTimeout(timer);
      if (navigator.onLine === false) {
        mostra('Sem rede · reconecta sozinho quando voltar', true);
        timer = setTimeout(tenta, espera); espera = Math.min(espera * 2, 10000);
        return;
      }
      servidorResponde().then(function (ok) {
        if (!ok) {
          mostra('Sem conexão com o servidor · tentando de novo…', true);
          timer = setTimeout(tenta, espera); espera = Math.min(espera * 2, 10000);
          return;
        }
        // Chegou um dado enquanto conferia? A conexão voltou sozinha: nada a recarregar.
        if (Date.now() - ultimo < 3000) { tentando = false; espera = 2000; esconde(); return; }
        try { sessionStorage.setItem('cs-recarga', '1'); } catch (e) {}
        mostra('Reconectando ao terminal…', false);
        location.reload();
      });
  }

  function vigia() {
    if (document.visibilityState !== 'visible' || tentando) return;
    if (Date.now() - ultimo > MORTA_MS) reconecta('Conexão parada');
  }

  function liga() {
    css();
    // Qualquer escrita do servidor no terminal = conexão viva (o batimento do tmux garante uma a cada 5 s).
    // onRender só de reserva: ele também dispara com rolagem e redimensionamento feitos aqui na página.
    if (t.onWriteParsed) t.onWriteParsed(vivo);
    else if (t.onRender) t.onRender(vivo);
    setInterval(vigia, 3000);
    window.addEventListener('offline', function () { mostra('Sem rede · reconecta sozinho quando voltar', true); });
    window.addEventListener('online', function () { reconecta('Rede voltou'); });
    // Troca de rede sem passar por "offline" (Wi-Fi para Wi-Fi, Wi-Fi para 4G): onde o navegador avisa.
    var cx = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (cx && cx.addEventListener) cx.addEventListener('change', function () {
      // Dá 4 s para o ttyd mostrar que ainda está vivo; sem nada, a conexão era da rede antiga.
      var antes = ultimo;
      setTimeout(function () { if (ultimo === antes) reconecta('Rede trocada'); }, 4000);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') { escondida = Date.now(); return; }
      if (!escondida || Date.now() - escondida < VOLTA_MS) return;
      // Voltou do segundo plano (celular): se em 5 s não chegar nada, a conexão morreu enquanto dormia.
      var antes = ultimo;
      setTimeout(function () { if (ultimo === antes) reconecta('De volta'); }, 5000);
    });
  }

  var n = 0, i = setInterval(function () {
    t = window.term;
    if (t || ++n > 150) { clearInterval(i); if (t) liga(); }
  }, 100);
})();
