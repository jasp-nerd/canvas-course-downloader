<p align="center">
  <img src="icons/icon.svg" alt="Canvas Course Downloader" width="100" height="100">
</p>

<h1 align="center">Canvas Course Downloader</h1>

<p align="center">
  <strong>Browser extension that bulk-downloads your Canvas LMS courses.</strong><br>
  <sub>Works on Chrome, Edge, Firefox, Brave, and other Chromium-based browsers.</sub>
</p>

<p align="center">
  <a href="https://hits.sh/github.com/jasp-nerd/canvas-course-downloader/"><img src="https://hits.sh/github.com/jasp-nerd/canvas-course-downloader.svg?label=views&color=4c1" alt="Views"/></a>
</p>

<p align="center">
  <a href="#features">Features</a> &nbsp;&bull;&nbsp;
  <a href="#installation">Installation</a> &nbsp;&bull;&nbsp;
  <a href="#usage">Usage</a> &nbsp;&bull;&nbsp;
  <a href="#supported-content">Supported Content</a> &nbsp;&bull;&nbsp;
  <a href="#contributing">Contributing</a>
</p>

---

## Why?

Canvas courses can disappear after a semester ends. Downloading files one at a time takes forever when you have hundreds across multiple courses, and the existing tools out there all need API tokens or Python.

This extension skips all that. Open Canvas, click a button, and it downloads every file, page, assignment, announcement, discussion, module, and syllabus into organized folders. It uses your existing session cookies, so there's nothing to set up.

## Features

- Download all content from a single course page, or select multiple courses from your dashboard
- Finds files linked inside assignments, pages, announcements, and discussions that don't show up in the file browser
- Saves everything into `Files/`, `Pages/`, `Modules/`, and `Extracted_Files/` subfolders per course
- Works with any Canvas LMS instance (Instructure-hosted or self-hosted) on macOS, Windows, and Linux
- No API keys needed
- Runs entirely in your browser; nothing is sent to external servers

## Screenshots

### Bulk download result
All courses organized into folders:

![Downloaded courses organized by folder](screenshots/bulk-download-result.png)

### Course selector
Pick which courses to download from your Canvas dashboard:

![Multi-course selector overlay on Canvas dashboard](screenshots/course-selector.png)

## Installation

### Chrome / Edge / Brave (developer mode)

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
5. Go to your Canvas LMS site and you're good to go

### Firefox (developer mode)

1. Clone this repository
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on** and select the `manifest.json` file
4. Go to your Canvas LMS site

### Web stores

*Coming soon for Chrome Web Store and Firefox Add-ons.*

## Usage

### Single course

1. Go to any Canvas course page
2. Click the **"Download Course Content"** button in the breadcrumb bar
3. The extension grabs everything and downloads it into folders

### Multiple courses

1. Go to your Canvas dashboard (homepage)
2. Click **"Download Courses"** in the header
3. Check the courses you want
4. Click **"Download Selected"** and wait for the progress bar to finish

## Supported content

| Content Type   | What gets downloaded                                         |
| -------------- | ------------------------------------------------------------ |
| Files          | All files from the course file browser, kept in their folders |
| Pages          | Every page saved as HTML                                     |
| Assignments    | Assignments with descriptions and due dates                  |
| Announcements  | Course announcements with dates                              |
| Discussions    | Discussion topics with author info                           |
| Modules        | Module structure and any files linked within them            |
| Syllabus       | The course syllabus as HTML                                  |
| Hidden files   | Files embedded in assignments, pages, or announcements       |

## Project structure

```
canvas-course-downloader/
├── manifest.json      # Extension manifest (MV3)
├── content.js         # Content script: Canvas detection, API calls, UI overlay
├── background.js      # Service worker: sequential download queue
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic, communicates with content script
└── icons/
    └── icon.svg       # Extension icon
```

## How it works

The content script checks if the current page is a Canvas site by looking for Instructure domains and Canvas-specific DOM elements. If it is, the extension uses the Canvas REST API with your existing session cookies (no API token) and handles pagination automatically.

Beyond the normal file list, it also parses HTML from pages, assignments, and announcements to find linked files that aren't in the file browser. Files get sent to the background service worker, which downloads them one at a time with throttling so it doesn't overwhelm the browser.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Some ideas:
- Chrome Web Store / Firefox Add-ons listing
- Download progress notifications
- Options to skip certain content types
- Better file deduplication

## License

[MIT](LICENSE)
