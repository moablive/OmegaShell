# CloudShell — terminal web da Astral Wave

> Fonte da documentação: Google Doc "Projeto - Astral Wave ／ CloudShell", pasta awldocs do Drive.
> Este arquivo é a cópia no repositório.

Terminal no navegador, instalável como app (PWA), que abre SSH nos servidores da
Astral Wave. Container `astralwave_omegashell` na `awl_network` (aba Astral Wave
do painel Docker do Moabinho), serviço no `docker-compose.yml` da raiz do
astralwavelabel.

## Página inicial (27/10/2026)

Ao abrir (ou recarregar) o CloudShell, antes do terminal aparece a **página inicial**: o título "Para onde
vamos?", a saudação com data e hora e dois cartões (a mesa do Conselho desenhada saiu em 27/10/2026: o Conselho
e os escritórios moram no Escritórios 3D, https://escritorios.astralwavelabel.com; os cartões Conselho Ômega e
Continuar saíram em 28/10/2026, e o Nova sessão também — sessão nova só pela tela de Sessões): **Ω Sessões** (1, aba omega) e **🧾 Scripts ~/sh** (2) — os cartões não mostram o selo do número desde 28/10/2026, as teclas continuam.
Esc fecha a página e volta à aba de antes — se for a janela conselho (sessão nova), vai para a omega (Sessões);
cair na conselho (ao fechar outra aba) reabre a página inicial. Teclado: 1–2, ← → e Enter; ⌥ Tab fecha a página e abre os
menus. O botão **⌂** no canto (acima do ⌥⇥) volta para ela. É uma camada por cima do terminal (`pwa/inicio.js`,
injetado pelo nginx como o `botoes.js`): o login não muda. Cada cartão só digita uma tecla que o `tmux.conf`
liga à janela (`\e[94~` omega, `\e[93~` sh).

## Telas de Sessões e de Scripts (27/10/2026)

Na aba **omega** (e no cartão **Ω Sessões** da página inicial), por cima da lista em texto, a tela de Sessões
(`pwa/sessoes.js`): um bloco por servidor — **logo**, nome, ● no ar / sem resposta do ssh, quantas sessões — e um
cartão por sessão (logo do Claude ou do Gemini, ícone de terminal, nome, situação, nº). Ao vivo: o omega manda o menu a
cada segundo e relê a cada 3 s; os cabeçalhos dos servidores vêm no próprio menu (itens de ícone `servidor`, que o
painel do ⌥ Tab não desenha). Clique, nº + Enter ou ← → e Enter abre a sessão; **n** nova, **r** renomeia,
**d** fecha, **a** atualiza; **Esc** abre a página inicial (desde 28/10/2026 a lista em texto não aparece); ⌥ Tab abre os botões por cima da tela.
Esc numa pergunta do omega (renomear, fechar, excluir…) cancela (Ctrl-D) e a tela volta.

Na aba **sh** a mesma tela vira **Scripts ~/sh**: um bloco por servidor (awlsrv, srvbonatoeferraz) com os ~/sh
em **lista**, um por linha com o nome inteiro, há quanto tempo foi gravado ou de qual depende, e a divisão
**↻ reutilizáveis**. nº + Enter ou ↑ ↓ e Enter roda (abre a aba verde, como antes); **t** automático, **a**
atualiza, **k** senha do sudo, **x** exclui; Esc abre a página inicial.

**Versão nova da página** (27/10/2026): reconstruir o container só reconecta o terminal — a página continuava com
os scripts antigos até um Cmd+R (foi por isso que a tela de Scripts "não aparecia"). Agora o `inicio.js` confere a
cada 20 s a ETag do `botoes.js`, `inicio.js` e `sessoes.js` e, se mudou, recarrega sozinho quando não houve tecla
nos últimos 8 s, voltando direto ao terminal (sem a página inicial). Vale a partir da primeira recarga com ele.

**Logo de cada servidor**: `pwa/servidores/<nome>.svg` ou `.png`, nome em minúsculas (`awlsrv`,
`srvbonatoeferraz`, `mac`); sem arquivo fica o espaço tracejado com a inicial. Desde 27/10/2026: `awlsrv.png` =
isotipo da Astral Wave (Nextcloud › IDENTIDADE VISUAL › ID VISUAL › ISOTIPO SEM FUNDO.png), `srvbonatoeferraz.png` =
logo da Sul Alimentos (bf: /srv/projetos/sul-alimentos/sul-alimentos/logo/logo-oficial-transparente.png), `mac.svg` =
maçã da Apple (Simple Icons 13.21.0, CC0, em branco). Os logos vão **embutidos** em `pwa/logos.js` (data: URI, gerado por
`pwa/servidores/gerar-logos.sh` — rodar depois de pôr ou trocar um logo): a página não depende de buscar a imagem
pela rede (na página real, pela Cloudflare, o logo não aparecia). Recortados e reduzidos a 160 px de altura; o espaço do logo é
escuro e aceita logo comprido (até 132 px). Depois de pôr o arquivo, reconstruir o container.

## Repositório público: OmegaShell (27/10/2026)

O CloudShell + o omega são publicados como **github.com/moablive/OmegaShell** (público; destaque e card no portfólio
moablive.github.io). A fonte continua aqui e no MoabinhoIA: o repo público é uma **cópia limpa** feita pelo
`publicar-omegashell.sh` (ou `~/sh/omegashell-publicar.sh`): exporta o HEAD, troca domínios/contas/nomes internos por
exemplos (`srv2`, `macuser`, `*.example.com`), tira o `known_hosts`, este README e o logo da Sul Alimentos, e só
publica se não sobrar dado interno e o awlsec-guardrail aprovar. O README e o `docs/` do OmegaShell são escritos lá.

## Duas portas, nesta ordem

1. **LoginHUB** — app próprio "CloudShell" no hub (`CLOUDSHELL_LOGINHUB_APP_ID` no
   `.env`), com o padrão dos projetos do awlsrv: e-mail + senha + **2FA (TOTP)
   obrigatório**, convite por magic link (`/setup-password`), revogação de sessão
   pelo piso do hub. Quem não tem conta no app CloudShell não vê nem o prompt do SSH.
2. **SSH por chave, como awlsrv** — depois do login não há pergunta nenhuma: cada aba
   abre `ssh -p 3333 awlsrv@awlsrv` (host-gateway) com a chave só do CloudShell
   (`/etc/awl/cloudshell/id_ed25519`, montada só leitura). No `authorized_keys` do awlsrv
   a chave vai com `restrict,pty,command="/usr/local/lib/cloudshell/sessao.sh",from="172.18.255.250/32"`
   (só o IP fixo do container na `awl_network`; `restrict` corta túnel, agente, X11,
   user-rc **e o pty**, e o `pty` depois dele reabre só o terminal): ela só abre a sessão
   tmux da conta, e id de conta inválido é recusado (não há sessão padrão). Nenhuma senha
   fica guardada; `sudo` pede a senha do awlsrv (o `~/sh/cloudshell-host-endurecer.sh`
   confere que não há regra `NOPASSWD` para o awlsrv) — mas isso **não** é segundo fator:
   ver "Conta no CloudShell = root" abaixo.

## Sessão: tmux por conta, Conselho Ômega na 1ª janela

- Uma sessão tmux por conta do hub (`cs-<id>`, servidor tmux próprio `-L cloudshell`):
  fechar o navegador não mata as janelas de shell; reabrir (em qualquer aparelho) volta a elas.
- Na criação da sessão: janela **conselho** com o chat do 📜 Conselheiro Ômega
  (`hermes -p conselho-omega chat` como awlsrv, com `HERMES_HOME=/home/awlsrv/.hermes`,
  sem sudo desde 26/10/2026), janela fixa **omega** e janela fixa **sh**. Existe no máximo uma janela conselho
  por sessão.
- **Logado** (24/10/2026): a tecla **k** do omega grava a senha do sudo em
  `~/.config/omega/sudo-senha` (600) do awlsrv; com ela o omega não pede o sudo e os `~/sh` rodam sem a pergunta do
  cabeçalho Ômega. `kx` apaga. Senha que deixou de servir vira `sudo-senha.errada` (o omega
  não insiste, para não travar a conta no faillock); com a conta travada no faillock (3 falhas) ele
  nem tenta e não marca `.errada` — a senha volta a valer quando o bloqueio passa (26/10/2026). Quem entra no CloudShell já era root
  na prática (abaixo); a senha guardada só tira a pergunta.
- Janela fixa **sh** (no lugar da antiga "shell"): a lista dos `~/sh` (`omega sh`), por servidor;
  em cada um, primeiro os que faltam rodar e depois a divisão **↻ reutilizáveis** (`# omega:
  manter`, que ficam na lista). Escolher
  um número abre uma **aba nova com o servidor e o nome do script** (`awlsrv-<script>`, `bf-<script>`), **verde**, onde ele roda. Terminou OK:
  mostra o resultado por 3 s e a aba fecha sozinha. Deu erro: a aba fica **vermelha** e espera
  o Enter. Se ela já estiver aberta, só vai para ela. O mesmo vale para o `sh` da
  janela omega (as duas rodam com `OMEGA_ABAS=1`). Shell solto: **☰ menu → + Nova janela**.
- Terminal escolhido no menu da **omega** (número, ou `n` nova sessão) abre numa **aba nova
  com o servidor e o nome da sessão** (`awlsrv-<sessão>`, `bf-<sessão>`; desde 26/10/2026 toda aba de servidor leva o prefixo, e as já abertas o omega renomeia sozinho); já aberta, só vai
  para ela. Sair sem fechar a sessão (`Ctrl-b Ctrl-b d`) fecha só a aba. A aba guarda a
  conta e o id da sessão (`@omega_conta`, `@omega_sid`; o id não muda quando a sessão é
  renomeada): a cada desenho do menu (`a`, 🔄 sozinho, `r`) a omega acerta o nome da aba pelo
  nome atual da sessão, mesmo renomeada no Mac.
- Menu de sessões em **blocos por servidor** (`── awlsrv`, `── srvbonatoeferraz`, `── mac`),
  cada um do mais recente ao mais antigo; bloco vazio ou servidor fora do ar (Mac dormindo)
  também aparece. O Mac entra pelo `ssh mac` do astralwave (tmux e claude em
  `/usr/local/bin` e `~/.local/bin` de lá); abas dele levam `mac-` no nome.
- **n** (nova sessão), como no omega do Mac: escolhe o servidor (awlsrv, srvbonatoeferraz, mac),
  **1 Claude, 2 Gemini ou 3 só o terminal**, e o nome (sugere claude, claude-2… / gemini… / term, term-2…); abre numa aba.
- **Links como no Terminal do Mac**: segurando **Cmd**, o mouse em cima de um `http(s)://` vira
  mãozinha, e **Cmd+clique** abre o link numa aba do navegador (o clique não vai para o tmux).
- **Copiar e colar**: arrastar o mouse seleciona no tmux e, ao soltar, o texto vai para a área
  de transferência do navegador (tmux `set-clipboard on` → OSC 52 → leitor injetado pelo nginx
  → `navigator.clipboard`). **Option+arrastar** (Shift fora do Mac) seleciona direto no
  navegador, que o ttyd copia sozinho (✂). Colar: **Cmd+V** (Ctrl+Shift+V fora do Mac).
- **srvbonatoeferraz** no omega e na sh (24/10/2026): sessões tmux e `~/sh` do bf aparecem junto
  (cabeçalho `awlsrv ✓ · srvbonatoeferraz ✓`, bloco `── srvbonatoeferraz` na lista), pelo ssh do
  astralwave (`Host srvbonatoeferraz`). Abas do bf levam `bf-` no nome (as do awlsrv, `awlsrv-`); `t` (automático)
  segue só no awlsrv.
- Janela fixa **omega**: o menu do `omega` com o visual do omega do Mac (sessões tmux mais
  recentes primeiro; `n` nova, `r` renomeia, `d` fecha, `a` 🔄 relê na hora). No CloudShell o menu não tem o botão `sh`: a lista dos `~/sh` é a aba fixa
  **sh**, e digitar `sh` vai para ela (26/10/2026); fora do CloudShell o `sh` continua no menu. Os dois painéis são **ao vivo**: a cada 3 s a
  tela é refeita e troca sozinha se algo mudou (sessão nova, situação, nome, "há N min", script que
  entrou ou saiu), sem esperar o `a`; o que já foi digitado no prompt volta depois do redesenho, e
  aba que ninguém está vendo não relê nada. Fica sempre aberta, logo depois da conselho, e a aba dela
  (como a da sh e a conselho) é **sempre azul** e as três ficam no menu **☰ CloudShell** (abaixo): o ◐ cor, o Option+C e o Ctrl-b C nelas só avisam. Sair do omega (`q`) só o reabre; o botão
  ✕ fechar shell nela só avisa; se faltar, o `sessao.sh` recria. Quando o último navegador
  sai ela é reiniciada (`respawn-window -k`), para o ticket do sudo digitado nela não ficar
  num terminal sem dono.
- **Abas fixas não fecham** (26/10/2026): conselho, omega e sh são marcadas pelo `host/fixas.sh`
  (`@jfixa` na janela, `@pfixa` no painel fixo). Nelas o **✕ fechar shell**, `Ctrl-b x`, `Ctrl-b &`,
  `Ctrl-b ,` só avisam, e no menu do botão direito (aba ou painel) **Kill** e **Rename** ficam
  apagados. Dentro delas nada encerra o programa: no chat da conselho `/exit`, `/quit`, Ctrl+D,
  Ctrl+C/Ctrl+Q com a linha vazia e Ctrl+Z só avisam ("aba fixa do CloudShell…") — o chat sobe pelo
  `host/hermes-fixo.py`, que troca esses comandos só nesse processo; no omega e no sh não há `q`
  (digitar `q` só avisa) e Ctrl-C reabre o omega na hora (`trap : INT` no laço). Se algo ainda
  derrubar o programa, o painel volta em 1 s (`remain-on-exit` + hook `pane-died`). Se a aba sumir mesmo assim (um `tmux kill-window` digitado num shell), o hook
  `window-unlinked` (`fixas.sh repor`) recria na hora. Painel aberto ao lado de uma fixa
  (⫼ dividir, Option+V) fecha normal. Precisa de um shell: **☰ menu → + Nova janela**.
- Quando o último navegador sai, a janela **conselho** é fechada (hook `client-detached`);
  na volta o `sessao.sh` recria — ninguém herda um chat do Conselho deixado aberto. As janelas de shell continuam.
- Abas abertas ao mesmo tempo não duplicam a sessão (`flock`); o host registra cada
  entrada no journal (`journalctl -t cloudshell`).
- **Conta no CloudShell = root na prática.** O awlsrv está no grupo `docker` (um
  `docker run --privileged -v /:/host` é root sem senha) e no `wheel`; e, como awlsrv, dá
  para gravar uma chave própria no `~awlsrv/.ssh/authorized_keys` e voltar por fora do
  2FA. A única porta real é o LoginHUB (senha + TOTP): convide para o app CloudShell só
  quem já tem acesso de root ao servidor. Mover a linha do CloudShell para um
  `AuthorizedKeysFile` root não mudaria isso (o awlsrv continua dono do arquivo dele).
- **Sessão por conta é conveniência, não isolamento.** Toda conta do app CloudShell no hub
  entra como o mesmo usuário Unix awlsrv, no mesmo servidor tmux: da janela de shell dá
  para `tmux -L cloudshell attach -t cs-<outra>` e, se a janela conselho dela estiver
  aberta, usar o hermes root dela sem a senha do sudo. Conta no app CloudShell = awlsrv =
  root em potencial: convide só quem já tem esse acesso. Isolamento de verdade só com um
  usuário Unix por conta (decisão do dono).
- **Divisões**: borda grossa e visível (a do painel ativo em roxo), com setas amarelas **←→**
  (e **↑↓**) na faixa do topo, encostadas na borda que se arrasta — **arraste a borda** com o
  mouse para mudar o tamanho; cada painel ganha uma faixa no topo (nº e programa), que também
  arrasta; **clique duplo numa borda** iguala os tamanhos. **☰ menu → ⇔ Tamanho…**:
  Metade, 1/3, 2/3, Igualar todos e Tela cheia/voltar (o mesmo que `Ctrl-b z`).
- **☰ CloudShell** (26/10/2026): o rótulo à esquerda da barra é o menu das janelas fixas — 📜 Conselho
  Ômega (c), Ω omega (o) e 🧾 sh (s), e **🖥️ Nova sessão…** (n, 27/10/2026). Elas não aparecem mais como abas (nem no grupo omega de 25/10);
  estando numa delas, o nome aparece em azul ao lado do botão ("☰ CloudShell · omega").
- **Botões no visual do Cmd+Tab, atalho ⌥ Option + Tab (26/10/2026)**: todo menu do CloudShell tem também
  (os ~/sh da aba sh e do 🗑 Excluir saem em **lista**, um embaixo do outro com o nome inteiro — 27/10/2026)
  (as sessões levam o **logo do Claude ou do Gemini** — o omega manda `claude`/`gemini` no ícone e o `botoes.js`
  desenha o SVG; terminal comum leva o ícone `terminal` — janela escura com os três botões e o prompt verde, 28/10/2026)
  um painel de botões no meio da tela, que abre **só pelo ⌥ Option + Tab**, como o Cmd+Tab do Mac:
  segurando o Option, cada Tab passa para o próximo botão (⇧ volta) e **soltar o Option abre o escolhido**;
  ←→/Enter e o clique também servem, Esc fecha. Na omega e na sh o atalho mostra o menu delas; nas outras
  abas (um Claude, um shell) ele abre o ☰ menu com as **abas para trocar — a última usada primeiro**, então
  ⌥ Tab e soltar volta para a aba anterior — e as ações. No celular (sem Option) o botão **⌥⇥** no canto
  abre. O painel (vidro escuro desfocado, ícone grande, o escolhido destacado e o nome dele embaixo) vale
  para o menu de sessões da **omega** (um botão por sessão, em blocos por servidor, e
  ➕ Nova, 📝 Renomear, ❌ Fechar, 🔄 Atualizar, 🧾 Scripts ~/sh — vai para a aba sh), a lista dos `~/sh` da **sh** (▶️ Automático, 🔑 Senha, 🗑
  Excluir), as perguntas do omega (servidor, Claude ou terminal, nome sugerido, "Fechar mesmo?", "Enter =
  voltar") e os menus do tmux (**☰ CloudShell**, **☰ menu** com o ⇄ Mover, **⇔ Tamanho…**, **◐ Cor…**,
  **▦ Grupo…** e o Sim/Não dos `y/n`). O botão **só digita a tecla do item** (a
  etiqueta roxa no canto dele: `1⏎`, `n⏎`, `y`…; a escolha da IA da Nova sessão não mostra a etiqueta desde 28/10/2026), a mesma que se digitaria — o menu em texto continua lá e
  continua valendo. Menu que chega não pula na tela sozinho (só o que veio de um botão escolhido, como o
  2º menu do Tamanho… ou a próxima pergunta do omega). Digitar outra tecla fecha o painel e ela vai para
  o terminal. Trocar de aba tira os botões guardados da anterior; a omega e a sh mandam os delas de novo em
  até 3 s. ⌥ Tab numa aba sem menu manda `\e[96~` (User3 do tmux.conf), que abre o `abas.sh painel`. Como funciona: `host/botoes.sh` escreve a
  sequência OSC 7717 (o menu em JSON, base64) direto no tty do cliente tmux = o terminal do navegador, e o
  `pwa/botoes.js` (injetado pelo nginx) desenha; a página só aceita como tecla até 4 letras/números (com ⏎) ou
  Esc/Home/End, e nenhum comando sai do navegador além dessas teclas. O omega só manda botões nas abas do
  CloudShell (`OMEGA_ABAS=1`).
- **Grupos e ordem das abas (25/10/2026)**: **☰ menu → ▦ Grupo…** (pôr a aba num grupo que já existe,
  **Novo grupo…**, recolher/expandir, tirar do grupo, juntar as abas de cada grupo e **✕ Apagar o grupo X** — as abas ficam abertas, só saem do grupo; confirma com `y`) e **☰ menu → ⇄ Mover ▸** (abre como dropdown dentro do próprio menu: ← esquerda, → direita, ⇤ começo, ⇥ fim logo abaixo do Mover; o menu fica aberto a cada clique, para ir clicando nos lados até a aba chegar no lugar; Esc fecha; as abas fixas e as escondidas de grupo recolhido são puladas);
  também dá para **arrastar a aba** pela barra. **Minimizar** (26/10/2026): o rótulo amarelo
  **▾ nome** antes da 1ª aba do grupo é um botão — um clique recolhe o grupo para **▸ nome (N)**
  (N = quantas abas ele tem, ex. "▸ omega (3)") e passa para a última aba usada fora dele; outro
  clique expande e abre a 1ª aba do grupo. Sem aba fora do grupo, a ativa continua à vista.
  Grupo = opção `@grupo` da janela; a lógica é o
  `host/abas.sh`, instalado em `/usr/local/lib/cloudshell/` junto com o `tmux.conf` e o `host/fixas.sh`.
- Barra em cima com as abas clicáveis e, à direita, **um botão só: ☰ menu** (26/10/2026; antes eram sete
  botões). Ele abre o menu da aba ativa: **🖥️ Nova sessão…** (N, 27/10/2026), **+ Nova janela** (n, shell aqui), **⫼ Dividir** (d), **✕ Fechar shell** (x),
  **▦ Grupo…** (g), **⇄ Mover ▸** (m, dropdown no próprio menu), **⇔ Tamanho…** (t) e **◐ Cor…** (c) — os com reticências abrem um
  segundo menu no mesmo lugar; nas abas fixas Fechar shell e Cor ficam apagados. **🖥️ Nova sessão…** abre a aba
  `nova-sessao` com o `omega nova`: escolhe o servidor (awlsrv, srvbonatoeferraz, Mac), Claude, Gemini ou só o terminal (nessa ordem) e o
  nome (sugere um livre), em botões no ⌥ Tab (Esc em qualquer passo cancela e fecha a aba, sem o menu em texto), e troca para a aba da sessão nova (`<servidor>-<nome>`), como o n da aba omega. Detalhes de cada um:
  **⇔ Tamanho…**, **◐ Cor…** (8 cores + Padrão;
  pinta a aba ativa, que leva ainda negrito e sublinhado; a cor some quando a aba fecha;
  **Option+C** troca direto para a próxima cor a cada toque — vermelho, laranja, amarelo,
  verde, azul, ciano, rosa, cinza, padrão — e `Ctrl-b C` abre o menu no meio da tela),
  **Option+G** abre direto o menu do **▦ Grupo…** da aba ativa (`n` = Novo grupo…),
  **Option+L** limpa a caixa de texto do Claude Code (manda meta+l = `chat:clearInput` do
  `~/.claude/keybindings.json` do awlsrv; útil depois de colar texto grande),
  **Option+V** divide a tela ao lado com o **omega** na metade nova (o que se escolhe nele
  abre ali dentro; `q` fecha a divisão; no CloudShell o Option+C não digita "ç"),
  **✕ Fechar shell** (fecha o
  painel ativo — a janela inteira se for o único — depois de confirmar com `y`),
  **⫼ Dividir** e **+ Nova janela** (também `Ctrl-b x` / `Ctrl-b %` / `Ctrl-b c`). Fonte: `host/tmux.conf`, `host/sessao.sh`, `host/fixas.sh`, `host/abas.sh` e `host/fechar-conselho.sh`, instalados
  em `/usr/local/lib/cloudshell/` pelo `~/sh/cloudshell-host-endurecer.sh` (o
  `cloudshell-chave-awlsrv.sh` só gerou a chave e instalou a 1ª versão de dois deles).

## Como funciona por dentro

| Peça | Onde | O que faz |
|---|---|---|
| nginx `:8080` | `nginx.conf` | Serve PWA (manifest, `sw.js`, ícones) e a tela `/entrar`; todo o resto passa por `auth_request` no gateway antes do ttyd |
| Tela de login | `web/` (Vue + auth-kit `hubAuthClient`) | Os três desfechos do `/auth/login` (sessão, desafio, enrolar com QR na própria tela), backup codes, `/setup-password`, `/sair` |
| Gateway `127.0.0.1:7690` | `gateway/` (Node + auth-kit `hubAuthServer`) | `POST /sessao` confere o JWT (`verifyHubToken`: assinatura, tenant, recusa passe de etapa única) + piso de revogação e grava cookie `cs_sessao` (httpOnly, Secure, SameSite=Strict); `GET /verificar` para o nginx; `POST /sair` |
| ttyd `127.0.0.1:7681` | `entrypoint.sh` | Terminal; cada aba roda `cloudshell-login` |
| Botões dos menus | `pwa/botoes.js` + `host/botoes.sh` | Servido em `/botoes.js` (público, só desenho) e injetado pelo `sub_filter`; lê o OSC 7717 que o host escreve no tty do cliente tmux e digita a tecla do botão escolhido |
| Fonte do terminal | `pwa/fontes/` (JetBrainsMono Nerd Font Mono 3.5.1, OFL, em woff2) | Servida em `/fontes/` (pública, cache longo) e declarada como `"CloudShell Nerd"` pelo `sub_filter` do nginx; é a 1ª do `fontFamily` do ttyd. Sem ela os ícones do eza/starship viram quadrados no navegador. Depois que a fonte carrega, um script troca e volta o `fontFamily` do `window.term` para o xterm redesenhar |
| Chaves do host | `known_hosts`, `ssh_config` | `StrictHostKeyChecking yes` com as chaves públicas do sshd do awlsrv fixadas; só a chave do CloudShell, sem senha |
| Lado do host | `host/sessao.sh`, `host/tmux.conf`, `host/fechar-conselho.sh` | Comando forçado da chave: abre/anexa a sessão tmux `cs-<id>` (Conselho Ômega + omega + shell); no `client-detached`, o `fechar-conselho.sh` fecha a janela conselho e reinicia a omega de toda sessão sem navegador anexado (e não fecha a conselho se for a única janela) |

- O WebSocket do terminal não leva header `Authorization`: por isso a sessão do hub
  vira cookie no gateway.
- Sem `app_id` ou sem `JWT_SECRET` o gateway **falha fechado**: o terminal manda para
  `/entrar` (401) e o `POST /sessao` responde 500 `CONFIG_AUSENTE` — ninguém entra.
- Só o `/ws` sobe terminal: upgrade de WebSocket em qualquer outro caminho dá 404 (o ttyd
  aceitaria em `/`, com o `arg` forjado pelo cliente). O `sub` da conta só passa se for
  numérico.
- Piso de revogação consultado a cada 15 s (o kit usa 60 s): sessão revogada no hub cai
  rápido. Se o hub não responder, o kit **falha aberto** por design (assinatura, tenant e
  `action` continuam conferidos localmente).
- Só o usuário awlsrv entra, e só pela chave com comando forçado: não há prompt de
  usuário nem de senha no SSH (root e senha ficaram de fora).
- Trilha (`docker logs astralwave_omegashell`): o nginx loga cada pedido ao terminal com
  a conta do hub, o IP informado pela Cloudflare (`CF-Connecting-IP`, só se tiver forma de
  IP) e o `peer` (quem falou com o nginx — o cloudflared; não é forjável), sem a query
  (o magic link do convite é credencial); o gateway loga cada terminal aberto
  (`terminal aberto: conta_hub=<id> <e-mail> ip=<ip>`); e o nginx põe o id da conta na
  URL do WebSocket (`ttyd --url-arg`, a query do navegador é descartada), então o
  `cloudshell-login` loga `conta_hub=<id> ssh awlsrv@awlsrv (tmux cs-<id>)` — o log amarra
  cada terminal aberto à conta (é trilha, não isolamento: ver acima). O cookie com o JWT não é repassado ao ttyd.
- Redirect para `/entrar` é relativo (`absolute_redirect off`): atrás da Cloudflare o
  esquema e a porta internos não vazam. Sem `app_id`, o terminal manda para `/entrar` e o
  login responde `CONFIG_AUSENTE`.
- O container não recebe o `.env` inteiro da label: só `JWT_SECRET`, o `app_id` e a
  URL interna do hub.
- Sem porta no host: o cookie é `Secure`, então o acesso é só por HTTPS (Cloudflare).
- O auth-kit é vendorizado pelo `sync-auth-kit.sh` do LoginHUB (`gateway/src/hubAuthServer.ts`,
  `web/src/lib/hubAuthClient.ts`) — não editar as cópias.

## Ícone

`pwa/icone.svg` (nuvem + prompt `>_`, cores da Astral Wave) é a fonte; `pwa/gerar-icones.sh`
gera os PNGs do PWA. O `favicon-192.png` também é o logo do app no LoginHUB (e-mail de
convite e QR do Google Authenticator).

## Operação

- App no hub: `app_id` 17 (registrado em 22/10/2026 por `~/sh/cloudshell-registrar-loginhub.sh`).
- Chave + lado do host + deploy: `~/sh/cloudshell-chave-awlsrv.sh` (rodado em 22/10) e
  `~/sh/cloudshell-host-endurecer.sh` (troca a linha do `authorized_keys`, reinstala
  `host/` igual ao commit, confere o sudo e faz o deploy).
- Trocar a chave (um fluxo só): apagar `/etc/awl/cloudshell/id_ed25519*` e a linha
  `cloudshell@astralwave_omegashell` do `~awlsrv/.ssh/authorized_keys`, rodar um `~/sh` novo
  baseado no `cloudshell-chave-awlsrv.sh` + `cloudshell-host-endurecer.sh` (que instala os
  TRÊS arquivos de `host/`: `sessao.sh`, `tmux.conf` e `fechar-conselho.sh`), e recriar o
  container com `docker compose up -d --force-recreate astralwave_omegashell` (o bind de
  arquivo prende o inode antigo; o `deploy.sh` não recria se a imagem não mudou).
- IP fixo `172.18.255.250`: a `awl_network` é externa e sem `--ip-range`, então esse IP
  está dentro do pool que o Docker distribui (hoje em 172.18.0.x, em sequência). Se outro
  container pegar esse IP antes, o `astralwave_omegashell` não sobe ("Address already in
  use") e fica reiniciando — o app não abre, sem erro na tela. Diagnóstico:
  `docker ps -a --filter name=astralwave_omegashell` e
  `docker network inspect awl_network -f '{{range .Containers}}{{.Name}} {{.IPv4Address}}{{"\n"}}{{end}}' | grep 172.18.255.250`.
  O `from=` é defesa em profundidade, não fronteira: a chave mora no próprio container.
- A chave vale o que vale o container: quem executar código dentro do
  `astralwave_omegashell` lê `/run/cloudshell/id_ed25519` (uid 1000) e anexa qualquer
  `cs-<id>` como awlsrv.
- Novos usuários: convite pelo painel do LoginHUB no app CloudShell.
- Rebuild: `sudo ./scripts/deploy.sh astralwave_omegashell` (ou `docker compose build/up -d astralwave_omegashell`).
- Lockfiles npm fora da busca de segredos no `.awlsec-ignorar` (integrity sha512 = falso positivo).

## HISTÓRICO

- 22/10/2026 — Criado: ttyd + PWA + SSH no awlsrv; integrado ao LoginHUB (app próprio, 2FA
  obrigatório) com gateway de sessão; ícone próprio.
- 22/10/2026 — Correções do parecer do Tech Lead: log de acesso com a conta do hub, root
  barrado, cookie não chega ao ttyd, headers de segurança nos arquivos do PWA, revogação
  a cada 15 s, `CLOUDSHELL_LOGINHUB_APP_ID` no `.env.example`. Rota pública:
  `zsh.astralwavelabel.com`. 3ª rodada: redirect relativo, conta do hub amarrada à sessão
  SSH no log, `-` no log sem conta, config ausente vira 401.
- 22/10/2026 — 4ª rodada: upgrade de WebSocket fora do `/ws` dá 404 (fechava o `arg`
  forjado em `/`), `sub` numérico e e-mail ASCII validados no gateway, `-` no IP vazio do
  log. 5ª rodada: a validação de `sub`/e-mail mora no `conferir()` (o `/sessao` recusa com
  código na tela em vez de laço de redirect), o log de terminal aberto usa uma marca do
  `location = /ws` (vale para `//ws`), `/ws` sem upgrade dá 404. CNPJ do app no hub:
  60.522.261/0001-01, o mesmo dos outros apps da Astral Wave. 6ª rodada: a tela de login
  mostra o código da recusa do gateway (ex.: `CONFIG_AUSENTE`), o log de partida avisa
  `app_id` vazio, e o registro confere e-mail e senha antes de criar o app no hub.
- 22/10/2026 — 7ª rodada: o log não grava a query (o token do convite vazava),
  `/setup-password` mostra o motivo da recusa no próprio formulário, e só recusa de
  sessão derruba o login do kit (`CONFIG_AUSENTE`/5xx mantêm o token). 8ª rodada: IP do
  log validado como IP + `peer=$remote_addr`, a mesma validação no log do gateway,
  `/entrar` mostra o motivo da recusa ao abrir, e o registro sobe o container pelo
  `scripts/deploy.sh` do repositório.
- 22/10/2026 — Sem pergunta de usuário: entra como awlsrv por chave própria com comando
  forçado (sessão tmux por conta, 1ª janela = chat do Conselheiro Ômega, botões ✕ fechar shell,
  + nova janela e ⫼ dividir na barra). App registrado no hub: `app_id` 17.
  Endurecido nos pareceres seguintes: `restrict,pty` e `from=172.18.255.250/32` na chave, id
  inválido recusado, `flock`, janela do Conselho fechada no detach, log no journal.
- 22/10/2026 — Ao sair do chat do Conselho a janela fecha (antes virava shell e cada volta
  empilhava outra janela conselho); README com o modo de falha do IP fixo.
- 24/10/2026 — Botão vermelho **✕ fechar shell** na barra (fecha o painel ativo, confirma com
  `y`); o clique da barra passou para a sintaxe de chaves do tmux.
- 24/10/2026 — Ícones do terminal (eza, starship) de volta: fonte JetBrainsMono Nerd Font
  Mono servida pelo próprio CloudShell em `/fontes/`, sem depender da fonte do aparelho.
- 24/10/2026 — Janela fixa **omega** (lista dos `~/sh`, `omega sh`) logo depois da conselho,
  recriada se faltar e reiniciada quando o último navegador sai.
- 24/10/2026 — CloudShell **logado**: senha do sudo gravada pela tecla k do omega; conselho,
  omega e `~/sh` param de perguntar. Menu do omega com o visual do Mac (ícones, auto-reload, k, x).
- 24/10/2026 — Janela omega abre no menu principal (sessões), com o visual do omega do Mac.
- 24/10/2026 — Janela **shell** trocada pela janela fixa **sh** (lista dos `~/sh`); cada script
  escolhido abre numa aba com o nome dele.
- 24/10/2026 — Terminal escolhido no menu da omega abre numa aba com o nome da sessão.
- 24/10/2026 — Copiar e colar no CloudShell (OSC 52 + Option+arrastar) e 🔄 ATUALIZAR (`a` e
  auto-reload) no menu principal do omega.
- 24/10/2026 — Botão **◐ cor** na barra: muda a cor da aba ativa.
- 24/10/2026 — srvbonatoeferraz no omega do CloudShell (sessões e `~/sh`, abas `bf-…`).
- 24/10/2026 — `r` da omega renomeia a sessão e a aba dela no CloudShell.
- 24/10/2026 — Abas seguem a sessão pelo id (🔄 acerta o nome); menu em blocos por servidor.
- 24/10/2026 — Aba de `~/sh` nasce verde; OK fecha sozinha em 3 s, erro fica vermelha e pausa.
- 24/10/2026 — Mac no omega do CloudShell; `n` escolhe servidor e Claude ou só o terminal.
- 24/10/2026 — Atalho Cmd+Shift+C (e Ctrl-b C) abre o menu de cor da aba.
- 24/10/2026 — Cmd+Shift+C passa a trocar direto para a próxima cor (sem menu).
- 24/10/2026 — Cmd+Shift+V divide a tela com o omega na metade nova.
- 24/10/2026 — Atalhos trocados para Option+C (cor) e Option+V (divide com o omega).
- 24/10/2026 — Divisões: borda grossa arrastável, clique duplo iguala, botão ⇔ tamanho.
- 24/10/2026 — Setas ←→/↑↓ na faixa de cada painel, junto da borda arrastável.
- 24/10/2026 — Lista dos `~/sh` com a divisão ↻ reutilizáveis.
- 24/10/2026 — Cmd+clique abre links (como no Terminal do Mac).
- 24/10/2026 — Painéis do omega (menu e sh) ao vivo: redesenho a cada 3 s, sem esperar o `a`.
- 24/10/2026 — Abas omega e sh sempre vermelhas (cor fixa).
- 25/10/2026 — Botões ▦ grupo e ⇄ mover e arrastar aba (host/abas.sh); copiar ao selecionar também no Safari (aviso "copiado ✓").
- 25/10/2026 — Option+L limpa a caixa de texto do Claude Code; Option+G abre o menu do ▦ grupo.
- 25/10/2026 — Abas conselho, omega e sh sempre azuis (eram vermelhas) e abrindo juntas no grupo ▦ omega.
- 26/10/2026 — Abas fixas (conselho, omega, sh) não fecham: botão, atalhos e menus bloqueados, painel ressuscita, `host/fixas.sh` recria; rótulo do grupo vira botão de minimizar ("▸ nome (N)").
- 26/10/2026 — omega no CloudShell sem o botão sh (vai para a aba fixa sh); senha guardada não vira `.errada` com a conta travada no faillock.
- 26/10/2026 — Abas fixas não respondem ao /exit: chat da conselho pelo host/hermes-fixo.py (/exit, /quit, Ctrl+D, Ctrl+C vazio e Ctrl+Z só avisam); omega e sh sem q.
- 26/10/2026 — Abas de sessão e de ~/sh sempre com o servidor na frente: awlsrv-<nome> (como o bf-).
- 26/10/2026 — Os sete botões da barra (grupo, mover, tamanho, cor, fechar shell, dividir, nova janela) viraram um só: ☰ menu.
- 26/10/2026 — ☰ CloudShell: conselho, omega e sh saem da lista de abas e ficam no menu do rótulo CloudShell; ▦ Grupo… ganhou ✕ Apagar o grupo.
- 26/10/2026 — ⇄ Mover… montado pelo host/abas.sh (mover): o submenu reabre depois de cada clique (vai clicando ← →, Esc fecha) e pula abas fixas e escondidas.
- 26/10/2026 — ☰ menu montado pelo host/abas.sh (painel): o ⇄ Mover ▸ abre como dropdown dentro do menu, não num menu à parte.
- 26/10/2026 — ⇄ Mover: o dropdown fechava ao clicar com o mouse (o menu reabria antes de o tmux terminar de fechar o anterior); pausa de 0,2 s antes de reabrir.
- 26/10/2026 — Janela conselho: o Hermes passou do root para o awlsrv (HERMES_HOME=/home/awlsrv/.hermes); o chat do Conselheiro Ômega abre sem sudo e sem senha.
- 26/10/2026 — Botões no visual do Cmd+Tab do Mac (pwa/botoes.js + host/botoes.sh, OSC 7717): menus da omega, da sh, perguntas do omega e todos os menus do tmux (☰ CloudShell, ☰ menu, Mover, Tamanho, Cor, Grupo, Sim/Não) também em botões; o clique só digita a tecla do item. ⇔ Tamanho… e ◐ Cor… passaram para o abas.sh (painel tamanho|cor), e o ☰ CloudShell para o abas.sh cs.
- 26/10/2026 — Botões só pelo atalho ⌥ Option + Tab (segurar ⌥, Tab avança, soltar abre), como o Cmd+Tab; nas abas sem menu o atalho abre o ☰ menu com as abas para trocar (a última usada primeiro); ⌥⇥ no canto para o celular.
- 27/10/2026 — 🖥️ Nova sessão… no ☰ menu (N, também no ⌥ Tab de qualquer aba) e no ☰ CloudShell (n): abre o `omega nova` numa aba própria — servidor, Claude ou terminal e nome, em botões — sem precisar ir à aba omega. + Nova janela continua sendo o shell solto aqui.
- 27/10/2026 — Botões da aba sh (e do 🗑 Excluir) em lista: um ~/sh por linha com o nome inteiro, o "depois de…" à direita e a tecla no canto; as ações continuam em botões.
- 27/10/2026 — Ícone das sessões nos botões: logo do Claude ou do Gemini (SVG no botoes.js), ⌨️ para terminal comum; o omega reconhece sessão Gemini e a 🖥️ Nova sessão… ganhou a opção 3) Gemini.
- 27/10/2026 — ⌥ Tab: o item embaixo do mouse é o escolhido (um destaque só) e soltar o ⌥ abre ele; Tab/setas tomam a vez até o mouse mexer de novo. O omega reenvia os botões a cada segundo (voltar à aba ou recarregar a página não deixa mais o ⌥ Tab sem menu por até 3 s).
- 27/10/2026 — Painel do ⌥ Tab com véu escuro e desfocado na tela toda e fundo 90% opaco: o menu em texto do omega/tmux (que continua atrás, recebendo a tecla) não aparece mais misturado com os botões.
- 27/10/2026 — Página inicial com o Conselho desenhado (pwa/inicio.js): cartões Conselho Ômega, Sessões, Scripts ~/sh, Nova sessão e Continuar; ⌂ no canto volta para ela; teclas User4–User7 no tmux.conf.
- 27/10/2026 — Tela de Sessões (pwa/sessoes.js, carregado pelo inicio.js): bloco por servidor com espaço de logo (pwa/servidores/<nome>.svg|png, vazio por enquanto), estado do servidor e cartão por sessão, ao vivo; o omega manda os cabeçalhos dos servidores no menu.
- 27/10/2026 — Tela de Scripts ~/sh na aba sh (o mesmo sessoes.js): bloco por servidor com logo, ~/sh em lista com idade ou dependência e a divisão ↻ reutilizáveis; o omega manda os cabeçalhos dos servidores também na lista dos ~/sh. Enter segue a ordem da tela.
- 27/10/2026 — Recarga automática da página quando o servidor tem botoes.js/inicio.js/sessoes.js novos (ETag a cada 20 s, sem tecla há 8 s); depois de uma reconstrução o terminal reconectava com os scripts velhos.
- 27/10/2026 — Logos dos servidores: Astral Wave (awlsrv), Sul Alimentos (srvbonatoeferraz) e Apple (mac); espaço do logo escuro e com largura livre.
- 27/10/2026 — Logos não apareciam na página real: carregavam na caixa do 1º desenho, que o redesenho ao vivo já tinha trocado. Agora cada desenho cria a própria imagem (o endereço achado fica guardado). Botões de escolher o servidor da Nova sessão (⌥ Tab) também com o logo.
- 27/10/2026 — Painel do ⌥ Tab: logo do servidor ao lado do nome de cada grupo (sessões e ~/sh) e botão ⌂ Início em todo menu (fecha o menu e abre a página inicial).
- 27/10/2026 — Logos embutidos em pwa/logos.js (gerar-logos.sh) e usados antes dos arquivos: na página real o logo continuava sem aparecer buscando a imagem pela rede.
- 27/10/2026 — ☰ CloudShell da barra só abre a página inicial (botoes.sh inicio); as fixas conselho, omega e sh saíram da lista de abas do ☰ menu; o ☰ menu (e todo menu aberto por clique) abre direto no painel de botões (CS_ABRE=1 → "abre" no menu); ⌥ C abre a paleta de cores em esferas (Padrão = esfera de vidro vazia), em vez de passar para a próxima cor.
- 27/10/2026 — Paleta do ⌥ C no efeito do ⌥ Tab: cores em caixinhas (como ícone de app do Mac), grade de 5 por linha; segurando o ⌥, cada C passa para a próxima cor (⇧C volta) e soltar o ⌥ aplica.
- 27/10/2026 — ◐ Cor… saiu do ☰ menu: a cor da aba é só pelo ⌥ C ou Ctrl-b C, sempre na paleta de caixinhas (o Ctrl-b C abria o menu de cores em texto do tmux).
- 27/10/2026 — A lista em texto não aparece mais entre uma tela e outra: ao escolher sessão/script a tela fica com "abrindo…" até a aba abrir (só o k, senha do sudo, mostra o terminal); a troca de aba manda o nome da aba (botoes.sh esconde → {tipo: aba}) e a omega/sh mostram na hora a última tela delas; a pergunta seguinte do omega abre no painel (csPede).
- 27/10/2026 — A mesa do Conselho desenhada saiu da página inicial (pedido do dono): tudo foi para o Escritórios 3D, que substituiu o Hermes3D. Ficam o título "Para onde vamos?", a saudação e os cinco cartões.
- 27/10/2026 — ⌥ C: a paleta não abre mais "segurada" — um toque deixa ela aberta (antes, soltar o ⌥ aplicava a 1ª cor e fechava na hora, e a paleta nem aparecia); segurar o ⌥ e apertar C de novo anda pelas cores e soltar aplica.
- 27/10/2026 — ⌥ G = agrupar abas (abas.sh juntar): as abas em caixinhas na cor delas, clique marca/desmarca (✓, o menu reabre no lugar); ➕ Criar grupo… pede o nome (na barra do tmux) e junta as marcadas; Pôr em <grupo> leva as marcadas para um grupo que já existe; Limpar seleção. Fixas ficam de fora. O menu de grupo da aba ativa continua no ☰ menu → ▦ Grupo….
- 27/10/2026 — ⌥ Tab numa aba comum (Claude, terminal): o painel traz também Ω omega (O) e 🧾 sh (S) num grupo CloudShell no começo (CS_ATALHO=1 no User3); o clique no ☰ menu continua sem as fixas.
- 27/10/2026 — Saíram da barra os botões ☰ CloudShell e ☰ menu: o ⌥ Tab traz os menus (e a omega e a sh), o ⌂ abre a página inicial; nas fixas fica só o nome delas em azul à esquerda. No celular, o ⌥⇥ e o ⌂ no canto.
- 27/10/2026 — Repositório público OmegaShell (github.com/moablive/OmegaShell) por cópia limpa (publicar-omegashell.sh); destaque e card no portfólio no lugar do card do astralwavelabel (privado, dava 404).
- 27/10/2026 — O app passa a se chamar **OmegaShell** para quem usa: nome do PWA (manifest), título da janela (ttyd), telas de login, página inicial, Sessões/Scripts, mensagens e o grupo do ⌥ Tab. O nome técnico (pasta apps/cloudshell, container astralwave_cloudshell, /usr/local/lib/cloudshell) e o nome do app no LoginHUB (NOME_NO_HUB, emissor do 2FA) continuam CloudShell.
- 27/10/2026 — Container `astralwave_cloudshell` → **`astralwave_omegashell`** (o nome antigo fica como alias na awl_network enquanto existir a rota velha) e domínio `zsh.astralwavelabel.com` → **`omegashell.astralwavelabel.com`** (rota nova na Cloudflare, platform_url do app 17 no LoginHUB). O nome do app no LoginHUB ("CloudShell", emissor do 2FA já cadastrado) não mudou.
- 27/10/2026 — Rota nova na Cloudflare criada pelo usuário e a `zsh` apagada: saiu o alias `astralwave_cloudshell` da awl_network.
- 27/10/2026 — ✏️ Renomear… (tecla r) no ☰ menu e no ⌥ Tab, grupo Janela: abre a barra do tmux com o nome atual da aba; apagado nas abas fixas (como o Ctrl-b ,). Instalado pelo ~/sh/cloudshell-renomear-aba.sh.
- 28/10/2026 — Página inicial: saíram os cartões 📜 Conselho Ômega e ⌨️ Continuar (Esc continua voltando ao terminal); ficam Sessões, Scripts ~/sh e Nova sessão (1–3). A janela conselho do tmux e a tecla User4 continuam.
- 28/10/2026 — Nada de menu em texto no Esc ou ao fechar aba: Esc na tela de Sessões/Scripts abre a página inicial; ⌥ Tab abre os botões por cima dela (sem esconder); Esc em qualquer pergunta do omega cancela com Ctrl-D; a troca de aba e o attach (hook client-attached → botoes.sh esconde) dizem a aba ativa — omega/sh sem tela guardada mostram "abrindo…", e a conselho abre a página inicial (Esc nela vai para a omega).
- 28/10/2026 — Cor inicial da aba pelo servidor: sem @cor, bf-* (srvbonatoeferraz) vermelha, as do awlsrv azuis (mac-* no padrão); o "Padrão" do ⌥ C volta a ela e o ⌥ G mostra as caixinhas nessa cor. As de ~/sh rodando continuam verdes. Instalado pelo ~/sh/cloudshell-cor-servidor-sem-texto.sh.
- 28/10/2026 — Nova sessão: ordem 1 Claude, 2 Gemini, 3 só o terminal; o ⌨️ virou o ícone `terminal` (janela escura com os três botões e o prompt verde, no botoes.js), também nos cartões das sessões; Esc no painel da Nova sessão cancela (Ctrl-D) e fecha a aba nova-sessao sem o menu em texto (omega 1d09b83, ~/sh/omega-nova-sessao-esc-cancela.sh). Sem o selo do número nos cartões da página inicial e na escolha da IA (as teclas continuam).
- 28/10/2026 — Nova sessão sem o selo do número em todos os passos (servidor, IA, nome); degradês dos logos (Gemini, terminal) num `<svg id="csb-defs">` único no body — com o `<defs>` repetido dentro de cada ícone, a primeira cópia escondida num painel apagava o Gemini nas outras telas.
- 28/10/2026 — Lista de abas do ☰ menu / ⌥ Tab: cada aba mostra o logo da IA (Claude, Gemini ou terminal) com o logo do servidor (awlsrv, srvbonatoeferraz, mac) no canto. O `abas.sh` manda `ia@servidor` (`ia_aba`: no awlsrv pelo processo da sessão, nas remotas pela tela da aba) e o `botoes.js` desenha; o menu em texto fica com 🤖 / ✦ / ⌨️ (~/sh/omegashell-abas-ia-servidor.sh).
- 28/10/2026 — A seção **abas** saiu do painel de botões do ☰ menu / ⌥ Tab (repetia a barra de abas do topo e a página inicial); o painel fica com OmegaShell (omega e sh, pelo ⌥ Tab), janela e organizar. Com isso o `ia_aba` e o selo do servidor no botoes.js saíram também; a lista de abas segue só no menu em texto do tmux (~/sh/omegashell-abas-sem-secao.sh).
- 28/10/2026 — Nome do grupo na caixa de texto do painel novo: "Novo grupo…" (▦ grupo) e "Criar grupo com as marcadas…" (⌥ G) mandam os botões com a caixa ✎ junto com o command-prompt do tmux (`caixa_grupo` no abas.sh); a caixa digita o nome e o Enter no prompt, o Esc dela cancela (~/sh/omegashell-grupo-nome-caixa.sh).
- 28/10/2026 — Página inicial sem o cartão 🖥️ Nova sessão (pedido do dono): sessão nova só pela tela de Sessões (➕ Nova sessão) ou pelo ⌥ Tab; ficam Sessões e Scripts ~/sh (1–2).
- 28/10/2026 — ⌥ Tab sem o grupo "OmegaShell" (Ω omega, 🧾 sh) nos botões (pedido do dono: repete a página inicial); fica só no menu em texto do tmux (teclas O e S). Instalado pelo ~/sh/cloudshell-optab-sem-omegashell.sh.
- 28/10/2026 — Botão 🧾 **Scripts ~/sh** de volta em dois lugares (pedido do dono: de uma sessão se vai rodar um ~/sh): nas ações da tela de Sessões / ⌥ Tab da aba omega (omega `tela_menu_botoes`, tecla s = aba sh) e no ⌥ Tab das abas de sessão (grupo OmegaShell do `abas.sh painel`, tecla S). O Ω omega continua só no menu em texto. Instalado pelo ~/sh/omegashell-botao-sh-volta.sh.
- 28/10/2026 — Toda sessão com terminal tem a sua aba, fixa até a sessão acabar (pedido do dono, pelo print da tela de Sessões com 4 sessões e 1 aba): a cada desenho do menu de sessões o omega (`abas_fixa_terminais`) abre em segundo plano a aba `<servidor>-<nome>` de toda sessão listada que não tem aba — inclusive as abertas fora do OmegaShell (terminal do bf, Mac). Fechar a aba (✕, Ctrl-b Ctrl-b d) só a faz voltar em até 3 s; ela some quando a sessão é encerrada (d fechar, /quit). As sessões sh-* do rodador ficam de fora (a aba delas é a do omega rodar). E o rótulo da aba na barra troca o prefixo do servidor pelo ícone: 🌊 awlsrv, 🥩 srvbonatoeferraz, 🍎 mac (`@aba_rotulo` no tmux.conf; o nome da janela continua awlsrv-/bf-/mac-). Instalado pelo ~/sh/omegashell-abas-fixas-icone.sh.
- 28/10/2026 — Logo oficial do servidor e logo da IA em cada aba da barra (pedido do dono: "já tem os 2 para cada aba"). O tmux não desenha imagem, então o rótulo (`@aba_rotulo`) vira marcas de texto — 🌊 🥩 🍎 com 3 espaços (servidor) e 🤖 ✨ 💻 (IA, pela opção `@omega_ia` que o omega grava na aba a cada leitura das sessões) — e o `pwa/botoes.js` pinta por cima de cada marca uma caixa com a cor de fundo da célula e o logo (logos.js / ICONE), sem receber mouse (clique, arrasto e menu da barra seguem no tmux). Em terminal comum ficam os emojis. Instalado pelo ~/sh/omegashell-abas-logos.sh (omega, tmux.conf e rebuild do container).
- 28/10/2026 — Toda aba nasce **preta** com a fonte branca até o dono dar uma cor (⌥ C); aba colorida leva a fonte preta (pedido do dono). Saiu a cor inicial por servidor (bf vermelha, mac cinza, o resto azul), no tmux.conf e nas caixinhas do ⌥ G. Os logos por cima das marcas seguem o fundo da célula, então ficam no preto também. Instalado pelo ~/sh/omegashell-abas-pretas.sh.
- 28/10/2026 — Aba maior (pedido do dono): a barra passa a ter **2 linhas** (`status 2`); a 2ª fica vazia no tmux (só a marca ⠀ na 1ª coluna) e o `botoes.js` desenha nela a faixa de cada aba, na cor da aba, com os logos ocupando as duas linhas. E o ⌥ Tab ganhou **⏻ Encerrar aba** (tecla e), diferente do ✕ Fechar shell: numa aba de sessão abre `omega encerrar <conta> <sessão>` numa aba própria, com a pergunta da tecla d (Claude sai com /quit e a Regra 7; terminal é morto) e a aba some quando a sessão acaba; numa aba comum é kill-window depois de confirmar; nas fixas fica apagado. Instalado pelo ~/sh/omegashell-aba-maior-encerrar.sh.
- 28/10/2026 — ✎ **Abrir projeto no editor** (tecla p) no ⌥ Tab (pedido do dono: "o fresh, o melhor de terminal, na tela dividida, direto no projeto que estou no chat"): numa aba de sessão abre `omega editor <conta> <sessão>` num painel dividido ao lado — o omega descobre a pasta do projeto na máquina da sessão (Claude: o transcript da sessão, casado pela hora de início do processo, guarda a pasta de trabalho atual, ou a raiz git do último arquivo editado; agy: a raiz git do último caminho citado no transcript da conversa; senão a pasta do painel) e abre o `fresh` nela; numa aba comum é o fresh na pasta do painel; nas fixas fica apagado. Fechar o fresh fecha o painel. O fresh está no awlsrv (0.5.4) e no bf (0.5.2); no Mac não. Instalado pelo ~/sh/omegashell-abrir-projeto-editor.sh.
- 28/10/2026 — Correções do ✎ (print do dono: o fresh abriu na home do awlsrv numa aba do bf): (1) o tmux guarda o comando de partida da aba com aspas, e a expressão do abas.sh exigia o fim da linha logo depois do nome da sessão — a aba de sessão caía no ramo de aba comum; isso também pegava o ⏻ Encerrar aba; (2) o detector lia a hora de início do processo com `date -d` em cima do `ps lstart`, que no bf vem em português — agora usa `etimes`; (3) Claude que só usa comandos (cd /srv/… && git …) não tem `file_path` no transcript: entra a raiz git do último caminho citado, como no agy (gps → sul-alimentos/cofre). E o botão **⌧ Fechar editor** (tecla f) fecha os painéis do fresh da aba (apagado se não há). Instalado pelo ~/sh/omegashell-editor-correcao-fechar.sh.
- 28/10/2026 — Os logos da barra de abas apareciam por cima da tela de Sessões/Scripts (print do dono): a faixa (`#csb-barra`) tinha z-index 20 e a tela 15. Agora 10 — acima do xterm, abaixo das telas de Sessões/Scripts e Início. Instalado pelo ~/sh/omegashell-abas-sob-telas.sh (rebuild do container).
- 28/10/2026 — Efeitos nas abas da barra (pedido do dono): uma caixa transparente por cima de cada aba (as duas linhas) — passar o mouse acende e levanta de leve; o clique dá um pulso; aba que some deixa um fantasma na cor dela que encolhe e apaga; se o sumiço veio de um ⏻ Encerrar aba ou do "Sim, fechar" do omega no último minuto e meio, o fantasma fica **vermelho** antes de sumir. Tudo no `botoes.js` (a aba é identificada pelo texto dela na 1ª linha, sem o "N:"); o texto segue sendo do tmux. Instalado pelo ~/sh/omegashell-abas-efeitos.sh (rebuild do container).
- 28/10/2026 — Ajuste dos efeitos das abas (2º pedido do dono): (1) saiu o número "N:" da aba — o ícone do servidor/IA fica no lugar dele; (2) a aba ativa perdeu o sublinhado e ganhou um brilho leve (degradê claro no alto, contorno e halo roxo) — a página acha a ativa pelo negrito do tmux; (3) hover vira véu claro com borda e mãozinha, sem o "levanta/escala" (o texto é do canvas do tmux e não acompanhava a caixa); (4) o clique dá uma onda (ripple) a partir do ponto clicado, numa camada que não é refeita no redesenho — antes a troca de aba redesenhava a barra e apagava a animação — e a aba que fica ativa acende; (5) o CSS dos fantasmas (fechar/encerrar em vermelho) apontava para `#csb-barra` e eles vivem em `#csb-fantasmas`: nunca aparecia, corrigido. Instalado pelo ~/sh/omegashell-abas-hover-ativa.sh (tmux.conf + rebuild do container).
- 28/10/2026 — Nova sessão sempre no painel novo (pedido do dono: a pergunta do nome caiu no terminal em texto, sem o layout novo): os três passos do `omega` (servidor, IA, nome) vão com `CS_ABRE=1` (`botoes_abre`), e o painel abre na hora. Antes só abria se a pergunta chegasse em até 2 s depois do clique anterior (`csPede`), e o passo do nome consulta o servidor da sessão por ssh (`has-session` no bf e no Mac), que podia demorar mais — aí ficava só o "Nome da sessão nova…" em texto. Instalado pelo ~/sh/omega-nova-sessao-painel-abre.sh.
- 29/10/2026 — Ícones de tamanho de painel e ações de janela renderizados em SVG (pedido do dono: "os ícones de ajustar o tamanho de cada aba não estão sendo renderizados corretamente aqui no omegashell"): substituídos glifos Unicode ausentes ou inconsistentes (▯, ⛶, ◧, ▭, ⊞, ⇔, etc.) no mapa ICONE do `pwa/botoes.js` por vetores SVG nítidos e responsivos no padrão do tema. Rebuild do container astralwave_omegashell e limpeza de cache da Cloudflare.
