# Canvas Course Downloader

Browser extension (Chrome, Edge, Firefox) that exports Canvas LMS courses. v3 is WXT + TypeScript + Svelte 5. v2.11.0, the last 2.x release, is in git history (tag `v2.11.0`); v3 still reads what v2 users stored.

## Commands

- `pnpm verify:fast` while iterating and before calling something done: typecheck, lint and the unit tests related to your changes. `pnpm verify` runs everything (all unit tests, the three builds, the manifest guard and the few e2e journeys); CI runs it, so run it yourself only before a release or a change to exports, storage or permissions.
- `pnpm dev` / `pnpm dev:firefox` are dev builds; never ship one (WXT adds permissions in dev).
- `pnpm test:firefox`: Firefox smoke test (Puppeteer + BiDi; on macOS start Firefox with `open -n`).

## Rules

1. Don't change tests, goldens or snapshots just to make something pass. Stop and explain.
2. Permissions are frozen: a new required host or warning-bearing permission makes Chrome disable the extension for every user. New host access goes in `optional_host_permissions`, requested from a click. `manifest.snapshot.json` changes only with jasp's OK.
3. Storage keys, export paths and the incremental inventory are public contracts: changing one needs a migration and a test.
4. Canvas data is untrusted: HTML only through the sanitizer module.
5. Ask before adding a dependency.
6. Firefox: no blob/data URLs from content scripts, stricter filenames, `permissions.request()` must be the first statement in a click handler.
7. Never read `.env*`, publish to a store, or push without being asked.
8. Test data is invented. No real course or student data.
9. No Co-Authored-By lines in commits.
10. An update never opens a tab or interrupts. Only a major version (like 2 to 3) gets a one-time note in the popup, seen when people open it themselves.

## Tests

Less is more. Add a test only when it guards something that can really break: export paths and file names, the incremental inventory, storage keys and migrations, the sanitizer, Canvas API parsing and throttling, permissions, or the logic of a tricky bug. Leave out tests of UI copy, markup, layout, trivial helpers, what types already guarantee, and mock-call mirrors. Extend an existing test or table before adding a new one, and test at one layer. A visual change gets screenshots, not a test. Deleting a low-value test is fine.

## Before a commit

User-visible change: a line under `## X.Y.Z (unreleased)` in `CHANGELOG.md` (it becomes the release notes and the website's changelog). Privacy change: `PRIVACY.md`. Website change: `pnpm run deploy` in `website/`. Releases: `docs/releasing.md`.

## Verification

UI changes: look at them in a real browser (the `browser-verifier` agent, with screenshots), not with new e2e tests. E2E uses Chrome for Testing; branded Chrome ignores `--load-extension`.