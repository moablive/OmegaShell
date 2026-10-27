// CloudShell — botões dos menus no visual do Cmd+Tab do Mac (26/10/2026, pedido do dono).
// Fonte da documentação: Google Doc "Projeto - Astral Wave ／ CloudShell", pasta awldocs do Drive.
//
// O host (host/botoes.sh, chamado pelo omega e pelos menus do tmux) escreve no terminal a sequência
// OSC 7717 com o menu em JSON (base64); vazia = some. O menu fica guardado e só aparece no atalho
// ⌥ Option + Tab, como o Cmd+Tab do Mac: segurando o Option, cada Tab passa para o próximo botão
// (Shift volta) e soltar o Option abre o escolhido. Aba sem menu (um Claude, um shell): o atalho pede
// ao tmux o "☰ menu" (\e[96~ = User3), que traz as abas para trocar e as ações. Clicar (ou ←→ e
// Enter) também serve; Esc fecha. O botão só DIGITA a tecla do item no terminal, a mesma que se
// digitaria à mão: nenhum comando sai daqui. No celular (sem Option) o ⌥⇥ no canto abre.
(function () {
  'use strict';

  var CSS = [
    '#csb{position:fixed;inset:0;z-index:20;display:none;align-items:center;justify-content:center;pointer-events:none}',
    // Véu na tela toda (27/10/2026, pedido do dono): o menu em texto do omega/tmux continua atrás (é ele que
    // recebe a tecla), mas não aparece mais misturado com o painel. Clique fora continua indo para o terminal.
    '#csb.on{display:flex;background:rgba(8,8,14,.72);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}',
    '#csb .p{pointer-events:auto;max-width:min(94vw,980px);max-height:86vh;overflow:auto;padding:18px 18px 14px;',
    'border-radius:26px;background:rgba(36,36,46,.9);-webkit-backdrop-filter:blur(28px) saturate(170%);',
    'backdrop-filter:blur(28px) saturate(170%);border:1px solid rgba(255,255,255,.14);',
    'box-shadow:0 24px 60px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.08);',
    'font:500 13px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",system-ui,sans-serif;color:#f2f2f7;',
    'animation:csb-in .16s cubic-bezier(.445,.05,.55,.95)}',
    '@keyframes csb-in{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}',
    '#csb .t{font-weight:600;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:rgba(242,242,247,.55);',
    'text-align:center;margin:0 0 10px}',
    '#csb .g{font-size:11px;font-weight:600;color:#b388ff;margin:10px 6px 4px;letter-spacing:.03em;display:flex;align-items:center;gap:7px}',
    '#csb .g img{height:22px;max-width:54px;object-fit:contain}',
    '#csb .ini{all:unset;cursor:pointer;display:block;margin:10px auto 0;padding:6px 14px;border-radius:12px;font-size:12px;font-weight:600;',
    'background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12)}',
    '#csb .ini:hover{background:rgba(255,255,255,.14);border-color:rgba(179,136,255,.5)}',
    '#csb .l{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}',
    '#csb .b{all:unset;box-sizing:border-box;position:relative;width:104px;padding:12px 6px 9px;border-radius:18px;',
    'display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;',
    'transition:background .18s,transform .3s cubic-bezier(.445,.05,.55,.95)}',
    '#csb .b.s{background:rgba(255,255,255,.2);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}',
    '#csb .b:active{transform:scale(.94)}',
    '#csb .b.x{opacity:.32;cursor:default}',
    // Paleta de cores (⌥ C, 27/10/2026, pedido do dono: no mesmo efeito do ⌥ Tab, as cores em caixinhas): cada cor é
    // uma caixinha como ícone de app do Mac — degradê de cima para baixo, brilho no alto e sombra embaixo.
    '#csb .esf{display:inline-block;width:46px;height:46px;border-radius:12px;vertical-align:middle;box-sizing:border-box;',
    'background:linear-gradient(180deg,color-mix(in srgb,var(--c) 62%,#fff) 0%,var(--c) 48%,color-mix(in srgb,var(--c) 70%,#000) 100%);',
    'border:1px solid rgba(255,255,255,.22);box-shadow:0 8px 16px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.55),',
    'inset 0 -3px 6px rgba(0,0,0,.18)}',
    '#csb .p.cor{max-width:min(94vw,600px)}',
    '#csb .b.marcado .e{position:relative}',
    '#csb .b.marcado .esf{outline:2.5px solid #fff;outline-offset:2px}',
    '#csb .b.marcado .e::after{content:"✓";position:absolute;right:-6px;bottom:-2px;width:20px;height:20px;border-radius:50%;',
    'background:#69db7c;color:#14141f;font:800 13px/20px system-ui,sans-serif;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.5)}',
    '#csb .esf.vazia{background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.03));',
    'border:1.5px dashed rgba(255,255,255,.4)}',
    '#csb .e{font-size:40px;line-height:48px;height:48px;transition:transform .3s cubic-bezier(.445,.05,.55,.95)}',
    '#csb .b.s .e{transform:scale(1.12)}',
    '#csb .r{max-width:96px;font-size:12px;font-weight:600;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '#csb .d{max-width:96px;font-size:10.5px;color:rgba(242,242,247,.55);text-align:center;overflow:hidden;',
    'text-overflow:ellipsis;white-space:nowrap}',
    '#csb .k{position:absolute;top:6px;right:7px;min-width:16px;padding:0 4px;border-radius:6px;font:600 10px ui-monospace,',
    'Menlo,monospace;line-height:16px;color:#14141f;background:rgba(179,136,255,.9)}',
    '#csb .n{margin:12px 4px 0;text-align:center;font-size:15px;font-weight:600;min-height:20px}',
    '#csb .n small{display:block;font-size:11.5px;font-weight:500;color:rgba(242,242,247,.6);margin-top:2px}',
    '#csb .h{margin-top:8px;text-align:center;font-size:10.5px;color:rgba(242,242,247,.4)}',
    // Lista (27/10/2026, pedido do dono): os ~/sh um embaixo do outro, com o nome inteiro.
    '#csb .p.lista{width:min(94vw,760px)}',
    '#csb .l.lista{flex-direction:column;flex-wrap:nowrap;gap:2px}',
    '#csb .l.lista .b{width:100%;flex-direction:row;align-items:center;gap:10px;padding:7px 44px 7px 10px;border-radius:10px}',
    '#csb .l.lista .e{font-size:20px;line-height:24px;height:24px;flex:none}',
    '#csb .l.lista .b:hover .e,#csb .l.lista .b.s .e{transform:none}',
    '#csb .l.lista .r{max-width:none;flex:1;text-align:left;white-space:normal;word-break:break-all;font:500 13px ui-monospace,Menlo,monospace}',
    '#csb .l.lista .d{max-width:40%;flex:none;text-align:right}',
    '#csb .l.lista .k{top:50%;transform:translateY(-50%);right:10px}',
    '#csb .e svg{width:1em;height:1em;vertical-align:middle}',
    '#csb .i{all:unset;box-sizing:border-box;display:block;width:min(80vw,360px);margin:4px auto 10px;padding:10px 14px;',
    'border-radius:12px;background:rgba(0,0,0,.35);border:1px solid rgba(179,136,255,.55);color:#f2f2f7;',
    'font:500 15px ui-monospace,Menlo,monospace;text-align:center}',
    '#csb .i.ruim{border-color:#ff6b6b}',
    '#csb .l .i{flex:0 0 100%;max-width:360px}',
    '#csb-v{position:fixed;right:14px;bottom:52px;z-index:20;display:none;border:1px solid rgba(255,255,255,.16);',
    'border-radius:14px;padding:6px 10px;opacity:.6;background:rgba(36,36,46,.7);-webkit-backdrop-filter:blur(18px);',
    'backdrop-filter:blur(18px);color:#f2f2f7;font:600 13px system-ui,sans-serif;cursor:pointer}',
    '#csb-v.on{display:block}',
    '@media (max-width:600px){#csb .b{width:82px;padding:10px 4px 8px}#csb .e{font-size:32px;line-height:40px;height:40px}',
    '#csb .r,#csb .d{max-width:76px}#csb .h{display:none}}'
  ].join('');

  // Tecla do item: até 4 letras/números (ou < >) com ⏎ opcional, ou só ⏎, Esc, Home, End.
  var TECLA = /^([A-Za-z0-9<>]{1,4})?(⏎)?$/;
  var ESPECIAL = { 'Esc': '\x1b', 'Home': '\x1b[1~', 'End': '\x1b[4~' };
  function teclas(k) {
    if (!k || k === '-') return null;
    if (ESPECIAL[k]) return ESPECIAL[k];
    var m = TECLA.exec(k);
    if (!m || (!m[1] && !m[2])) return null;
    return (m[1] || '') + (m[2] ? '\r' : '');
  }

  // Campo de texto (27/10/2026, pedido do dono: o nome da sessão nova não era pedido no painel — só
  // havia o botão do nome sugerido e o véu escondia a pergunta). Item com tecla "✎": o que se digita
  // nele vai para o terminal com Enter, só [A-Za-z0-9._-] (o omega confere de novo); vazio = Enter.
  var TEXTO = '✎', NOME = /^[A-Za-z0-9._-]{0,40}$/;
  function campo() { return painel.querySelector('.i'); }
  function envia(c) {
    if (!NOME.test(c.value)) { c.classList.add('ruim'); return; }
    var v = c.value;
    some();
    pede = true; setTimeout(function () { pede = false; }, 2000);
    digita(v + '\r');
    t.focus();
  }

  // Menus de scripts do omega (🧾 sh e 🗑 Excluir): os grupos só de itens "N⏎" (um por ~/sh) saem em lista.
  var LISTA = { sh: 1, excluir: 1 };
  function emLista(gr) {
    return !!LISTA[menu.id] && gr.n.every(function (n) { return /^[0-9]+⏎$/.test(menu.i[n].k || ''); });
  }

  // Logos no lugar do emoji (27/10/2026, pedido do dono): o host manda "claude" ou "gemini" no ícone da
  // sessão e a página desenha o SVG daqui (texto fixo; nada que venha do terminal vira HTML). Desenhos
  // oficiais do Simple Icons 13.21.0 (CC0): claude.svg na cor do Claude e googlegemini.svg no degradê do Gemini.
  var ICONE = {
    claude: '<svg viewBox="0 0 24 24" aria-label="Claude"><path fill="#d97757" d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/></svg>',
    gemini: '<svg viewBox="0 0 24 24" aria-label="Gemini"><defs><linearGradient id="csb-gm" x1="0" y1="1" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#1c7dff"/><stop offset=".55" stop-color="#9b72cb"/><stop offset="1" stop-color="#d96570"/>' +
      '</linearGradient></defs><path fill="url(#csb-gm)" d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81"/></svg>'
  };

  window.csIcone = ICONE;
  // A tela de Sessões/Scripts (sessoes.js) digita uma escolha: a pergunta que o omega fizer em seguida (qual sessão,
  // confirmar, Enter = voltar) já abre no painel, como depois de um clique aqui.
  window.csPede = function () { pede = true; setTimeout(function () { pede = false; }, 2000); };

  // Botões de escolher o servidor (Nova sessão): o logo de pwa/servidores/<nome>.svg|png no lugar do 🖥️, se houver
  // (27/10/2026). A imagem só entra quando carrega; sem arquivo fica o emoji.
  // Também antes do nome do servidor nos títulos de grupo (antes = true). O endereço achado fica guardado; sem
  // arquivo, não tenta de novo por 1 min.
  var achados = {}, semLogo = {};
  function logoServidor(e, nome, alto, antes) {
    var slug = String(nome || '').toLowerCase().replace(/[^a-z0-9-]/g, ''), cand, im, src;
    if (!slug || Date.now() - (semLogo[slug] || 0) < 60000) return;
    if (window.csLogos && window.csLogos[slug]) achados[slug] = window.csLogos[slug];   // embutido (logos.js)
    cand = achados[slug] ? [achados[slug]] : ['/servidores/' + slug + '.svg', '/servidores/' + slug + '.png'];
    im = document.createElement('img');
    im.alt = antes ? '' : nome;
    if (!antes) im.style.cssText = 'height:' + alto + 'px;max-width:92px;object-fit:contain;vertical-align:middle';
    im.onload = function () {
      achados[slug] = src;
      if (antes) e.insertBefore(im, e.firstChild); else { e.textContent = ''; e.appendChild(im); }
    };
    im.onerror = function () { src = cand.shift(); if (src) im.src = src; else semLogo[slug] = Date.now(); };
    im.onerror();
  }   // a tela de Sessões (sessoes.js) usa os mesmos logos

  // Cada menu que chega (ou some) vai também para quem escuta "cs-menu": a tela de Sessões (27/10/2026).
  function avisa(m) { try { window.dispatchEvent(new CustomEvent('cs-menu', { detail: m })); } catch (e) {} }

  var t, raiz, painel, volta;
  var bruto = '';       // o omega reenvia o mesmo menu a cada 3 s: igual = nada a refazer
  var menu = null;      // {tipo, id, t, i: [{g, e, r, d, k}]}
  var sel = 0;
  var aberto = false;   // painel na tela (só pelo ⌥ Tab ou pelo botão do canto)
  var segura = false;   // aberto pelo ⌥ Tab com o Option ainda apertado: soltar abre o escolhido
  var pede = false;     // ⌥ Tab numa aba sem menu: o ☰ menu do tmux está a caminho
  var mx = -1, my = -1; // onde o mouse está (27/10/2026): o item embaixo dele é o escolhido…
  var rato = false;     // …até o teclado (Tab, setas) escolher outro; mexer o mouse devolve a vez a ele

  function digita(d) {
    if (t.input) t.input(d, true);
    else t._core.coreService.triggerDataEvent(d, true);
  }

  function ativos() {
    var r = [];
    if (menu) menu.i.forEach(function (it, n) { if (teclas(it.k)) r.push(n); });
    return r;
  }

  function nome() {
    var it = menu && menu.i[sel], n = painel.querySelector('.n');
    n.textContent = it ? it.r : '';
    if (it && it.d) { var s = document.createElement('small'); s.textContent = it.d; n.appendChild(s); }
  }

  function marca() {
    painel.querySelectorAll('.b').forEach(function (b) { b.classList.toggle('s', +b.dataset.n === sel); });
    nome();
  }

  function desenha() {
    painel.textContent = '';
    // ~/sh em lista; paleta (cor) em grade de 5 caixinhas por linha.
    painel.className = 'p' + (LISTA[menu.id] ? ' lista' : '') + (menu.id === 'cor' || menu.id === 'juntar' ? ' cor' : '');
    var tt = document.createElement('div'); tt.className = 't'; tt.textContent = menu.t || '';
    painel.appendChild(tt);
    var grupos = [], ult = null;
    menu.i.forEach(function (it, n) {
      if (it.e === 'servidor') return;   // cabeçalho de servidor: só a tela de Sessões desenha
      if (!ult || ult.g !== it.g) { ult = { g: it.g, n: [] }; grupos.push(ult); }
      ult.n.push(n);
    });
    grupos.forEach(function (gr) {
      if (gr.g && grupos.length > 1) {
        var g = document.createElement('div'); g.className = 'g'; painel.appendChild(g);
        // Grupo que é um servidor (awlsrv, srv2, mac; "· ↻ reutilizáveis" e "(root)" também): logo antes do nome.
        logoServidor(g, gr.g.replace(/ · ↻ reutilizáveis$/, '').replace(/ \(.*\)$/, ''), 22, true);
        g.appendChild(document.createTextNode(gr.g));
      }
      var l = document.createElement('div'); l.className = 'l' + (emLista(gr) ? ' lista' : '');
      gr.n.forEach(function (n) {
        var it = menu.i[n], b;
        if (it.k === TEXTO) {
          b = document.createElement('input');
          b.className = 'i'; b.type = 'text'; b.maxLength = 40; b.spellcheck = false;
          b.autocomplete = 'off'; b.placeholder = it.r || ''; if (it.d) b.title = it.d;
          b.addEventListener('input', function () { b.classList.toggle('ruim', !NOME.test(b.value)); });
          l.appendChild(b);
          return;
        }
        b = document.createElement('button');
        b.type = 'button'; b.tabIndex = -1; b.className = 'b' + (teclas(it.k) ? '' : ' x'); b.dataset.n = n;
        // ⌥ G (agrupar): a aba marcada leva o ✓ na caixinha.
        if (menu.id === 'juntar' && /^✓/.test(it.d || '')) b.classList.add('marcado');
        var e = document.createElement('span'); e.className = 'e';
        if (ICONE.hasOwnProperty(it.e)) e.innerHTML = ICONE[it.e];
        else if (/^#[0-9a-fA-F]{6}$/.test(it.e || '')) {   // cor da paleta: esfera
          var sf = document.createElement('span'); sf.className = 'esf'; sf.style.setProperty('--c', it.e); e.appendChild(sf);
        } else if (it.e === '◯' && menu.id === 'cor') {   // "Padrão" (sem cor): esfera de vidro vazia
          var vz = document.createElement('span'); vz.className = 'esf vazia'; e.appendChild(vz);
        } else e.textContent = it.e || '•';
        if (menu.id === 'nova-servidor') logoServidor(e, it.r, 40, false);
        var r = document.createElement('span'); r.className = 'r'; r.textContent = it.r || '';
        b.appendChild(e); b.appendChild(r);
        if (it.d) { var d = document.createElement('span'); d.className = 'd'; d.textContent = it.d; b.appendChild(d); }
        if (it.k && it.k !== '-') {
          var k = document.createElement('span'); k.className = 'k'; k.textContent = it.k; b.appendChild(k);
        }
        // Sem tirar o foco do terminal: o teclado continua indo para ele.
        b.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
        b.addEventListener('mouseover', function () { if (rato && teclas(it.k) && sel !== n) { sel = n; marca(); } });
        b.addEventListener('click', function () { escolhe(n); });
        l.appendChild(b);
      });
      painel.appendChild(l);
    });
    var n = document.createElement('div'); n.className = 'n'; painel.appendChild(n);
    // ⌂ Início em todo painel (27/10/2026, pedido do dono): fecha o menu (Esc no do tmux) e abre a página inicial.
    var ini = document.createElement('button'); ini.type = 'button'; ini.tabIndex = -1; ini.className = 'ini';
    ini.textContent = '⌂ Início';
    ini.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
    ini.addEventListener('click', function () {
      if (menu && menu.tipo === 'tmux') { some(); digita('\x1b'); } else { aberto = segura = false; mostra(); }
      var v = document.getElementById('csi-v'); if (v) v.click();
    });
    painel.appendChild(ini);
    var h = document.createElement('div'); h.className = 'h';
    h.textContent = segura && menu.id === 'cor' ? '⌥ segurado: C próxima cor · ⇧C volta · solte o ⌥ para aplicar · esc fecha'
                  : segura ? '⌥ segurado: tab próximo · ⇧tab volta · solte o ⌥ para abrir · esc fecha'
                           : '← → ou tab escolher · ⏎ abrir · esc fecha';
    painel.appendChild(h);
    sobMouse();
    marca();
    var c = campo();
    if (c && !segura) setTimeout(function () { c.focus(); }, 0);
  }

  // Painel aberto (ou redesenhado) embaixo do mouse parado: o item sob o cursor vira o escolhido, para
  // soltar o ⌥ abrir o que se está vendo destacado (27/10/2026, pedido do dono).
  function sobMouse() {
    if (!rato || mx < 0 || !aberto) return;
    var el = document.elementFromPoint(mx, my), b = el && el.closest && el.closest('#csb .b');
    if (b && !b.classList.contains('x')) sel = +b.dataset.n;
  }

  function mostra() {
    if (!menu) aberto = segura = false;
    raiz.classList.toggle('on', aberto);
    volta.classList.toggle('on', !aberto);
  }

  function some() { menu = null; bruto = ''; mostra(); avisa(null); }

  function abre(seg) {
    segura = seg; aberto = true;
    var a = ativos();
    if (a.length && a.indexOf(sel) < 0) sel = a[0];
    desenha(); mostra();
  }

  // ⌥ Tab (ou o botão do canto): o menu guardado, ou o ☰ menu do tmux nesta aba.
  function atalho(seg) {
    if (menu) { abre(seg); return; }
    pede = true; segura = seg;
    digita('\x1b[96~');
    setTimeout(function () { pede = false; }, 2000);
  }

  function escolhe(n) {
    var it = menu && menu.i[n], d = it && teclas(it.k);
    if (!d) return;
    some();
    // O que esse botão abrir em seguida (2º menu, pergunta do omega) já vem aberto.
    pede = true; setTimeout(function () { pede = false; }, 2000);
    digita(d);
    t.focus();
  }

  function esconde() {
    if (!menu) return;
    // Menu do tmux aberto atrás: o Esc que ele receberia fecha ele também.
    if (menu.tipo === 'tmux') { some(); digita('\x1b'); return; }
    aberto = segura = false; mostra();
  }

  function anda(passo) {
    var a = ativos();
    if (!a.length) return;
    rato = false;
    var p = a.indexOf(sel);
    sel = a[(p < 0 ? 0 : (p + passo + a.length) % a.length)];
    marca();
  }

  function recebe(dados) {
    if (!dados) { some(); return true; }
    if (menu && dados === bruto) return true;
    var m;
    try {
      m = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(dados), function (c) { return c.charCodeAt(0); })));
    } catch (e) { return true; }
    // Troca de aba (botoes.sh esconde, 27/10/2026): some com os botões e avisa a tela de Sessões/Scripts da aba nova.
    if (m && m.tipo === 'aba') { some(); avisa(m); return true; }
    // ☰ CloudShell da barra (27/10/2026): só abre a página inicial.
    if (m && m.tipo === 'inicio') { var v = document.getElementById('csi-v'); if (v) v.click(); return true; }
    if (!m || !Array.isArray(m.i) || (m.tipo !== 'omega' && m.tipo !== 'tmux')) return true;
    var mesmo = menu && menu.id === m.id, k = mesmo && menu.i[sel] ? menu.i[sel].k : null;
    menu = m; bruto = dados;
    avisa(m);
    sel = -1;
    menu.i.forEach(function (it, n) { if (sel < 0 && k !== null && it.k === k) sel = n; });
    if (sel < 0) { var a = ativos(); sel = a.length ? a[0] : 0; }
    // Menu novo não pula na tela: só o que o ⌥ Tab pediu, ou o que já estava aberto.
    // Menu aberto por clique (☰ menu, ⌥ C, um botão do painel: abre = true) também já vem aberto.
    // Não nasce "segurado": um toque em ⌥ C deixa a paleta aberta (antes, soltar o ⌥ aplicava a 1ª cor e fechava na
    // hora — a paleta nem aparecia). O C de novo com o ⌥ ainda apertado é que passa a valer o soltar para aplicar.
    if (pede || m.abre) { pede = false; aberto = true; }
    else if (!mesmo) aberto = segura = false;
    if (aberto) desenha();
    mostra();
    return true;
  }

  function para(e) { e.preventDefault(); e.stopPropagation(); }

  function teclado(e) {
    // Digitando no campo de texto: só Enter (envia) e Esc (fecha) são do painel; o resto fica no campo.
    if (aberto && e.target && e.target.classList && e.target.classList.contains('i')) {
      if (e.key === 'Enter') { para(e); envia(e.target); }
      else if (e.key === 'Escape') { para(e); esconde(); t.focus(); }
      else if (e.code === 'Tab' && e.altKey) { para(e); anda(e.shiftKey ? -1 : 1); }
      else e.stopPropagation();
      return;
    }
    // ⌥ Tab: abre; com o painel aberto, cada Tab anda (⇧ volta). Pelo e.code: no Mac o Option muda a tecla.
    if (e.code === 'Tab' && e.altKey && !e.metaKey && !e.ctrlKey) {
      para(e);
      if (aberto) { anda(e.shiftKey ? -1 : 1); if (!segura) { segura = true; desenha(); } }
      else atalho(true);
      return;
    }
    if (!aberto || e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'Tab') anda(k === 'Tab' && e.shiftKey ? -1 : 1);
    else if (k === 'ArrowLeft' || k === 'ArrowUp') anda(-1);
    else if (k === 'Escape') esconde();
    else if (k === 'Enter') escolhe(sel);
    else {
      // Digitou outra coisa: o painel sai e a tecla vai para o terminal (num menu do tmux, escolhe nele).
      if (k.length === 1 || k === 'Backspace') { if (menu.tipo === 'tmux') some(); else esconde(); }
      return;
    }
    para(e);
  }

  // Soltar o Option com o painel aberto pelo ⌥ Tab abre o escolhido, como o Cmd+Tab.
  function solta(e) {
    if (e.key !== 'Alt') return;
    if (aberto && segura) { segura = false; para(e); sobMouse(); escolhe(sel); }
    else segura = false;
  }

  function inicia() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    raiz = document.createElement('div'); raiz.id = 'csb';
    painel = document.createElement('div'); painel.className = 'p';
    raiz.appendChild(painel);
    volta = document.createElement('button'); volta.id = 'csb-v'; volta.type = 'button'; volta.tabIndex = -1;
    volta.textContent = '⌥⇥';
    volta.title = 'Option + Tab: botões dos menus';
    volta.addEventListener('mousedown', function (e) { e.preventDefault(); });
    volta.addEventListener('click', function () { atalho(false); });
    document.body.appendChild(raiz); document.body.appendChild(volta);
    t.parser.registerOscHandler(7717, recebe);
    document.addEventListener('keydown', teclado, true);
    // ⌥ C com a paleta aberta: anda pelas cores (⇧ volta), como o Tab no ⌥ Tab. No window, antes do atalho da
    // página que manda o ⌥ C ao tmux (que reabriria a paleta do zero).
    window.addEventListener('keydown', function (e) {
      if (e.code !== 'KeyC' || !e.altKey || e.metaKey || e.ctrlKey || !aberto || !menu || menu.id !== 'cor') return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      anda(e.shiftKey ? -1 : 1);
      if (!segura) { segura = true; desenha(); }
    }, true);
    document.addEventListener('keyup', solta, true);
    window.addEventListener('blur', function () { segura = false; });
    document.addEventListener('mousemove', function (e) {
      if (e.clientX === mx && e.clientY === my) return;   // o redesenho embaixo do mouse parado também gera mousemove
      mx = e.clientX; my = e.clientY; rato = true;
    }, true);
    // Clique no terminal com um menu do tmux aberto: o tmux fecha ou escolhe nele; os botões saem.
    t.element.addEventListener('mousedown', function () { if (menu && menu.tipo === 'tmux') some(); }, true);
  }

  var n = 0, i = setInterval(function () {
    t = window.term;
    if (!t && ++n < 100) return;
    clearInterval(i);
    if (t && t.parser) inicia();
  }, 100);
})();
