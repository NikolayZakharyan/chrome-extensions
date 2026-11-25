#!/usr/bin/env bash
# Builds the ZIP to upload to the Chrome Web Store: dist/armenian-translit-<version>.zip
# Only runtime files go in (manifest, src, icons) — no tests, store assets or scripts.
set -euo pipefail

cd "$(dirname "$0")/.."

version=$(node -p 'require("./manifest.json").version')
out="dist/armenian-translit-${version}.zip"

npm test --silent

mkdir -p dist
rm -f "$out"
zip -qr "$out" manifest.json src icons -x '*.DS_Store'

echo "Built $out"
unzip -l "$out" | tail -n +4 | head -n -2 | awk '{print "  " $4}'
