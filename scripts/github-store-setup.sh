#!/bin/sh
# One-time GitHub setup for submit.yml: the store keys as secrets and the store-submit environment,
# which makes every store upload wait for jasp's approval and only runs for v* tags.
# Reads the keys from ~/.config/canvas-downloader/ and prints none of them.
set -eu
DIR="$HOME/.config/canvas-downloader"
REPO=jasp-nerd/canvas-course-downloader
val() { grep -E "^$1=" "$2" | head -1 | cut -d= -f2-; }

# The approval gate first, so no secret is ever usable without it.
ME=$(gh api user --jq .id)
printf '{"reviewers":[{"type":"User","id":%s}],"deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true}}' "$ME" |
  gh api -X PUT "repos/$REPO/environments/store-submit" --input - >/dev/null
gh api -X POST "repos/$REPO/environments/store-submit/deployment-branch-policies" -f name='v*' -f type=tag >/dev/null 2>&1 || true

node -p 'require(process.argv[1]).client_email' "$DIR/cws-key.json" | gh secret set CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL -R "$REPO"
node -p 'require(process.argv[1]).private_key' "$DIR/cws-key.json" | gh secret set CHROME_SERVICE_ACCOUNT_PRIVATE_KEY -R "$REPO"
val FIREFOX_JWT_ISSUER "$DIR/amo.env" | gh secret set FIREFOX_JWT_ISSUER -R "$REPO"
val FIREFOX_JWT_SECRET "$DIR/amo.env" | gh secret set FIREFOX_JWT_SECRET -R "$REPO"
gh variable set CHROME_EXTENSION_ID -R "$REPO" --body mmnmcnffbkcnhcjiidmdnaclpfeekiol
gh variable set CHROME_PUBLISHER_ID -R "$REPO" --body "$(val CHROME_PUBLISHER_ID "$DIR/cws.env")"
gh variable set FIREFOX_EXTENSION_ID -R "$REPO" --body canvas-course-downloader@jasp-nerd
gh variable set CHROME_PUBLISH_TYPE -R "$REPO" --body STAGED_PUBLISH
echo "Done: store-submit needs your approval and only runs for v* tags. Secrets:"
gh secret list -R "$REPO" | cut -f1
