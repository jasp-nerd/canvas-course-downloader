# v3 contracts

Behaviours v3 must keep, taken from the v2.11.0 code (`legacy/v2/`), its git history and its issues. Each line becomes a test. Where v3 deliberately differs, the difference is listed in `parity-diffs.md`.

Source: a code audit of v2.11.0 (2026-10-19). File references are to `legacy/v2/`.

## Parity checklist

**Detection and entry**
1. On a hostname containing `instructure.com`, the page is treated as Canvas without DOM checks.
2. On another hostname, the page is Canvas iff ≥2 of these exist: `.ic-app`, `link[href*=brandable_css]`, `meta[name=apple-itunes-app][content*=480883488]`, `.ic-app-nav-toggle-and-crumbs`, an inline script containing `DOMAIN_ROOT_ACCOUNT_ID`.
3. A course page is any path matching `/courses/(\d+)`; the course ID is that number.
4. On course pages a "Download course content" button appears inline in the breadcrumb row; on other Canvas pages a "Download courses" button opens the selector. Buttons re-inject after SPA URL changes.
5. The keyboard command (Ctrl/Cmd+Shift+D) exports the current course on a course page, opens the selector on other Canvas pages, and does nothing elsewhere.
6. The popup reports one of: course detected (exports this course), Canvas non-course page (opens the selector), non-Canvas https page, or no content script.
7. The selector lists courses with `enrollment_state=active` and `completed` in two tabs, grouped by term (newest `start_at` first, default/"Other" last), searchable by name, code, and term, with per-term and global select-all.
8. Multi-course export processes the selected courses sequentially and keeps going after a per-course error.

**Settings**
9. All settings listed under "v2 settings" below persist in `storage.sync` with the listed defaults, and changes apply to the next export.
10. Settings saved by older versions (missing `submissions`, `quizzes`, or other keys, or `conflictAction:"skip"`) load with sensible values, and submissions inherit `assignments`. (v3 should fix the quizzes and skip cases, not reproduce them.)
11. Presets set the content-type checkboxes as defined in legacy/v2/options.js:32. The highlighted preset reflects the current checkbox state.

**Role**
12. A user whose `enrollments[].type` includes teacher, ta, or designer gets the teacher export; anyone else, or any lookup failure, gets the student export.

**Content**
13. Files from `/files` are saved under `Files/<Canvas folder path without "course files">/`.
14. Files with an empty `url` are not downloaded and appear in `_inaccessible_links.csv` as `locked`/`no-url`.
15. Pages from both the Pages list and Page module items are exported once each. Their embedded files are extracted even when Pages is off but Modules is on.
16. Every `/files/<id>` reference in `a/img/iframe/source/video/audio/embed` inside assignment, announcement, discussion and reply, page, syllabus, quiz description, and submission body HTML is fetched via `/api/v1/files/<id>` with the link's `location` and `verifier`, deduped by file ID, and saved under `Extracted_Files/`.
17. Linked files whose link names another course map that course's URL onto the local copy, and failures list `linked_course_id`.
18. Canvas media embeds (all four forms) resolve through `/media_attachments/:id/info` or `/media_objects/:id/info`, download the best non-HLS flavor to `Media/` with `.srt` captions, dedupe by `media_id`, and their iframes become local `<video>`/`<audio>`. Unresolvable media is reported as `no-media-sources`, `bad-media-url`, an HTTP status, or `error`.
19. Assignments export with the due date, cleaned description, and rubric definition (range tiers rendered as "high to >low").
20. Teacher submissions: for each assignment with an online submission type, every student with real content gets `Submissions/<A>/<Student>/` containing every attempt's files (`Attempt N - ` when there are multiple attempts), media recordings, comment media, and a page with grade, text, URL, rubric assessment, and comments. A per-assignment `_grades.csv` covers all students.
21. Student submissions come from `/submissions/self` into `Submissions/<A>/` with the same page content.
22. Announcements and discussions export with posted date and author. Discussions include the full threaded `/view` replies for both roles, with reply attachments saved under `Discussions/<topic>/`. Teachers get a graded-discussion `_grades.csv`.
23. `Modules.html` lists every module and item with its type. Module File items not already captured go to `Modules/<module>/`.
24. The syllabus exports when non-empty.
25. Students get `Grades.csv` with the 11 columns listed. Teachers get `Gradebook.csv` (with a points row and a section column) and `Students.csv`. Both roles get `Grading Weights` when any group weight is above 0.
26. Quizzes:
    - Everyone: classic-quiz metadata and description.
    - Teacher: question bank with marked correct answers, a per-student score table sorted by section then name, and `_grades.csv`.
    - Student: own score, and own answers when allowed.
    - Student on a 403: the `/history` review is scraped. Selected answers show ✓/✗ only when the page exposes correctness, otherwise a neutral `•`.
27. YouTube iframes become thumbnail links. `$CANVAS_…$` placeholder links become inert spans. Empty paragraphs are dropped, and whitespace inside whitespace-only spans is preserved.
28. Links between exported items (pages, assignments, announcements, discussions, quizzes, modules, module items, files, media) are rewritten to relative local paths. Unknown links stay as they are.
29. HTML exports link a root `styles.css`. Markdown exports produce `.md` with `# Title`, GFM tables, and media links, and no `styles.css`.
30. Every export includes `manifest.json` with the counts listed in §4.1, plus `_inaccessible_links.csv` when anything was refused.

**Naming**
31. Generated names are sanitized: control and zero-width characters stripped, reserved characters become `-`, no leading or trailing dots or spaces, Windows reserved names prefixed, never empty. Generated-doc names are truncated to fit 250 characters including the course name. Case-insensitive duplicate paths get ` (n)`.

**Delivery**
32. With ZIP on and an estimate ≤1.5 GiB, each course becomes one `<Course>.zip` streamed from the sources. Fetch failures are excluded and reported. A ZIP generation error falls back to individual downloads with a toast. An estimate over 1.5 GiB falls back with the size toast.
33. With ZIP off, files download one at a time through `chrome.downloads` into `<prefix>/<Course>/…`, with the configured conflict action and throttle. The queue survives service-worker restarts. The badge shows the remaining count, and a notification fires when the queue finishes.
34. The progress panel shows live counts, the current file, and the percentage. It supports cancel (which stops in-flight fetches, the multi-course loop, and mid-handshake downloads), retry failed, minimize, and dismiss.

**Incremental and filters**
35. Every run records `{t, m, s}` per downloaded file in `storage.local` under the course key. With incremental mode on, files with an existing entry and unchanged `updated_at`/size are skipped. Generated docs are always re-exported. Files that failed or were filtered out are not recorded.
36. "Exclude videos" drops video files and video media. "Max size" drops files larger than N MB. Generated docs and CSVs are never filtered.

**Permissions**
37. canvas-user-content.com access is requested at runtime at most once (popup click or in-page flow). Denial never blocks the export and shows the Settings hint. The options page offers a manual grant and shows its status. No new required permissions are added.
38. Student-uploaded files from the CDN are readable for ZIP bundling once access is granted.

## v2 settings

All in `chrome.storage.sync` as top-level keys.

| Key | Default | UI (options.html) | Exact effect in code |
|---|---|---|---|
| `contentTypes.files` | true | "Files & folders" :431 | Lists `/folders` and `/files`, then queues each file into `Files/<folder>/` (legacy/v2/downloader.js:491) |
| `contentTypes.pages` | true | "Pages" | Fetches the pages list and emits `Pages/*.html`. Page bodies are fetched even when this is off if modules yielded slugs (legacy/v2/downloader.js:1169), for linked-file extraction |
| `contentTypes.assignments` | true | "Assignments" | Emits `Assignments/*.html` with due date, description, and rubric |
| `contentTypes.submissions` | true | "Student submissions" | Teacher: every student, all attempts, plus `_grades.csv`. Student: `/submissions/self`. Back-compat: if the key is missing it inherits `assignments` (legacy/v2/downloader.js:376). Also triggers the CDN permission request |
| `contentTypes.discussions` | true | "Discussions" | Topics plus the full `/view` reply thread (both roles), reply attachments, teacher graded-discussion `_grades.csv`. Also triggers the CDN permission request |
| `contentTypes.announcements` | true | "Announcements" | `Announcements/*.html` |
| `contentTypes.modules` | true | "Modules" | `Modules.html`, `Modules/<module>/<file>` for File items, page slugs from Page items, module-item ID mapping |
| `contentTypes.syllabus` | true | "Syllabus" | `Syllabus.html` |
| `contentTypes.grades` | true | "Grades (CSV export)" | Student `Grades.csv`; teacher `Gradebook.csv`/`Students.csv`; both: `Grading Weights.html` |
| `contentTypes.quizzes` | true | "Quizzes" | See §4. **No back-compat**: settings saved before v2.7.0 lack the key, so `undefined` means quizzes are silently skipped, while options.js:94 shows the box checked (`?? true`) |
| `contentTypes.linkedFiles` | true | "Linked / extracted files" | Gates `extractLinkedFiles`, which also gates **Canvas media** extraction |
| `conflictAction` | `"uniquify"` | select :480 (`uniquify`/`overwrite`) | Passed to `chrome.downloads.download` for every job, including the ZIP. A legacy `"skip"` value (offered until v2.5.3) is passed raw; see §7 |
| `throttleMs` | 250 | number :487 (min 50, max 5000, not enforced) | Delay before the next background job after each completion or failure (background.js:156). **No effect in ZIP mode.** `0`/NaN becomes 250 (options.js:122, background.js:243) |
| `folderPrefix` | `""` | text :492, placeholder `e.g. Canvas Downloads/` | Individual mode: `/[/\\?%*:|"<>]/` becomes `-`, then prepended as one folder (background.js:244, 258). ZIP mode: `sanitizeFilename(prefix) + "/"` is concatenated into the ZIP filename, then the background replaces `/` with `-`, so the prefix becomes **part of the filename**, e.g. `Canvas Downloads--Course.zip`, not a folder (legacy/v2/downloader.js:334-339, background.js:184) |
| `zipMode` | true (since v2.8.0) | checkbox :497 | See §4.5 |
| `incrementalMode` | false | checkbox :501 | Filters files by the stored inventory. The inventory is **written on every run regardless** (legacy/v2/downloader.js:1523) |
| `excludeVideos` | false | checkbox :534 | Drops non-synthetic entries whose filename matches `/\.(mp4\|mov\|avi\|mkv\|webm\|wmv\|flv\|m4v)$/i` or whose `contentType` starts with `video/` (legacy/v2/downloader.js:1486-1501) |
| `maxFileSizeMB` | 0 | checkbox :538 plus number :542 | Drops non-synthetic entries with `size > MB*1024*1024`. Canvas media entries always have `size: 0`, so they are never filtered (legacy/v2/downloader.js:707) |
| `preset` | `"full-archive"` | preset bar :420 | Saved by options.js:130 but **never read** by any behavior. Purely cosmetic |
| `exportFormat` | `"html"` | select :520 | `"markdown"` emits `.md` and omits `styles.css` |

Presets (options.js:32): `full-archive` (all true), `files-only` (files only), `text-only` (everything except files and linkedFiles), `linked-only` (only linkedFiles). **`linked-only` exports nothing useful**: every `extractLinkedFiles` call sits inside a block gated by another type (legacy/v2/downloader.js:782, 852, 968, 993, 1026, 1195, 1212, 1361), so the export contains only `styles.css` and `manifest.json`.

Local storage keys: `incremental_<courseId>` (object `{ "<path><filename>": {t, m, s} }`, or a legacy bare timestamp); `completedSessions` (int); `feedbackState` (`pending` | `positive_clicked` | `negative_clicked` | `dismissed`). Session storage keys: see §2.

## Hard-won fixes (regression tests)

Every row is a bug that shipped once. v3 needs a test for each.

| Commit | What broke | Fix | Regression test idea |
|---|---|---|---|
| eea8f4b (v1.3) | Hung API requests stalled exports; downloads overwrote each other; `<script>` in exported HTML | 30 s AbortController timeout; `uniquify` default; script stripping | A mock endpoint that never responds is aborted and retried, and the export completes |
| 8a77ded (v1.4) | The same file linked with different URLs was downloaded twice | Dedupe by Canvas file ID | The same file ID linked as `/files/1?verifier=a` and `/files/1/download` yields one entry |
| aabdfbb (v2.0) | `*://*/` host permission was overbroad | Narrowed to instructure.com plus activeTab | The manifest snapshot has no all-hosts permission |
| d07648b (v2.0.3) | False-positive Canvas detection on non-Canvas sites (`#application`, `#main`, csrf meta) | ≥2 of 5 Canvas-specific signals | A fixture with only `#application`, `#main`, and a csrf meta is not detected; a Canvas fixture with two signals is |
| 540ab19 (v2.3.0) | Cancel didn't stop the ZIP fetch loop or the multi-course loop; files saved after Cancel when the download was mid-handshake | `downloadCancelled` flag; cancel the download ID returned after cancel | Cancel while `downloads.download` is pending causes `downloads.cancel(id)`, and no file remains |
| ecf0cbe (v2.4.0), issue #1 | Stuck on "Generating ZIP" for large courses (JSZip buffering) | client-zip streaming, AbortController, 1.5 GB fallback, ZIP64 | A course estimated over 1.5 GB falls back with the toast; a synthetic over-4 GB archive is a valid ZIP64 |
| 5d3af65 / b9d6e4a (v2.5.0), issue #6 | "Invalid filename": zero-width/control chars, NBSP, trailing dots/spaces, CON/PRN, unsanitized page slug | Hardened `sanitizeFilename`, applied to slugs | A table test over `sanitizeFilename` (the existing cases plus the #6 titles) |
| b9d6e4a (v2.5.0) | Module-only pages (absent from the Pages list for students) and their PDFs were missing; a duplicate back-to-Canvas `<h2>` link; locale-dependent dates | Collect slugs from module items; `formatDate` | A page referenced only by a module item is exported and its linked PDF extracted |
| 20a3417 + f82175d (v2.5.1/2) | The regex cleanup ate `Apple-converted-space` whitespace (words merged); the regex sanitizer missed `on*` and `javascript:` | DOM-based `cleanCanvasHtml`/`sanitizeHtml` | `Overall<span class="Apple-converted-space"> </span>description` gives `Overall description` |
| 130c178 (v2.5.3) | Service-worker idle (30 s) wiped the queue mid-batch; also removed the "skip" conflict option | `chrome.storage.session` persistence and rehydrate | Terminate the SW mid-queue, then fire `downloads.onChanged`, and the queue resumes |
| 130c178 (side effect, **still open**) | The removed mapping `skip → uniquify`: users who saved "Skip if exists" before v2.5.3 still pass `conflictAction:"skip"`, an invalid enum, to `chrome.downloads.download`. Inferred from the code; Chrome should reject it, so every download fails, ZIP included | None | Stored `conflictAction:"skip"` is migrated to `uniquify` and downloads succeed |
| 6638375 / 67aa537 (v2.6/2.7), issue #8 | Teachers couldn't archive student data | Teacher mode, quizzes, rubrics, roster | A teacher fixture produces Submissions/, Gradebook.csv, Students.csv, and quiz `_grades.csv` |
| c999ac1 (v2.8.0) | `<img src=".../files/<id>/preview">` was not downloaded or rewritten; same-named items overwrote each other in the ZIP; rubric point ranges; quiz and module links not rewritten | Scan img/iframe/source; case-insensitive de-dup; `ratingPointsLabel` | Two quizzes titled "Unnamed quiz" give `Unnamed quiz.html` and `Unnamed quiz (2).html`; an inline image is rewritten to `../Extracted_Files/x.png` |
| ad849f2 (v2.9.0) | Only the latest submission attempt was saved; students got no submissions | `submission_history`, the `Attempt N - ` prefix, `/self` | A three-attempt history gives two prefixed files and one page with three attempt sections |
| bcf9061 (v2.9.1) | Old settings had no `submissions` key | Inherit from `assignments` | Stored `{assignments:false}` without `submissions` means no submission fetch |
| d94cc48 (PR #9) | Concluded courses return 403 on quiz submission endpoints, so students lost their answers | Scrape `/quizzes/:id/history` | A 403 on `quizzes/:id/submissions` triggers the history scrape, and the answers are rendered |
| 38a239d (PR #10), issue #11 | Submission files on canvas-user-content.com failed CORS in ZIP mode | DNR `ACAO:*` rule | With the permission granted, a CDN file fetch inside the ZIP succeeds |
| 34cba43, issue #11 | Students got no discussion replies (the `/view` call was gated to teachers) | `/view` for both roles | The student fixture's discussion HTML contains the "Replies" section |
| f25afa3 (v2.10.0) | A required CDN host permission would auto-disable the extension for all users | Optional permission plus runtime request; options fallback | The manifest has the CDN only under `optional_host_permissions`; denial is non-fatal and shows the toast |
| e9b0983 (PR #12) | The inline button wrapped below the breadcrumbs | `display:flex` on the crumb list | The button's `offsetTop` equals the crumbs' on a fixture |
| 5c07e46 (v2.10.1) | The inventory was only written when incremental was on, so the first incremental run re-downloaded everything; changed files were skipped forever; filtered files were recorded as downloaded | Record on every run; `{t, m, s}` with an `updated_at`/size comparison; record after filters | Run 1 with incremental off, run 2 with it on: zero files re-fetched. A changed `updated_at` is re-fetched |
| e0713cd (v2.10.2) | Cross-course linked files were refused (`location`/`verifier` dropped); locked files saved the current page HTML as "lecture.pdf"; silent drops | Forward the params; empty-`url` check; `_inaccessible_links.csv` | A link `/courses/85509/files/9?location=course_syllabus_85509` makes the API call carry `location`; an empty `url` produces a CSV row, not a file |
| a4f9eaf / 5f8d7a2 (v2.10.3), issue #16 | The review scrape marked selected answers wrong when correctness was hidden | Only use `✗` when the question shows any `.correct_answer` | A fixture with no `.correct_answer` renders the selected answer as `•` with no red |
| 331a73e (v2.11.0) | Canvas media-player videos were never downloaded; a failed ZIP fetch was recorded as done in incremental; locked Files-tab entries saved page HTML; a ZIP generation error was fatal; Markdown dropped iframes and video; video/audio/embed `/files/` refs were not scanned | Media resolver; `failedKeys`; empty-`url` check; ZIP fallback; Turndown `mediaEmbed` rule; wider selector | The existing `extractMediaRefs`/`pickMediaSource`/`mediaFilename`/`convertLocalMediaEmbeds` tests, plus "a ZIP entry 500 means the key is absent from `incremental_<id>`" |

Gaps those fixes left behind (v3 should test them):

- The empty-`url` guard is missing for module File items (legacy/v2/downloader.js:1143).
- `failedKeys` are post-truncation and post-de-dup names, while inventory keys are pre-truncation, so a failed file with a truncated or de-duplicated name is still recorded and skipped forever (legacy/v2/downloader.js:1525 vs 1536).
- Individual mode records the inventory before the downloads finish (:1723), so failed downloads are marked done.

---
