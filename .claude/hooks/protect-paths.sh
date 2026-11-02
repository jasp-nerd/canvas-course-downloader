#!/usr/bin/env bash
# PreToolUse on Edit/Write: block edits to human-owned files and secrets.
# Agents game tests by editing them; read-only oracles stop that. An "ask" decision is
# auto-approved in auto mode, so this blocks outright. To change these files on purpose,
# start the session with CCD_ALLOW_PROTECTED=1.
set -euo pipefail
file=$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')
[ -z "$file" ] && exit 0
rel=${file#"$CLAUDE_PROJECT_DIR"/}

case "$rel" in
  .env|.env.*|*/.env|*/.env.*)
    echo "Blocked: $rel may hold store credentials. Don't read or write it." >&2
    exit 2 ;;
  legacy/v2/*|tests/golden/*|tests/fixtures/*|*__snapshots__/*|*-snapshots/*|*.snap|manifest.snapshot.json|pnpm-lock.yaml|.claude/hooks/*|.claude/settings.json|.github/workflows/*)
    [ "${CCD_ALLOW_PROTECTED:-}" = "1" ] && exit 0
    echo "Blocked: $rel is human-owned (reference implementation, golden output, fixture, snapshot, lockfile, hook or CI). Don't work around this. If it really must change, stop and tell jasp why; he can rerun with CCD_ALLOW_PROTECTED=1." >&2
    exit 2 ;;
esac
exit 0
