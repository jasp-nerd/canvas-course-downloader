#!/usr/bin/env bash
# PostToolUse on Edit/Write: format and lint the edited file, feed errors back to Claude.
set -uo pipefail
file=$(jq -r '.tool_input.file_path // empty')
case "$file" in *.ts|*.js|*.mjs|*.svelte) ;; *) exit 0 ;; esac
rel=${file#"$CLAUDE_PROJECT_DIR"/}
case "$rel" in legacy/*|marketing/*|.claude/*|node_modules/*|.output/*|.wxt/*) exit 0 ;; esac
cd "$CLAUDE_PROJECT_DIR" || exit 0
pnpm exec prettier --write "$file" >/dev/null 2>&1
if ! out=$(pnpm exec eslint --fix --max-warnings 0 "$file" 2>&1); then
  printf 'ESLint errors in %s. Fix the code; do not add eslint-disable:\n%s\n' "$rel" "$(echo "$out" | tail -40)" >&2
  exit 2
fi
exit 0
