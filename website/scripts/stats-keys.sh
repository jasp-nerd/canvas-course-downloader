#!/bin/sh
# Gives the stats collector on the server the store keys from ~/.config/canvas-downloader/, so
# coursedownloader.com/stats shows real numbers. Nothing is printed. Run again after a key changes.
# Optional: UMAMI_SHARE_ID=… sh website/scripts/stats-keys.sh   (the id at the end of an Umami share link)
set -eu
DIR="$HOME/.config/canvas-downloader"
KEY="$DIR/cws-key.json"
ENV_FILE=/data/coursedownloader/stats/env
[ -f "$KEY" ] && [ -f "$DIR/cws.env" ] && [ -f "$DIR/edge.env" ] && [ -f "$DIR/amo.env" ] || { echo "Missing key files in $DIR"; exit 1; }

# Keep the Umami share id already on the server when none is given.
[ -n "${UMAMI_SHARE_ID:-}" ] || UMAMI_SHARE_ID=$(ssh hetzner "grep -E '^UMAMI_SHARE_ID=' $ENV_FILE | cut -d= -f2-" 2>/dev/null || true)

# docker --env-file takes each line literally: no quotes, the key's newlines written as \n.
umask 077
{
  node -e '
    const k = require(process.argv[1]);
    console.log("CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL=" + k.client_email);
    console.log("CHROME_SERVICE_ACCOUNT_PRIVATE_KEY=" + k.private_key.replace(/\n/g, "\\n"));
  ' "$KEY"
  grep -E '^CHROME_(PUBLISHER|EXTENSION)_ID=' "$DIR/cws.env"
  grep -E '^EDGE_CRX_ID=' "$DIR/edge.env"
  grep -E '^FIREFOX_JWT_(ISSUER|SECRET)=' "$DIR/amo.env"
  [ -n "${UMAMI_SHARE_ID:-}" ] && echo "UMAMI_SHARE_ID=$UMAMI_SHARE_ID"
  true
} | ssh hetzner "umask 077 && cat > $ENV_FILE && chmod 600 $ENV_FILE"

# The newest collector too, so a fix to it doesn't need stats-server.sh again.
scp -q "$(dirname "$0")/../../scripts/collect-stats.mjs" hetzner:/data/coursedownloader/stats/collect-stats.mjs

# Collect once now, so the page has the numbers straight away.
ssh hetzner "docker run --rm --memory 128m --env-file $ENV_FILE -v /data/coursedownloader/stats:/app:ro -v /data/coursedownloader/site/stats/data:/out node:24-alpine node /app/collect-stats.mjs /out" | tail -5
echo "Done. Open https://coursedownloader.com/stats/"
