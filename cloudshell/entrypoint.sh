#!/bin/bash
# Sobe gateway, ttyd e nginx; se qualquer um cair, o container sai e o restart do compose religa.
set -euo pipefail

node /opt/cloudshell/gateway.mjs &

ttyd \
  --interface 127.0.0.1 --port 7681 \
  --writable --check-origin \
  --url-arg \
  --ping-interval 25 \
  -t titleFixed="OmegaShell" \
  -t fontSize=15 \
  -t macOptionClickForcesSelection=true \
  -t 'fontFamily="\"CloudShell Nerd\", JetBrains Mono, Menlo, Consolas, monospace"' \
  -t 'theme={"background":"#0b0b14","foreground":"#e6e6f0","cursor":"#b388ff"}' \
  /usr/local/bin/cloudshell-login &

nginx -g 'daemon off;' &

wait -n
exit 1
