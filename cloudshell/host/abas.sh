#!/bin/bash
# CloudShell — grupos de abas (25/10/2026, pedido do dono). Chamado pelos botões "⇄ mover" e
# "▦ grupo" e pelo arrastar da barra (tmux.conf), sempre com o socket e os ids que o tmux expande:
#   abas.sh menu     <socket> <@janela> <cliente>   monta o menu do ▦ grupo
#   abas.sh grupo    <socket> <@janela>             confere o nome que o "Novo grupo…" gravou
#   abas.sh recolher <socket> <@janela>             recolhe/expande o grupo da aba
#   abas.sh clique   <socket> <@janela>             clique no rótulo do grupo (1ª aba dele): idem, e
#                                                   ao expandir vai para essa aba
#   abas.sh arruma   <socket> <@janela>             junta as abas de cada grupo e marca
#   abas.sh marca    <socket> <@janela>             só marca (depois de arrastar ou mover)
#   abas.sh apagar   <socket> <@janela> <grupo>     apaga o grupo: as abas dele ficam, soltas (26/10/2026)
#   abas.sh painel   <socket> <@janela> <cliente> [mover [e|d|c|f] | tamanho | cor]
#                                                   o "☰ menu" da barra (26/10/2026); "mover" abre o dropdown
#                                                   ← → ⇤ ⇥ dentro dele, que fica aberto a cada clique; Esc fecha;
#                                                   "tamanho" e "cor" abrem o 2º menu no mesmo lugar
#   abas.sh cs       <socket> <@janela> <cliente>   o "☰ CloudShell": abre a página inicial do navegador
#   abas.sh juntar   <socket> <@janela> <cliente> [marca <@id> | limpa]
#                                                   o ⌥ G (27/10/2026): marca várias abas (caixinhas) e cria um grupo
#                                                   com elas ou põe num grupo que já existe; a seleção fica em @juntar
#   abas.sh juntar_ok  <socket> <@janela>           cria o grupo com o nome digitado (@juntar_nome)
#   abas.sh juntar_por <socket> <@janela> <grupo>   põe as marcadas no grupo
# Todo menu daqui sai também em botões no navegador (botoes.sh, visual do Cmd+Tab, 26/10/2026): o
# clique num botão só digita a tecla do item, com o menu do tmux aberto atrás.
# Só o id da janela (@N) passa pelos comandos: o da sessão ($N) seria expandido pelo sh do run-shell.
# O grupo é a opção @grupo da janela; a 1ª aba de cada grupo leva @g_ini (rótulo "▦ nome" na barra) e
# @g_n (quantas); os recolhidos ficam na opção @recolhidos da sessão ("|nome|outro|"), e a barra
# esconde as abas deles menos a 1ª, que vira "▸ nome (N)". Recolher com a aba ativa no grupo passa
# para uma aba de fora (26/10/2026), e o grupo fica só no "▸ nome (N)"; sem aba de fora, a ativa fica.
set -u
export LC_ALL=C.UTF-8   # [[:alnum:]] aceita acento (Produção) no nome do grupo
lib=/usr/local/lib/cloudshell

acao=${1:-}; sock=${2:-}
# Só o socket de um servidor tmux da conta, e ids no formato do tmux: nada vira comando sem conferir.
[[ $sock =~ ^/tmp/tmux-[0-9]+/[A-Za-z0-9._-]+$ && -S $sock ]] || exit 0
t() { tmux -S "$sock" "$@"; }
id_ok() { [[ $1 =~ ^@[0-9]+$ ]]; }
# Nome de grupo: letras (com acento), números, _ . - e até 15; nada de | , # } (quebram a barra).
nome_ok() { [[ $1 =~ ^[[:alnum:]_.-]{1,15}$ ]]; }
# Botões do menu no navegador ($cliente = tty do cliente tmux, já conferido): tipo tmux, id, título, itens.
# CS_ABRE=1: todo menu daqui nasce de um clique (☰ menu, ⌥ C, um botão): o painel abre na hora (27/10/2026).
btn() { CS_ABRE=1 "$lib/botoes.sh" cliente "$cliente" tmux "$@"; }
# Comando de menu que mostra Sim/Não em botões antes do confirm-before (y/n) do tmux. A pergunta
# vai entre aspas simples no sh do run-shell (que antes expande #formatos e $variáveis): sem ' " \ $ # ;.
# "🖥️ Nova sessão…" (27/10/2026, pedido do dono: o ⌥ Tab não tinha como abrir terminal novo escolhendo o
# servidor e o nome): aba própria com o omega nova — servidor, Claude ou terminal, nome, em botões.
nova='new-window -n nova-sessao -e OMEGA_ABAS=1 "/usr/local/bin/omega nova"'
pergunta() { printf "run-shell \"CS_ABRE=1 %s/botoes.sh cliente %s tmux confirma '%s' 'y|✅|Sim||y' 'y|↩️|Não||n'\"" "$lib" "$cliente" "${1//[\'\"\\\$#;]/}"; }

# Marca a 1ª aba de cada grupo (@g_ini/@g_n) e tira a marca das outras.
marca() {
  local s=$1 w g visto='|'
  declare -A n=()
  while IFS='|' read -r w g; do [[ -n $g ]] && n[$g]=$(( ${n[$g]:-0} + 1 )); done \
    < <(t list-windows -t "$s" -F '#{window_id}|#{@grupo}')
  while IFS='|' read -r w g; do
    if [[ -n $g && $visto != *"|$g|"* ]]; then
      t set -w -t "$w" @g_ini 1 \; set -w -t "$w" @g_n "${n[$g]}"; visto+="$g|"
    else
      t set -wu -t "$w" @g_ini \; set -wu -t "$w" @g_n
    fi
  done < <(t list-windows -t "$s" -F '#{window_id}|#{@grupo}')
  # Grupo que deixou de existir sai da lista de recolhidos.
  local r novo='|' x
  r=$(t show -v -t "$s" @recolhidos 2>/dev/null || true)
  IFS='|' read -ra x <<< "$r"
  for g in "${x[@]}"; do [[ -n $g && $visto == *"|$g|"* ]] && novo+="$g|"; done
  if [[ $novo == '|' ]]; then t set -u -t "$s" @recolhidos; else t set -t "$s" @recolhidos "$novo"; fi
}

# Junta as abas de cada grupo logo depois da 1ª dele (a ordem de cada grupo e das abas soltas fica).
arruma() {
  local s=$1 w g i k ordem=() idx=() quer atual
  declare -A membros=() feito=()
  while IFS='|' read -r w g; do [[ -n $g ]] && membros[$g]+="$w "; done \
    < <(t list-windows -t "$s" -F '#{window_id}|#{@grupo}')
  while IFS='|' read -r i w g; do
    idx+=("$i")
    if [[ -z $g ]]; then ordem+=("$w")
    elif [[ -z ${feito[$g]:-} ]]; then feito[$g]=1; for k in ${membros[$g]}; do ordem+=("$k"); done
    fi
  done < <(t list-windows -t "$s" -F '#{window_index}|#{window_id}|#{@grupo}')
  # Posição k recebe ordem[k]: troca com a janela que está lá (swap -d não muda a aba ativa).
  for k in "${!ordem[@]}"; do
    quer=${ordem[k]}
    atual=$(t list-windows -t "$s" -F '#{window_index} #{window_id}' | awk -v i="${idx[k]}" '$1 == i { print $2 }')
    [[ $atual == "$quer" ]] || t swap-window -d -s "$quer" -t "$atual"
  done
  marca "$s"
}

w=${3:-}
id_ok "$w" || exit 0
s=$(t display -p -t "$w" '#{session_id}' 2>/dev/null) || exit 0
[[ -n $s ]] || exit 0

case $acao in
  marca|arruma) "$acao" "$s" ;;
  apagar)
    g=${4:-}
    nome_ok "$g" || exit 0
    n=0
    while IFS='|' read -r j jg; do
      [[ $jg == "$g" ]] && { t set -wu -t "$j" @grupo; n=$((n + 1)); }
    done < <(t list-windows -t "$s" -F '#{window_id}|#{@grupo}')
    arruma "$s"   # tira as marcas e o grupo da lista de recolhidos
    t display-message -d 1500 "grupo $g apagado: $n aba(s) soltas" ;;
  grupo)
    # O "Novo grupo…" gravou o que foi digitado (%%%, com aspas escapadas) direto no @grupo: aqui
    # ele é conferido antes de ir para a barra ou para outro comando.
    g=$(t show -wv -t "$w" @grupo 2>/dev/null || true)
    if ! nome_ok "$g"; then
      t set -wu -t "$w" @grupo
      t display-message "nome de grupo inválido (letras, números, _ . - e até 15)"
    fi
    arruma "$s" ;;
  recolher|clique)
    g=$(t show -wv -t "$w" @grupo 2>/dev/null || true)
    nome_ok "$g" || { t display-message "esta aba não está em nenhum grupo"; exit 0; }
    r=$(t show -v -t "$s" @recolhidos 2>/dev/null || true); r=${r:-|}
    if [[ $r == *"|$g|"* ]]; then
      r=${r/"|$g|"/|}; msg="grupo $g expandido"
      [[ $acao == clique ]] && t select-window -t "$w"
    else
      r+="$g|"; msg="grupo $g recolhido: ▸ $g"
      # Aba ativa no grupo: vai para a última usada fora dele (ou a 1ª visível de fora).
      if [[ $(t display -p -t "$s" '#{@grupo}') == "$g" ]]; then
        fora=$(t list-windows -t "$s" -F '#{window_last_flag} #{window_id} #{@grupo}' |
          awk -v g="$g" -v r="$r" '$3 != g && ($3 == "" || index(r, "|" $3 "|") == 0) { if ($1 == 1) { print $2; achou = 1; exit } if (!p) p = $2 } END { if (!achou && p) print p }')
        if id_ok "$fora"; then t select-window -t "$fora"; else msg+=" (a aba ativa fica à vista)"; fi
      fi
    fi
    if [[ $r == '|' ]]; then t set -u -t "$s" @recolhidos; else t set -t "$s" @recolhidos "$r"; fi
    arruma "$s"
    t display-message -d 1200 "$msg" ;;
  painel|mover)
    # O "☰ menu" da barra (26/10/2026, pedido do dono): montado aqui para o ⇄ Mover abrir como
    # dropdown DENTRO dele — o tmux não tem submenu em cascata, então o mesmo menu reabre no mesmo
    # lugar com ← → ⇤ ⇥ logo abaixo do "⇄ Mover ▾", e continua aberto a cada clique (Esc fecha).
    #   painel <socket> <@janela> <cliente> [mover [e|d|c|f]]   (mover … = painel … mover …)
    cliente=${4:-}
    if [[ $acao == mover ]]; then aberto=mover para=${5:-}; else aberto=${5:-} para=${6:-}; fi
    [[ $cliente =~ ^/dev/pts/[0-9]+$ ]] || exit 0
    [[ -z $aberto || $aberto == @(mover|tamanho|cor) ]] || exit 0
    [[ -z $para || $para == [edcf] ]] || exit 0
    base="$lib/abas.sh painel $sock $w $cliente"
    titulo="aba #W"
    janela=$(t display -p -t "$w" '#W')
    jfixa=$(t display -p -t "$w" '#{@jfixa}') pfixa=$(t display -p -t "$w" '#{@pfixa}')
    # Reaberto por um clique de mouse no próprio menu: sem a pausa, o tmux ainda está fechando o
    # menu anterior e fecha o novo junto (com teclado não acontecia).
    [[ -n $aberto$para ]] && sleep 0.2
    case $aberto in
      tamanho)
        btn tamanho "tamanho do painel · $janela" 'tamanho|◧|Metade||m' 'tamanho|▯|1/3 (estreito)||1' \
          'tamanho|▭|2/3 (largo)||2' 'tamanho|⊞|Igualar todos||i' 'tamanho|⛶|Tela cheia / voltar||z'
        t display-menu -O -M -c "$cliente" -T '#[align=centre]tamanho do painel ativo' -x R -y S -- \
          'Metade' m 'resize-pane -x 50%' '1/3 (estreito)' 1 'resize-pane -x 33%' '2/3 (largo)' 2 'resize-pane -x 67%' \
          'Igualar todos' i 'select-layout -E' '' 'Tela cheia / voltar' z 'resize-pane -Z'
        exit 0 ;;
      cor)
        # ⌥ C (27/10/2026: abre esta paleta em vez de passar para a próxima cor); nas fixas a cor não muda.
        if [[ -n $jfixa ]]; then t display-message "a aba $janela é fixa: fica sempre azul"; exit 0; fi
        args=() bt=()
        for c in Vermelho:v:ff5c7a:🟥 Laranja:l:ffa94d:🟧 Amarelo:a:ffd43b:🟨 Verde:g:69db7c:🟩 Azul:z:4dabf7:🟦 \
                 Ciano:c:3bc9db:🩵 Rosa:r:f783ac:🩷 Cinza:i:adb5bd:⬜; do
          IFS=: read -r cn ck ch ce <<< "$c"
          args+=("$cn" "$ck" "set -w -t $w @cor \"#$ch\"")
          bt+=("cor|#$ch|$cn||$ck")   # ícone = a cor: a página desenha uma esfera dela
        done
        btn cor "cor da aba $janela" "${bt[@]}" 'cor|◯|Padrão|sem cor|p'
        t display-menu -O -M -c "$cliente" -T '#[align=centre]cor da aba #W' -x R -y S -- \
          "${args[@]}" '' 'Padrão' p "set -wu -t $w @cor"
        exit 0 ;;
    esac
    mov=("⇄ Mover ▸" m "run-shell \"$base mover\"")
    bmov=()
    if [[ $aberto == mover ]]; then
      # Só as abas que aparecem na barra contam como vizinhas: fixas (@jfixa) e as escondidas de
      # grupo recolhido (menos a 1ª, o "▸ nome") são puladas, para cada clique mexer a aba de verdade.
      visiveis() {
        local r j jf jg ji
        vis=() p=0
        r=$(t show -v -t "$s" @recolhidos 2>/dev/null || true)
        while IFS='|' read -r j jf jg ji; do
          if [[ $j != "$w" ]]; then
            [[ -z $jf ]] || continue
            [[ -n $jg && $r == *"|$jg|"* && -z $ji ]] && continue
          fi
          [[ $j == "$w" ]] && p=${#vis[@]}
          vis+=("$j")
        done < <(t list-windows -t "$s" -F '#{window_id}|#{@jfixa}|#{@grupo}|#{@g_ini}')
        n=${#vis[@]}
      }
      visiveis
      case $para in
        e) (( p > 0 ))     && t swap-window -d -s "$w" -t "${vis[p - 1]}" ;;
        d) (( p < n - 1 )) && t swap-window -d -s "$w" -t "${vis[p + 1]}" ;;
        c) (( p > 0 ))     && t move-window -b -s "$w" -t "${vis[0]}" ;;
        f) (( p < n - 1 )) && t move-window -a -s "$w" -t "${vis[n - 1]}" ;;
      esac
      if [[ -n $para ]]; then
        t move-window -r -t "$s"
        marca "$s"
        antes=$p; visiveis
        (( p == antes )) && t display-message -d 900 "a aba já está $([[ $para == [ec] ]] && echo 'no começo' || echo 'no fim')"
      fi
      ini=; fim=
      (( p == 0 )) && ini=-
      (( p == n - 1 )) && fim=-
      titulo="aba #W ($((p + 1)) de $n)"
      # Teclas < > Home End (as letras e d c f já são de Dividir e Cor no menu; as setas ← → o menu usa).
      mov=("⇄ Mover ▾" m "run-shell \"$base\""
           "${ini}     ← Para a esquerda" "<"   "run-shell \"$base mover e\""
           "${fim}     → Para a direita"  ">"   "run-shell \"$base mover d\""
           "${ini}     ⇤ Para o começo"   Home  "run-shell \"$base mover c\""
           "${fim}     ⇥ Para o fim"      End   "run-shell \"$base mover f\"")
      bmov=("mover · $((p + 1)) de $n|←|Para a esquerda||${ini:-<}" "mover · $((p + 1)) de $n|→|Para a direita||${fim:->}"
            "mover · $((p + 1)) de $n|⇤|Para o começo||${ini:-Home}" "mover · $((p + 1)) de $n|⇥|Para o fim||${fim:-End}")
    fi
    # Abas para trocar (o ⌥ Tab do navegador abre este menu nas abas sem menu próprio, como o Cmd+Tab):
    # a última usada primeiro — ⌥ Tab e soltar volta para ela —, depois as outras na ordem da barra;
    # teclas 1–9, e O e S para a omega e a sh no ⌥ Tab (as minúsculas são das ações).
    babas=() mabas=() bfix=() mfix=() k=0
    while IFS='|' read -r ultima j jn jc jf; do
      [[ $j == "$w" ]] && continue
      case $jn in
        # As fixas saíram da lista do ☰ menu (27/10/2026, pedido do dono: ficam na página inicial). Pelo ⌥ Tab
        # (CS_ATALHO=1, tmux.conf) a omega e a sh voltam, num grupo à parte no começo (27/10/2026, pedido do dono).
        omega|sh)
          [[ ${CS_ATALHO:-} == 1 ]] || continue
          if [[ $jn == omega ]]; then jk=O ic=Ω d='sessões'; else jk=S ic=🧾 d='scripts ~/sh'; fi
          bfix+=("OmegaShell|$ic|$jn|$d|$jk")
          mfix+=("$ic $jn ($d)" "$jk" "select-window -t $j")
          continue ;;
        conselho) continue ;;
        *) [[ -n $jf ]] && continue
           (( k < 9 )) || continue
           jk=$((++k)); [[ $jc == *claude* ]] && ic=🤖 || ic=⌨️ ;;
      esac
      babas+=("abas|$ic|${jn//|/}|$( (( ultima )) && echo 'última usada')|$jk")
      mabas+=("$ic ${jn//[\'\"\\\$#;]/}" "$jk" "select-window -t $j")
    done < <(t list-windows -t "$s" -F '#{window_last_flag}|#{window_id}|#{window_name}|#{pane_current_command}|#{@jfixa}' | sort -t'|' -k1,1nr -s)
    babas=("${bfix[@]}" "${babas[@]}"); mabas=("${mfix[@]}" "${mabas[@]}")
    (( ${#mabas[@]} )) && mabas+=("")
    btn painel "aba $janela" "${babas[@]}" 'janela|🖥️|Nova sessão…|servidor e nome|N' \
      'janela|➕|Nova janela|shell aqui|n' 'janela|⫼|Dividir||d' \
      "janela|✕|Fechar shell|${pfixa:+aba fixa}|$([[ -n $pfixa ]] && echo - || echo x)" \
      'organizar|▦|Grupo…||g' "organizar|⇄|Mover|$([[ $aberto == mover ]] && echo 'aberto abaixo')|m" \
      'organizar|⇔|Tamanho…||t' \
      "${bmov[@]}"
    t display-menu -O -M -c "$cliente" -T "#[align=centre]$titulo" -x R -y S -- \
      "${mabas[@]}" \
      "🖥️ Nova sessão… (servidor e nome)" N "$nova" \
      "+ Nova janela (shell aqui)" n 'new-window -c "#{pane_current_path}"' \
      "⫼ Dividir"     d 'split-window -h -c "#{pane_current_path}"' \
      "#{?@pfixa,-,}✕ Fechar shell" x "$(pergunta "fechar este shell ($janela)?") ; confirm-before -p \"fechar este shell (#W)? y/n\" kill-pane" \
      "" \
      "▦ Grupo…" g "run-shell \"$lib/abas.sh menu $sock $w $cliente\"" \
      "${mov[@]}" \
      "⇔ Tamanho…" t "run-shell \"$base tamanho\"" ;;
    # A cor saiu do ☰ menu (27/10/2026, pedido do dono): só pelo ⌥ C (e Ctrl-b C), na paleta de caixinhas.
  cs)
    # "☰ CloudShell" da barra: abre só a página inicial do navegador (27/10/2026, pedido do dono; até então era o
    # menu das janelas fixas, que agora ficam nos cartões da página inicial).
    cliente=${4:-}
    [[ $cliente =~ ^/dev/pts/[0-9]+$ ]] || exit 0
    "$lib/botoes.sh" inicio "$cliente" ;;
  juntar)
    # ⌥ G (27/10/2026, pedido do dono: "agrupar, escolhendo as sessões, visualmente parecido com a seleção de cor"):
    # cada aba é uma caixinha na cor dela; o clique marca/desmarca (✓) e o menu reabre no mesmo lugar, como o ⇄ Mover.
    cliente=${4:-} op=${5:-} alvo=${6:-}
    [[ $cliente =~ ^/dev/pts/[0-9]+$ ]] || exit 0
    [[ -z $op || $op == @(marca|limpa) ]] || exit 0
    eu="$lib/abas.sh"; base="$eu juntar $sock $w $cliente"
    sel=$(t show -v -t "$w" @juntar 2>/dev/null || true)
    case $op in
      marca) id_ok "$alvo" || exit 0
             if [[ ${sel:-|} == *"|$alvo|"* ]]; then sel=${sel/"|$alvo|"/|}; else sel=${sel:-|}$alvo'|'; fi ;;
      limpa) sel='|' ;;
      '')    [[ -n $sel && $sel != '|' ]] || sel="|$w|" ;;   # 1ª abertura: a aba ativa já vem marcada
    esac
    # Só as abas que existem e não são fixas.
    novo='|' itens=() bt=() k=0 n=0
    teclas=(1 2 3 4 5 6 7 8 9 A B C D E F G H I J K L M O P Q R S T U V W Y Z)
    while IFS='|' read -r j jn jc jg jf; do
      [[ -n $jf ]] && continue
      (( k < ${#teclas[@]} )) || break
      tk=${teclas[k]}; k=$((k + 1))
      cor=${jc:-#5c5c7a}; [[ $cor =~ ^#[0-9a-fA-F]{6}$ ]] || cor='#5c5c7a'
      if [[ $sel == *"|$j|"* ]]; then novo+="$j|"; n=$((n + 1)); marca='✓ marcada'; caixa='☑'
      else marca=${jg:+▦ $jg}; caixa='☐'; fi
      bt+=("abas|$cor|${jn//|/}|$marca|$tk")
      itens+=("$caixa ${jn//[\'\"\\\$#;]/}" "$tk" "run-shell \"$base marca $j\"")
    done < <(t list-windows -t "$s" -F '#{window_id}|#{window_name}|#{@cor}|#{@grupo}|#{@jfixa}')
    if [[ $novo == '|' ]]; then t set -u -t "$w" @juntar; else t set -t "$w" @juntar "$novo"; fi
    [[ -n $op ]] && sleep 0.2   # reaberto por um clique no próprio menu (ver o ⇄ Mover)
    tem=-; (( n )) && tem=
    itens+=("" "${tem}➕ Criar grupo com as $n marcadas…" n \
      "command-prompt -p 'nome do grupo:' \"set -t $w @juntar_nome \\\"%%%\\\" ; run-shell \\\"$eu juntar_ok $sock $w\\\"\"")
    bt+=("ações|➕|Criar grupo…|com as $n marcada$( (( n == 1 )) || echo s)|${tem:-n}")
    letras=(a b c d e f g h i) l=0
    while IFS= read -r g; do
      nome_ok "$g" || continue
      (( l < 9 )) || break
      itens+=("${tem}▦ Pôr as marcadas em $g" "${letras[l]}" "run-shell \"$eu juntar_por $sock $w $g\"")
      bt+=("ações|▦|Pôr em $g|as marcadas|${tem:-${letras[l]}}")
      l=$((l + 1))
    done < <(t list-windows -t "$s" -F '#{@grupo}' | awk 'NF && !v[$0]++')
    itens+=("" "✕ Limpar a seleção" x "run-shell \"$base limpa\"")
    bt+=("ações|✕|Limpar seleção||x")
    btn juntar "agrupar abas · $n marcada$( (( n == 1 )) || echo s)" "${bt[@]}"
    args=() i=0
    while (( i < ${#itens[@]} )); do
      if [[ -z ${itens[i]} ]]; then args+=(""); i=$((i + 1)); else args+=("${itens[i]}" "${itens[i+1]}" "${itens[i+2]}"); i=$((i + 3)); fi
    done
    t display-menu -O -M -c "$cliente" -T "#[align=centre]agrupar abas ($n marcadas)" -x R -y S -- "${args[@]}" ;;
  juntar_ok|juntar_por)
    sel=$(t show -v -t "$w" @juntar 2>/dev/null || true)
    if [[ $acao == juntar_ok ]]; then
      g=$(t show -v -t "$w" @juntar_nome 2>/dev/null || true); t set -u -t "$w" @juntar_nome
    else g=${4:-}; fi
    nome_ok "$g" || { t display-message "nome de grupo inválido (letras, números, _ . - e até 15)"; exit 0; }
    n=0
    IFS='|' read -ra ids <<< "$sel"
    for j in "${ids[@]}"; do
      id_ok "$j" || continue
      [[ -z $(t display -p -t "$j" '#{@jfixa}' 2>/dev/null) ]] || continue
      t set -w -t "$j" @grupo "$g" && n=$((n + 1))
    done
    t set -u -t "$w" @juntar
    arruma "$s"
    t display-message -d 1500 "grupo $g: $n aba(s)" ;;
  menu)
    cliente=${4:-}
    [[ $cliente =~ ^/dev/pts/[0-9]+$ ]] || exit 0
    atual=$(t show -wv -t "$w" @grupo 2>/dev/null || true); nome_ok "$atual" || atual=
    r=$(t show -v -t "$s" @recolhidos 2>/dev/null || true)
    eu="$lib/abas.sh"
    itens=() k=0 bt=()
    # Grupos que já existem (menos o desta aba): 1–9 põem a aba nele.
    while IFS= read -r g; do
      nome_ok "$g" && [[ $g != "$atual" ]] || continue
      (( ++k <= 9 )) || break
      itens+=("Pôr no grupo $g" "$k" "set -w -t $w @grupo $g ; run-shell \"$eu arruma $sock $w\"")
      bt+=("pôr no grupo|▦|$g||$k")
    done < <(t list-windows -t "$s" -F '#{@grupo}' | awk 'NF && !v[$0]++')
    bt+=("pôr no grupo|➕|Novo grupo…||n")
    itens+=("Novo grupo…" n "command-prompt -p 'nome do grupo:' \"set -w -t $w @grupo \\\"%%%\\\" ; run-shell \\\"$eu grupo $sock $w\\\"\"")
    if [[ -n $atual ]]; then
      itens+=("" "" "")
      if [[ $r == *"|$atual|"* ]]; then itens+=("Expandir o grupo $atual" r "run-shell \"$eu recolher $sock $w\""); bt+=("grupo $atual|▾|Expandir||r")
      else itens+=("Recolher o grupo $atual" r "run-shell \"$eu recolher $sock $w\""); bt+=("grupo $atual|▸|Recolher||r"); fi
      itens+=("Tirar esta aba do grupo" t "set -wu -t $w @grupo ; run-shell \"$eu arruma $sock $w\"")
      bt+=("grupo $atual|⤴|Tirar esta aba||t")
    fi
    itens+=("" "" "" "Juntar as abas de cada grupo" j "run-shell \"$eu arruma $sock $w\"")
    bt+=("todos|🧲|Juntar as abas de cada grupo||j")
    # Apagar um grupo (26/10/2026, pedido do dono): as abas ficam, só saem do grupo; confirma com y.
    # Teclas a, b, c… (as outras letras do menu são n, r, t, j).
    primeiro=1 k=0 letras=(a b c d e f g h i)
    while IFS= read -r g; do
      nome_ok "$g" || continue
      (( primeiro )) && { itens+=("" "" ""); primeiro=0; }
      (( k < 9 )) || break
      itens+=("✕ Apagar o grupo $g" "${letras[k]}" "$(pergunta "apagar o grupo $g? as abas ficam abertas") ; confirm-before -p 'apagar o grupo $g? as abas ficam abertas (y/n)' { run-shell \"$eu apagar $sock $w $g\" }")
      bt+=("apagar|🗑|$g|as abas ficam|${letras[k]}")
      k=$((k + 1))
    done < <(t list-windows -t "$s" -F '#{@grupo}' | awk 'NF && !v[$0]++')
    # Linha vazia do display-menu é separador só com UM argumento: tira as chaves/comandos vazios.
    args=() i=0
    while (( i < ${#itens[@]} )); do
      if [[ -z ${itens[i]} ]]; then args+=(""); else args+=("${itens[i]}" "${itens[i+1]}" "${itens[i+2]}"); fi
      i=$((i + 3))
    done
    btn grupo "grupo da aba $(t display -p -t "$w" '#W')" "${bt[@]}"
    t display-menu -O -M -c "$cliente" -T "#[align=centre]grupo da aba #W" -x R -y S "${args[@]}" ;;
esac
exit 0
