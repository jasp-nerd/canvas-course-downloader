# Canvas Course Downloader

Browser extension (Chrome, Edge, Firefox) that exports Canvas LMS courses. v3 is WXT + TypeScript + Svelte 5. `legacy/v2/` is the v2.11.0 release, the read-only reference.

## Commands

- `pnpm verify:fast` while iterating; `pnpm verify` (adds the three builds, the manifest guard and e2e) means done.
- `pnpm dev` / `pnpm dev:firefox` are dev builds; never ship one (WXT adds permissions in dev).
- `pnpm test:firefox`: Firefox smoke test (Puppeteer + BiDi; on macOS start Firefox with `open -n`).

## Rules

1. Don't change tests, goldens, snapshots or `legacy/v2/` just to make something pass. Stop and explain.
2. v3 output must match the v2 goldens. Intended differences go in `docs/v3/parity-diffs.md` with a reason, for jasp to approve.
3. Permissions are frozen: a new required host or warning-bearing permission makes Chrome disable the extension for every user. New host access goes in `optional_host_permissions`, requested from a click. `manifest.snapshot.json` changes only with jasp's OK.
4. Storage keys, export paths and the incremental inventory are public contracts: changing one needs a migration and a test.
5. A bug fix comes with a test that fails without it.
6. Canvas data is untrusted: HTML only through the sanitizer module.
7. Ask before adding a dependency.
8. Firefox: no blob/data URLs from content scripts, stricter filenames, `permissions.request()` must be the first statement in a click handler.
9. Never read `.env*`, publish to a store, or push without being asked.
10. Test data is invented. No real course or student data.
11. No Co-Authored-By lines in commits.

## Before a commit

User-visible change: a line under `## X.Y.Z (unreleased)` in `CHANGELOG.md` (it becomes the release notes and the website's changelog). Privacy change: `PRIVACY.md`. Website change: `pnpm run deploy` in `website/`. Releases: `docs/releasing.md`.

## Verification

UI changes: check in a real browser (the `browser-verifier` agent or e2e). E2E uses Chrome for Testing; branded Chrome ignores `--load-extension`.
