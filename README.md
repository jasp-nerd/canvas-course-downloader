# Canvas Course Downloader

A browser extension that bulk-downloads your Canvas LMS courses into organized folders.

<p align="center">
  <img src="screenshots/hero-banner.png" alt="Canvas Course Downloader — download your Canvas courses with one click">
</p>

<p align="center">
  Works on Chrome, Edge, Firefox, Brave, and other Chromium-based browsers.
</p>

<p align="center">
  If this saved you time, a ⭐ helps others find it.
</p>

## Why?

Canvas courses can disappear after a semester ends. Downloading files one at a time is tedious when you have hundreds across multiple courses, and existing tools all need API tokens or Python scripts. This extension uses your existing session cookies, so there's nothing to configure.

## Features

- Download everything from a single course, or select multiple courses from your dashboard
- Pick between active and past courses, grouped by term, with search filtering
- Bundle each course into a single `.zip` file instead of loose folders
- Incremental mode skips files you've already downloaded on previous runs
- Export your grades as a CSV with assignment names, due dates, points, scores, and letter grades
- Finds files embedded in assignments, pages, announcements, and discussions that don't appear in the file browser
- Saves into organized subfolders per course with your original Canvas folder structure preserved
- Four built-in presets (Full Archive, Files Only, Text Only, Linked Only) plus custom configuration
- Configurable download throttling, file conflict handling, and folder prefix
- Keyboard shortcut: <kbd>Ctrl+Shift+D</kbd> (Mac: <kbd>Cmd+Shift+D</kbd>)
- Works with any Canvas instance, including self-hosted installations on custom domains
- No API tokens needed. Runs entirely in your browser with nothing sent to external servers

## Screenshots

### Course selector

Pick which courses to download from your Canvas dashboard:

![Course selector overlay showing courses grouped by term](screenshots/course-selector.png)

### Download progress

![Download in progress with file count and progress panel](screenshots/download-progress-detail.png)

### Settings

![Settings page with presets and configuration options](screenshots/settings-horizontal.png)

## Installation

### Chrome Web Store

Install directly from the [Chrome Web Store](https://chromewebstore.google.com/detail/mmnmcnffbkcnhcjiidmdnaclpfeekiol). Also works on Edge and Brave.

### Manual install (Chrome / Edge / Brave)

1. Clone this repository:
   ```bash
   git clone https://github.com/jasp-nerd/canvas-course-downloader.git
   ```
2. Open your browser's extension page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the cloned folder
5. Navigate to your Canvas site

### Firefox

1. Clone this repository
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on** and select the `manifest.json` file
4. Navigate to your Canvas site

> Firefox temporary add-ons expire when the browser restarts. You'll need to reload from `about:debugging` each session.

## Usage

### Single course

1. Go to any Canvas course page
2. Click the **"Download Course Content"** button that appears in the breadcrumb bar
3. Files download into organized folders named after the course

### Multiple courses

1. Go to your Canvas dashboard
2. Click **"Download Courses"** in the header area
3. Use the **Active** and **Past Courses** tabs to find your courses
4. Search by course name, code, or term to narrow the list
5. Check the courses you want (or use "Select All" per term group)
6. Click **"Download Selected"** and watch the progress bar

You can also trigger downloads from the extension popup icon or with the keyboard shortcut.

### Settings

Open settings from the extension popup or your browser's extension options page.

| Setting | What it does |
| --- | --- |
| Content types | Toggle which types to export: files, pages, assignments, discussions, announcements, modules, syllabus, grades, linked files |
| Presets | Quick-select common combos: Full Archive, Files Only, Text Content Only, Linked Files Only |
| File conflict handling | Choose uniquify (rename), overwrite, or skip when a file already exists |
| Download throttle | Delay between downloads in milliseconds (default 250, range 50–5000) |
| Folder prefix | Custom string prepended to all download paths |
| ZIP bundling | Bundle each course into a single `.zip` file |
| Incremental mode | Track what's been downloaded per course and skip those files next time |

## Supported content

| Content type | What gets downloaded |
| --- | --- |
| Files | All files from the course file browser, preserving the original folder hierarchy |
| Pages | Every wiki page saved as an HTML file |
| Assignments | Each assignment with its description and due date as HTML |
| Announcements | Course announcements with dates as HTML |
| Discussions | Discussion topics with author info as HTML |
| Modules | Module structure overview plus any files referenced within modules |
| Syllabus | The course syllabus as HTML |
| Grades | Assignment scores, due dates, points possible, and letter grades as CSV |
| Linked files | Files embedded in assignment/page/announcement HTML that don't appear in the file browser |

Each export also includes a `manifest.json` with metadata: export date, file counts per type, source URL, and extension version.

## Exported folder structure

```
Course Name/
├── Files/
│   ├── Lecture Slides/
│   │   ├── week1.pdf
│   │   └── week2.pdf
│   └── Readings/
│       └── chapter1.pdf
├── Pages/
│   ├── course-overview.html
│   └── resources.html
├── Assignments/
│   ├── Homework-1.html
│   └── Final-Project.html
├── Announcements/
│   └── Welcome-to-class.html
├── Discussions/
│   └── Introduce-yourself.html
├── Modules/
│   └── Week 1/
│       └── handout.pdf
├── Extracted_Files/
│   └── embedded-image.png
├── Modules.html
├── Syllabus.html
├── Grades.csv
└── manifest.json
```

In ZIP mode, the same structure is bundled into a single `Course Name.zip`.

## How it works

The content script runs on every HTTPS page but immediately exits if it doesn't detect Canvas (it checks for Instructure domains and Canvas-specific DOM elements like `#application`, `.ic-app`, and the CSRF meta tag). On Canvas pages, it calls the Canvas REST API using your session cookies and follows pagination via RFC 5988 Link headers.

Beyond the normal file list, it parses HTML content from pages, assignments, and announcements to extract linked files that aren't in the file browser. Files get queued in the background service worker, which downloads them sequentially with configurable throttling. Failed downloads are retried with exponential backoff (up to 3 attempts) and can be retried manually from the progress panel.

## Folder structure

```
canvas-course-downloader/
├── manifest.json        # Extension manifest (MV3)
├── background.js        # Service worker: sequential download queue
├── content.js           # Entry point, SPA navigation handling, message routing
├── downloader.js        # Download orchestration, ZIP bundling, settings
├── ui.js                # UI components: buttons, progress panel, course selector, toasts
├── canvas-api.js        # Canvas REST API: fetch with retry, pagination, timeouts
├── detector.js          # Canvas page and course detection
├── helpers.js           # Pure utilities: sanitization, parsing, color math
├── jszip.min.js         # JSZip library
├── popup.html / js      # Extension popup
├── options.html / js    # Settings page
├── icons/               # Extension icons (SVG + PNG at 16, 48, 128)
├── screenshots/         # Store and documentation images
└── tests/
    └── test-helpers.html  # Browser-based unit tests for helper functions
```

## Permissions

The extension requests broad page access (`https://*/*`) because Canvas can be hosted on any domain. Universities often run it on their own URLs like `canvas.university.edu`. The extension needs to inject its content script everywhere to detect Canvas instances, but it exits immediately on non-Canvas pages and makes no network requests outside the Canvas site you're on.

For the full privacy policy, see [PRIVACY.md](PRIVACY.md).

## Known limitations

- Content hosted by third-party LTI tools (Turnitin, Panopto, external videos) lives outside Canvas and can't be downloaded
- You must be logged into Canvas. There's no API-token or headless mode
- Pages, assignments, announcements, and discussions are saved as HTML summaries, not pixel-perfect copies of the Canvas layout
- Heavily customized Canvas themes may affect button placement or page detection
- Courses with hundreds of files will take a few minutes. The throttle setting helps balance speed against browser download limits
- Windows paths are truncated to stay under the 260-character limit, which can shorten long filenames

## Troubleshooting

**"Not on a Canvas page"** — The extension didn't detect Canvas on the current page. Make sure you're on a page with Canvas navigation elements. On self-hosted instances with heavy theme customizations, detection can fail. File an issue with details about your Canvas URL.

**Course selector is empty** — No courses came back from the API. Try the **Past Courses** tab for completed semesters. Some institutions restrict API access for certain enrollment roles.

**Downloads blocked by browser** — Browsers may block bulk downloads the first time. Click **Allow** when prompted. If downloads are timing out, lower the throttle value in settings.

**Some files are missing** — Files in restricted areas or behind additional permission checks may not be accessible through the API. Files hosted by external LTI tools won't be captured. Check the browser console for specific errors.

**Firefox add-on expired** — Firefox temporary add-ons only last until browser restart. Reload from `about:debugging#/runtime/this-firefox`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
