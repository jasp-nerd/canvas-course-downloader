#!/bin/sh
# Sets the password for coursedownloader.com/stats. It asks for it here, on your Mac, and only a
# bcrypt hash of it goes to the server. Run it again to change it.
set -eu
ROUTE=/data/coolify/proxy/dynamic/coursedownloader-stats.yaml
printf 'User name for the stats page [jasp]: '
read -r NAME
NAME=${NAME:-jasp}
LINE=$(htpasswd -nB "$NAME")
# Replace the users line; Traefik picks the change up by itself.
printf '%s\n' "$LINE" | ssh hetzner "IFS= read -r L && sed -i \"s|^\\( *\\)- '.*'|\\1- '\$L'|\" $ROUTE && grep -c \"'\$L'\" $ROUTE >/dev/null"
echo "Done. Open https://coursedownloader.com/stats/ and sign in as $NAME."
