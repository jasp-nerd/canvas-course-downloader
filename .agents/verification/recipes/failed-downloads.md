# Files that fail during an export

Where: the export tab's receipt, the "Open me" page in the download, `_download_errors.csv`, and `inventory:<origin>:<course>` in `chrome.storage.local`.

Setup: the e2e fixtures (`e2e/fixtures.ts`) with course 104 on the mock Canvas. `resetExtensionStorage(serviceWorker, { zipMode })` picks folders or ZIP. `mock.addFault({ path: '^/files/<id>/download', ... })` makes one file fail: `status`, `drop` or `loginPage`.

What to expect: Chrome reports its own codes when saving as folders, so a 404 is `SERVER_BAD_CONTENT`, 403 `SERVER_FORBIDDEN`, 401 `SERVER_UNAUTHORIZED`, 500 and 429 `SERVER_FAILED`, a dropped connection `NETWORK_FAILED`. A ZIP shows `HTTP 404`. A login page is `NOT_A_FILE` in both modes, and no file is left on disk. Each failed file is listed under "Not saved", isn't linked, and isn't in the inventory.

Flows worth repeating: every fault in both modes; a second only-new export fetches the failed file; a run with no faults has no warning and no `_download_errors.csv`.

Stuck downloads: with every file answering 404, `chrome.downloads.download()` sometimes never answers. Allow over 2 minutes per run, repeat many times, and expect `DOWNLOAD_STUCK` in some runs. Seen in headless Chrome for Testing; not checked in branded Chrome.

A file where a folder should be makes Chrome report `USER_CANCELED` for other files too, so the export stops as if cancelled and writes no overview.
