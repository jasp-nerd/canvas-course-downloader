# Contributing to Canvas Course Downloader

Thanks for your interest in contributing! Here's how to get started.

## Getting started

You need [Node.js](https://nodejs.org/) 22 or later and [pnpm](https://pnpm.io/).

```bash
git clone https://github.com/<you>/canvas-course-downloader.git
cd canvas-course-downloader
pnpm install
pnpm dev              # opens Chrome with the extension loaded, rebuilt on save
pnpm dev:firefox
```

Don't share or install a `pnpm dev` build: in development WXT adds permissions that a release must not have.

## Checking your change

```bash
pnpm verify:fast      # type checks, lint, the unit tests related to your changes
pnpm verify           # everything: also the builds, the permission check and the browser tests
```

CI runs `pnpm verify` on every push. The few browser tests run Chrome for Testing against a mock Canvas in `e2e/mock-canvas/`, so you don't need a Canvas account for them. Run `pnpm exec playwright install chromium` once first.

## How the code is organized

- `src/entrypoints/`: the background script, the Canvas content script (buttons, course picker), the popup, the settings page, the export tab and the welcome page
- `src/canvas/`: the Canvas API client (pagination, retries, rate limits), page detection, course lists
- `src/engine/`: works out what to export, one module per part of a course, into a plan of files
- `src/export/`: turns the plan into HTML, Markdown, file names, the overview page, study packs and agent files
- `src/sinks/`: where files go: a ZIP, the Downloads folder, or a folder the user chose

## Rules worth knowing

- **Output must match v2.** The tests compare v3's exports with exports v2 made of the mock Canvas. Every intended difference is listed in `docs/v3/parity-diffs.md` with a reason.
- **Permissions don't change.** A new required permission makes Chrome disable the extension for every existing user until they accept it. `pnpm check:manifest` fails if the manifest asks for more. New access to a site goes in `optional_host_permissions` and is requested from a click.
- **Few tests, where they matter.** Test what can really break (export paths, the list of saved files, storage, the sanitizer, permissions), not wording or layout. Check visual changes with screenshots. Don't loosen existing tests, fixtures or golden files to make something pass.
- **Canvas content is untrusted.** Insert it as text; HTML only through the sanitizer in `src/export/sanitize.ts`.
- **No real data.** Test data is invented. Never commit real course content, names or Canvas addresses of real people.
- **Settings and export paths are contracts.** Users have them stored and saved; changing one needs a migration and a test.

## Pull requests

- Keep each PR to one change, ideally under about 400 lines
- Describe what you changed and how you checked it (commands, screenshots for UI)
- Update the README if you add a feature

## Reporting issues

When reporting a bug, please include:
- Your browser and version, and the extension version
- Whether your Canvas is on `instructure.com` or your school's own domain
- Steps to reproduce the problem
- The overview page's "Not saved" list or `_download_errors.csv`, if files are missing
