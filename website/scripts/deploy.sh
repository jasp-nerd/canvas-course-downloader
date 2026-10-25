#!/bin/sh
# Builds the site for coursedownloader.com and copies it to the Hetzner server, where Coolify's
# nginx (project "coursedownloader", service "site") serves /data/coursedownloader/site.
# Needs the `hetzner` SSH host.
set -eu
cd "$(dirname "$0")/.."
SITE_URL=https://coursedownloader.com BASE_PATH=/ pnpm build
rsync -az --delete dist/ hetzner:/data/coursedownloader/site/
echo "Deployed to https://coursedownloader.com"
