#!/usr/bin/env bash
# Stop: if source or tests changed, typecheck and unit tests must pass before the turn ends.
set -uo pipefail
cd "$CLAUDE_PROJECT_DIR" || exit 0
if [ -z "$(git status --porcelain -- src tests e2e scripts 2>/dev/null)" ]; then
  exit 0
fi
if ! out=$( { pnpm -s typecheck && pnpm -s test; } 2>&1 ); then
  printf 'Typecheck or unit tests fail. Fix the code, not the tests. If you cannot, stop and report the failing output and say the work is NOT done.\n%s\n' "$(echo "$out" | tail -60)" >&2
  exit 2
fi
exit 0
