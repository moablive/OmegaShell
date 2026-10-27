# CloudShell da Astral Wave — terminal web instalável (PWA) atrás do LoginHUB (2FA).
#
# Não é app do workspace pnpm: o contexto é esta pasta.
#   docker build apps/cloudshell
# (o docker-compose.yml da raiz já faz isso).
#
# Dentro do container:
#   nginx :8080  → manifest/service worker/ícones públicos; /entrar e /setup-password
#                  = tela de login (Vue + auth-kit); todo o resto passa pelo
#                  auth_request do gateway antes de chegar ao ttyd
#   gateway 127.0.0.1:7690 → confere a sessão do LoginHUB (verifyHubToken + piso de
#                  revogação) e guarda em cookie httpOnly — o WebSocket não leva header
#   ttyd 127.0.0.1:7681 → cloudshell-login, que sem perguntar nada faz ssh -p 3333 como
#                  awlsrv no host (host-gateway) com a chave do CloudShell; no host o
#                  comando forçado (host/sessao.sh) abre a sessão tmux da conta do hub
# Nenhuma senha guardada. A chave privada NÃO está na imagem: vem do host em
# /run/cloudshell/id_ed25519 (bind só leitura, docker-compose.yml), legível pelo uid 1000.

FROM node:20-alpine AS web
ARG VITE_LOGINHUB_API_URL
ARG VITE_LOGINHUB_APP_ID
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY web/ ./
RUN npm run build

FROM node:20-alpine AS gateway
WORKDIR /gateway
COPY gateway/package.json gateway/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY gateway/ ./
RUN npm run build

FROM alpine:3.20

RUN apk add --no-cache bash ttyd nginx nodejs openssh-client-default tini \
 && adduser -D -u 1000 -h /home/shell shell \
 && mkdir -p /run/nginx /var/lib/nginx/tmp /var/log/nginx \
 && chown -R shell:shell /run/nginx /var/lib/nginx /var/log/nginx

# Chaves públicas do sshd do awlsrv: StrictHostKeyChecking=yes sem confiar no 1º acesso.
COPY --chown=shell:shell known_hosts /home/shell/.ssh/known_hosts
COPY ssh_config /etc/ssh/ssh_config.d/cloudshell.conf
COPY nginx.conf /etc/nginx/nginx.conf
COPY pwa/ /srv/pwa/
COPY --from=web /web/dist/ /srv/web/
COPY --from=gateway /gateway/dist/gateway.mjs /opt/cloudshell/gateway.mjs
COPY cloudshell-login entrypoint.sh /usr/local/bin/
RUN chmod 700 /home/shell/.ssh && chmod 600 /home/shell/.ssh/known_hosts \
 && chmod 644 /etc/ssh/ssh_config.d/cloudshell.conf /etc/nginx/nginx.conf \
 && chmod -R a+rX /srv/pwa /srv/web /opt/cloudshell \
 && chmod 755 /usr/local/bin/cloudshell-login /usr/local/bin/entrypoint.sh

USER shell
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:8080/manifest.webmanifest >/dev/null || exit 1
# -g: o SIGTERM do docker stop vai para o grupo inteiro (gateway, ttyd, nginx).
ENTRYPOINT ["/sbin/tini", "-g", "--", "/usr/local/bin/entrypoint.sh"]
