# Privacy Policy — Canvas Course Downloader

**Last updated:** May 11, 2026

## Overview

Canvas Course Downloader is a free, open-source browser extension. This policy explains what data the extension accesses and how it's handled.

## Data Collection

**Canvas Course Downloader does not collect, store, transmit, or share any user data.** The extension does not use analytics, tracking, cookies, or any form of telemetry.

## How the Extension Works

- The extension runs entirely in your browser.
- When you choose to download course content, it communicates **only** with the Canvas LMS server you are currently logged into, using your existing browser session.
- Downloaded files are saved directly to your computer via your browser's built-in download manager.
- No data is ever sent to the extension developer, any third-party server, or any external service.

## Permissions

The extension requests the following browser permissions:

| Permission | Why it's needed |
|---|---|
| `activeTab` | To communicate with the content script on the current tab |
| `alarms` | To fire scheduled download runs on a recurring interval |
| `downloads` | To save course files to your computer |
| `notifications` | To notify you when a download batch finishes |
| `storage` | To save your settings, track which files have been downloaded in incremental mode, and store your schedule configuration |
| `tabs` | To locate an open Canvas tab when a scheduled alarm fires, so the download can be delivered to the right page |
| Host permissions (`https://*/*`) | Canvas LMS can be hosted on any domain, so the extension needs to detect Canvas on any HTTPS page |

## Scheduled Downloads

When you configure a schedule, the extension stores the following locally in your browser:

- Your schedule configuration (enabled state, interval, selected course IDs and names) — synced across your Chrome profile via `chrome.storage.sync`
- The Canvas domain you are logged into (e.g. `https://canvas.instructure.com`) — stored in `chrome.storage.local` so the background service worker can find an open Canvas tab when an alarm fires
- The timestamp and result of the last scheduled run — stored in `chrome.storage.local` and displayed in the Settings page

None of this data leaves your browser or is sent to any server other than the Canvas instance you are logged into.

## Third-Party Services

The extension does not integrate with or send data to any third-party services.

## Open Source

The full source code is publicly available at [github.com/jasp-nerd/canvas-course-downloader](https://github.com/jasp-nerd/canvas-course-downloader). You can audit exactly what the extension does.

## Contact

If you have questions about this privacy policy, please open an issue on [GitHub](https://github.com/jasp-nerd/canvas-course-downloader/issues).
