// CloudShell — botões dos menus no visual do Cmd+Tab do Mac (26/10/2026, pedido do dono).
// Fonte da documentação: Google Doc "Projeto - Astral Wave ／ CloudShell", pasta awldocs do Drive.
//
// O host (host/botoes.sh, chamado pelo omega e pelos menus do tmux) escreve no terminal a sequência
// OSC 7717 com o menu em JSON (base64); vazia = some. O menu fica guardado e só aparece no atalho
// ⌥ Option + Tab, como o Cmd+Tab do Mac: segurando o Option, cada Tab passa para o próximo botão
// (Shift volta); soltar o Option NÃO abre nada: só o Enter (ou o clique) entra no escolhido, e o ✕ Cancelar
// ou o Esc fecham (30/10/2026, pedido do dono). Aba sem menu (um Claude, um shell): o atalho pede
// ao tmux o "☰ menu" (\e[96~ = User3), que traz as abas para trocar e as ações. Clicar (ou ←→ e
// Enter) também serve; Esc fecha. O botão só DIGITA a tecla do item no terminal, a mesma que se
// digitaria à mão: nenhum comando sai daqui. No celular (sem Option) o ⌥⇥ no canto abre.
// Desde 19/11/2026 não há menu em texto do tmux atrás dos botões (pedido do dono: "volta e meia mostra partes do
// antigo menu dropdown"): o "☰ menu" do tmux é só uma tabela de teclas (host/abas.sh, menu_teclas), que não desenha
// nada e sai sozinha na primeira tecla ou clique. ⌥ ← e ⌥ → passam para a aba vizinha.
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
    '#csb .rodape{display:flex;gap:8px;justify-content:center}#csb .rodape .ini{margin:10px 0 0}',
    '#csb .ini.canc:hover{border-color:rgba(255,99,99,.6)}',
    '#csb .l{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}',
    '#csb .b{all:unset;box-sizing:border-box;position:relative;width:104px;padding:12px 6px 9px;border-radius:18px;',
    'display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;',
    'transition:background .18s,transform .3s cubic-bezier(.445,.05,.55,.95)}',
    '#csb .b.s{background:rgba(255,255,255,.2);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}',
    '#csb .b:active{transform:scale(.94)}',
    '#csb .b.x{opacity:.32;cursor:default}',
    // ◀ ▶ da Nova sessão · servidor (07/11/2026): mudam a ordem dos servidores, a mesma da tela de Sessões.
    '#csb .mv{position:absolute;top:5px;width:22px;height:22px;border-radius:7px;display:none;align-items:center;',
    'justify-content:center;font-size:10px;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.18);color:#fff}',
    '#csb .mv:hover{background:rgba(179,136,255,.6)}',
    '#csb .mv.esq{left:5px}#csb .mv.dir{right:5px}',
    '#csb .b:hover .mv,#csb .b.s .mv{display:flex}',
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
    // Logos na barra de abas (28/10/2026): caixas por cima das marcas da linha de status do tmux.
    // z-index 10: acima das camadas do xterm, abaixo das telas de Sessões/Scripts (#css, 15) e Início (#csi, 30) —
    // com 20 os logos ficavam por cima da tela de Sessões (28/10/2026, print do dono).
    '#csb-barra{position:absolute;left:0;top:0;width:100%;height:0;overflow:visible;pointer-events:none;z-index:10}',
    '#csb-barra .c{position:absolute;top:0;display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:1px 2px}',
    '#csb-barra .f{position:absolute}',
    '#csb-fantasmas{position:absolute;left:0;top:0;width:100%;height:0;overflow:visible;pointer-events:none;z-index:11}',
    // Efeitos das abas (28/10/2026, pedido do dono): caixa da aba inteira (as duas linhas) por cima do texto do tmux —
    // passar o mouse acende; o clique dá uma onda; aba que some deixa um fantasma que encolhe e
    // apaga; se saiu pelo ⏻ Encerrar / ❌ Fechar sessão, o fantasma fica vermelho antes de sumir.
    // Ajuste (28/10/2026, 2º pedido do dono): sem o \"levanta/escala\" (o texto é do canvas do tmux e não acompanhava a
    // caixa); hover = véu claro com borda, como o hover de aba de navegador; aba ativa (negrito no tmux, sem o
    // sublinhado) = brilho leve no alto + contorno; clique = onda (ripple) que nasce no ponto clicado, numa camada
    // que não é refeita quando a barra redesenha (antes o redesenho da troca de aba apagava a animação), e a aba que
    // fica ativa acende.
    '#csb-barra .aba{position:absolute;top:0;box-sizing:border-box;border-radius:6px 6px 0 0;background:transparent;',
    'transition:background .15s ease,box-shadow .15s ease}',
    '#csb-barra .aba.ativa{background:linear-gradient(180deg,rgba(255,255,255,.20),rgba(255,255,255,.04) 55%,rgba(255,255,255,0));',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.55),inset 0 0 0 1px rgba(255,255,255,.22),0 0 12px rgba(179,136,255,.45)}',
    '#csb-barra .aba.hover{background:rgba(255,255,255,.14);box-shadow:inset 0 0 0 1px rgba(255,255,255,.30)}',
    '#csb-barra .aba.ativa.hover{background:linear-gradient(180deg,rgba(255,255,255,.26),rgba(255,255,255,.10));',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.6),inset 0 0 0 1px rgba(255,255,255,.32),0 0 14px rgba(179,136,255,.6)}',
    '#csb-barra .aba.entra{animation:csb-entra .45s ease-out}',
    '@keyframes csb-entra{0%{box-shadow:inset 0 0 0 2px rgba(255,255,255,.8),0 0 22px rgba(179,136,255,.9);background:rgba(255,255,255,.32)}}',
    '#csb-fantasmas .onda{position:absolute;top:0;overflow:hidden;border-radius:6px 6px 0 0}',
    '#csb-fantasmas .onda i{position:absolute;border-radius:50%;background:rgba(255,255,255,.45);transform:translate(-50%,-50%) scale(0);',
    'animation:csb-onda .5s ease-out forwards}',
    '@keyframes csb-onda{to{transform:translate(-50%,-50%) scale(1);opacity:0}}',
    '#csb-fantasmas .fantasma{position:absolute;top:0;border-radius:7px 7px 0 0;animation:csb-fecha .55s ease forwards;transform-origin:50% 50%}',
    '@keyframes csb-fecha{0%{opacity:.95;transform:scale(1)}100%{opacity:0;transform:scale(.55);filter:blur(2px)}}',
    '#csb-fantasmas .fantasma.excluir{animation:csb-exclui .9s ease forwards}',
    '@keyframes csb-exclui{0%{opacity:1;background:#ff3b3b;box-shadow:0 0 0 2px #ff3b3b,0 0 18px #ff3b3b;transform:scale(1.04)}',
    '55%{opacity:.95;background:#ff3b3b;box-shadow:0 0 0 2px #ff3b3b,0 0 18px #ff3b3b;transform:scale(1)}100%{opacity:0;background:#ff3b3b;transform:scale(.5);filter:blur(3px)}}',
    '#csb-barra .c img,#csb-barra .c svg{height:100%;width:auto;max-width:100%;object-fit:contain;display:block}',
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
    '#csb .r,#csb .d{max-width:76px}#csb .h{display:none}',
    // Celular (18/11/2026, plano do 🎨 UI): campo de 16 px (sem zoom do iPhone ao focar), Cancelar/Início com 44 px, e o
    // ⌥⇥ vai para a esquerda (à direita ficava por cima do ✏️ do servidor e do ✕ dos cartões), com 44 px, opaco
    // (a 60% o rótulo não chegava a 4,5:1 de contraste) e acima da barra inicial do iPhone (HIG, área segura).
    '#csb .i{font-size:16px}#csb .ini{min-height:44px;box-sizing:border-box;padding:12px 16px;font-size:14px}',
    '#csb-v{left:12px;right:auto;bottom:calc(14px + env(safe-area-inset-bottom));opacity:.92;min-width:44px;',
    'min-height:44px;padding:0 12px;border-radius:16px;font-size:15px}#csb-v.on{display:flex;align-items:center;justify-content:center}}',
    // Reduzir movimento: o painel entra sem escala (Astryx reduced-motion).
    '@media (prefers-reduced-motion:reduce){#csb .p{animation:none}#csb .b,#csb .e{transition:none}}'
  ].join('');

  // Tecla do item: até 4 letras/números (ou < >) com ⏎ opcional, ou só ⏎, Esc, Home, End.
  var TECLA = /^([A-Za-z0-9<>]{1,4})?(⏎)?$/;
  // Home e End como o xterm manda (\e[H e \e[F): o tmux não lê \e[1~ / \e[4~ como Home/End com este TERM, e o
  // ⇤ Para o começo / ⇥ Para o fim do Mover não fazia nada (19/11/2026).
  var ESPECIAL = { 'Esc': '\x1b', 'Home': '\x1b[H', 'End': '\x1b[F' };
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
  // ⌂ Início: espera entre o Esc que fecha a pergunta do tmux e a tecla das Sessões, e a repetição da tecla.
  var INICIO_ESC_MS = 150, INICIO_DE_NOVO_MS = 700;
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
  // "terminal" (28/10/2026, pedido do dono, no lugar do ⌨️): janela escura com os três botões e o prompt verde.
  // Ícones vetoriais para tamanho de painel, divisões e ações de janela (29/10/2026, pedido do dono):
  // no lugar dos glifos Unicode ausentes ou inconsistentes (▯, ⛶, ◧, ▭, ⊞, ⇔, etc.).
  var ICONE = {
    claude: '<svg viewBox="0 0 24 24" aria-label="Claude"><path fill="#d97757" d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/></svg>',
    gemini: '<svg viewBox="0 0 24 24" aria-label="Gemini"><path fill="url(#csb-gm)" d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81"/></svg>',
    terminal: '<svg viewBox="0 0 24 24" aria-label="Terminal">' +
      '<rect x="1.5" y="3" width="21" height="18" rx="4" fill="url(#csb-tm)" stroke="#62627a" stroke-width=".7"/>' +
      '<path d="M1.9 8.4h20.2" stroke="#fff" stroke-opacity=".12" stroke-width=".6"/>' +
      '<circle cx="4.9" cy="5.8" r=".95" fill="#ff5f57"/><circle cx="7.6" cy="5.8" r=".95" fill="#febc2e"/><circle cx="10.3" cy="5.8" r=".95" fill="#28c840"/>' +
      '<path d="M5.6 11.4l3.1 2.7-3.1 2.7M11 16.8h6.6" fill="none" stroke="#5af78e" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    '⇔': '<svg viewBox="0 0 24 24" aria-label="Tamanho">' +
      '<rect x="3" y="4" width="18" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
      '<line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2 2" stroke-opacity=".5"/>' +
      '<path d="M6 12h12M9 9.5L6.5 12 9 14.5M15 9.5l2.5 2.5-2.5 2.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    '◧': '<svg viewBox="0 0 24 24" aria-label="Metade">' +
      '<rect x="3" y="4" width="18" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
      '<line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" stroke-width="1.8"/>' +
      '<rect x="4" y="5" width="7.2" height="14" rx="1.5" fill="currentColor" fill-opacity=".35"/></svg>',
    '▯': '<svg viewBox="0 0 24 24" aria-label="1/3 estreito">' +
      '<rect x="3" y="4" width="18" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
      '<line x1="9" y1="4" x2="9" y2="20" stroke="currentColor" stroke-width="1.8"/>' +
      '<rect x="4" y="5" width="4.2" height="14" rx="1.2" fill="currentColor" fill-opacity=".35"/></svg>',
    '▭': '<svg viewBox="0 0 24 24" aria-label="2/3 largo">' +
      '<rect x="3" y="4" width="18" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
      '<line x1="15" y1="4" x2="15" y2="20" stroke="currentColor" stroke-width="1.8"/>' +
      '<rect x="4" y="5" width="10.2" height="14" rx="1.5" fill="currentColor" fill-opacity=".35"/></svg>',
    '⊞': '<svg viewBox="0 0 24 24" aria-label="Igualar todos">' +
      '<rect x="3" y="4" width="18" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
      '<line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" stroke-width="1.8"/>' +
      '<line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="1.8"/>' +
      '<rect x="4" y="5" width="7.2" height="6.2" rx="1" fill="currentColor" fill-opacity=".25"/>' +
      '<rect x="12.8" y="5" width="7.2" height="6.2" rx="1" fill="currentColor" fill-opacity=".25"/>' +
      '<rect x="4" y="12.8" width="7.2" height="6.2" rx="1" fill="currentColor" fill-opacity=".25"/>' +
      '<rect x="12.8" y="12.8" width="7.2" height="6.2" rx="1" fill="currentColor" fill-opacity=".25"/></svg>',
    '⛶': '<svg viewBox="0 0 24 24" aria-label="Tela cheia">' +
      '<path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    '⫼': '<svg viewBox="0 0 24 24" aria-label="Dividir">' +
      '<rect x="3" y="4" width="18" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
      '<line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" stroke-width="1.8"/></svg>',
    '⏻': '<svg viewBox="0 0 24 24" aria-label="Encerrar">' +
      '<path d="M12 3v9M18.36 6.64a9 9 0 1 1-12.73 0" fill="none" stroke="#ff5c7a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    '⌧': '<svg viewBox="0 0 24 24" aria-label="Fechar editor">' +
      '<rect x="3" y="4" width="18" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
      '<path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#ff5c7a" stroke-width="1.8" stroke-linecap="round"/></svg>',
    '▦': '<svg viewBox="0 0 24 24" aria-label="Grupo">' +
      '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5" fill="currentColor" fill-opacity=".3" stroke="currentColor" stroke-width="1.5"/>' +
      '<rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" fill="currentColor" fill-opacity=".3" stroke="currentColor" stroke-width="1.5"/>' +
      '<rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" fill="currentColor" fill-opacity=".3" stroke="currentColor" stroke-width="1.5"/>' +
      '<rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" fill="currentColor" fill-opacity=".3" stroke="currentColor" stroke-width="1.5"/></svg>',
    '⇄': '<svg viewBox="0 0 24 24" aria-label="Mover">' +
      '<path d="M4 8h14M15 5l3 3-3 3M20 16H6M9 13l-3 3 3 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    '←': '<svg viewBox="0 0 24 24" aria-label="Esquerda"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    '→': '<svg viewBox="0 0 24 24" aria-label="Direita"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    '⇤': '<svg viewBox="0 0 24 24" aria-label="Começo"><path d="M5 5v14M19 12H9M14 7l-5 5 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    '⇥': '<svg viewBox="0 0 24 24" aria-label="Fim"><path d="M19 5v14M5 12h10M10 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  // Degradês dos logos num <svg> só, fora dos painéis (28/10/2026): com o <defs> dentro de cada ícone o id se
  // repetia e, se a primeira cópia ficasse num painel escondido (display:none), o Gemini sumia nas outras telas.
  var DEFS = '<svg id="csb-defs" width="0" height="0" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden">' +
    '<linearGradient id="csb-gm" x1="0" y1="1" x2="1" y2="0">' +
    '<stop offset="0" stop-color="#1c7dff"/><stop offset=".55" stop-color="#9b72cb"/><stop offset="1" stop-color="#d96570"/></linearGradient>' +
    '<linearGradient id="csb-tm" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#3b3b48"/><stop offset="1" stop-color="#15151b"/></linearGradient></svg>';

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
  var segura = false;   // aberto pelo ⌥ Tab com o Option ainda apertado (só muda a dica; soltar não abre nada)
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
      if (it.e === 'servidor' || it.e === 'aviso') return;   // cabeçalho de servidor e aviso: só a tela de Sessões desenha
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
          // Renomear (aba pelo ⌥ R ou sessão pelo r do omega, 03/11/2026, pedido do dono): o campo já vem com o nome
          // atual, todo selecionado — digitar troca, as setas editam.
          if (menu.id === 'renomear' && NOME.test(it.r || '')) b.value = it.r;
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
        // Ícone "srv:<servidor>" (omega, 07/11/2026): o logo vem do servidor, não do nome na tela, que pode ter mudado.
        if (menu.id === 'nova-servidor') {
          var host = /^srv:/.test(it.e || '') ? it.e.slice(4) : it.r;
          if (host !== it.r || /^srv:/.test(it.e || '')) e.textContent = '🖥️';
          logoServidor(e, host, 40, false);
          var pos = parseInt(it.k, 10), tot = menu.i.filter(function (x) { return /^srv:/.test(x.e || ''); }).length;
          [['esq', '◀', 'ou', -1, pos > 1], ['dir', '▶', 'ob', 1, pos < tot]].forEach(function (x) {
            if (!x[4] || !/^srv:/.test(it.e || '')) return;
            var mv = document.createElement('span'); mv.className = 'mv ' + x[0]; mv.textContent = x[1];
            mv.title = x[3] < 0 ? 'Mover para a esquerda (⇧←)' : 'Mover para a direita (⇧→)';
            mv.addEventListener('mousedown', function (ev) { ev.preventDefault(); ev.stopPropagation(); });
            mv.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); move(n, x[3]); });
            b.appendChild(mv);
          });
        }
        var r = document.createElement('span'); r.className = 'r'; r.textContent = it.r || '';
        b.appendChild(e); b.appendChild(r);
        if (it.d) { var d = document.createElement('span'); d.className = 'd'; d.textContent = it.d; b.appendChild(d); }
        // Nova sessão (servidor, IA, nome) sem o selo 1⏎ 2⏎ 3⏎ (28/10/2026, pedido do dono); as teclas continuam valendo.
        if (it.k && it.k !== '-' && !/^nova-/.test(menu.id)) {
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
    // ✕ Cancelar (30/10/2026, pedido do dono: "ficou faltando um botão de cancelar"): o mesmo que o Esc.
    var canc = document.createElement('button'); canc.type = 'button'; canc.tabIndex = -1; canc.className = 'ini canc';
    canc.textContent = '✕ Cancelar';
    canc.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
    canc.addEventListener('click', function () { cancela(); t.focus(); });
    var rod = document.createElement('div'); rod.className = 'rodape';
    // ⌂ Início de volta em todo painel (18/11/2026, pedido do dono: "faltou o botão de início que sumiu dos menus"; tinha
    // saído em 12/11 com a página inicial): fecha o menu (Esc no do tmux) e leva à tela de Sessões, o início de hoje.
    var ini = document.createElement('button'); ini.type = 'button'; ini.tabIndex = -1; ini.className = 'ini';
    ini.textContent = '⌂ Início';
    ini.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
    // 19/11/2026 (pedido do dono: "o botão de ir para o início ainda não funciona bem"): num menu do tmux o Esc e a
    // tecla das Sessões saíam colados (\e\e[94~), o tmux lia outra tecla, o menu ficava aberto atrás e a tela não
    // mudava. Agora o Esc vai sozinho (fecha a pergunta do tmux, se houver uma: renomear, confirmar) e a tecla das
    // Sessões vai logo depois, já fora do tempo em que o tmux juntaria as duas.
    // Ainda 19/11/2026 (pedido do dono: "meu botão início ainda está bugado, não voltando para a página inicial"),
    // medido num tmux à parte: desde que o menu virou tabela de teclas (abas.sh, menu_teclas) o Esc na frente é que
    // estragava — a tecla das Sessões que chega até ~0,5 s depois dele se perde, e a aba não muda. Agora:
    //  · menu comum do tmux (tabela de teclas): só a tecla das Sessões, que sai da tabela e troca de aba;
    //  · pergunta do tmux aberta atrás (campo ✎ de nome, Sim/Não): o Esc fecha a pergunta e a tecla vai depois;
    //  · pergunta do omega (nova sessão, encerrar…): o mesmo Ctrl-D do ✕ Cancelar e a tecla em seguida.
    // Se a tela de Sessões não entrou, a tecla vai de novo um pouco depois (cobre a que se perder na rede).
    ini.addEventListener('click', function () {
      var ir = function () { if (window.csSessoes) window.csSessoes(); };
      var pergunta = menu && menu.tipo === 'tmux' &&
        (menu.id === 'confirma' || menu.i.some(function (it) { return it.k === TEXTO; }));
      var doOmega = menu && menu.tipo === 'omega' && !/^(menu|sh)$/.test(menu.id || '');
      if (pergunta) { some(); digita('\x1b'); setTimeout(ir, INICIO_ESC_MS); }
      else if (doOmega) { some(); digita('\x04'); ir(); }
      else if (menu && menu.tipo === 'tmux') { some(); ir(); }
      else { aberto = segura = false; mostra(); ir(); }
      setTimeout(function () { if (!document.querySelector('#css.on')) ir(); }, INICIO_DE_NOVO_MS);
      t.focus();
    });
    rod.appendChild(canc); rod.appendChild(ini);
    painel.appendChild(rod);
    var h = document.createElement('div'); h.className = 'h';
    h.textContent = segura && menu.id === 'cor' ? '⌥ segurado: C próxima cor · ⇧C volta · ⏎ aplicar · esc cancela'
                  : segura ? '⌥ segurado: tab próximo · ⇧tab volta · ⏎ abrir · esc cancela'
                           : menu.id === 'nova-servidor' ? '← → ou tab escolher · ⇧← ⇧→ muda a ordem · ⏎ abrir · esc cancela'
                           : '← → ou tab escolher · ⏎ abrir · esc cancela';
    painel.appendChild(h);
    sobMouse();
    marca();
    var c = campo();
    // Campo de texto: foco nele sempre (03/11/2026, pedido do dono: aberto pelo ⌥ Tab com o Option ainda apertado, o
    // foco ficava no terminal e a 1ª letra fechava o painel e caía na pergunta em texto do tmux).
    if (c) setTimeout(function () { c.focus(); if (c.value) c.select(); }, 0);
  }

  // Painel aberto (ou redesenhado) embaixo do mouse parado: o item sob o cursor vira o escolhido, para
  // o Enter abrir o que se está vendo destacado (27/10/2026, pedido do dono; desde 30/10 só o Enter entra).
  function sobMouse() {
    if (!rato || mx < 0 || !aberto) return;
    var el = document.elementFromPoint(mx, my), b = el && el.closest && el.closest('#csb .b');
    if (b && !b.classList.contains('x')) sel = +b.dataset.n;
  }

  function mostra() {
    if (!menu) aberto = segura = false;
    raiz.classList.toggle('on', aberto);
    volta.classList.toggle('on', !aberto);
    capa(aberto && menu.tipo === 'tmux' && menu.i.some(function (it) { return it.k === TEXTO; }));
  }

  // Capa da barra (03/11/2026, pedido do dono: "a tela de fundo em amarelo legado ainda continua"): o campo ✎ de um
  // menu do tmux (renomear, nome do grupo) digita numa pergunta do tmux (command-prompt) aberta atrás, que aparece em
  // amarelo na barra de abas, por baixo do véu. Enquanto o campo está aberto, as duas linhas da barra ficam cobertas
  // na cor dela; ao fechar, a capa sai um pouco depois, quando o tmux já recebeu o Enter e redesenhou a barra.
  var capaEl = null, capaFim = 0;
  function capa(on) {
    var tela = t.element && t.element.querySelector('.xterm-screen');
    if (!tela || !t.rows) return;
    if (!capaEl) { capaEl = document.createElement('div'); capaEl.id = 'csb-capa'; }
    if (capaEl.parentNode !== tela) tela.appendChild(capaEl);
    clearTimeout(capaFim);
    if (on) {
      capaEl.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:' + (2 * tela.clientHeight / t.rows) +
        'px;background:#14141f;z-index:12;pointer-events:none';
    } else if (capaEl.style.display !== 'none') {
      capaFim = setTimeout(function () { capaEl.style.display = 'none'; }, 400);
    }
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

  // Nova sessão · servidor: troca o servidor do item n com o vizinho (dir -1/+1). O omega grava a ordem e manda o
  // painel de novo; o escolhido acompanha o servidor que andou.
  function move(n, dir) {
    var it = menu && menu.i[n], pos = it && parseInt(it.k, 10);
    if (!pos || menu.id !== 'nova-servidor' || !menu.i[n + dir] || !/^srv:/.test(menu.i[n + dir].e || '')) return;
    sel = n + dir;
    pede = true; setTimeout(function () { pede = false; }, 2000);
    digita((dir < 0 ? 'ou' : 'ob') + pos + '\r');
    t.focus();
  }

  function escolhe(n) {
    var it = menu && menu.i[n], d = it && teclas(it.k);
    if (!d) return;
    // ⏻ Encerrar aba (painel, e) e o "Sim, fechar" do omega (fechar, s⏎): a aba que sumir no próximo
    // minuto e meio sai com o efeito vermelho de excluir (28/10/2026, pedido do dono).
    if ((menu.id === 'painel' && it.k === 'e') || (menu.id === 'fechar' && /^s/i.test(it.k))) excluirAte = Date.now() + 90000;
    some();
    // O que esse botão abrir em seguida (2º menu, pergunta do omega) já vem aberto.
    pede = true; setTimeout(function () { pede = false; }, 2000);
    digita(d);
    t.focus();
  }

  function esconde() {
    if (!menu) return;
    // Menu do tmux (tabela de teclas ou pergunta do tmux atrás): o Esc sai dele também.
    if (menu.tipo === 'tmux') { some(); digita('\x1b'); return; }
    aberto = segura = false; mostra();
  }

  // Esc no painel da Nova sessão (28/10/2026, pedido do dono: só os botões, nunca o menu em texto do omega):
  // cancela — Ctrl-D na pergunta, e o omega fecha a aba nova-sessao. Desde 28/10/2026 (pedido do dono: a lista em
  // texto não pode aparecer) vale para toda pergunta do omega (renomear, fechar, excluir, sessão…): todo read dele
  // volta ao menu no Ctrl-D, e a tela de Sessões/Scripts volta. Só as telas menu e sh e os menus do tmux só escondem.
  function cancela() {
    if (menu && menu.tipo === 'omega' && !/^(menu|sh)$/.test(menu.id || '')) { some(); digita('\x04'); t.focus(); return; }
    esconde();
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
    // ☰ CloudShell da barra (27/10/2026): abria a página inicial; sem ela (12/11/2026), leva à tela de Sessões.
    if (m && m.tipo === 'inicio') { if (window.csSessoes) window.csSessoes(); return true; }
    if (!m || !Array.isArray(m.i) || (m.tipo !== 'omega' && m.tipo !== 'tmux')) return true;
    // Sem o botão 🧾 Scripts ~/sh na tela de Sessões nem no ⌥ Tab dela (12/11/2026, pedido do dono: só as sessões; os
    // ~/sh o Claude roda sozinho). O omega ainda manda a ação "s⏎" no menu das sessões; ela sai aqui.
    if (m.tipo === 'omega' && m.id === 'menu') m.i = m.i.filter(function (it) { return !(it.g === 'ações' && it.k === 's⏎'); });
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
    // Menu com campo de texto não fica "segurado": soltar o Option redesenharia o painel e apagaria o que já foi digitado.
    if (m.i.some(function (it) { return it.k === TEXTO; })) segura = false;
    if (aberto) desenha();
    mostra();
    return true;
  }

  function para(e) { e.preventDefault(); e.stopPropagation(); }

  function teclado(e) {
    // Digitando no campo de texto: só Enter (envia) e Esc (fecha) são do painel; o resto fica no campo.
    if (aberto && e.target && e.target.classList && e.target.classList.contains('i')) {
      if (e.key === 'Enter') { para(e); envia(e.target); }
      else if (e.key === 'Escape') { para(e); cancela(); t.focus(); }
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
    // ⌥ ainda apertado: Enter entra no escolhido e Esc cancela (30/10/2026) — não precisa soltar antes.
    if (aberto && e.altKey && !e.metaKey && !e.ctrlKey && (e.key === 'Enter' || e.key === 'Escape')) {
      para(e);
      if (e.key === 'Enter') { var ca = campo(); if (ca) envia(ca); else { sobMouse(); escolhe(sel); } } else cancela();
      return;
    }
    if (!aberto || e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    if (e.shiftKey && menu && menu.id === 'nova-servidor' && (k === 'ArrowLeft' || k === 'ArrowRight')) move(sel, k === 'ArrowLeft' ? -1 : 1);
    else if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'Tab') anda(k === 'Tab' && e.shiftKey ? -1 : 1);
    else if (k === 'ArrowLeft' || k === 'ArrowUp') anda(-1);
    else if (k === 'Escape') cancela();
    else if (k === 'Enter') { var ce = campo(); if (ce) envia(ce); else escolhe(sel); }
    else if (campo() && (k.length === 1 || k === 'Backspace')) {
      // Painel com campo de texto e o foco fora dele: a tecla vai para o campo, o painel fica (03/11/2026).
      var cc = campo(), tudo = cc.selectionStart === 0 && cc.selectionEnd === cc.value.length;
      cc.focus();
      cc.value = k === 'Backspace' ? (tudo ? '' : cc.value.slice(0, -1)) : (tudo ? '' : cc.value) + k;
      cc.dispatchEvent(new Event('input'));
    } else {
      // Digitou outra coisa: o painel sai e a tecla vai para o terminal (num menu do tmux, escolhe nele).
      if (k.length === 1 || k === 'Backspace') { if (menu.tipo === 'tmux') some(); else esconde(); }
      return;
    }
    para(e);
  }

  // Soltar o Option NÃO entra em nada (30/10/2026, pedido do dono: "só deve entrar em algo se eu clicar Enter";
  // antes abria o escolhido, como o Cmd+Tab, e entrava sem querer). O painel fica aberto com o destaque onde
  // estava: Enter (ou clique) entra, ✕ Cancelar ou Esc fecham. Só a dica embaixo muda.
  function solta(e) {
    if (e.key !== 'Alt') return;
    if (aberto && segura) { segura = false; para(e); desenha(); }
    else segura = false;
  }

  // ---- Logos na barra de abas (28/10/2026, pedido do dono: "use o ícone oficial da empresa e coloque o ícone da
  // IA que está rodando"). O tmux não desenha imagem: o rótulo da aba (host/tmux.conf, @aba_rotulo) leva marcas de
  // texto — 🌊 🥩 🍎 🛒 + 3 espaços (servidor, 5 células) e 🤖 ✨ 💻 (IA, 2 células) — e a página pinta por cima de cada
  // marca uma caixa com a cor de fundo da célula e o logo oficial (logos.js) ou o da IA (ICONE). A caixa não
  // recebe mouse: clique, arrasto e menu da barra continuam indo para o tmux. Em terminal comum ficam os emojis.
  // Redesenha quando o xterm pinta a 1ª linha (onRender) ou muda de tamanho; igual ao anterior = nada a fazer.
  var MARCA = { '🌊': ['srv', 'awlsrv', 5], '🥩': ['srv', 'srv2', 5], '🍎': ['srv', 'mac', 5],
                '🛒': ['srv', 'pdv-casadecarnes', 5],
                '🤖': ['ia', 'claude', 2], '✨': ['ia', 'gemini', 2], '💻': ['ia', 'terminal', 2] };
  var barra = null, barraSig = '', barraPend = false;
  var abasAntes = {}, abasAgora = [], hoverNome = '', excluirAte = 0, fantasmas = null, dimAntes = null, barraDupla = false;
  var ativaAntes = '', entraNome = '', entraAte = 0;
  var ANSI = ['#000000', '#cd3131', '#0dbc79', '#e5e510', '#2472c8', '#bc3fbc', '#11a8cd', '#e5e5e5',
              '#666666', '#f14c4c', '#23d18b', '#f5f543', '#3b8eea', '#d670d6', '#29b8db', '#ffffff'];
  function hex2(v) { return ('0' + (v & 255).toString(16)).slice(-2); }
  function cor256(i) {
    if (i < 16) return ANSI[i];
    if (i < 232) {
      var j = i - 16, L = [0, 95, 135, 175, 215, 255];
      return '#' + hex2(L[Math.floor(j / 36)]) + hex2(L[Math.floor(j / 6) % 6]) + hex2(L[j % 6]);
    }
    var c = 8 + (i - 232) * 10; return '#' + hex2(c) + hex2(c) + hex2(c);
  }
  // Fundo da célula (xterm: modo RGB, 256 cores ou 16); sem cor = o fundo da barra (status-style do tmux.conf).
  function corCelula(c) {
    var m = c.getBgColorMode(), v = c.getBgColor();
    if (m === 50331648) return '#' + hex2(v >> 16) + hex2(v >> 8) + hex2(v);
    if (m === 33554432 || m === 16777216) return cor256(v);
    return '#14141f';
  }
  function barraDesenha() {
    barraPend = false;
    try {
      var tela = t.element && t.element.querySelector('.xterm-screen');
      if (!tela || !t.buffer) return;
      var buf = t.buffer.active, linha = buf.getLine(buf.viewportY);
      if (!linha) return;
      var cw = tela.clientWidth / t.cols, ch = tela.clientHeight / t.rows, achadas = [], x, cel, s, m;
      for (x = 0; x < t.cols; x++) {
        cel = linha.getCell(x); if (!cel) continue;
        s = cel.getChars(); if (!s) continue;
        m = MARCA[String.fromCodePoint(s.codePointAt(0))];
        if (m) achadas.push({ x: x, m: m, cor: corCelula(cel) });
      }
      // Barra com 2 linhas (tmux.conf: status 2, marca ⠀ na 1ª coluna da 2ª linha): cada aba ganha uma faixa na
      // 2ª linha, na cor dela, e os logos ocupam as duas linhas (28/10/2026, pedido do dono: aba maior).
      var l2 = buf.getLine(buf.viewportY + 1), c2 = l2 && l2.getCell(0), dupla = !!(c2 && c2.getChars() === '\u2800');
      var faixas = [], corAtual = null, x0 = 0;
      if (dupla) {
        for (x = 0; x <= t.cols; x++) {
          cel = x < t.cols ? linha.getCell(x) : null;
          var cor = cel && cel.getBgColorMode() !== 0 ? corCelula(cel) : null;
          if (cor !== corAtual) { if (corAtual) faixas.push({ x: x0, n: x - x0, cor: corAtual }); corAtual = cor; x0 = x; }
        }
      }
      // Cada faixa colorida da 1ª linha é uma aba: o texto dela é a identidade, para os efeitos. A ativa é a que está
      // em negrito (tmux.conf: window-status-current-format, sem sublinhado desde 28/10/2026).
      var alt = dupla ? 2 * ch : ch, abas = [], agora = {}, ativa = '';
      faixas.forEach(function (f) {
        var nome = linha.translateToString(false, f.x, f.x + f.n).replace(/\s+/g, ' ').trim(), negrito = false;
        if (!nome) return;
        for (var k = f.x; k < f.x + f.n && !negrito; k++) { var cc = linha.getCell(k); if (cc && cc.isBold()) negrito = true; }
        if (negrito && !ativa && !/^[▾▸]/.test(nome)) ativa = nome;   // rótulo de grupo também é negrito: fora
        abas.push({ nome: nome, x: f.x, n: f.n, cor: f.cor }); agora[nome] = { x: f.x, n: f.n, cor: f.cor };
      });
      var sig = JSON.stringify([cw, ch, dupla, achadas, faixas, ativa]);
      if (sig === barraSig) return;
      barraSig = sig;
      if (!barra) { barra = document.createElement('div'); barra.id = 'csb-barra'; }
      if (barra.parentNode !== tela) tela.appendChild(barra);
      if (!fantasmas) { fantasmas = document.createElement('div'); fantasmas.id = 'csb-fantasmas'; }
      // Aba que sumiu: fantasma no lugar dela (vermelho se veio de um ⏻ Encerrar / ❌ Fechar sessão recente).
      if (dimAntes && dimAntes[0] === cw && dimAntes[1] === ch) {
        Object.keys(abasAntes).forEach(function (nome) {
          if (agora[nome]) return;
          var a = abasAntes[nome], g = document.createElement('div');
          g.className = 'fantasma' + (Date.now() < excluirAte ? ' excluir' : '');
          g.style.cssText = 'left:' + (a.x * cw) + 'px;width:' + (a.n * cw) + 'px;height:' + alt + 'px;background:' + a.cor;
          fantasmas.appendChild(g);
          setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 1000);
        });
      }
      abasAntes = agora; abasAgora = abas; dimAntes = [cw, ch]; barraDupla = dupla;
      // Troca de aba: a que ficou ativa acende (vale também para trocas pelo teclado / ⌥ Tab).
      if (ativa && ativaAntes && ativa !== ativaAntes) { entraNome = ativa; entraAte = Date.now() + 450; }
      ativaAntes = ativa;
      barra.textContent = '';
      faixas.forEach(function (f) {
        var d = document.createElement('div'); d.className = 'f';
        d.style.cssText = 'left:' + (f.x * cw) + 'px;top:' + ch + 'px;width:' + (f.n * cw) + 'px;height:' + ch + 'px;background:' + f.cor;
        barra.appendChild(d);
      });
      if (fantasmas.parentNode !== tela) tela.appendChild(fantasmas);
      achadas.forEach(function (a) {
        var d = document.createElement('div'), slug = a.m[1], im;
        d.className = 'c ' + a.m[0];
        d.style.cssText = 'left:' + (a.x * cw) + 'px;width:' + (a.m[2] * cw) + 'px;height:' + (dupla ? 2 * ch : ch) + 'px;background:' + a.cor;
        if (a.m[0] === 'ia') d.innerHTML = ICONE[slug] || '';
        else if (window.csLogos && window.csLogos[slug]) { im = document.createElement('img'); im.src = window.csLogos[slug]; im.alt = slug; d.appendChild(im); }
        else return;
        barra.appendChild(d);
      });
      // Caixas das abas por último: o véu do hover e o brilho da ativa ficam por cima dos logos também.
      abas.forEach(function (a) {
        var d = document.createElement('div');
        d.className = 'aba' + (a.nome === ativa ? ' ativa' : '') + (a.nome === hoverNome ? ' hover' : '') +
                      (a.nome === entraNome && Date.now() < entraAte ? ' entra' : '');
        d.setAttribute('data-nome', a.nome);
        d.style.cssText = 'left:' + (a.x * cw) + 'px;width:' + (a.n * cw) + 'px;height:' + alt + 'px';
        barra.appendChild(d);
      });
    } catch (e) {}
  }
  function barraAgenda() { if (barraPend) return; barraPend = true; requestAnimationFrame(barraDesenha); }
  // Aba embaixo do mouse (coluna e linha da célula do xterm), ou nada.
  function abaNoMouse(e) {
    var tela = t.element && t.element.querySelector('.xterm-screen');
    if (!tela || !abasAgora.length) return null;
    var r = tela.getBoundingClientRect(), cw = r.width / t.cols, ch = r.height / t.rows;
    var col = (e.clientX - r.left) / cw, lin = (e.clientY - r.top) / ch;
    if (lin < 0 || lin >= (barraDupla ? 2 : 1)) return null;
    for (var i = 0; i < abasAgora.length; i++) if (col >= abasAgora[i].x && col < abasAgora[i].x + abasAgora[i].n) return abasAgora[i].nome;
    return null;
  }
  function abaEl(nome) {
    if (!barra || !nome) return null;
    var els = barra.querySelectorAll('.aba');
    for (var i = 0; i < els.length; i++) if (els[i].getAttribute('data-nome') === nome) return els[i];
    return null;
  }
  function barraMouse(e) {
    var nome = abaNoMouse(e) || '';
    if (nome === hoverNome) return;
    var velho = abaEl(hoverNome); if (velho) velho.classList.remove('hover');
    hoverNome = nome;
    var novo = abaEl(nome); if (novo) novo.classList.add('hover');
    // Mãozinha em cima da aba (as caixas não recebem mouse: o cursor é o da tela do xterm).
    var tela = t.element && t.element.querySelector('.xterm-screen');
    if (tela) tela.style.cursor = nome ? 'pointer' : '';
  }
  // Clique: onda que nasce no ponto clicado, na camada dos fantasmas (não é apagada quando a barra redesenha com
  // a troca de aba — era o que matava a animação antiga).
  function barraClique(e) {
    var nome = abaNoMouse(e), a = null, i;
    if (!nome || !fantasmas) return;
    for (i = 0; i < abasAgora.length; i++) if (abasAgora[i].nome === nome) a = abasAgora[i];
    var tela = t.element.querySelector('.xterm-screen'); if (!a || !tela) return;
    var r = tela.getBoundingClientRect(), cw = r.width / t.cols, ch = r.height / t.rows, alt = barraDupla ? 2 * ch : ch;
    var w = a.n * cw, cx = e.clientX - r.left - a.x * cw, cy = e.clientY - r.top, raio = 2 * Math.hypot(Math.max(cx, w - cx), alt);
    var o = document.createElement('div'), b = document.createElement('i');
    o.className = 'onda';
    o.style.cssText = 'left:' + (a.x * cw) + 'px;width:' + w + 'px;height:' + alt + 'px';
    b.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;width:' + raio + 'px;height:' + raio + 'px';
    o.appendChild(b); fantasmas.appendChild(o);
    setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 600);
  }
  function barraInicia() {
    if (!t.buffer || !t.onRender) return;
    t.onRender(function (e) { if (!e || e.start === 0) barraAgenda(); });
    t.onResize(function () { barraSig = ''; barraAgenda(); });
    window.addEventListener('resize', function () { barraSig = ''; barraAgenda(); });
    t.element.addEventListener('mousemove', barraMouse, true);
    t.element.addEventListener('mouseleave', function () { barraMouse({ clientX: -1, clientY: -1 }); }, true);
    t.element.addEventListener('mousedown', barraClique, true);
    barraAgenda();
  }

  // ---- Toque no celular (19/11/2026, pedido do dono: "o omega shell mobile não funciona direito o touch screen e não
  // consigo mudar de aba no terminal"). Medido num iPhone simulado com toque de verdade (CDP dispatchTouchEvent):
  //  - tocar numa aba visível da barra JÁ trocava (o toque vira clique e o tmux recebe o MouseDown1Status);
  //  - arrastar o dedo NÃO rolava nada: o xterm só converte a roda do mouse em rolagem do tmux, e toque não é roda;
  //  - com 8 abas, numa tela de 40 colunas cabiam 3 e o resto ficava atrás de um ">" de 1 caractere, sem como chegar.
  // Então: (1) arrastar na vertical vira roda do mouse (o tmux entra no copy-mode e rola, como no computador);
  // (2) deslizar na horizontal troca para a aba vizinha (as mesmas teclas do ⌥ ← / ⌥ →, User9/User10 do tmux.conf);
  // (3) botões ‹ › de 44 px ao lado do ⌥⇥ fazem o mesmo, para quem não sabe do gesto. O toque curto continua
  // sendo clique (abas, links, painéis do tmux): só depois de o dedo andar 10 px o gesto é nosso.
  // Só em tela de toque (pointer:coarse); no computador nada muda.
  var toqueX = 0, toqueY = 0, toqueModo = '', toqueResto = 0;
  function toqueAba(dir) { if (!aberto) digita(dir < 0 ? '\x1b[90~' : '\x1b[89~'); }
  function toqueRoda(dy) {
    // Sempre no meio da tela: roda em cima da barra de abas é previous/next-window no tmux (WheelUpStatus).
    var el = t.element.querySelector('.xterm-screen') || t.element, r = el.getBoundingClientRect();
    el.dispatchEvent(new WheelEvent('wheel', { deltaY: dy, deltaMode: 0, clientX: r.left + r.width / 2,
      clientY: r.top + r.height / 2, bubbles: true, cancelable: true }));
  }
  function toqueInicia() {
    if (!window.matchMedia || !window.matchMedia('(pointer:coarse)').matches) return;
    var el = t.element;
    el.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { toqueModo = 'x'; return; }
      toqueX = e.touches[0].clientX; toqueY = e.touches[0].clientY; toqueModo = ''; toqueResto = 0;
    }, { passive: true });
    el.addEventListener('touchmove', function (e) {
      if (toqueModo === 'x' || e.touches.length !== 1) return;
      var p = e.touches[0], dx = p.clientX - toqueX, dy = p.clientY - toqueY;
      if (!toqueModo) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        toqueModo = Math.abs(dy) >= Math.abs(dx) ? 'v' : 'h';
      }
      e.preventDefault();   // o gesto é nosso: sem quique da página e sem clique no fim
      if (toqueModo !== 'v') return;
      // Cada roda rola 5 linhas no copy-mode do tmux: uma roda a cada 3 alturas de célula andadas deixa o texto
      // acompanhar o dedo um pouco mais rápido que ele (medido: 1 roda por célula corria 5× o dedo).
      var ch = 3 * (el.querySelector('.xterm-screen') || el).getBoundingClientRect().height / (t.rows || 24);
      toqueResto += dy; toqueY = p.clientY; toqueX = p.clientX;
      while (Math.abs(toqueResto) >= ch) {
        var s = toqueResto > 0 ? 1 : -1;
        toqueRoda(-s * 100);
        toqueResto -= s * ch;
      }
    }, { passive: false });
    el.addEventListener('touchend', function (e) {
      if (toqueModo === 'h') {
        var p = e.changedTouches[0], dx = p.clientX - toqueX;
        if (Math.abs(dx) >= 60) toqueAba(dx < 0 ? 1 : -1);   // dedo para a esquerda = próxima aba
      }
      toqueModo = '';
    }, { passive: true });
    // ‹ › ao lado do ⌥⇥ (mesmo visual; só no celular).
    var st = document.createElement('style');
    st.textContent = '.csb-nav{position:fixed;bottom:calc(14px + env(safe-area-inset-bottom));z-index:20;display:flex;' +
      'align-items:center;justify-content:center;min-width:44px;min-height:44px;padding:0;box-sizing:border-box;' +
      'border:1px solid rgba(255,255,255,.16);border-radius:16px;opacity:.92;background:rgba(36,36,46,.7);' +
      '-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);color:#f2f2f7;font:600 22px system-ui,sans-serif;' +
      'cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}' +
      '.csb-nav:active{background:rgba(124,77,255,.45)}#csb-ant{left:66px}#csb-prx{left:120px}' +
      '#csb.on~.csb-nav{display:none}';
    document.head.appendChild(st);
    [['csb-ant', '‹', 'Aba anterior', -1], ['csb-prx', '›', 'Próxima aba', 1]].forEach(function (x) {
      var b = document.createElement('button');
      b.id = x[0]; b.className = 'csb-nav'; b.type = 'button'; b.tabIndex = -1;
      b.textContent = x[1]; b.setAttribute('aria-label', x[2]); b.title = x[2];
      b.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
      b.addEventListener('click', function () { toqueAba(x[3]); });
      document.body.appendChild(b);
    });
    puxadorInicia();
    tecladoInicia();
  }

  // ---- Teclado do celular (19/11/2026, pedido do dono: "ao abrir o teclado deve mover o texto pra cima dele, na
  // horizontal ou na vertical"). No iPhone o Safari NÃO encolhe a página quando o teclado abre: ele só cobre a metade
  // de baixo, e a linha em que se digita (o fim do terminal) fica atrás dele. O interactive-widget=resizes-content
  // da meta viewport (inicio.js) resolve só no Chrome do Android. Aqui a altura da página passa a ser a da área
  // VISÍVEL (visualViewport), o xterm recalcula as linhas (fit) e o tmux redesenha com menos linhas — o prompt fica
  // logo acima do teclado, em pé ou deitado. Os botões flutuantes sobem junto (--cs-kb).
  var tecladoPend = 0, tecladoCheio = {};
  function tecladoAjusta(hTeste) {
    tecladoPend = 0;
    var vv = window.visualViewport;
    if (!vv && !hTeste) return;
    var h = Math.round(hTeste || vv.height);
    // Altura "sem teclado" = a maior área visível já vista nesta largura: diz se o teclado está aberto.
    var chave = Math.round(vv ? vv.width : window.innerWidth);
    tecladoCheio[chave] = Math.max(tecladoCheio[chave] || 0, h);
    var aberto2 = tecladoCheio[chave] - h > 80;
    // Quanto subir os botões fixos: o que o teclado cobre da área de layout. No iPhone a área de layout não encolhe
    // (kb = altura do teclado); no Android com resizes-content ela encolhe junto (kb = 0, nada a compensar).
    var kb = hTeste ? Math.max(0, window.innerHeight - h)
      : Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
    var raizDoc = document.documentElement;
    raizDoc.style.setProperty('--cs-kb', kb + 'px');
    raizDoc.classList.toggle('cs-teclado', aberto2);
    raizDoc.style.height = h + 'px'; document.body.style.height = h + 'px';
    // O CSS do ttyd tem html,body{min-height:100%}: sem zerar, a página nunca fica menor que a tela.
    raizDoc.style.minHeight = '0'; document.body.style.minHeight = '0';
    if (window.scrollY) window.scrollTo(0, 0);   // o iPhone empurra a página para cima ao focar; volta ao topo
    // O fit lê a altura nova depois do layout; um segundo fit pega o fim da animação do teclado.
    requestAnimationFrame(function () { if (window.term && window.term.fit) window.term.fit(); if (puxDesenha) puxDesenha(); });
    setTimeout(function () { if (window.term && window.term.fit) window.term.fit(); if (puxDesenha) puxDesenha(); }, 350);
  }
  function tecladoAgenda() { if (!tecladoPend) tecladoPend = setTimeout(tecladoAjusta, 60); }
  function tecladoInicia() {
    var st = document.createElement('style');
    st.textContent = 'body{height:100%}' +
      // Celular deitado passa de 600 px e cairia no ⌥⇥ do computador (à direita, em cima da barra de puxar):
      // em tela de toque ele fica sempre como no celular em pé.
      '#csb-v{left:12px;right:auto;bottom:calc(14px + env(safe-area-inset-bottom));opacity:.92;min-width:44px;' +
      'min-height:44px;padding:0 12px;border-radius:16px;font-size:15px}#csb-v.on{display:flex;align-items:center;' +
      'justify-content:center}' +
      '#csb-v,.csb-nav{margin-bottom:var(--cs-kb,0px)}' +
      // Teclado aberto: o prompt é a última linha, à esquerda. Os botões vão para a direita (antes da barra de
      // puxar) e ficam mais apagados, para não cobrir o que se digita.
      '.cs-teclado #csb-v{left:auto;right:40px;opacity:.6}' +
      '.cs-teclado #csb-prx{left:auto;right:102px;opacity:.6}' +
      '.cs-teclado #csb-ant{left:auto;right:152px;opacity:.6}';
    document.head.appendChild(st);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', tecladoAgenda);
      window.visualViewport.addEventListener('scroll', tecladoAgenda);
    }
    window.addEventListener('orientationchange', function () { setTimeout(tecladoAjusta, 250); });
    window.csTeclado = tecladoAjusta;   // teste: csTeclado(<altura visível>) simula o teclado aberto
    tecladoAjusta();
  }

  // ---- Barra de puxar (19/11/2026, pedido do dono: "ainda não funciona bem o arrastar a página no mobile; teria como
  // colocar uma barra de puxar somente no mobile?"). Uma barra de rolagem de verdade na borda direita, só em tela de
  // toque. A posição vem do próprio tmux: no copy-mode ele escreve "[linha/total]" no alto do painel
  // (copy-mode-position-format), e a página lê isso do buffer do xterm a cada redesenho. Arrastar o puxador escolhe
  // a linha alvo; a página manda rodas do mouse (5 linhas cada, o WheelUpPane do tmux) até chegar perto. Puxador
  // embaixo de tudo = o fim: o tmux sai do copy-mode sozinho (copy-mode -e). Tocar na trilha pula para o ponto.
  // Em programa de tela cheia (vim, menus) não há "[linha/total]": aí a barra anda por roda relativa ao dedo.
  var pux = null, puxTrilha = null, puxBolha = null, puxArrasto = false, puxAlvo = null, puxPos = 0, puxTotal = 0,
    puxUltimaRoda = 0, puxRelY = 0;
  function puxLe() {
    // Procura "[n/m]" nas primeiras linhas visíveis (o painel começa depois das 2 linhas da barra e da borda).
    var b = t.buffer.active;
    for (var i = 0; i < 6; i++) {
      var l = b.getLine(b.viewportY + i);
      var m = l && /\[(\d+)\/(\d+)\]/.exec(l.translateToString(true));
      if (m) return [parseInt(m[1], 10), parseInt(m[2], 10)];
    }
    return null;
  }
  function puxArea() {
    var el = t.element.querySelector('.xterm-screen') || t.element, r = el.getBoundingClientRect();
    var ch = r.height / (t.rows || 24);
    var topo = r.top + ch * 3 + 6, base = (window.visualViewport ? window.visualViewport.height : window.innerHeight) - 18;
    return { topo: topo, alto: Math.max(120, base - topo) };
  }
  function puxDesenha() {
    if (!pux) return;
    var a = puxArea(), lido = puxLe();
    if (lido) { puxPos = lido[0]; puxTotal = lido[1]; } else if (!puxArrasto) { puxPos = 0; }
    puxTrilha.style.top = a.topo + 'px'; puxTrilha.style.height = a.alto + 'px';
    var alto = 52, livre = a.alto - alto;
    var fr = puxArrasto && puxAlvo !== null && puxTotal ? puxAlvo / puxTotal : (puxTotal ? puxPos / puxTotal : 0);
    fr = Math.max(0, Math.min(1, fr));
    pux.style.top = (a.topo + livre * (1 - fr)) + 'px';   // fr 0 = fim (embaixo); 1 = começo do histórico (em cima)
    pux.classList.toggle('modo', !!lido);
    if (puxArrasto) {
      puxBolha.textContent = puxTotal ? (puxPos ? '↑ ' + puxPos + ' de ' + puxTotal : 'fim') : '…';
      puxBolha.style.top = (a.topo + livre * (1 - fr) + 12) + 'px';
    }
  }
  function puxPersegue() {
    // Uma rajada de rodas por quadro, até o alvo; o redesenho seguinte relê a posição e corrige.
    if (!puxArrasto || puxAlvo === null) return;
    var agora = Date.now();
    if (agora - puxUltimaRoda < 30) { requestAnimationFrame(puxPersegue); return; }
    puxUltimaRoda = agora;
    var lido = puxLe();
    if (!lido) {
      if (puxAlvo > 0) toqueRoda(-100);          // ainda fora do copy-mode: a 1ª roda entra nele
      requestAnimationFrame(puxPersegue); return;
    }
    var dif = puxAlvo - lido[0];
    if (Math.abs(dif) >= 5) {
      var n = Math.min(8, Math.floor(Math.abs(dif) / 5));
      for (var k = 0; k < n; k++) toqueRoda(dif > 0 ? -100 : 100);
    } else if (puxAlvo === 0 && lido[0] > 0) {
      toqueRoda(100);                             // últimas linhas até o fim (o tmux sai do copy-mode)
    }
    requestAnimationFrame(puxPersegue);
  }
  function puxAlvoPelo(y) {
    var a = puxArea(), livre = a.alto - 52;
    var fr = 1 - Math.max(0, Math.min(1, (y - 26 - a.topo) / livre));
    if (fr < 0.02) fr = 0;
    puxAlvo = Math.round(fr * puxTotal);
  }
  function puxadorInicia() {
    var st = document.createElement('style');
    st.textContent =
      '#csb-trilha{position:fixed;right:0;width:34px;z-index:19;touch-action:none;-webkit-tap-highlight-color:transparent}' +
      '#csb-trilha::before{content:"";position:absolute;right:7px;top:0;bottom:0;width:4px;border-radius:2px;' +
      'background:rgba(255,255,255,.10)}' +
      '#csb-pux{position:fixed;right:3px;width:12px;height:52px;z-index:20;border-radius:6px;pointer-events:none;' +
      'background:rgba(179,136,255,.55);box-shadow:0 0 0 1px rgba(255,255,255,.18);transition:width .12s,right .12s,background .12s}' +
      '#csb-pux.modo{background:rgba(179,136,255,.85)}' +
      '#csb-pux.arrasta{width:16px;right:1px;background:#b388ff}' +
      '#csb-bolha{position:fixed;right:30px;z-index:20;display:none;padding:6px 10px;border-radius:12px;pointer-events:none;' +
      'background:rgba(36,36,46,.92);border:1px solid rgba(255,255,255,.16);color:#f2f2f7;' +
      'font:600 13px ui-monospace,Menlo,monospace;transform:translateY(-50%)}' +
      '#csb.on~#csb-trilha,#csb.on~#csb-pux{display:none}' +
      '@media (prefers-reduced-motion:reduce){#csb-pux{transition:none}}';
    document.head.appendChild(st);
    puxTrilha = document.createElement('div'); puxTrilha.id = 'csb-trilha';
    puxTrilha.setAttribute('role', 'scrollbar'); puxTrilha.setAttribute('aria-label', 'Rolar o terminal');
    pux = document.createElement('div'); pux.id = 'csb-pux';
    puxBolha = document.createElement('div'); puxBolha.id = 'csb-bolha';
    document.body.appendChild(puxTrilha); document.body.appendChild(pux); document.body.appendChild(puxBolha);
    puxTrilha.addEventListener('touchstart', function (e) {
      if (aberto || e.touches.length !== 1) return;
      e.preventDefault();
      puxArrasto = true; pux.classList.add('arrasta'); puxBolha.style.display = 'block';
      puxRelY = e.touches[0].clientY;
      var lido = puxLe();
      if (!lido) { toqueRoda(-100); puxTotal = puxTotal || 0; }   // entra no copy-mode para o tmux dizer o total
      puxAlvoPelo(e.touches[0].clientY);
      puxDesenha(); requestAnimationFrame(puxPersegue);
    }, { passive: false });
    puxTrilha.addEventListener('touchmove', function (e) {
      if (!puxArrasto) return;
      e.preventDefault();
      var y = e.touches[0].clientY;
      if (puxTotal) puxAlvoPelo(y);
      else {
        // Sem "[n/m]" (programa de tela cheia): roda relativa, 1 roda a cada 14 px.
        while (Math.abs(y - puxRelY) >= 14) { toqueRoda(y < puxRelY ? -100 : 100); puxRelY += y < puxRelY ? -14 : 14; }
      }
      puxDesenha();
    }, { passive: false });
    function solta() {
      if (!puxArrasto) return;
      puxArrasto = false; puxAlvo = null;
      pux.classList.remove('arrasta'); puxBolha.style.display = 'none';
      puxDesenha();
    }
    puxTrilha.addEventListener('touchend', solta);
    puxTrilha.addEventListener('touchcancel', solta);
    t.onRender(puxDesenha);
    window.addEventListener('resize', puxDesenha);
    puxDesenha();
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
    document.body.insertAdjacentHTML('afterbegin', DEFS);
    document.body.appendChild(raiz); document.body.appendChild(volta);
    t.parser.registerOscHandler(7717, recebe);
    barraInicia();
    toqueInicia();
    document.addEventListener('keydown', teclado, true);
    // ⌥ C com a paleta aberta: anda pelas cores (⇧ volta), como o Tab no ⌥ Tab. No window, antes do atalho da
    // página que manda o ⌥ C ao tmux (que reabriria a paleta do zero).
    window.addEventListener('keydown', function (e) {
      if (e.code !== 'KeyC' || !e.altKey || e.metaKey || e.ctrlKey || !aberto || !menu || menu.id !== 'cor') return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      anda(e.shiftKey ? -1 : 1);
      if (!segura) { segura = true; desenha(); }
    }, true);
    // ⌥ R (03/11/2026, pedido do dono: "ao lado do ⌥ C"): renomear a aba — o tmux (User8) abre o campo no painel.
    // Pelo e.code: no Mac o Option+R vira ®. Com o painel aberto não faz nada (o campo pode estar recebendo texto).
    window.addEventListener('keydown', function (e) {
      if (e.code !== 'KeyR' || !e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      if (!aberto) digita('\x1b[91~');
    }, true);
    // ⌥ ← e ⌥ → (19/11/2026, pedido do dono: "coloque um atalho opt + seta para navegar entre as abas"): a aba vizinha
    // na barra — o tmux (User9/User10) pula as fixas e dá a volta nas pontas; da tela de Sessões, → vai para a 1ª aba
    // e ← para a última. Com o painel aberto não faz nada; num campo de texto (nome, renomear) as setas são dele.
    window.addEventListener('keydown', function (e) {
      if ((e.code !== 'ArrowLeft' && e.code !== 'ArrowRight') || !e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (e.target && e.target.tagName === 'INPUT') return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      if (!aberto) digita(e.code === 'ArrowLeft' ? '\x1b[90~' : '\x1b[89~');
    }, true);
    document.addEventListener('keyup', solta, true);
    window.addEventListener('blur', function () { segura = false; });
    document.addEventListener('mousemove', function (e) {
      if (e.clientX === mx && e.clientY === my) return;   // o redesenho embaixo do mouse parado também gera mousemove
      mx = e.clientX; my = e.clientY; rato = true;
    }, true);
    // Clique no terminal com um menu do tmux aberto: o tmux fecha ou escolhe nele; os botões saem.
    t.element.addEventListener('mousedown', function () { if (menu && menu.tipo === 'tmux') some(); }, true);
    // Mouse passando pelo terminal com um menu do tmux aberto (20/11/2026, pedido do dono: "não está mudando de cor
    // as abas"): o Claude Code pede o movimento do mouse (modo 1003) e o xterm manda cada passo ao tmux. Medido num
    // tmux à parte: o movimento em cima da barra de abas ou da faixa do painel é uma tecla para o tmux, tira o cliente
    // da tabela de teclas do menu (abas.sh, menu_teclas, 19/11/2026) e a tecla do botão — a cor da paleta do ⌥ C, um
    // item do ⌥ Tab — caía no terminal como letra, sem fazer nada. O tmux não deixa prender o movimento na tabela
    // (MouseMove… não é tecla de bind), então com o menu aberto o movimento sem botão não chega ao xterm.
    t.element.addEventListener('mousemove', function (e) {
      if (menu && menu.tipo === 'tmux' && !e.buttons) e.stopPropagation();
    }, true);
  }

  var n = 0, i = setInterval(function () {
    t = window.term;
    if (!t && ++n < 100) return;
    clearInterval(i);
    if (t && t.parser) inicia();
  }, 100);
})();
