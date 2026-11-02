#!/bin/sh
# Builds the site for coursedownloader.com and copies it to the Hetzner server, where Coolify's
# nginx (project "coursedownloader", service "site") serves /data/coursedownloader/site.
# Needs the `hetzner` SSH host.
set -eu
cd "$(dirname "$0")/.."
SITE_URL=https://coursedownloader.com BASE_PATH=/ pnpm build
# stats/data/ is written on the server every hour (scripts/stats-server.sh), so the deploy leaves it.
rsync -az --delete --exclude /stats/data/ dist/ hetzner:/data/coursedownloader/site/
echo "Deployed to https://coursedownloader.com"
