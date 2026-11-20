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

  // Viewport (18/11/2026, pedido do dono: "ajustar todo o omega shell para mobile"; plano do 🎨 UI): a página do ttyd
  // não tem <meta name=viewport>, e o celular desenhava tudo a 980 px e encolhia (texto ilegível; os @media de
  // sessoes.js e botoes.js nunca disparavam). O sub_filter do nginx está no limite, então ela entra por aqui.
  // Sem maximum-scale/user-scalable: o pinça-zoom continua (HIG, ampliação até 200%). viewport-fit=cover libera o
  // env(safe-area-inset-*); interactive-widget=resizes-content faz o teclado virtual encolher o terminal, não cobri-lo.
  // No computador width=device-width é o comportamento que já havia.
  if (!document.querySelector('meta[name=viewport]')) {
    var vp = document.createElement('meta');
    vp.name = 'viewport';
    vp.content = 'width=device-width,initial-scale=1,viewport-fit=cover,interactive-widget=resizes-content';
    (document.head || document.documentElement).appendChild(vp);
  }

  // A tela de Sessões (sessoes.js) entra por aqui: o sub_filter do nginx.conf já está no limite de tamanho.
  // logos.js (os logos dos servidores embutidos, gerado por pwa/servidores/gerar-logos.sh) vem antes, em ordem.
  // rede.js (30/10/2026): conexão que não trava na troca de Wi-Fi.
  // botoes.js também entra por aqui desde 20/11/2026, e todos com a versão no endereço (__CS_V__ = resumo dos scripts,
  // posto no build pelo Dockerfile; o nginx põe a mesma no endereço deste arquivo): a Cloudflare e o navegador
  // guardavam os scripts por até 4 h e a página seguia com o código velho depois de um deploy.
  ['/botoes.js', '/logos.js', '/sessoes.js', '/rede.js'].forEach(function (u) {
    var ss = document.createElement('script'); ss.src = u + '?v=__CS_V__'; ss.async = false;
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
  // A aba fixa sh também (12/11/2026, pedido do dono: "o painel bugou voltando ao sh e ele deveria sempre retornar ao
  // início"): ao fechar uma aba o tmux caía nela, vizinha da omega, e a tela Scripts ~/sh aparecia. Agora a sh nunca
  // fica na frente no OmegaShell; os ~/sh se veem no Parlamento do Escritórios 3D.
  var recarga = false, primeira = true;
  try { recarga = sessionStorage.getItem('cs-recarga') === '1'; sessionStorage.removeItem('cs-recarga'); } catch (e) {}

  // Capa de abertura (17/11/2026, pedido do dono: "exibe algumas telas de terminal ainda… ir direto"): entre a página
  // abrir e a tela de Sessões entrar, o terminal aparecia cru — o ssh conectando, o attach do tmux e a aba que
  // tinha ficado na frente da última vez. A capa cobre o terminal até o tmux dizer a aba ativa; indo para as
  // Sessões, fica até a troca de aba. Abaixo da tela de Sessões (#css, z-index 15). Teto de 8 s: erro do login
  // ("sem a chave do awlsrv", "sem conta do LoginHUB") sai no terminal e precisa ser visto.
  var CAPA_TETO_MS = 8000;
  var capa = document.createElement('div');
  capa.id = 'cs-capa';
  capa.style.cssText = 'position:fixed;inset:0;z-index:14;display:flex;align-items:center;justify-content:center;' +
    'color:rgba(242,242,247,.6);font:600 14px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;' +
    'letter-spacing:.04em;background:radial-gradient(1100px 520px at 50% 0%,rgba(124,77,255,.20),transparent 60%),#0b0b14';
  capa.textContent = 'Ω OmegaShell · abrindo…';
  (document.body || document.documentElement).appendChild(capa);
  function tiraCapa() { if (capa) { capa.remove(); capa = null; } }
  setTimeout(tiraCapa, CAPA_TETO_MS);

  window.addEventListener('cs-menu', function (ev) {
    var m = ev.detail;
    if (!m || m.tipo !== 'aba') return;
    var abrir = primeira && !recarga;
    primeira = false;
    // Indo para as Sessões: a capa espera o "aba" da omega (a tela de Sessões entra na mesma hora, por cima).
    if (m.w !== 'omega' && (abrir || m.w === 'conselho' || m.w === 'sh')) sessoes();
    else tiraCapa();
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
