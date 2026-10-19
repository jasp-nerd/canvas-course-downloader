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
