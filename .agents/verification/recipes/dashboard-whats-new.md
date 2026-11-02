# The Dashboard "what's new" note

Where: the Canvas Dashboard (`https://school.instructure.com/` on the mock Canvas), under the dashboard header. Also the "N new" chip next to "Download course" on course pages.

Setup without exporting first:
- Start the mock in-process (`startMockCanvas()` from `e2e/mock-canvas/server.ts`) and launch Chrome for Testing with the built extension (`.output/chrome-mv3`) and `--host-resolver-rules` mapping every `MOCK_HOSTS` host to the mock's port, as `e2e/fixtures.ts` does.
- Mark a course as saved: write `inventory:<origin>:104` to `chrome.storage.local` from the service worker, with `files` built from `files(findCourse(104), origin)` in `e2e/mock-canvas/data.ts`. Then `mock.state.newFileIn = [104]` adds "Lecture 13 - Review session.pdf".
- The results live in `updates:<origin>`. Writing that key re-renders the note at once (no reload). Setting `checkedAt: 0` and dispatching `visibilitychange` on the page makes it ask Canvas again.

Reading it: the note is in a shadow root on `<ccd-updates-note>`. `innerText` of that host is empty; read `locator('ccd-updates-note').locator('.note')`. Role queries (`getByRole('button', { name: 'Dismiss' })`) pierce it.

Flows worth repeating: note appears for a new file; Download opens an update whose receipt is headed "<Course> is up to date" with a "What's new" list; X shows "Hidden until something new comes in" and stores the listed keys in `dismissed`; "Don't show these again" sets `updatesNote: false` in `storage.sync`, Undo sets it back; after a reload hidden items stay hidden.

Not observable headless: the OS notification after an automatic download.
