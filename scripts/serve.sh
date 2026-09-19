#!/usr/bin/env bash
# Servidor local para desarrollo (los modulos ES no funcionan con file://).
set -e
PORT="${1:-8080}"
cd "$(dirname "$0")/.."
echo "Text Reader -> http://localhost:$PORT/"
python3 -m http.server "$PORT"
