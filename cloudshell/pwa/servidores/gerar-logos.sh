#!/usr/bin/env bash
# Gera pwa/logos.js com os logos de pwa/servidores/ embutidos (data: URI), para a página do CloudShell não depender
# de buscar a imagem pela rede (27/10/2026: os arquivos chegavam pela Cloudflare, mas o logo não aparecia).
# Rodar depois de pôr ou trocar um logo aqui; PNG vai reduzido a 96 px de altura.
# Documentação: "Projeto - Astral Wave ／ CloudShell", pasta awldocs do Drive.
set -euo pipefail
cd "$(dirname "$0")"
saida=../logos.js
tmp=$(mktemp -d)
{
  echo '// Gerado por pwa/servidores/gerar-logos.sh — não editar à mão. Logos dos servidores (data: URI) para a tela'
  echo '// de Sessões/Scripts e o painel do ⌥ Tab; "Projeto - Astral Wave ／ CloudShell", pasta awldocs do Drive.'
  echo 'window.csLogos = {'
  for f in *.svg *.png; do
    [[ -e $f ]] || continue
    nome=${f%.*}
    [[ $nome =~ ^[a-z0-9-]+$ ]] || continue
    if [[ $f == *.png ]]; then
      magick "$f" -resize x96 -strip PNG32:"$tmp/$nome.png"
      printf "  '%s': 'data:image/png;base64,%s',\n" "$nome" "$(base64 -w0 "$tmp/$nome.png")"
    else
      printf "  '%s': 'data:image/svg+xml;base64,%s',\n" "$nome" "$(base64 -w0 "$f")"
    fi
  done
  echo '};'
} > "$saida"
rm -rf "$tmp"
ls -l "$saida"
