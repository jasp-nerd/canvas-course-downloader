#!/bin/sh
# Sets up the private dashboard at coursedownloader.com/stats on the Hetzner server. Safe to run
# again; it never touches what Coolify manages.
#
# - The page itself is part of the site (src/pages/stats/), deployed with `pnpm run deploy`.
# - A Traefik route (its own file in the proxy's dynamic folder, which Coolify leaves alone)
#   puts a password on everything under /stats. It starts locked: run stats-password.sh to set yours.
# - Every hour, cron runs scripts/collect-stats.mjs in a throwaway Node container. It writes
#   /data/coursedownloader/site/stats/data/, which the deploy leaves alone.
# - Store keys go in /data/coursedownloader/stats/env (root only), never in the repo:
#     CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL=…  CHROME_SERVICE_ACCOUNT_PRIVATE_KEY="…"  CHROME_PUBLISHER_ID=…
#     UMAMI_SHARE_ID=…   EDGE_CRX_ID=…
set -eu
cd "$(dirname "$0")/../.."

HOST=hetzner
STATS=/data/coursedownloader/stats
DATA=/data/coursedownloader/site/stats/data
ROUTE=/data/coolify/proxy/dynamic/coursedownloader-stats.yaml
SITE=site-xc2brq64dg1mtp8axg6sqh9b

# A password nobody knows, until stats-password.sh sets a real one.
LOCKED="locked:$(openssl passwd -apr1 "$(openssl rand -hex 24)")"

ssh "$HOST" "mkdir -p $STATS $DATA && chmod 700 $STATS && touch $STATS/env && chmod 600 $STATS/env"
scp -q scripts/collect-stats.mjs "$HOST:$STATS/collect-stats.mjs"

# Keep a password already set; otherwise start locked.
USERS=$(ssh "$HOST" "grep -o \"^ *- '[^']*'\" $ROUTE 2>/dev/null | head -1 | sed \"s/^ *- '//; s/'\$//\"" || true)
[ -n "$USERS" ] || USERS="$LOCKED"

ssh "$HOST" "cat > $ROUTE" <<EOF
# coursedownloader.com/stats: jasp's dashboard, behind a password. Set by website/scripts/stats-server.sh.
http:
  routers:
    coursedownloader-stats:
      rule: Host(\`coursedownloader.com\`) && PathPrefix(\`/stats\`)
      entryPoints: [https]
      priority: 1000
      middlewares: [coursedownloader-stats-auth]
      service: coursedownloader-stats
      tls:
        certResolver: letsencrypt
  middlewares:
    coursedownloader-stats-auth:
      basicAuth:
        realm: Course Downloader stats
        users:
          - '$USERS'
  services:
    coursedownloader-stats:
      loadBalancer:
        servers:
          - url: http://$SITE:80
EOF

ssh "$HOST" "cat > /etc/cron.d/coursedownloader-stats" <<EOF
# Refreshes coursedownloader.com/stats every hour (website/scripts/stats-server.sh).
17 * * * * root docker run --rm --memory 128m --env-file $STATS/env -v $STATS:/app:ro -v $DATA:/out node:24-alpine node /app/collect-stats.mjs /out >> /var/log/coursedownloader-stats.log 2>&1
EOF

# A first run now, so the page has numbers.
ssh "$HOST" "docker run --rm --memory 128m --env-file $STATS/env -v $STATS:/app:ro -v $DATA:/out node:24-alpine node /app/collect-stats.mjs /out"
echo "Stats set up. The page is locked until you run website/scripts/stats-password.sh."
