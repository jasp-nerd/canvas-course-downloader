# What it saves

The details behind the [README](../README.md): every setting, what each part of a course becomes, what a copy looks like on disk, how it works, its limits, and what to do when something goes wrong.

## Settings

Open the settings from the toolbar button, or from **Change** in the course picker.

| Setting | What it does |
| --- | --- |
| Each download makes | A copy to keep, a study pack for AI (and for which tool), or files for coding agents |
| What to download | Presets (Everything, Files only, Pages and text) or any mix of files, pages, assignments, submissions, discussions, announcements, modules, syllabus, grades, quizzes and linked files |
| Save to | Your Downloads folder, or a folder you choose (Chrome and Edge) |
| Save as | One ZIP per course, or folders |
| Folder inside | An optional folder to save into, such as "Canvas" |
| If a file is already there | Keep both, or replace it |
| Only download what's new | Skip files you already saved from a course |
| Download new files automatically | When you open Canvas, save new files from courses you downloaded before |
| Pages, assignments and discussions as | Web pages (HTML) or Markdown |
| Skip | Videos, and files larger than a size you set |

## Supported content

| Content type | What gets saved |
| --- | --- |
| Files | Everything in the Files tab, in its folders |
| Pages | Every page, including pages only reachable from modules |
| Assignments | Each assignment with its description, due date, points and rubric |
| Announcements | Announcements with their dates |
| Discussions | Topics with their replies and attachments. Teachers also get per-student grades for graded discussions |
| Modules | An overview of every module, plus files that only appear in modules |
| Syllabus | The syllabus page |
| Grades | Students: `Grades.csv` with your scores and the class statistics Canvas shows. Teachers/TAs: `Gradebook.csv` (every student × assignment) and a `Students.csv` roster |
| Submissions | Teachers/TAs: every student's work, all attempts, in per-student folders, with a `_grades.csv` per assignment and rubric feedback. Students: your own submissions and feedback |
| Quizzes | Quiz details for everyone. Teachers/TAs: the questions with the answer key, and every student's score. Students: your score and, when the teacher allows it, your answers |
| Linked files | Files and Canvas videos embedded in pages, assignments, announcements, discussions and the syllabus that aren't in the Files tab, including files linked from another course when Canvas allows it. They're saved even when you don't save the pages they're in |
| Canvas media | Videos and audio uploaded or recorded in the Canvas editor, at the best quality Canvas offers, with captions as `.srt`. Saved pages play them offline |

Anything that couldn't be saved is listed, with the reason, on the overview page and in `_inaccessible_links.csv` (links) or `_download_errors.csv` (downloads).

## What a copy looks like

```
Course Name/
├── Open me - Course Name.html     # start here: the course by module, and what's missing
├── index.html                     # the same overview, for tools
├── Files/
│   └── Lecture Slides/
│       ├── week1.pdf
│       └── week2.pdf
├── Pages/
├── Assignments/
├── Announcements/
├── Discussions/
├── Quizzes/
│   └── Midterm/
│       ├── Midterm.html
│       └── _grades.csv            # teacher only
├── Submissions/
│   └── Homework 1/                # your own work, or every student's if you teach
├── Modules/                       # files only found in modules
├── Extracted_Files/               # files linked inside pages
├── Media/                         # Canvas videos and audio, with captions
├── Modules.html
├── Syllabus.html
├── Grades.csv                     # student
├── Gradebook.csv                  # teacher only
├── Students.csv                   # teacher only
├── Grading Weights.html           # when the course uses weighted groups
├── styles.css
└── manifest.json
```

In ZIP mode the same structure is inside `Course Name.zip`. In Markdown mode, pages end in `.md` and there's no `styles.css`.

**A study pack for AI** is one flat folder (`Course Name - AI study pack`): `00 Course guide.md`, one Markdown file per module (`01 Week 1.md`, …), the slides and PDFs named by module (`M01 Lecture 1.pdf`), and `_extras/` with web links and the files the tool doesn't accept. It never contains other students' work, grades or scores.

**Files for coding agents** is the copy in Markdown, where every page starts with front matter (type, title, module, due date, points, Canvas link), plus `AGENTS.md` (how to read the folder), `llms.txt` (an index by module) and `course.json` (modules, documents, files, grading weights and what's missing, as data).

## How it works

On a Canvas page the extension adds its buttons and does nothing else. On every other site the content script stops right away. A download opens an export tab, which reads the course through the Canvas REST API with your session, the same way Canvas's own pages do.

The extension checks your role in each course. Instructor-only data (all submissions, the gradebook, quiz answer keys) is only requested when you are a teacher, TA or designer.

Requests run in parallel. Canvas reports how much of its rate limit is left, and the extension speeds up or slows down to match, pausing when Canvas asks it to. Failed requests are retried. A file that still fails is listed instead of being skipped silently, and the export ends as complete, partial or failed.

## Known limitations

- Videos in third-party tools (Canvas Studio, Panopto, Kaltura, YuJa, Echo360, Vimeo, Zoom, Microsoft Stream) live behind that tool's own login, so they can't be downloaded. Only media uploaded through Canvas's own editor is saved. YouTube links are kept as links
- You must be logged into Canvas. There's no API-token or headless mode
- Saved pages are clean copies of the content, not pixel-perfect copies of the Canvas layout
- Choosing a folder to save into needs Chrome or Edge; Firefox and Brave save to Downloads
- Very long paths are shortened to stay under Windows' 260-character limit

## Troubleshooting

**No Download button**: If Canvas was already open when you installed or updated the extension, reload the page once. On heavily customized Canvas themes detection can fail; please open an issue with your Canvas address.

**The course picker is empty**: Try the **Past** tab. Some schools keep old courses under Current, newest term first.

**Some files are missing**: Open the export's overview page (`Open me - <Course>.html`): the list at the bottom says what couldn't be saved and why. Files hidden from students, locked files and files in external tools can't be downloaded.

**"Your browser couldn't save the ZIP"**: For very large courses, choose a folder in the settings (Chrome, Edge), or save as folders instead of a ZIP.
