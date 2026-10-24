# Privacy policy

**Last updated:** October 2026 (version 3.0)

## Overview

Canvas Course Downloader is a free, open-source browser extension. This policy explains what data the extension accesses and how it's handled.

## Data collection

**Canvas Course Downloader does not collect, transmit, or share any user data.** It has no analytics, tracking, or telemetry, and no server of its own. Nothing about you or your courses is ever sent to the developer.

## How the extension works

- The extension runs entirely in your browser.
- It talks **only** to the Canvas site you are logged into (and Canvas's own file server for the files themselves), using your existing browser session. It never asks for your password or an access token.
- Exports run in a browser tab the extension opens, and are saved to your Downloads folder or to a folder you choose.
- If you have downloaded a course before, opening Canvas makes the extension ask that same Canvas site, at most every few hours, whether the course has new files, announcements or changed pages, so it can show what's new on your dashboard. This request goes only to Canvas.
- To show how many stars the project has on GitHub, the extension asks GitHub's public API for that one number, at most once a day, without cookies. Nothing about you or your courses is sent; GitHub sees only that someone asked, like any visit to a web page.
- If you teach a course and turn on "Also save Canvas's course package" (off by default), the extension asks your Canvas to build the course's own export file (.imscc) and downloads it. This is the only time it asks Canvas to create anything. Canvas lists that export under the course's Settings › Export Course Content, where your co-teachers can see it, and keeps it for 30 days. The security token Canvas puts in the page is used for that one request, kept only in memory, and never stored or sent anywhere else.
- "Download new files automatically" is off unless you turn it on in the settings.

## What is stored on your computer

Everything below stays in your browser, in storage that only this extension can read. Uninstalling the extension removes it.

| What | Why |
|---|---|
| Your settings | So your choices are remembered. Browsers that sync extension settings (such as Chrome with sync on) copy them between your own devices |
| A list of files you downloaded per course (Canvas file id, name, size, date) | To download only what's new next time, and to show "new files" |
| When Canvas was last checked for new files | So it's checked at most every few hours |
| Whether you've seen or dismissed the review card, or the question at your first download | So they're not shown again |
| The folder you chose to save into, if you chose one | So exports can go there. The extension can only write inside that folder, and only after your browser has asked for your OK |

## Links

After some successful downloads, the extension may show a small card asking how it went. The settings page has a few links too. These links (store review page, GitHub, GitHub Sponsors, Ko-fi, a feedback form on Google Forms) open only when you click them. Some include a fixed tag such as `utm_source=extension`, which is the same for everyone and tells me which link was used, not who used it. The feedback form is optional and hosted by Google; it is filled in with the extension's version and your browser's name, which you can see and change before sending.

## Permissions

| Permission | Why it's needed |
|---|---|
| `activeTab` | To talk to the Canvas tab you're on when you use the toolbar button or keyboard shortcut |
| `downloads` | To save course files to your computer |
| `notifications` | To tell you when an automatic download of new files has finished |
| `storage` | To keep the settings and lists described above |
| Content script (`https://*/*`) | Canvas can run on any domain (`canvas.university.edu`), so the script loads on HTTPS pages to recognize Canvas. On other sites it stops immediately and does nothing |
| Host permission (`*://*.instructure.com/*`) | Access to Canvas sites hosted by Instructure, for exports |
| `declarativeNetRequest` | Adds one header to responses from Canvas's file server (`canvas-user-content.com`) so files from there can be put into a ZIP |
| Optional: `*://*.canvas-user-content.com/*` | Only asked for when you click "Allow access" in the settings, for schools that serve submitted files from that server |

## Third-party services

The extension does not send data to any third-party service. The links described above open third-party websites only when you click them.

## Open source

The full source code is publicly available at [github.com/jasp-nerd/canvas-course-downloader](https://github.com/jasp-nerd/canvas-course-downloader). You can check exactly what the extension does.

## Contact

If you have questions about this privacy policy, please open an issue on [GitHub](https://github.com/jasp-nerd/canvas-course-downloader/issues).
