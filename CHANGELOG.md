# Changelog

## 3.0.0 (unreleased)

A rewrite of the whole extension. Your settings and the list of files you already downloaded carry over.

### New

- **Exports run in their own tab.** You can keep using Canvas, or close it, while a course downloads.
- **Faster.** Several requests run at once, adjusting to how much Canvas allows, instead of one at a time.
- **Firefox and Edge** are supported properly, next to Chrome.
- **Save into a folder you choose** (Chrome, Edge), for example one inside Google Drive, OneDrive or Dropbox. Large ZIPs are written straight to disk there.
- **An overview page in every export** (`Open me - <Course>.html`): the course by module, everything else by kind, and what couldn't be saved and why.
- **New files on your dashboard.** Courses you downloaded before show how many files are new, with a button to download only those. Optionally, they download automatically when you open Canvas.
- **Study packs for AI.** A download can be a pack for NotebookLM, ChatGPT or Claude: a course guide with deadlines and grading, one Markdown file per module, and the slides and PDFs, split into several notebooks or projects when a course has too many files. It never contains other students' work.
- **Files for coding agents.** A Markdown copy with front matter on every page, plus `AGENTS.md`, `llms.txt` and `course.json`.
- **Teachers' copies leave students' work out** unless you turn on "Include students' work": no roster, submissions, gradebook, quiz attempts or named discussion replies in a copy you might share. Questions, rubrics and prompts are still saved.
- **Deadlines as a calendar file.** Every copy has `Deadlines.ics` with the course's due dates, linked back to Canvas. Import it again after a later download and the events update instead of doubling.
- **Canvas's own course package for teachers.** Optionally, a teacher's copy also brings the `.imscc` file Canvas builds for re-importing a course, next to the readable copy. Off by default.
- **More than new files.** The check for courses you saved before also counts new announcements and pages and assignments that changed since.
- **A short setup** for new users: what downloads should be and how to save them. Whoever skips it gets one question at the first download instead. People updating from 2.x aren't asked anything.
- **A new look** with its own colours, typefaces and a mascot (Pip, a red squirrel) on the extension's own pages. The button on Canvas keeps your school's colour and now carries our logo. The setup, course picker, popup and settings are redesigned.
- **A Download tab you can watch.** The logo's dots fill as files save, also on the browser tab and the toolbar button. It ends in a receipt: what's inside, what's missing and why, Show in folder, and the next step for a study pack or files for code.
- **Fewer surprises when saving.** If your browser asks where to save every file, a closed window stops the download instead of opening hundreds more, and you're told how to turn that off. Files the browser holds back as possibly harmful are listed with how to keep them.

### Fixed

- A ZIP no longer says "complete" when files are missing: an export ends as complete, partial (with the failed files listed) or failed.
- "Linked files only" now downloads the linked files.
- Quizzes are no longer skipped for settings saved before 2.7.
- When Canvas asks to slow down, downloads pause and retry instead of failing.
- "Only download what's new" no longer marks failed downloads as done.
- File names that Windows, macOS, Chrome or Firefox refuse are made safe.
- Links on other websites that merely contain `/files/<number>` are no longer mistaken for Canvas files.
- Course parts a course has turned off (such as Pages or Quizzes) are no longer reported as missing.
- Page titles and course content are escaped and sanitized more strictly.

### Changed

- With a folder name set, a ZIP is saved inside that folder (`Canvas/Course.zip`) instead of getting the folder name in its file name.
- Markdown tables are aligned.
- The download throttle setting is gone: speed now adapts to Canvas automatically.

For versions before 3.0, see the [GitHub releases](https://github.com/jasp-nerd/canvas-course-downloader/releases).
