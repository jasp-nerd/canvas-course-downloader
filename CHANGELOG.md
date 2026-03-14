# Changelog

All notable changes to Canvas Course Downloader will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.2]

### Added
- Chrome Web Store link in README installation section
- Star and rate links in popup footer and course selector overlay

### Changed
- Bumped manifest version to 2.0.2

## [2.0.1]

### Changed
- Rewrote README with accurate feature descriptions pulled from actual source code
- Updated CONTRIBUTING.md to reflect modular architecture (was still describing the old single-file structure)
- Fixed PRIVACY.md permissions table: `storage` now correctly described as active, added missing `activeTab` and `notifications` permissions
- Replaced old screenshots with up-to-date course selector, download progress, and settings images
- Removed outdated bulk-download-result and old course-selector screenshots

## [2.0.0]

### Changed
- Split `content.js` into separate modules (`helpers.js`, `detector.js`, `canvas-api.js`, `ui.js`, `downloader.js`) for better maintainability
- Improved DOM selector resilience with ordered fallback lists and graceful degradation
- Narrowed host permissions (removed `*://*/`, added `activeTab`)

### Added
- Unit tests for pure helper functions (`tests/test-helpers.html`)
- Comprehensive README sections: permissions explainer, known limitations, troubleshooting, exported folder structure

## [1.9.0]

### Added
- ZIP bundling mode — bundle each course into a single `.zip` file instead of individual downloads
- Active vs. past courses toggle in the course selector
- Richer popup with course info panel, content type tags, and live download queue status
- Accessibility: ARIA attributes, focus trapping in modals, keyboard navigation for term headers
- Polished course selector with loading spinners, empty states, and finish screen

## [1.8.0]

### Added
- Grades CSV export (assignment scores, due dates, points)
- Incremental mode — skip previously downloaded files on subsequent runs
- JSZip library bundled for client-side ZIP generation

### Removed
- Quizzes content type (Canvas API restrictions made it unreliable)

## [1.7.0]

### Added
- Options page with export presets (full archive, files only, text only)
- Configurable download throttle, file conflict handling, and folder prefix
- Content type toggles to control what gets exported

## [1.6.0]

### Added
- Real download job management with queued/downloading/complete/failed states
- Live progress panel with minimize, cancel, retry, and dismiss controls
- Badge counter showing remaining downloads

## [1.5.0]

### Added
- Canvas theme color detection (reads institution brand colors from CSS variables)
- Keyboard shortcut: Ctrl+Shift+D (Cmd+Shift+D on Mac)
- Export manifest (`manifest.json`) included with every download
- Path length safety for Windows 260-character limit

## [1.4.0]

### Added
- Retry logic with exponential backoff for failed API requests
- Per-item HTML export for assignments, announcements, and discussions
- Course search in the selector overlay
- Term-based grouping with collapsible sections

## [1.3.0]

### Added
- Fetch timeout handling (30s default) with AbortController
- Desktop notifications when all downloads finish
- HTML sanitization (script tag removal) for exported content

### Fixed
- Download reliability for large courses with many API pages

## [1.2.0]

### Added
- Branding refresh with new icon and popup design
- Course selector overlay for bulk downloading from the dashboard

## [1.1.0]

### Added
- Firefox support (Manifest V3 with gecko settings)
- Edge and Brave compatibility
- Privacy policy for Chrome Web Store submission

## [1.0.0]

### Added
- Initial release
- Single-course and multi-course bulk download
- Content types: files, pages, assignments, announcements, discussions, modules, syllabus
- Hidden/linked file extraction from HTML content
- Session cookie authentication (no API token needed)
- Organized folder structure per course
