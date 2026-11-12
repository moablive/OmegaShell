// CloudShell — entrada direta na tela de Sessões (12/11/2026, pedido do dono: "não ter mais o botão início e não ter os
// botões sh, mostrar apenas as sessões direto"). Até então este arquivo desenhava a página inicial ("Para onde vamos?",
// cartões Ω Sessões e 🧾 Scripts ~/sh, botão ⌂ no canto), criada em 27/10/2026; ela saiu inteira. Os ~/sh o Claude roda
// sozinho (Regra 17 do Ômega) e aparecem no cartão 🧾 Scripts ~/sh do Parlamento, no Escritórios 3D.
// Fonte da documentação: Google Doc "Projeto - Astral Wave ／ CloudShell", pasta 📦 Documentação do servidor do Drive.
//
// O que ficou aqui: carregar os outros scripts da página, levar para a aba omega (Sessões) ao abrir e conferir a
// versão da página. O login (LoginHUB + 2FA) e o ttyd não mudam.
(function () {
  'use strict';

  // A tela de Sessões (sessoes.js) entra por aqui: o sub_filter do nginx.conf já está no limite de tamanho.
  // logos.js (os logos dos servidores embutidos, gerado por pwa/servidores/gerar-logos.sh) vem antes, em ordem.
  // rede.js (30/10/2026): conexão que não trava na troca de Wi-Fi.
  ['/logos.js', '/sessoes.js', '/rede.js'].forEach(function (u) {
    var ss = document.createElement('script'); ss.src = u; ss.async = false;
    (document.head || document.documentElement).appendChild(ss);
  });

  var t;
  function digita(d) {
    if (!t) t = window.term;
    if (!t) return;
    if (t.input) t.input(d, true);
    else t._core.coreService.triggerDataEvent(d, true);
  }
  // \e[94~ = User5 do tmux.conf: select-window na omega, onde a tela de Sessões (sessoes.js) fica na frente.
  function sessoes() { digita('\x1b[94~'); }
  window.csSessoes = sessoes;   // o ☰ da barra (botoes.js, tipo "inicio") também traz para cá

  // O tmux diz a aba ativa no attach e a cada troca (evento "aba" do botoes.sh esconde). Página recém-aberta: vai
  // para as Sessões, esteja onde estiver. Recarga automática (versão nova, rede): fica na aba em que estava.
  // A janela conselho não tem tela: cair nela (fechar outra aba) também leva às Sessões.
  var recarga = false, primeira = true;
  try { recarga = sessionStorage.getItem('cs-recarga') === '1'; sessionStorage.removeItem('cs-recarga'); } catch (e) {}
  window.addEventListener('cs-menu', function (ev) {
    var m = ev.detail;
    if (!m || m.tipo !== 'aba') return;
    var abrir = primeira && !recarga;
    primeira = false;
    if (m.w !== 'omega' && (abrir || m.w === 'conselho')) sessoes();
  });

  // Página nova no servidor (27/10/2026): reconstruir o container só reconecta o terminal, e a página continuava
  // com os scripts velhos até um Cmd+R. A cada 20 s confere a versão (ETag) dos scripts da página; mudou, ela
  // recarrega sozinha — sem tecla nos últimos 8 s, para não cortar o que se digita — e volta direto ao terminal
  // (as abas e sessões tmux continuam no servidor).
  var versao = null, tecla = 0;
  document.addEventListener('keydown', function () { tecla = Date.now(); }, true);
  function confere() {
    Promise.all(['/botoes.js', '/inicio.js', '/sessoes.js', '/logos.js', '/rede.js'].map(function (u) {
      return fetch(u, { method: 'HEAD', cache: 'no-store' }).then(function (r) {
        return r.ok ? (r.headers.get('etag') || r.headers.get('last-modified') || '') : '';
      });
    })).then(function (v) {
      v = v.join('|');
      if (v.indexOf('||') >= 0 || v.charAt(0) === '|') return;   // servidor voltando: confere na próxima
      if (versao === null) { versao = v; return; }
      if (v !== versao && Date.now() - tecla > 8000) {
        try { sessionStorage.setItem('cs-recarga', '1'); } catch (e) {}
        location.reload();
      }
    }).catch(function () {});
  }
  setTimeout(confere, 3000);
  setInterval(confere, 20000);
})();
