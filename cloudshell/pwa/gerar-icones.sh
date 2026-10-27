#!/usr/bin/env bash
# Gera os PNGs do PWA a partir de icone.svg (precisa de rsvg-convert e ImageMagick).
# "any" tem cantos arredondados; o maskable sangra até a borda e o sistema recorta.
set -euo pipefail
cd "$(dirname "$0")"
tmp=$(mktemp -d)
rsvg-convert -w 512 -h 512 icone.svg -o "$tmp/cheio.png"
magick "$tmp/cheio.png" \( -size 512x512 xc:none -fill white -draw "roundrectangle 0,0,511,511,112,112" \) \
  -compose DstIn -composite "$tmp/redondo.png"
magick "$tmp/redondo.png" -strip favicon-512.png
magick "$tmp/redondo.png" -strip -resize 192x192 favicon-192.png
magick "$tmp/cheio.png" -strip favicon-512-maskable.png
magick "$tmp/cheio.png" -strip -resize 180x180 apple-touch-icon.png
rm -rf "$tmp"
