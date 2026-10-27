#!/bin/bash
# CloudShell — janelas fixas conselho, omega e sh (26/10/2026, pedido do dono: não dá para fechar).
# Instalado em /usr/local/lib/cloudshell/ com os outros de host/.
#   fixas.sh garante <cs-id>   cria a sessão e as fixas que faltarem e marca (@jfixa na janela, @pfixa
#                              no painel fixo, que ressuscita sozinho); a barra esconde as três, que
#                              ficam no menu "☰ CloudShell".
#                              Chamado pelo sessao.sh, que já segura o lock da sessão.
#   fixas.sh repor             hook window-unlinked (tmux.conf): se uma fixa sumiu mesmo assim
#                              (kill-window digitado num shell, por exemplo), recria nas sessões
#                              com navegador anexado. Sessão sem ninguém fica com o fechar-conselho.sh,
#                              que fecha a conselho de propósito; a volta recria pelo sessao.sh.
set -u
# Caminhos fixos: o run-shell do hook herda o ambiente do servidor tmux (pode vir sem HOME).
casa=/home/awlsrv
locks=$casa/.cache/cloudshell
lib=/usr/local/lib/cloudshell
t() { tmux -u -L cloudshell -f "$lib/tmux.conf" "$@"; }

# Chat do 📜 Conselheiro Ômega. Desde 26/10/2026 o Hermes é do awlsrv (/home/awlsrv/.hermes),
# então o chat abre direto, sem sudo nem senha.
# O chat sobe pelo hermes-fixo.py (26/10/2026): /exit, /quit, Ctrl+D e Ctrl+C vazio não fecham (só avisam).
conselho='env -u PYTHONPATH -u PYTHONHOME HOME=/home/awlsrv HERMES_HOME=/home/awlsrv/.hermes /usr/local/lib/hermes-agent/venv/bin/python /usr/local/lib/cloudshell/hermes-fixo.py -p conselho-omega chat'
# Janela "omega": o menu do omega (sessões; sh = lista dos ~/sh; os dois painéis ao vivo,
# redesenho a cada 3 s), como o omega do Mac. Sair do omega (q) só o reabre.
# OMEGA_ABAS=1: escolher um ~/sh abre uma aba nova com o nome dele (omega sh_abre_aba).
# trap : INT — Ctrl-C derruba só o omega, não o laço (handler, não ignore: o omega recebe o sinal
# normal), e ele volta em 1 s sem a aba piscar. Dentro da aba o omega já não tem q para sair.
omega="trap : INT; while :; do OMEGA_ABAS=1 /usr/local/bin/omega; sleep 1; done"
# Janela "sh" (no lugar da antiga "shell"): a lista dos ~/sh; mesmo tratamento da omega.
sh_lista="trap : INT; while :; do OMEGA_ABAS=1 /usr/local/bin/omega sh; sleep 1; done"

garante() {
  local s=$1 janelas j p
  if ! t has-session -t "=$s" 2>/dev/null; then
    t new-session -d -s "$s" -n conselho -c "$casa" "$conselho"
  fi
  janelas=$(t list-windows -t "=$s" -F '#{window_name}')
  if ! grep -qx conselho <<<"$janelas"; then
    t new-window -d -b -t "=$s:^" -n conselho -c "$casa" "$conselho"
  fi
  # A omega vem logo depois da conselho, a sh logo depois da omega.
  if ! grep -qx omega <<<"$janelas"; then
    t new-window -d -a -t "=$s:=conselho" -n omega -c "$casa" "$omega"
  fi
  if ! grep -qx sh <<<"$janelas"; then
    t new-window -d -a -t "=$s:=omega" -n sh -c "$casa" "$sh_lista"
  fi
  # Sem grupo (26/10/2026): as três não aparecem como abas, ficam no menu "☰ CloudShell" (tmux.conf);
  # o grupo "omega" de 25/10 sai delas.
  # O painel fixo é o primeiro da janela; os que se abrem nela (⫼ dividir, Option+V) fecham normal.
  # remain-on-exit + hook pane-died (tmux.conf): sair do chat, Ctrl-C ou q não fecham, reiniciam.
  for j in conselho omega sh; do
    t set -wu -t "=$s:=$j" @grupo \; set -w -t "=$s:=$j" @jfixa 1 2>/dev/null || continue
    t list-panes -t "=$s:=$j" -F '#{@pfixa}' | grep -qx 1 && continue
    p=$(t list-panes -t "=$s:=$j" -F '#{pane_id}' | head -1)
    [[ $p =~ ^%[0-9]+$ ]] && t set -p -t "$p" @pfixa 1 \; set -p -t "$p" remain-on-exit on
  done
  "$lib/abas.sh" arruma "$(t display -p '#{socket_path}')" \
    "$(t display -p -t "=$s:=omega" '#{window_id}')" || true
}

repor() {
  local s n janelas c
  t list-sessions -F '#{session_name} #{session_attached}' 2>/dev/null |
  while read -r s n; do
    [[ $s =~ ^cs-[0-9]{1,12}$ && $n != 0 ]] || continue
    janelas=$(t list-windows -t "=$s" -F '#{window_name}' 2>/dev/null) || continue
    grep -qx conselho <<<"$janelas" && grep -qx omega <<<"$janelas" && grep -qx sh <<<"$janelas" && continue
    # Uma vez a cada 10 s por sessão: se a fixa morrer logo ao abrir, não vira laço.
    [ -n "$(find "$locks" -maxdepth 1 -name "$s.repor" -newermt '-10 seconds' 2>/dev/null)" ] && continue
    (
      flock -n 9 || exit 0   # o sessao.sh está abrindo esta sessão: ele mesmo garante as fixas
      touch "$locks/$s.repor"
      garante "$s"
      for c in $(t list-clients -t "=$s" -F '#{client_name}'); do
        t display-message -c "$c" -d 1500 "conselho, omega e sh são fixas: a aba foi reaberta"
      done
    ) 9>"$locks/$s.lock"
  done
}

case ${1:-} in
  garante) [[ ${2:-} =~ ^cs-[0-9]{1,12}$ ]] && garante "$2" ;;
  repor)   [ -d "$locks" ] && repor ;;
esac
exit 0
