#!/bin/bash
# Local capture helper for the stone probe pages. Not committed.
# usage: ./.shoot.sh <output-name> <url-path-and-query> [wait-seconds] [size]
#
# Each run gets a throwaway --user-data-dir. Without it Edge reuses its default
# profile cache and serves a stale Vite html-proxy chunk, so a capture taken
# after a source edit silently shows the *previous* build: byte-identical PNG,
# no error, nothing to notice. Restarting Vite does not help, because the stale
# copy is on the browser side.
NAME="$1"
URLQ="$2"
WAIT="${3:-14}"
SIZE="${4:-1600,900}"
PORT="${PORT:-5211}"
OUT="$(cygpath -w "$PWD")\\${NAME}"
PROFILE="$(mktemp -d)"
rm -f "$NAME"
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
  --headless=new --disable-gpu --use-gl=swiftshader --enable-unsafe-swiftshader \
  --user-data-dir="$PROFILE" --disk-cache-size=1 --disable-application-cache \
  --window-size="$SIZE" --screenshot="$OUT" \
  "http://localhost:${PORT}/${URLQ}" >/dev/null 2>&1 &
EDGE_PID=$!
for i in $(seq 1 "$WAIT"); do
  sleep 1
  if [ -s "$NAME" ]; then break; fi
done
sleep 2
kill $EDGE_PID 2>/dev/null
wait $EDGE_PID 2>/dev/null
rm -rf "$PROFILE" 2>/dev/null
ls -la "$NAME" 2>/dev/null || echo "CAPTURE FAILED: $NAME"
