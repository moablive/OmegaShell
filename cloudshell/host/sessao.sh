#!/bin/bash
# CloudShell — lado do host. Comando FORÇADO da chave do CloudShell no
# ~awlsrv/.ssh/authorized_keys (restrict,pty,command="…",from= o /32 do container): a chave
# não abre shell solto nem túnel, só esta sessão tmux. Instalado em /usr/local/lib/cloudshell/
# pelo ~/sh/cloudshell-host-endurecer.sh; fonte em apps/cloudshell/host/ do OmegaShell.
#
# SSH_ORIGINAL_COMMAND = id da conta no LoginHUB (posto pelo cloudshell-login a partir do
# que o gateway conferiu). Uma sessão tmux por conta: fechar o navegador não mata as janelas
# de shell; reabrir volta a elas. A janela "conselho" (chat do 📜 Conselheiro Ômega, que roda
# como root via sudo) é fechada quando o último navegador sai (hook no tmux.conf) e recriada
# aqui na volta — reabrir pede o sudo de novo, em vez de herdar um processo root.
set -euo pipefail

conta=${SSH_ORIGINAL_COMMAND:-}
origem=${SSH_CONNECTION:-}; origem=${origem%% *}
if ! [[ $conta =~ ^[0-9]{1,12}$ ]]; then
  logger -t cloudshell "recusado: id de conta inválido '$(printf '%s' "$conta" | tr -cd '[:alnum:]_-' | cut -c1-20)' de ${origem:--}" || true
  echo "CloudShell: sessão inválida (sem conta do LoginHUB)." >&2
  exit 1
fi
sessao="cs-$conta"
# -u: UTF-8 sempre (o comando forçado não herda LANG; sem isso "⫼" e acentos viram "_").
tmux_cs=(tmux -u -L cloudshell -f /usr/local/lib/cloudshell/tmux.conf)
# Janelas fixas conselho, omega e sh (comandos, marcas e ordem; ficam no menu ☰ CloudShell): host/fixas.sh.
# Não fecham (26/10/2026, pedido do dono): sair do chat, q ou Ctrl-C reinicia o painel; a janela
# conselho só sai quando o último navegador sai (fechar-conselho.sh), e esta abertura recria.
# Shell solto: + nova janela.

# Duas abas abrindo juntas não podem criar a sessão (ou a janela conselho) duas vezes.
# Lock no home do awlsrv (700), nunca em /tmp: lá outro usuário pré-criaria o arquivo.
locks="$HOME/.cache/cloudshell"
mkdir -p -m 700 "$locks"
chmod 700 "$locks"
# Marcadores de quem morreu antes do attach (o hook client-attached é quem apaga).
find "$locks" -maxdepth 1 -name 'cs-*.abrindo' -mmin +1 -delete 2>/dev/null || true
exec 9>"$locks/$sessao.lock"
flock 9
# Marcador: entre criar a janela conselho e o attach a sessão fica com 0 clientes; o
# fechar-conselho.sh (hook de detach de OUTRA sessão) pula sessão marcada há menos de 15 s.
touch "$locks/$sessao.abrindo"
/usr/local/lib/cloudshell/fixas.sh garante "$sessao"
flock -u 9
exec 9>&-

logger -t cloudshell "conta_hub=$conta anexou a sessão $sessao de ${origem:--}" || true
exec "${tmux_cs[@]}" attach-session -t "=$sessao"
