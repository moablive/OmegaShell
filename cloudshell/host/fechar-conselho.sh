#!/bin/bash
# CloudShell — chamado pelos hooks do tmux.conf (lado do host): client-detached
# (fechar-conselho.sh <socket>) e client-attached (fechar-conselho.sh --anexou cs-<id>).
# Fecha a janela "conselho" (chat do Hermes) e reinicia a "omega" e a "sh" de TODA sessão
# cs-<id> sem nenhum cliente anexado. Não dá para usar "a sessão de quem saiu": no hook, #{session_name} pode
# vir de outra sessão ainda anexada. Sessão com gente dentro nunca é tocada.
set -u
# Caminho fixo: o run-shell herda o ambiente do servidor tmux, e um HOME ausente com set -u
# abortaria o script — e a janela conselho ficaria aberta sem aviso.
locks=/home/awlsrv/.cache/cloudshell

# Hook client-attached: o navegador anexou, a sessão deixou de estar "abrindo".
if [ "${1:-}" = --anexou ]; then
  [[ ${2:-} =~ ^cs-[0-9]{1,12}$ ]] && rm -f "$locks/$2.abrindo"
  exit 0
fi

sock=${1:-}
[ -S "$sock" ] || exit 0
tmux -S "$sock" list-sessions -F '#{session_name} #{session_attached}' 2>/dev/null |
while read -r sessao anexados; do
  [[ $sessao =~ ^cs-[0-9]{1,12}$ ]] || continue
  [ "$anexados" = 0 ] || continue
  # Sessão abrindo agora (sessao.sh marcou há menos de 15 s): o attach ainda vem.
  [ -n "$(find "$locks" -maxdepth 1 -name "$sessao.abrindo" -newermt '-15 seconds' 2>/dev/null || true)" ] && continue
  # A omega e a sh ficam, mas reiniciam: o sudo que a pessoa digitou nela não sobra num terminal sem dono
  # (o ticket do sudo é por terminal, e o respawn abre outro).
  tmux -S "$sock" respawn-window -k -t "=$sessao:=omega" 2>/dev/null || true
  tmux -S "$sock" respawn-window -k -t "=$sessao:=sh" 2>/dev/null || true
  # Se a conselho for a única janela, fechar mataria a sessão inteira: deixa.
  janelas=$(tmux -S "$sock" display-message -p -t "=$sessao:" '#{session_windows}' 2>/dev/null || echo 1)
  [ "$janelas" -gt 1 ] || continue
  tmux -S "$sock" kill-window -t "=$sessao:=conselho" 2>/dev/null || true
done
exit 0
