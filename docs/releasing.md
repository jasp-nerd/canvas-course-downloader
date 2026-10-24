# Releasing

How a version goes from a tag to the stores, and how the website goes live. CI builds and drafts; only a person publishes. There are three human steps: push the tag, publish the draft release, approve the store submission.

## Turning it on

The workflow files are in `docs/releasing/` because `.github/workflows/` is human-owned (`.claude/hooks/protect-paths.sh`). To use them:

```bash
git mv docs/releasing/release.yml docs/releasing/submit.yml docs/releasing/website.yml .github/workflows/
```

Also add `paths-ignore: [website/**, video/**, media/**, docs/**]` to both triggers in `.github/workflows/ci.yml`, so website-only changes don't run the extension's tests.

| Workflow | Runs on | Does |
| --- | --- | --- |
| `release.yml` | a `v*.*.*` tag (or by hand, as a dry run) | `pnpm verify`; checks the tag matches `package.json`, the commit is on `main` and `CHANGELOG.md` has a dated section; builds the Chrome, Edge, Firefox and sources zips; rebuilds Firefox from the sources zip without git and compares it; attests the zips; drafts a GitHub release with the changelog section as notes |
| `submit.yml` | publishing that draft (or by hand, dry run by default) | after approval on the `store-submit` environment, checks the checksums and attestations, then `wxt submit` to the Chrome Web Store and Firefox Add-ons |
| `website.yml` | changes to `website/`, `PRIVACY.md`, `CHANGELOG.md` or the shared design files on `main` | builds `website/` and deploys it to GitHub Pages |

Every release has the same four files, so these links always point at the newest one:

- `https://github.com/jasp-nerd/canvas-course-downloader/releases/latest/download/canvas-course-downloader-chrome.zip`
- `…-edge.zip`, `…-firefox.zip`, `…-sources.zip`

The website sends people to the stores first: a hand-loaded copy doesn't update itself, and its settings and download history don't carry over to the store version.

## Settings to add in GitHub (once)

- **Pages:** Settings › Pages › Source: GitHub Actions. Until the domain exists, add repository variables `SITE_URL=https://jasp-nerd.github.io` and `BASE_PATH=/canvas-course-downloader/`. With the domain: delete those, add `website/public/CNAME` containing `coursedownloader.com`, and set the domain in Settings › Pages.
- **Releases:** turn on immutable releases. Turn on private vulnerability reporting (Settings › Security).
- **Environment `store-submit`:** required reviewer jasp; deployment branches and tags: `v*` only.

| Kind | Name | Where it comes from |
| --- | --- | --- |
| secret | `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL`, `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY` | a Google Cloud service account added in the Chrome Web Store dashboard (Account). The v1.1 API stopped working on 15 October 2026 |
| variable | `CHROME_EXTENSION_ID` | `mmnmcnffbkcnhcjiidmdnaclpfeekiol` |
| variable | `CHROME_PUBLISHER_ID` | the Chrome Web Store dashboard |
| variable | `CHROME_PUBLISH_TYPE` (optional) | `STAGED_PUBLISH`: after Google approves, you press Publish |
| secret | `FIREFOX_JWT_ISSUER`, `FIREFOX_JWT_SECRET` | addons.mozilla.org › Manage API keys |
| variable | `FIREFOX_EXTENSION_ID` | `canvas-course-downloader@jasp-nerd` |

Edge comes later: after the first Edge listing is made by hand, add `EDGE_CLIENT_ID`, `EDGE_API_KEY` (rotate every 72 days) and `EDGE_PRODUCT_ID`, and the `--edge-zip` line in `submit.yml`.

Before the first real submission, run `submit.yml` by hand with `dry_run` on.

## What stays manual

- The first Firefox and Edge listings: neither API can create one.
- Store text, screenshots, the video link, privacy forms, the Chrome Web Store's Official URL, and AMO's notes to reviewers (point them at `SOURCE_CODE_REVIEW.md`).
- The version bump, the changelog, the tag, publishing the draft, approving the submission.

## A release, step by step

1. Bump `version` in `package.json`. In `CHANGELOG.md`, rename `## X.Y.Z (unreleased)` to `## X.Y.Z (YYYY-MM-DD)`. Run `pnpm verify` and `pnpm test:firefox`.
2. Merge to `main`, then `git tag vX.Y.Z && git push origin vX.Y.Z`.
3. Read the draft release and its files on GitHub, then publish it.
4. Approve `store-submit`. Once Chrome approves the update, press Publish there if staged publishing is on.
