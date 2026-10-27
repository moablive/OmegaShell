#!/bin/bash
# CloudShell — botões no navegador (26/10/2026, pedido do dono: menus em botões, no visual do Cmd+Tab
# do Mac). Instalado em /usr/local/lib/cloudshell/ com os outros de host/.
#
# Quem tem um menu na tela (o omega, os menus do tmux montados pelo abas.sh) chama este script, que
# escreve uma sequência OSC 7717 direto no terminal do navegador (o tty do cliente tmux = o pty do
# ssh do CloudShell). A página (pwa/botoes.js, injetado pelo nginx) desenha os botões por cima do
# terminal; o clique só DIGITA a tecla do item (1⏎, n⏎, y…) — o programa continua lendo do teclado
# como sempre, e o menu em texto continua valendo.
#
#   botoes.sh cliente <tty> <tipo> <id> <título> <item>...         um navegador (cliente tmux)
#   botoes.sh sessao  <socket> <sessão> <tipo> <id> <título> <item>...   todos os navegadores da sessão
#   botoes.sh esconde <socket> <sessão>                             tira os botões e diz a aba ativa (hook de troca de aba)
#   botoes.sh inicio  <tty>                                         abre a página inicial (☰ CloudShell, 27/10/2026)
# CS_ABRE=1 no ambiente: a página abre o painel na hora, sem esperar o ⌥ Tab (menu aberto por clique, 27/10/2026).
#
# tipo: omega (o programa lê a tecla) ou tmux (menu do tmux aberto: Esc nos botões fecha ele também).
# item: "grupo|ícone|rótulo|detalhe|tecla"; tecla = o que o clique digita (até 4 letras/números, com
# ⏎ no fim = Enter; ou só ⏎, Esc, Home, End); "-" = botão apagado. A página recusa tecla fora disso.
set -u
export LC_ALL=C.UTF-8

tty_ok() { [[ $1 =~ ^/dev/pts/[0-9]+$ && -c $1 && -w $1 ]]; }
sock_ok() { [[ $1 =~ ^/tmp/tmux-[0-9]+/[A-Za-z0-9._-]+$ && -S $1 ]]; }
sessao_ok() { [[ $1 =~ ^[A-Za-z0-9._-]+$ ]]; }

# Clientes (tty) da sessão: os navegadores que estão vendo essa sessão agora.
clientes() { tmux -S "$1" list-clients -t "=$2" -F '#{client_tty}' 2>/dev/null; }

# Uma escrita só: o tmux também escreve nesse tty, e a sequência não pode sair partida.
envia() {
  local tty=$1 dados=$2
  tty_ok "$tty" || return 0
  printf '\e]7717;%s\a' "$dados" >"$tty" 2>/dev/null || true
}

# JSON em base64 (nada de aspas, ; ou BEL dentro da sequência).
monta() {
  local tipo=$1 id=$2 titulo=$3; shift 3
  [[ $tipo == @(omega|tmux) && $id =~ ^[a-z0-9-]{1,24}$ ]] || return 1
  jq -cn --arg tipo "$tipo" --arg id "$id" --arg t "$titulo" --argjson abre "$([[ ${CS_ABRE:-} == 1 ]] && echo true || echo false)" \
    '{tipo: $tipo, id: $id, t: $t, abre: $abre, i: ($ARGS.positional | map(split("|") | {g: .[0], e: .[1], r: .[2], d: .[3], k: .[4]}))}' \
    --args "$@" | base64 -w0
}

acao=${1:-}
case $acao in
  cliente)
    tty=${2:-}; shift 2 || exit 0
    dados=$(monta "$@") || exit 0
    envia "$tty" "$dados" ;;
  sessao)
    sock=${2:-} s=${3:-}; shift 3 || exit 0
    sock_ok "$sock" && sessao_ok "$s" || exit 0
    dados=$(monta "$@") || exit 0
    while IFS= read -r tty; do envia "$tty" "$dados"; done < <(clientes "$sock" "$s") ;;
  inicio)
    envia "${2:-}" "$(printf '{"tipo":"inicio"}' | base64 -w0)" ;;
  esconde)
    # Troca de aba (27/10/2026): além de tirar os botões, diz à página qual aba ficou ativa — na omega e na sh ela
    # mostra na hora a última tela de Sessões/Scripts, sem a lista em texto aparecer até o omega reenviar o menu.
    sock=${2:-} s=${3:-}
    sock_ok "$sock" && sessao_ok "$s" || exit 0
    w=$(tmux -S "$sock" display -p -t "=$s:" '#{window_name}' 2>/dev/null || true)
    [[ $w =~ ^[A-Za-z0-9._-]{1,40}$ ]] || w=
    dados=$(jq -cn --arg w "$w" '{tipo: "aba", w: $w}' | base64 -w0)
    while IFS= read -r tty; do envia "$tty" "$dados"; done < <(clientes "$sock" "$s") ;;
esac
exit 0
