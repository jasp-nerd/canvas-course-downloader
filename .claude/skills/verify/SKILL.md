---
name: verify
description: Run before saying a change works, before committing, and at the end of every slice. Defines the claims-first verification contract for Canvas Course Downloader: typecheck, lint, unit, parity, builds, manifest guard, e2e on the mock Canvas, and browser checks for UI. Use for any change under src/, e2e/, tests/, scripts/ or wxt.config.ts.
---

# Verify

## 1. Write the claims first

Before running anything, list what this change is supposed to do as numbered, testable sentences, e.g.:

1. "A course whose files endpoint returns 500 for one file ends as Partial with that file listed under Retry."
2. "The Firefox build keeps `optional_host_permissions`."

Add the areas the change touches but no claim covers. Those get NOT COVERED in the report.

## 2. Run the gate

```sh
pnpm verify
```

That runs typecheck, lint, unit tests, all three builds and the manifest guard. Once they exist, it also runs parity and e2e.

- On failure, read only the failing test's output (and `test-results/**/error-context.md` for e2e). Fix the code, then re-run.
- A test that fails, then passes on a retry, is flaky. It is not a pass: report it.
- If a failure looks unrelated, re-run that test on `main`/`HEAD~` with `git stash` to tell old failures from new ones.
- Stop after 3 repair rounds and report what's still failing.

## 3. Check UI in a real browser

For any change to UI or the download flow, delegate to the `browser-verifier` subagent. Give it the exact states to check (e.g. "modal on the dashboard with 2 terms; completion card after a partial run"). For each claim, try one extra probe as well: click twice, reload, a second course, dark mode, a narrow window.

## 4. Never

- Edit, skip or loosen a test, snapshot, fixture, golden file or `legacy/v2/` to get a pass.
- Run `--update-snapshots` or `check-manifest.mjs --update` without jasp's explicit OK.
- Count evidence from an earlier run.

## 5. Report

```
Claims
1. <claim>: PASS | FAIL | BLOCKED, with evidence: <command + key output line, or screenshot path>
...
NOT COVERED: <areas touched without a claim>
Commands run: <list with pass/fail counts>
Firefox: covered by <test> | not covered (say why)
```

Say the work is done only if every claim is PASS.
