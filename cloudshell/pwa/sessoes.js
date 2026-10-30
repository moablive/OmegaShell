// CloudShell — telas de Sessões e de Scripts (27/10/2026, pedidos do dono: "crie o novo layout para sessões também,
// de cada servidor, com suporte a logo; deixe o logo vazio por hora" e "o layout dos sh ainda mostra o velho").
// Fonte da documentação: Google Doc "Projeto - Astral Wave ／ CloudShell", pasta awldocs do Drive.
//
// Nas abas omega e sh, por cima da lista em texto: o menu que o omega manda (OSC 7717, recebido pelo botoes.js e
// repassado no evento "cs-menu"; id "menu" = sessões, "sh" = scripts) vira um bloco por servidor — logo, nome, no
// ar ou não — com um cartão por sessão (grade) ou uma linha por ~/sh (lista, nome inteiro; os ↻ reutilizáveis
// numa divisão à parte). Ao vivo: o omega reenvia a cada segundo e relê a cada 3 s. Como nos botões, o clique só
// DIGITA a tecla do item (nº⏎, n⏎, r⏎…); o omega continua lendo do teclado. A lista em texto nunca aparece
// (28/10/2026, pedido do dono): Esc abre a página inicial e o ⌥ Tab abre os botões por cima desta tela.
//
// Logo do servidor: /servidores/<nome>.svg ou .png (pwa/servidores/, nome em minúsculas: awlsrv,
// srv2, mac). Sem arquivo, fica o espaço tracejado com a inicial.
(function () {
  'use strict';

  var CSS = [
    '#css{position:fixed;inset:0;z-index:15;display:none;overflow:auto;color:#f2f2f7;',
    'font:500 14px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",system-ui,sans-serif;',
    'background:radial-gradient(1100px 520px at 50% 0%,rgba(124,77,255,.20),transparent 60%),',
    'radial-gradient(800px 500px at 90% 100%,rgba(59,201,219,.08),transparent 60%),#0b0b14}',
    '#css.on{display:block}',
    '#css.enviando .w{opacity:.45;pointer-events:none;transition:opacity .15s}',
    '#css.enviando::after{content:"abrindo…";position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);padding:12px 22px;',
    'border-radius:14px;background:rgba(36,36,46,.92);border:1px solid rgba(179,136,255,.5);font-weight:600}',
    '#css .w{max-width:1120px;margin:0 auto;padding:22px 16px 28px;box-sizing:border-box}',
    '#css .topo{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:18px}',
    '#css .marca{font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:rgba(242,242,247,.5)}',
    '#css h1{margin:4px 0 0;font-size:26px;font-weight:700;letter-spacing:-.01em}',
    '#css h1 small{font-size:13px;font-weight:500;color:rgba(242,242,247,.5);margin-left:8px}',
    '#css .acoes{display:flex;flex-wrap:wrap;gap:8px}',
    '#css .a{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;gap:7px;padding:8px 13px;',
    'border-radius:12px;background:rgba(36,36,46,.75);border:1px solid rgba(255,255,255,.10);font-size:13px;font-weight:600;',
    'transition:background .15s,border-color .15s}',
    '#css .a:hover{background:rgba(255,255,255,.12);border-color:rgba(179,136,255,.5)}',
    '#css .a kbd{font:600 10px ui-monospace,Menlo,monospace;color:#14141f;background:rgba(179,136,255,.9);border-radius:5px;padding:0 4px}',
    '#css .srv{margin-top:16px;border-radius:22px;padding:16px;background:rgba(28,26,40,.72);',
    'border:1px solid rgba(255,255,255,.08);box-shadow:0 14px 40px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.05)}',
    '#css .cab{display:flex;align-items:center;gap:14px;margin-bottom:12px}',
    '#css .logo{width:56px;height:56px;flex:none;border-radius:16px;display:flex;align-items:center;justify-content:center;',
    'overflow:hidden;background:rgba(255,255,255,.04);border:1.5px dashed rgba(179,136,255,.45);',
    'font:700 22px system-ui,sans-serif;color:rgba(179,136,255,.8)}',
    // Com logo (27/10/2026): fundo escuro (os logos da Astral Wave e da Sul são brancos) e largura livre até 132 px,
    // para logo comprido (cliente) não ficar minúsculo num quadrado.
    '#css .logo.tem{width:auto;min-width:56px;max-width:132px;padding:8px 10px;box-sizing:border-box;',
    'border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06)}',
    '#css .logo img{height:100%;width:auto;max-width:112px;object-fit:contain}',
    '#css .nm{font-size:18px;font-weight:700}',
    '#css .st{display:inline-flex;align-items:center;gap:6px;margin-top:3px;font-size:12px;color:rgba(242,242,247,.6)}',
    '#css .st i{width:8px;height:8px;border-radius:50%;background:#69db7c;box-shadow:0 0 8px #69db7c}',
    '#css .st.fora i{background:#ff5c7a;box-shadow:0 0 8px #ff5c7a}',
    '#css .gr{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px}',
    '#css .s{all:unset;box-sizing:border-box;position:relative;cursor:pointer;display:flex;align-items:center;gap:12px;',
    'padding:12px 38px 12px 12px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);',
    'transition:background .15s,border-color .15s,transform .2s}',
    '#css .s.sel{background:rgba(255,255,255,.13);border-color:rgba(179,136,255,.6);transform:translateY(-1px)}',
    '#css .s .e{font-size:30px;width:34px;height:34px;flex:none;display:flex;align-items:center;justify-content:center}',
    '#css .s .e svg{width:30px;height:30px}',
    '#css .s .r{font:600 13.5px ui-monospace,Menlo,monospace;word-break:break-all}',
    '#css .s .d{font-size:11.5px;color:rgba(242,242,247,.6);margin-top:3px}',
    // ✅ Sim / ✖ Não no cartão (30/10/2026, ideia do agent-dashboard): só quando a sessão pede permissão.
    '#css .s .ac{display:flex;gap:6px;margin-top:6px}',
    '#css .s .ac span{padding:4px 10px;border-radius:9px;font-size:12px;font-weight:600;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.14)}',
    '#css .s .ac span.sim{background:rgba(105,219,124,.22);border-color:rgba(105,219,124,.5)}',
    '#css .s .ac span.nao{background:rgba(255,92,122,.18);border-color:rgba(255,92,122,.45)}',
    '#css .s .ac span:hover{background:rgba(255,255,255,.22)}',
    '#css .s .k{position:absolute;top:50%;right:10px;transform:translateY(-50%);min-width:16px;padding:0 4px;border-radius:6px;',
    'font:600 10px ui-monospace,Menlo,monospace;line-height:16px;color:#14141f;background:rgba(179,136,255,.9)}',
    '#css .gr.lista{grid-template-columns:1fr;gap:6px}',
    '#css .sub{margin:12px 2px 6px;font-size:11.5px;font-weight:600;color:#b388ff;letter-spacing:.03em}',
    '#css .vazio{font-size:13px;color:rgba(242,242,247,.45);padding:6px 2px}',
    '#css .rod{margin-top:16px;text-align:center;font-size:11px;color:rgba(242,242,247,.4)}',
    '#css .num{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);padding:8px 16px;border-radius:12px;',
    'background:rgba(179,136,255,.95);color:#14141f;font:700 15px ui-monospace,Menlo,monospace;display:none}',
    '@media (max-width:600px){#css h1{font-size:22px}#css .gr{grid-template-columns:1fr}#css .rod{display:none}}'
  ].join('');

  // Uma configuração por menu do omega: título, contagem, atalhos de letra e o rodapé.
  var MODO = {
    menu: { titulo: 'Sessões', conta: function (n) { return n + (n === 1 ? ' aberta' : ' abertas'); }, lista: false,
            un: ['sessão', 'sessões'], vazio: 'nenhuma sessão aberta', letras: /^[nrda]$/i,
            rod: 'nº ou ← → e ⏎ abre · n nova · r renomeia · d fecha · ✅/✖ no cartão responde · esc lista em texto · ⌥ Tab menus' },
    sh:   { titulo: 'Scripts ~/sh', conta: function (n) { return n + (n === 1 ? ' script' : ' scripts'); }, lista: true,
            un: ['script', 'scripts'], vazio: 'nada para rodar', letras: /^[takx]$/i,
            rod: 'nº ou ↑ ↓ e ⏎ roda · t automático · a atualiza · k senha do sudo · x exclui · esc lista em texto · ⌥ Tab menus' }
  };
  var REUSO = / · ↻ reutilizáveis$/;

  var t, raiz, w, menu = null, sel = -1, buf = '', logos = {}, vis = [], desenhado = '';

  function digita(d) {
    if (!t) t = window.term;
    if (!t) return;
    if (t.input) t.input(d, true);
    else t._core.coreService.triggerDataEvent(d, true);
  }
  function teclas(k) {   // as mesmas regras do botoes.js: até 4 letras/números com ⏎ opcional
    var m = /^([A-Za-z0-9]{1,4})?(⏎)?$/.exec(k || '');
    return m && (m[1] || m[2]) ? (m[1] || '') + (m[2] ? '\r' : '') : null;
  }
  function tag(nome, cls, txt, pai) {
    var e = document.createElement(nome);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    if (pai) pai.appendChild(e);
    return e;
  }

  // Logo: cada desenho cria a própria imagem e só a põe na caixa DESTE desenho quando ela carrega (27/10/2026: a
  // versão anterior carregava uma vez e punha na caixa do 1º desenho, que o redesenho ao vivo já tinha trocado — o
  // logo nunca aparecia). O endereço que deu certo fica guardado; sem arquivo, tenta de novo depois de 1 min.
  var falhou = {};
  function logo(nome, pai) {
    var cx = tag('div', 'logo', (nome[0] || '?').toUpperCase(), pai), slug = nome.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!slug || Date.now() - (falhou[slug] || 0) < 60000) return;
    var emb = window.csLogos && window.csLogos[slug];   // logos.js (gerar-logos.sh): sem buscar nada pela rede
    if (emb) logos[slug] = emb;
    if (logos[slug]) {   // já achado: entra direto, sem piscar a inicial a cada redesenho
      cx.textContent = ''; cx.classList.add('tem');
      var ja = tag('img', null, null, cx); ja.alt = nome; ja.src = logos[slug];
      return;
    }
    var cand = ['/servidores/' + slug + '.svg', '/servidores/' + slug + '.png'];
    var im = document.createElement('img'), src;
    im.alt = nome;
    im.onload = function () { logos[slug] = src; cx.textContent = ''; cx.classList.add('tem'); cx.appendChild(im); };
    im.onerror = function () {
      src = cand.shift();
      if (src) im.src = src; else { delete logos[slug]; falhou[slug] = Date.now(); }
    };
    im.onerror();
  }

  function sessoes() { return menu ? menu.i.filter(function (it) { return it.e !== 'servidor' && it.g !== 'ações' && teclas(it.k); }) : []; }
  function modo() { return MODO[menu && menu.id] || MODO.menu; }

  function desenha() {
    var lista = sessoes(), acoes = menu.i.filter(function (it) { return it.g === 'ações'; });
    w.textContent = '';
    var topo = tag('div', 'topo', null, w), tt = tag('div', null, null, topo);
    tag('div', 'marca', 'Astral Wave · OmegaShell', tt);
    var M = modo(), h = tag('h1', null, M.titulo, tt); tag('small', null, M.conta(lista.length) + ' · ao vivo', h);
    var ac = tag('div', 'acoes', null, topo);
    function acao(rot, k, fn) {
      var b = tag('button', 'a', null, ac); b.type = 'button'; b.tabIndex = -1;
      tag('span', null, rot, b); if (k) tag('kbd', null, k, b);
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', fn);
    }
    acoes.forEach(function (it) {
      acao((it.e || '') + ' ' + it.r, it.k.replace('⏎', ''), function () { manda(it.k); });
    });
    acao('⌂ Início', null, function () { var v = document.getElementById('csi-v'); if (v) v.click(); });

    // Blocos: os servidores na ordem do omega (cabeçalhos "servidor"), e os grupos sem cabeçalho (outra conta) depois.
    var blocos = [], por = {};
    menu.i.forEach(function (it) {
      if (it.e === 'servidor' && !por[it.g]) { por[it.g] = { nome: it.r, st: it.d, s: [], r: [] }; blocos.push(por[it.g]); }
    });
    lista.forEach(function (it) {
      var g = it.g.replace(REUSO, '');
      if (!por[g]) { por[g] = { nome: g, st: '', s: [], r: [] }; blocos.push(por[g]); }
      (REUSO.test(it.g) ? por[g].r : por[g].s).push(it);
    });
    // vis = os itens na ordem da tela: é ela que as setas e o Enter seguem.
    vis = [];
    blocos.forEach(function (b) {
      var c = tag('section', 'srv', null, w), cab = tag('div', 'cab', null, c);
      logo(b.nome.replace(/ \(.*\)$/, ''), cab);
      var tx = tag('div', null, null, cab);
      tag('div', 'nm', b.nome, tx);
      var fora = /sem resposta/.test(b.st), st = tag('div', 'st' + (fora ? ' fora' : ''), null, tx);
      tag('i', null, null, st);
      var tot = b.s.length + b.r.length;
      tag('span', null, (b.st || 'no ar') + ' · ' + tot + ' ' + M.un[tot === 1 ? 0 : 1], st);
      if (fora && !tot) { tag('div', 'vazio', 'servidor fora do ar', c); return; }
      if (!b.s.length) tag('div', 'vazio', M.vazio, c);
      cartoes(c, b.s);
      if (b.r.length) { tag('div', 'sub', '↻ reutilizáveis · ficam na lista', c); cartoes(c, b.r); }
    });
    function cartoes(c, itens) {
      if (!itens.length) return;
      var gr = tag('div', 'gr' + (M.lista ? ' lista' : ''), null, c);
      itens.forEach(function (it) {
        var n = vis.length, bt = tag('button', 's' + (n === sel ? ' sel' : ''), null, gr);
        vis.push(it);
        bt.type = 'button'; bt.tabIndex = -1; bt.dataset.n = n;
        var e = tag('span', 'e', null, bt), ic = window.csIcone || {};
        if (ic.hasOwnProperty(it.e)) e.innerHTML = ic[it.e]; else e.textContent = it.e || '⌨️';
        var tx2 = tag('div', null, null, bt);
        tag('div', 'r', it.r, tx2);
        if (it.d) tag('div', 'd', it.d, tx2);
        // Sessão pedindo permissão (estado dos hooks, omega-estado): Sim e Não aqui mesmo, sem abrir o terminal.
        // O clique digita y<nº>⏎ / x<nº>⏎ no omega (responder), que manda a tecla por send-keys para a sessão.
        if (M === MODO.menu && /permiss/i.test(it.d || '')) {
          var ac = tag('div', 'ac', null, tx2), num = (it.k || '').replace('⏎', '');
          [['sim', '✅ Sim', 'y'], ['nao', '✖ Não', 'x']].forEach(function (b) {
            var sp = tag('span', b[0], b[1], ac);
            sp.addEventListener('mousedown', function (ev) { ev.preventDefault(); ev.stopPropagation(); });
            sp.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); manda(b[2] + num + '⏎'); });
          });
        }
        tag('span', 'k', it.k.replace('⏎', ''), bt);
        bt.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
        bt.addEventListener('mouseover', function () { if (sel !== n) { sel = n; marca(); } });
        bt.addEventListener('click', function () { manda(it.k); });
      });
    }
    tag('div', 'rod', M.rod, w);
    tag('div', 'num', null, w).id = 'css-num';
    mostraBuf();
  }

  function marca() { raiz.querySelectorAll('.s').forEach(function (b) { b.classList.toggle('sel', +b.dataset.n === sel); }); }
  function mostraBuf() { var n = document.getElementById('css-num'); if (n) { n.textContent = 'nº ' + buf + ' ⏎'; n.style.display = buf ? 'block' : 'none'; } }

  function some() { raiz.classList.remove('on', 'enviando'); buf = ''; }
  // Escolha feita (27/10/2026, pedido do dono: a lista em texto não pode mais aparecer): a tela fica na frente,
  // "abrindo…", até a aba nova abrir ou o omega mandar o próximo menu; a pergunta que vier depois (qual sessão,
  // confirmar) abre no painel de botões (csPede). Só o k (senha do sudo, digitada no terminal) mostra o terminal.
  var espera = 0;
  function manda(k) {
    var d = teclas(k);
    if (!d) return;
    buf = ''; mostraBuf();
    if (/^k/i.test(k) && modo() === MODO.sh) some();
    else {
      raiz.classList.add('enviando');
      clearTimeout(espera);
      espera = setTimeout(function () { raiz.classList.remove('enviando'); }, 2500);
      if (window.csPede) window.csPede();
    }
    digita(d);
    if (t) t.focus();
  }

  // Última tela de cada aba fixa: voltar para a omega ou a sh mostra ela na hora (o omega reenvia em até 1 s).
  var ultimo = {}, ABA = { omega: 'menu', sh: 'sh' };
  function recebe(m) {
    if (!m) { menu = null; sel = 0; some(); return; }   // saiu da aba (ou escolheu): começa de novo
    if (m.tipo === 'aba') {                                        // troca de aba (botoes.sh esconde)
      var u = ultimo[ABA[m.w]];
      if (!ABA[m.w]) { some(); return; }
      // Sem tela guardada (página recém-aberta): "abrindo…" na frente até o omega mandar a dele (até 1 s).
      if (!u) { clearTimeout(espera); raiz.classList.add('on', 'enviando'); return; }
      m = u;
    }
    if (m.tipo !== 'omega' || !MODO[m.id]) { some(); return; }   // outra pergunta do omega: fica com os botões
    raiz.classList.remove('enviando');
    // Menu igual ao que já está na tela: nada a refazer (30/10/2026, lentidão: o omega reenvia a cada segundo e
    // a página apagava e recriava todos os cartões — travava a rolagem e o hover, sobretudo no celular).
    var chave = JSON.stringify(m);
    if (menu && menu.id === m.id && chave === desenhado && raiz.classList.contains('on')) { ultimo[m.id] = m; return; }
    desenhado = chave;
    ultimo[m.id] = m;
    if (!menu || menu.id !== m.id) sel = 0;                        // outra tela: começa no primeiro
    menu = m;
    var n = sessoes().length;
    if (sel >= n) sel = n - 1;
    if (sel < 0 && n) sel = 0;
    var y = raiz.scrollTop;
    desenha();
    raiz.classList.add('on');
    raiz.scrollTop = y;
  }

  function teclado(e) {
    if (!raiz.classList.contains('on')) return;
    // Página inicial ou botões do ⌥ Tab por cima: as teclas são deles.
    if (document.querySelector('#csi.on, #csb.on')) return;
    if (e.code === 'Tab' && e.altKey) return;   // ⌥ Tab: os botões do botoes.js abrem por cima desta tela
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key, n = vis.length;
    if (k === 'Escape') { if (buf) { buf = ''; mostraBuf(); } else { var v = document.getElementById('csi-v'); if (v) v.click(); } }
    else if (/^[0-9]$/.test(k)) { if (buf.length < 3) buf += k; mostraBuf(); }
    else if (k === 'Backspace') { buf = buf.slice(0, -1); mostraBuf(); }
    else if (k === 'Enter') { if (buf) manda(buf + '⏎'); else if (vis[sel]) manda(vis[sel].k); }
    else if ((k === 'ArrowRight' || k === 'ArrowDown' || k === 'Tab') && n) { sel = (sel + (e.shiftKey ? n - 1 : 1)) % n; marca(); }
    else if ((k === 'ArrowLeft' || k === 'ArrowUp') && n) { sel = (sel + n - 1) % n; marca(); }
    else if (modo().letras.test(k)) manda(k.toLowerCase() + '⏎');
    else return;
    e.preventDefault(); e.stopPropagation();
  }

  function monta() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    raiz = tag('div', null, null, document.body); raiz.id = 'css';
    w = tag('div', 'w', null, raiz);
    window.addEventListener('cs-menu', function (ev) { recebe(ev.detail); });
    document.addEventListener('keydown', teclado, true);
  }
  if (document.body) monta(); else document.addEventListener('DOMContentLoaded', monta);
})();
