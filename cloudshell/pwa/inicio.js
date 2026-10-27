// CloudShell — página inicial (27/10/2026, pedido do dono: "ele precisa iniciar por uma página geral bonita").
// A mesa do Conselho desenhada saiu no mesmo dia: os escritórios (Conselho incluído) moram no Escritórios 3D
// (https://escritorios.example.com), que substituiu o Hermes3D.
// Fonte da documentação: Google Doc "Projeto - Astral Wave ／ CloudShell", pasta awldocs do Drive.
//
// Camada por cima do terminal, como os botões do ⌥ Tab (botoes.js): o login (LoginHUB + 2FA) e o ttyd não
// mudam. Abre ao carregar a página e pelo ⌂ no canto. Cada cartão só DIGITA no terminal a tecla que o
// tmux.conf liga à janela (User4–User7: conselho, omega, sh, nova sessão); Continuar (ou Esc) só fecha.
(function () {
  'use strict';

  // A tela de Sessões (sessoes.js) entra por aqui: o sub_filter do nginx.conf já está no limite de tamanho.
  // logos.js (os logos dos servidores embutidos, gerado por pwa/servidores/gerar-logos.sh) vem antes, em ordem.
  ['/logos.js', '/sessoes.js'].forEach(function (u) {
    var ss = document.createElement('script'); ss.src = u; ss.async = false;
    (document.head || document.documentElement).appendChild(ss);
  });

  var CSS = [
    '#csi{position:fixed;inset:0;z-index:30;display:none;overflow:auto;color:#f2f2f7;',
    'font:500 14px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",system-ui,sans-serif;',
    'background:radial-gradient(1200px 600px at 50% 38%,rgba(124,77,255,.22),transparent 60%),',
    'radial-gradient(800px 500px at 85% 100%,rgba(59,201,219,.10),transparent 60%),#0b0b14}',
    '#csi.on{display:block;animation:csi-in .22s cubic-bezier(.445,.05,.55,.95)}',
    '@keyframes csi-in{from{opacity:0}to{opacity:1}}',
    '#csi .w{min-height:100%;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;',
    'justify-content:center;gap:14px;padding:28px 16px 22px}',
    '#csi .marca{font-size:11.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:rgba(242,242,247,.5)}',
    '#csi h1{margin:0;font-size:30px;font-weight:700;letter-spacing:-.01em;text-align:center}',
    '#csi h1 span{background:linear-gradient(90deg,#ffd8a8,#b388ff);-webkit-background-clip:text;background-clip:text;color:transparent}',
    '#csi .hora{font-size:13px;color:rgba(242,242,247,.55);text-align:center}',
    '#csi .cs{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:820px}',
    '#csi .c{all:unset;box-sizing:border-box;position:relative;width:150px;padding:16px 10px 13px;border-radius:20px;cursor:pointer;',
    'display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;',
    'background:rgba(36,36,46,.72);border:1px solid rgba(255,255,255,.10);',
    'box-shadow:0 10px 30px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.06);',
    'transition:background .18s,transform .25s cubic-bezier(.445,.05,.55,.95),border-color .18s}',
    '#csi .c.s{background:rgba(255,255,255,.16);border-color:rgba(179,136,255,.6);transform:translateY(-2px)}',
    '#csi .c:active{transform:scale(.96)}',
    '#csi .c .e{font-size:34px;line-height:40px}',
    '#csi .c .r{font-size:14px;font-weight:600}',
    '#csi .c .d{font-size:11.5px;color:rgba(242,242,247,.55);line-height:1.3}',
    '#csi .c .k{position:absolute;top:8px;right:9px;min-width:16px;padding:0 4px;border-radius:6px;',
    'font:600 10px ui-monospace,Menlo,monospace;line-height:16px;color:#14141f;background:rgba(179,136,255,.9)}',
    '#csi .p{font-size:11px;color:rgba(242,242,247,.4);text-align:center}',
    '#csi-v{position:fixed;right:14px;bottom:92px;z-index:20;border:1px solid rgba(255,255,255,.16);border-radius:14px;',
    'padding:6px 10px;opacity:.6;background:rgba(36,36,46,.7);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);',
    'color:#f2f2f7;font:600 13px system-ui,sans-serif;cursor:pointer}',
    '#csi-v.esc{display:none}',
    '@media (max-width:600px){#csi h1{font-size:23px}#csi .c{width:calc(50% - 5px)}#csi .p{display:none}}',
    '@media (prefers-reduced-motion:reduce){#csi.on{animation:none}}'
  ].join('');

  // Cartões: rótulo, detalhe, ícone, o que digita no terminal (as teclas User4–User7 do tmux.conf; null = só fecha).
  var CARTOES = [
    ['📜', 'Conselho Ômega', 'conversar com o conselheiro', '\x1b[95~'],
    ['Ω', 'Sessões', 'omega: Claude, Gemini, terminais', '\x1b[94~'],
    ['🧾', 'Scripts ~/sh', 'o que falta rodar', '\x1b[93~'],
    ['🖥️', 'Nova sessão', 'servidor, IA e nome', '\x1b[92~'],
    ['⌨️', 'Continuar', 'voltar à aba de antes', null]
  ];

  var t, raiz, volta, cards = [], sel = 0, aberto = false;

  function digita(d) {
    if (!t) return;
    if (t.input) t.input(d, true);
    else t._core.coreService.triggerDataEvent(d, true);
  }

  function marca() { cards.forEach(function (c, n) { c.classList.toggle('s', n === sel); }); }

  function hora() {
    var h = raiz.querySelector('.hora'), a = new Date(), x = a.getHours();
    h.textContent = (x < 12 ? 'Bom dia' : x < 18 ? 'Boa tarde' : 'Boa noite') + ' · ' +
      a.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' +
      a.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function abre() { aberto = true; sel = 0; marca(); hora(); raiz.classList.add('on'); volta.classList.add('esc'); }
  function fecha() { aberto = false; raiz.classList.remove('on'); volta.classList.remove('esc'); if (t) t.focus(); }
  function escolhe(n) {
    var c = CARTOES[n];
    if (!c) return;
    fecha();
    if (c[3]) digita(c[3]);
  }

  function teclado(e) {
    if (!aberto) return;
    // ⌥ Tab: a página sai da frente e os botões do botoes.js abrem como sempre.
    if (e.code === 'Tab' && e.altKey) { fecha(); return; }
    if (e.metaKey || e.ctrlKey) return;
    var k = e.key, n = CARTOES.length;
    if (k === 'ArrowRight' || k === 'ArrowDown' || (k === 'Tab' && !e.shiftKey)) { sel = (sel + 1) % n; marca(); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'Tab') { sel = (sel + n - 1) % n; marca(); }
    else if (k === 'Enter') escolhe(sel);
    else if (k === 'Escape') fecha();
    else if (/^[1-9]$/.test(k) && +k <= n) escolhe(+k - 1);
    // Com a página na frente nada vai para o terminal às cegas.
    e.preventDefault(); e.stopPropagation();
  }

  function monta() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    raiz = document.createElement('div'); raiz.id = 'csi';
    var w = document.createElement('div'); w.className = 'w'; raiz.appendChild(w);
    var mc = document.createElement('div'); mc.className = 'marca'; mc.textContent = 'Astral Wave · CloudShell'; w.appendChild(mc);
    var h1 = document.createElement('h1'); h1.appendChild(document.createTextNode('Para onde '));
    var sp = document.createElement('span'); sp.textContent = 'vamos?'; h1.appendChild(sp); w.appendChild(h1);
    var hr = document.createElement('div'); hr.className = 'hora'; w.appendChild(hr);
    var cs = document.createElement('div'); cs.className = 'cs'; w.appendChild(cs);
    CARTOES.forEach(function (c, n) {
      var b = document.createElement('button'); b.type = 'button'; b.tabIndex = -1; b.className = 'c';
      [['e', c[0]], ['r', c[1]], ['d', c[2]], ['k', String(n + 1)]].forEach(function (p) {
        var s = document.createElement('span'); s.className = p[0]; s.textContent = p[1]; b.appendChild(s);
      });
      b.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
      b.addEventListener('mouseover', function () { if (sel !== n) { sel = n; marca(); } });
      b.addEventListener('click', function () { escolhe(n); });
      cs.appendChild(b); cards.push(b);
    });
    var p = document.createElement('div'); p.className = 'p';
    p.textContent = '1–5 ou ← → e ⏎ · esc continua · ⌥ Tab abre os menus · ⌂ no canto volta para cá';
    w.appendChild(p);
    volta = document.createElement('button'); volta.id = 'csi-v'; volta.type = 'button'; volta.tabIndex = -1;
    volta.textContent = '⌂'; volta.title = 'Página inicial';
    volta.addEventListener('mousedown', function (e) { e.preventDefault(); });
    volta.addEventListener('click', abre);
    document.body.appendChild(raiz); document.body.appendChild(volta);
    document.addEventListener('keydown', teclado, true);
    setInterval(function () { if (aberto) hora(); }, 30000);
    // Recarga automática (versão nova): volta direto ao terminal, sem a página inicial.
    var recarga = false;
    try { recarga = sessionStorage.getItem('cs-recarga') === '1'; sessionStorage.removeItem('cs-recarga'); } catch (e) {}
    if (!recarga) abre();
  }

  if (document.body) monta(); else document.addEventListener('DOMContentLoaded', monta);

  // Página nova no servidor (27/10/2026): reconstruir o container só reconecta o terminal, e a página continuava
  // com os scripts velhos até um Cmd+R. A cada 20 s confere a versão (ETag) dos scripts da página; mudou, ela
  // recarrega sozinha — sem tecla nos últimos 8 s, para não cortar o que se digita — e volta direto ao terminal
  // (as abas e sessões tmux continuam no servidor).
  var versao = null, tecla = 0;
  document.addEventListener('keydown', function () { tecla = Date.now(); }, true);
  function confere() {
    Promise.all(['/botoes.js', '/inicio.js', '/sessoes.js', '/logos.js'].map(function (u) {
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
  var n = 0, i = setInterval(function () {
    t = window.term;
    if (t || ++n > 100) clearInterval(i);
  }, 100);
})();
