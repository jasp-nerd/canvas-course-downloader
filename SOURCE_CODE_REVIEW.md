# Source code review

Notes for add-on store reviewers on how to build Canvas Course Downloader from this source package and get the same files as the uploaded extension.

## Requirements

- Node.js 22 or later (built with 24)
- pnpm 11.13.0. The exact version is pinned in `package.json` (`packageManager`); `corepack enable` installs it.
- macOS, Linux or Windows. No other tools are needed.

## Build

```bash
pnpm install --frozen-lockfile
pnpm build:firefox     # Firefox: output in .output/firefox-mv3/
pnpm build             # Chrome and Edge: output in .output/chrome-mv3/
```

`pnpm install --frozen-lockfile` installs exactly the versions in `pnpm-lock.yaml`. `pnpm-workspace.yaml` lets only esbuild run an install script.

The build uses [WXT](https://wxt.dev) (Vite and Rolldown) to bundle TypeScript and Svelte from `src/` into plain JavaScript. Files in `public/` (icons, the network rule in `rules.json`, the fonts and the mascot images) are copied unchanged.

## What is generated

Everything in the output folder comes from this package:

| Output | Source |
|---|---|
| `background.js` | `src/entrypoints/background.ts` |
| `content-scripts/canvas.js` | `src/entrypoints/canvas.content/` |
| `popup.html`, `options.html`, `export.html`, `welcome.html` and `chunks/`, `assets/` | `src/entrypoints/popup/`, `options/`, `export/`, `welcome/` |
| `manifest.json` | `wxt.config.ts` |
| `icons/`, `rules.json`, `fonts/`, `pip/` | `public/` |

The bundles are minified. The third-party code in them comes from npm packages listed in `package.json`, at the versions in `pnpm-lock.yaml`: Svelte, client-zip, DOMPurify, turndown, @joplin/turndown-plugin-gfm and @webext-core/messaging (exactly the `dependencies` in `package.json`). Nothing is downloaded or evaluated at runtime, and the extension doesn't use `eval` or remote code.

## What the extension does

It reads a Canvas LMS course through the Canvas API of the site the user is logged into, with the user's own session, and saves it to their computer. It sends no data anywhere else. Besides Canvas, it makes one request to a third party: the project's public star count from `api.github.com`, at most once a day and without cookies (`src/app/github.ts`). Its only write request is optional and off by default: a teacher who turns on "Also save Canvas's course package" makes the extension ask Canvas to build the course's own export (`POST /api/v1/courses/:id/content_exports`, `src/app/course-package.ts`), with the CSRF token the Canvas page itself provides. See `PRIVACY.md` in the repository (https://github.com/jasp-nerd/canvas-course-downloader) for details.
