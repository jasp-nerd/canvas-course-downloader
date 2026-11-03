# Releasing

How a version goes from a tag to the stores, and how the website goes live. CI builds and drafts; only a person publishes. There are three human steps: push the tag, publish the draft release, approve the store submission.

## The workflows

| Workflow | Runs on | Does |
| --- | --- | --- |
| `release.yml` | a `v*.*.*` tag (or by hand, as a dry run) | `pnpm verify`; checks the tag matches `package.json`, the commit is on `main` and `CHANGELOG.md` has a dated section; builds the Chrome, Edge, Firefox and sources zips; rebuilds Firefox from the sources zip without git and compares it; attests the zips; drafts a GitHub release with the changelog section as notes |
| `submit.yml` | publishing that draft (or by hand, dry run by default) | after approval on the `store-submit` environment, checks the checksums and attestations, then `wxt submit` to the Chrome Web Store, Firefox Add-ons and Edge Add-ons |

Every release has the same four files, so these links always point at the newest one:

- `https://github.com/jasp-nerd/canvas-course-downloader/releases/latest/download/canvas-course-downloader-chrome.zip`
- `…-edge.zip`, `…-firefox.zip`, `…-sources.zip`

The website sends people to the stores first: a hand-loaded copy doesn't update itself, and its settings and download history don't carry over to the store version.

## Settings to add in GitHub (once)

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
| secret | `EDGE_CLIENT_ID`, `EDGE_API_KEY` | Partner Center › Microsoft Edge › Publish API. The key expires (the current one on 13 January 2027): make a new one there and run `scripts/github-store-setup.sh` again |
| variable | `EDGE_PRODUCT_ID` | the same Publish API page |

`scripts/github-store-setup.sh` sets all of these from `~/.config/canvas-downloader/` without printing them.

Before the first real submission, run `submit.yml` by hand with `dry_run` on.

## What stays manual

- The first Edge listing: Microsoft's API can't create one. Firefox's can: the first listed upload creates the add-on (`web-ext sign --channel listed --amo-metadata …`, see docs/store/), after which `wxt submit` updates it. `wxt submit` alone fails until the add-on exists, because it looks the add-on up first.
- Store text, screenshots, the video link, privacy forms, the Chrome Web Store's Official URL, and AMO's notes to reviewers (point them at `SOURCE_CODE_REVIEW.md`).
- The version bump, the changelog, the tag, publishing the draft, approving the submission.

## A release, step by step

1. Bump `version` in `package.json`. In `CHANGELOG.md`, rename `## X.Y.Z (unreleased)` to `## X.Y.Z (YYYY-MM-DD)`. Run `pnpm verify` and `pnpm test:firefox`.
2. Merge to `main`, then `git tag vX.Y.Z && git push origin vX.Y.Z`.
3. Read the draft release and its files on GitHub, then publish it.
4. Approve `store-submit`. Firefox and Edge publish once their review passes. Once Chrome approves the update, press Publish there if staged publishing is on.

## The website

coursedownloader.com runs on the Hetzner server, in Coolify's project `coursedownloader`: the service `site` (nginx serving `/data/coursedownloader/site`) and `umami` (visit counts at stats.coursedownloader.com, no cookies, only for us). DNS is at Porkbun: the apex, `www` and `stats` point at the server; `www` redirects to the apex.

To publish a change, from `website/`: `pnpm run deploy` (builds, then rsyncs over the `hetzner` SSH host). It also picks up changes to `PRIVACY.md`, `CHANGELOG.md` and the shared design files, so run it after a release too.

On the day 3.0 is in the stores, set `LAUNCHED = true` in `website/src/data/site.ts` and deploy: until then every page asks search engines not to index it. Then verify the domain in Google Search Console, set it as the Chrome Web Store listing's website and privacy link (and on Firefox Add-ons), and as the GitHub repo's website: `gh repo edit --homepage https://coursedownloader.com`.
