#!/usr/bin/env bash
# PreToolUse on Edit/Write: human-owned files need jasp's approval, secrets are off limits.
# Agents game tests by editing them; read-only oracles stop that (see docs/v3 research).
set -euo pipefail
file=$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')
[ -z "$file" ] && exit 0
rel=${file#"$CLAUDE_PROJECT_DIR"/}

case "$rel" in
  .env|.env.*|*/.env|*/.env.*)
    echo "Blocked: $rel may hold store credentials. Don't read or write it." >&2
    exit 2 ;;
  legacy/v2/*|tests/golden/*|tests/fixtures/*|*__snapshots__/*|*-snapshots/*|*.snap|manifest.snapshot.json|pnpm-lock.yaml|.claude/hooks/*|.claude/settings.json|.github/workflows/*)
    reason="$rel is human-owned (reference implementation, golden output, fixture, snapshot, lockfile, hook or CI). Approve only if this change is intended; tests must not be weakened to pass."
    jq -n --arg r "$reason" '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: $r}}'
    exit 0 ;;
esac
exit 0
