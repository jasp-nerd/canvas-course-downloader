# Intended differences from v2.11.0

v3 must reproduce v2's export output (the golden files) except for the differences listed here. Each one needs a reason and jasp's approval before the golden files are regenerated.

| # | Area | v2 behaviour | v3 behaviour | Reason | Approved |
|---|---|---|---|---|---|
| 1 | ZIP results | Reports "Download complete! 0 failed" when entries are missing (5xx, dropped connection, 404 course) | Ends as Success, Partial (with Retry) or Failed; missing entries are listed | Users kept incomplete backups without knowing | 2026-10-19 (plan) |
| 2 | "Linked Files Only" preset | Exports only `styles.css` and `manifest.json` | Exports linked files | Bug | 2026-10-19 (plan) |
| 3 | Settings without a `quizzes` key (saved before v2.7.0) | Quizzes silently skipped while the options page shows them on | Quizzes default on | Bug | 2026-10-19 (plan) |
| 4 | Stored `conflictAction: "skip"` (before v2.5.3) | Passed to `downloads.download` as an invalid value | Migrated to `uniquify` | Bug | 2026-10-19 (plan) |
| 5 | Canvas 403 throttling | Not retried | Retried with backoff, honouring rate-limit headers | Bug | 2026-10-19 (plan) |
| 6 | Incremental inventory | Failed and not-yet-finished downloads recorded as done | Recorded only after the file is written | Bug | 2026-10-19 (plan) |
| 7 | Folder prefix in ZIP mode | Becomes part of the ZIP file name (`Canvas Downloads--Course.zip`) | TBD when the sinks slice lands | Bug | pending |
| 8 | ZIP entry names | Canvas display names put into the ZIP unsanitized (`Lecture 1 - What is psychology?.pdf`), which Windows can't extract | Sanitized like folder-mode names (`... psychology-.pdf`) | Bug | 2026-10-19 (plan) |
| 9 | File and folder names | Names with bidi marks, ZWJ/ZWNJ, soft hyphens, non-ASCII spaces, `~`, `.url`/`.lnk`, `CLOCK$`/`COM0`, or "Lecture 1. Intro" fail with "Invalid filename" (Chrome) or "illegal characters" (Firefox) | Made safe (`src/export/filenames.ts`); long names cut at 100 (files) or 60 (folders) characters with a stable tag | Bug | 2026-10-19 (plan) |
| 10 | HTML title | Page title inserted into `<title>` and `<h1>` unescaped | Escaped | Security | 2026-10-19 (plan) |
| 11 | Sanitizer | Blocklist that kept `srcdoc`, `formaction`, `<meta refresh>`, `<base>`, `<form>` | DOMPurify with a Canvas allowlist; benign Canvas markup unchanged | Security | 2026-10-19 (plan) |
| 12 | Markdown tables | `\| 1 \| Intro \|` | Columns padded to align (`\| 1   \| Intro \|`), from the maintained Joplin GFM plugin | Readability; v2's plugin is unmaintained since 2017 | pending |
| 13 | Overview page | None | `index.html` and `Open me - <Course>.html` at the course root: the course by module, everything else by kind, and what couldn't be saved and why (issue #11). No scripts; a CSP blocks them | Feature | 2026-10-19 (plan) |
