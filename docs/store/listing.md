# Store listings for 3.0

Copy for the Chrome Web Store, Firefox Add-ons and Edge Add-ons, written 2026-11-01 against the 3.0.0 changelog, README, PRIVACY.md and the UI. Every block in a fenced box is meant to be pasted as it is. The notes around them say why.

Before you paste: the Chrome and Edge **name** and **short description** come from the manifest (`name` and `description` in `wxt.config.ts`). Neither dashboard lets you edit them. So the new name and summary below only go live if those two strings change in `wxt.config.ts` and the package is rebuilt. That is a code change for you to make or approve. It doesn't touch `manifest.snapshot.json`, which tracks permissions only. Firefox lets you edit both in the Developer Hub.

---

## 1. Positioning

**One sentence:** Canvas Course Downloader saves a whole Canvas course to your computer in one click, so you keep your files, pages and grades after the term ends or you graduate.

**Three core messages**, in this order everywhere:

1. **Keep your courses after you lose access.** One click on a course page, or many courses at once from the Dashboard, current or past. Files, pages, assignments, announcements, your submissions and grades.
2. **A copy you can use, and trust.** It opens offline from one overview page. It can be a study pack for NotebookLM, ChatGPT or Claude. It ends with a receipt that names anything it couldn't save. Next time it gets only what's new.
3. **Free and private.** No account, no API token, nothing sent to the developer. Open source.

**Audiences**, most important first:

- **Students before access ends.** End of term, graduating, changing schools. The trigger is a deadline, so the copy names it ("before you lose access").
- **Students who study with AI.** They already upload slides to NotebookLM or ChatGPT one at a time. The study pack does it in one go and fits the tool's file limit.
- **Teachers backing up and archiving.** Before a term closes or the school changes systems. They worry about student data, so their section leads with "students' work stays out unless you include it".

**Keywords to own** (use them in plain sentences, never as a list in the listing):

| Primary | Secondary | Teachers | AI |
| --- | --- | --- | --- |
| canvas course downloader, canvas downloader, download canvas files, canvas lms | download all files from canvas, canvas export, canvas backup, save canvas courses, canvas after graduation, canvas offline | archive canvas course, backup canvas course, canvas imscc export | canvas notebooklm, canvas chatgpt, canvas study guide |

Why: "Canvas" alone is ambiguous in the store. The top result for "canvas downloader" today is a tool that exports HTML `<canvas>` images, and "Canvas Exporter Pro" is another. "Canvas LMS" in the name is what tells both people and the search index which Canvas this is.

---

## 2. Chrome Web Store

### Name (65 of 75 characters)

```
Canvas Course Downloader: Save Canvas LMS Files, Pages and Grades
```

Why: it keeps "Canvas Course Downloader" up front, the name people search for and v2 users know. The descriptor adds "Canvas LMS" (to tell it apart from the HTML canvas tools) and "files", the most common thing people search for. It drops "& Exporter", which pulls in the HTML canvas exporters. "Export" still appears in the description, which the store indexes. Grammarly ("Grammarly: AI Writing Assistant and Grammar Checker App") and Loom ("Loom – Screen Recorder & Screen Capture") use the same brand-plus-descriptor pattern.

If you'd rather keep the old name's search history, a fallback is `Canvas Course Downloader & Exporter for Canvas LMS` (50).

### Short description (126 of 132 characters)

```
Download your Canvas courses in one click, before you lose access: every file, page, assignment and grade. Free, no API token.
```

Why: it opens with the verb and keyword people type ("download", "Canvas courses"), states the reason to act now, names the four things students want most, and ends with the two facts that set it apart from rivals: it's free (Canvas File Downloader limits its free version to 5 files per batch) and it needs no API token (Canvas One-Click Downloader asks for one). It also works as the Edge short description, which comes from the same manifest field.

### Category

Productivity > Education (unchanged).

### Description (plain text)

```
Save your Canvas courses to your computer before you lose access. One click on a course page saves every file, page, assignment and announcement, plus your own submissions and grades, as folders or a ZIP that opens without internet.

When a term ends, Canvas courses turn read-only or disappear. When you graduate, your login can close the same day. Saving a course file by file takes an evening. This takes one click.

HOW IT WORKS
1. Open a course in Canvas and press Download course, next to the course name.
2. The course saves in its own tab. Keep using Canvas, or close it.
3. Press Show in folder and open the "Open me" page.
For many courses at once, press Download courses on your Canvas Dashboard and tick the ones you want, current or past.

WHAT YOU GET
- Files in their Canvas folders, plus files that only appear in modules or are linked inside pages
- Pages, assignments with their rubrics and due dates, announcements, discussions, quizzes, modules and the syllabus
- Your own submissions with feedback, and your grades as a spreadsheet (CSV)
- Videos and audio uploaded to Canvas itself, with captions
- An "Open me" page that works offline: the course by module, and anything that couldn't be saved, with the reason
- Deadlines.ics with every due date, for your calendar
- Pages as web pages or Markdown, saved as one ZIP per course or as folders, in Downloads or a folder you choose (for example inside Google Drive, OneDrive or Dropbox)

STUDY WITH AI
Pick "A study pack for AI" and a download becomes a few tidy files for NotebookLM, ChatGPT or Claude: a course guide with deadlines and grading, one file per module, and the slides and PDFs. When a course has more files than the tool accepts, the pack is split into several notebooks or projects. A study pack never contains other students' work.
For coding tools there's also a Markdown copy with AGENTS.md, llms.txt and course.json.

ONLY WHAT'S NEW
Download a course again and it skips the files you already have. Courses you saved before get a short note on your Canvas Dashboard that names what's new, with a button to download only that.

FOR TEACHERS
Archive the courses you teach before a term closes or your school changes systems: files, pages, assignments, quizzes with their questions, discussion prompts and every deadline. Students' work stays out unless you turn on "Include students' work". Then the copy also holds every submission, the gradebook and quiz results. Optionally, it saves the .imscc course package Canvas makes for importing the course again.

NEW IN 3.0
The whole extension is rewritten. Downloads run in their own tab and fetch several files at once. Every copy has an overview page and a calendar file. Courses you saved before show what's new on your Dashboard, and there are study packs for AI. Your settings and download history carry over.

PRIVATE
- No account and no API token. It uses the Canvas you're already logged in to, on any school's Canvas address.
- Nothing about you or your courses is sent to the developer or anyone else. No analytics, no tracking.
- It talks only to your Canvas, plus GitHub once a day for the project's star count.
- It doesn't submit, post or change anything in your courses.
- Open source under the MIT license: https://github.com/jasp-nerd/canvas-course-downloader

Why Chrome says it can "read and change all your data on all websites": schools run Canvas on their own web addresses, so the extension checks each page to see whether it's Canvas. On every other site it stops at once and reads nothing.

GOOD TO KNOW
- Recordings in other tools (Panopto, Kaltura, Canvas Studio, YuJa, Zoom) can't be downloaded. Videos uploaded to Canvas itself can.
- You need to be logged in to Canvas.
- Saved pages are clean copies of the content, not pixel copies of the Canvas layout.

Free, without ads, made by a student. If it saved you an afternoon, a review helps other students find it. Something missing from a download? The "Open me" page says what and why. Still stuck: https://github.com/jasp-nerd/canvas-course-downloader/issues

Canvas is a trademark of Instructure, Inc. This extension is independent and not affiliated with or endorsed by Instructure.
```

About 4,200 characters. Why it's built this way:

- **The first two lines do the selling.** Most people read the summary and the opening paragraph and then look at screenshots. The opening restates the promise in more detail (Dark Reader and Notion do the same). The second paragraph names the deadline problem in the reader's words.
- **Steps before features.** Three numbered steps answer "is this hard?" before the feature list. Canvas File Downloader and Notion Web Clipper use the same order.
- **Features as things you get, not as settings.** The live v2 description lists settings ("Configurable throttle delay", "manifest.json with course metadata"). This one lists what ends up on your disk.
- **Short CAPS headings.** In a plain-text field they're the only way to make the text scannable. Bitwarden, Loom and Notion all use them. They have no emojis or decorative bullets.
- **Trust after features.** The privacy section is concrete (what it talks to, how often), and it answers the scariest install warning in plain words before the reader has to ask. Bitwarden and uBlock Origin Lite build trust from mechanism, not adjectives.
- **The limits stay in.** Third-party recordings are the most common reason for a disappointed review. Saying so up front costs nothing and saves one-star reviews.
- **One ask at the end, no pressure.** A review, not a donation. Ko-fi and Sponsors live on pages people open themselves.
- **"New in 3.0" sits under the features**, not at the top, because new users are most of the readers. Remove that paragraph around January 2027.

### Privacy tab

**Single purpose** (132 characters):

```
Saves the Canvas LMS courses a user can open, from the Canvas site they are logged in to, to their own computer as folders or a ZIP.
```

**Permission justifications:**

| Field | Justification |
| --- | --- |
| `activeTab` | When the user presses the toolbar button or the keyboard shortcut, the extension reads which Canvas course the current tab shows, so it can download that course. |
| `declarativeNetRequest` | One static rule (rules.json) adds an Access-Control-Allow-Origin header to responses from Canvas's file server, canvas-user-content.com, so course files served from there can be read and put into the ZIP. It blocks nothing and changes no other site. |
| `downloads` | Saves the course files and ZIPs to the user's Downloads folder and shows a finished download in its folder when the user presses Show in folder. |
| `notifications` | Tells the user when an automatic download of new course files has finished. That setting is off unless the user turns it on. |
| `storage` | Keeps the user's settings, the list of files already downloaded per course (so later downloads skip them), when Canvas was last checked for new files, and which notes the user dismissed. Stored in the browser only. |
| Host permission `*://*.instructure.com/*` | Reads the user's courses through the Canvas API of Canvas sites hosted by Instructure, with the user's own logged-in session. |
| Content script on `https://*/*` | Schools run Canvas on their own domains (such as canvas.university.edu), so the content script loads on HTTPS pages to recognize Canvas and add the Download course button. On pages that aren't Canvas it exits right away without reading anything. |
| Optional host `*://*.canvas-user-content.com/*` | Asked for only when the user clicks Allow access in the settings, for schools that serve submitted files from Canvas's file server. |
| Remote code | No. All code is in the package. No eval, no remotely hosted scripts. |

**Data usage:** tick none of the data types. Certify all three statements (not sold, not used for unrelated purposes, not used for creditworthiness). That matches what the live listing already declares and what PRIVACY.md says. Privacy policy URL: `https://coursedownloader.com/privacy/` once the site is live; until then the GitHub `PRIVACY.md`.

---

## 3. Firefox Add-ons (AMO)

### Name

```
Canvas Course Downloader
```

Why: AMO search is less crowded (searching "canvas download" today finds only small single-purpose add-ons such as Canvas Downloads Enhancer and UBC Canvas Video Downloader), and the slug becomes `canvas-course-downloader`. The summary carries the keywords. Use the long Chrome name here too if you want one name everywhere.

### Summary (238 of 250 characters)

```
Download your Canvas LMS courses in one click: every file, page, assignment and grade, as folders or a ZIP that opens offline. Also study packs for NotebookLM, ChatGPT or Claude, and archives for teachers. Free, open source, no API token.
```

### Description (AMO HTML)

AMO keeps line breaks and allows `<b>`, `<i>`, `<a>`, `<ul>`, `<ol>` and `<li>`, but no headings. Firefox differences from Chrome: no "choose a folder" option (Firefox saves to Downloads), and the shortcut is Alt+Shift+D.

```html
Save your Canvas courses to your computer before you lose access. One click on a course page saves every file, page, assignment and announcement, plus your own submissions and grades, as folders or a ZIP that opens without internet.

When a term ends, Canvas courses turn read-only or disappear. When you graduate, your login can close the same day. Saving a course file by file takes an evening. This takes one click.

<b>How it works</b>
<ol><li>Open a course in Canvas and press <i>Download course</i>, next to the course name.</li><li>The course saves in its own tab. Keep using Canvas, or close it.</li><li>Open the "Open me" page in the download.</li></ol>
For many courses at once, press <i>Download courses</i> on your Canvas Dashboard and tick the ones you want, current or past. Or press Alt+Shift+D on a course page.

<b>What you get</b>
<ul><li>Files in their Canvas folders, plus files that only appear in modules or are linked inside pages</li><li>Pages, assignments with their rubrics and due dates, announcements, discussions, quizzes, modules and the syllabus</li><li>Your own submissions with feedback, and your grades as a spreadsheet (CSV)</li><li>Videos and audio uploaded to Canvas itself, with captions</li><li>An "Open me" page that works offline: the course by module, and anything that couldn't be saved, with the reason</li><li>Deadlines.ics with every due date, for your calendar</li><li>Pages as web pages or Markdown, saved as one ZIP per course or as folders</li></ul>
<b>Study with AI</b>
Pick "A study pack for AI" and a download becomes a few tidy files for NotebookLM, ChatGPT or Claude: a course guide with deadlines and grading, one file per module, and the slides and PDFs. When a course has more files than the tool accepts, the pack is split into several notebooks or projects. A study pack never contains other students' work. For coding tools there's also a Markdown copy with AGENTS.md, llms.txt and course.json.

<b>Only what's new</b>
Download a course again and it skips the files you already have. Courses you saved before get a short note on your Canvas Dashboard that names what's new, with a button to download only that.

<b>For teachers</b>
Archive the courses you teach before a term closes or your school changes systems: files, pages, assignments, quizzes with their questions, discussion prompts and every deadline. Students' work stays out unless you turn on "Include students' work". Then the copy also holds every submission, the gradebook and quiz results. Optionally, it saves the .imscc course package Canvas makes for importing the course again.

<b>Private</b>
<ul><li>No account and no API token. It uses the Canvas you're already logged in to, on any school's Canvas address.</li><li>Nothing about you or your courses is sent to the developer or anyone else. No analytics, no tracking.</li><li>It talks only to your Canvas, plus GitHub once a day for the project's star count.</li><li>It doesn't submit, post or change anything in your courses.</li><li>Open source under the MIT license: <a href="https://github.com/jasp-nerd/canvas-course-downloader">read the code</a>.</li></ul>
Why it asks for access to all websites: schools run Canvas on their own web addresses, so the extension checks each page to see whether it's Canvas. On every other site it stops at once and reads nothing.

<b>Good to know</b>
<ul><li>Recordings in other tools (Panopto, Kaltura, Canvas Studio, YuJa, Zoom) can't be downloaded. Videos uploaded to Canvas itself can.</li><li>You need to be logged in to Canvas.</li><li>Downloads go to your Downloads folder. Choosing another folder needs Chrome or Edge.</li></ul>
Free, without ads, made by a student. If it saved you an afternoon, a review helps other students find it. Something missing? The "Open me" page says what and why. Still stuck: <a href="https://github.com/jasp-nerd/canvas-course-downloader/issues">report a problem</a>.

Canvas is a trademark of Instructure, Inc. This add-on is independent and not affiliated with or endorsed by Instructure.
```

Why the differences: no "New in 3.0" paragraph, because 3.0 is the first Firefox version and nobody is upgrading there. Lists are kept on one line because AMO turns every line break inside a list into an extra `<br>`.

### Tags and categories

- **Tags:** `download`. AMO only allows tags from a fixed list (checked against `/api/v5/addons/tags/` today), and that's the only one that fits. "scholar", "productivity" and "education" aren't on the list.
- **Categories** (up to two): **Download Management**, and **Other**. Firefox has no education category.
- **Platforms:** Windows, macOS and Linux only. Leave Android unticked.
- **Support site:** `https://coursedownloader.com/`. **Support email:** leave empty and point to GitHub Issues, as Chrome does.

### Notes to reviewers

```
Canvas Course Downloader saves Canvas LMS courses (files, pages, assignments, grades) to the user's computer, using the Canvas site the user is logged in to.

Building from source: the source package has SOURCE_CODE_REVIEW.md at its root. In short, with Node 22 or later and pnpm 11.28.6:
  pnpm install --frozen-lockfile
  pnpm build:firefox
The output in .output/firefox-mv3/ matches the uploaded package. The bundles are minified by WXT (Vite and Rolldown) from TypeScript and Svelte in src/. Third-party code is exactly the "dependencies" in package.json: Svelte, client-zip, DOMPurify, turndown, @joplin/turndown-plugin-gfm and @webext-core/messaging. No eval, no remote code.

Network: the extension talks only to the user's Canvas site (and Canvas's file server, canvas-user-content.com), plus one cookieless request a day to api.github.com for the project's public star count (src/app/github.ts). It collects no data (data_collection_permissions: none).

Why the content script matches https://*/*: schools run Canvas on their own domains, so it loads on HTTPS pages to recognize Canvas and exits at once on pages that aren't Canvas (src/entrypoints/canvas.content/).

The only write request is optional and off by default: a teacher who turns on "Also save Canvas's course package" makes the extension ask Canvas to build the course's own export (POST /api/v1/courses/:id/content_exports, src/app/course-package.ts).

Testing needs a Canvas account with at least one course. The public repository (https://github.com/jasp-nerd/canvas-course-downloader) also has a mock Canvas server used by the end-to-end tests: pnpm mock:canvas.
```

---

## 4. Edge Add-ons

Edge's **name** and **short description** come from the manifest and can't be edited in Partner Center. They are the Chrome name and short description above. The **description** must be 250 to 10,000 characters.

### Description

Paste the Chrome description with two changes:

- In PRIVATE, replace `Why Chrome says it can "read and change all your data on all websites":` with `Why Edge says it can "read and change all your data on all websites":`
- Leave out the NEW IN 3.0 paragraph. It's the first Edge listing, and Edge users of v2 installed it from the Chrome Web Store and stay there.

### Category

**Productivity**. I couldn't confirm whether Partner Center offers an Education category for new listings. If it does, choose Education.

### Search terms (7 terms, 18 of 21 words, each under 30 characters)

```
canvas course downloader
download canvas files
canvas lms
canvas export
canvas backup
canvas after graduation
notebooklm study pack
```

### Notes for certification

Use the AMO reviewer note, with `pnpm build` and `.output/chrome-mv3/` in place of the Firefox commands, and say the extension is also on the Chrome Web Store under the same publisher.

---

## 5. Screenshots (1280×800)

Capture them from the mock Canvas (`pnpm mock:canvas`) with the invented "Academic Writing" course at "Sample University", like the website. No real course or student data. Each screenshot has a caption bar on a navy (#14202F) or highlighter (#FFC43D) field, with the headline in Gabarito, and the UI below it at 2x. Chrome and Edge show at most 5 and 6 screenshots. AMO has no limit, so it gets all seven.

| # | Caption | What it shows | Why here |
| --- | --- | --- | --- |
| 1 | **Save a whole course in one click** | A Canvas course page with the Download course button next to the course name, in the school's colour, with the cursor on it. | The first screenshot decides most installs. It shows where the extension lives and the one action, on a page every student knows. |
| 2 | **Every course at once, past ones too** | The course picker on the Dashboard: courses by term, three ticked, "Download 3 courses". | Answers "I have 30 courses" and "my old courses aren't on the Dashboard" right after the basic promise. |
| 3 | **Opens offline, laid out by module** | The "Open me" overview page inside an export, in a browser with no internet, modules on the left and the "Couldn't be saved" list at the bottom. | Shows the result, not the process: what you keep after access ends. The missing-files list builds trust without needing words. |
| 4 | **Ready for NotebookLM, ChatGPT or Claude** | The study pack receipt: "Your study pack is ready, 31 sources, all in one notebook", the Open NotebookLM step and "Ask your first question". | The second audience, and the clearest difference from every rival listing. It comes after the basics so it reads as a bonus, not as what the product is. |
| 5 | **Next time, only what's new** | The what's-new note on the Canvas Dashboard naming new files, with its Download button. | Gives people a reason to keep it installed after the first download, and shows it fits into Canvas. |
| 6 (Edge, AMO) | **See what's saved, and what isn't** | The export tab's receipt after a partial download: one lecture listed as missing with the reason, and Show in folder. | Speaks to the "did it get everything?" worry. On Chrome, screenshot 3 covers this. |
| 7 (AMO) | **Archive the courses you teach** | The teacher receipt with "Students' work: not included" visible. | Teachers search less but read more. On Chrome they get the description section. |

Not used: settings (a list of options doesn't sell anything and looks like work) and the what's-new 3.0 page (only v2 users see it).

### Small promo tile (440×280)

Navy field. The logo's dot ring fully filled in red, left of centre. Next to it, "Canvas Course Downloader" in white Gabarito on two lines, and below it one line in highlighter yellow: "Save your courses before they close". Nothing else. Why: this tile shows at thumbnail size in store grids, where only the logo, the name and three or four words are readable. The filled ring hints at "done" without a screenshot.

### Marquee (1400×560)

Left third, on the mist (#F4F6F9) background: "Download your Canvas courses" in navy Gabarito, with "Every file, page and grade, in one click" below it. Right two thirds: a browser window cropped to a Canvas course page with the Download course button, and the export card over it at 100% ("Academic Writing is saved, 54 files, 27 MB, in Downloads") with the ring filled. Pip, waving, small, at the bottom edge of the card. Why: the marquee only appears when the store features the item, so it repeats screenshot 1's promise as a picture of the finished result. It's the same scene as the website hero, so the two match.

The 2.x assets in `media/store/chrome/` show the old UI and should all be replaced.

---

## 6. What's new in 3.0 (for v2 users)

For the GitHub release, AMO's version notes, and the top of the Chrome listing's "New in 3.0" paragraph. The popup's one-time note links to the in-extension page, which already says the same thing.

```
What's new in 3.0

The whole extension is rewritten. Your settings and the list of files you already downloaded carry over, so there's nothing to set up again.

- Downloads run in their own tab. Keep using Canvas, or close it. Several files download at once, so it's faster too.
- Nothing goes missing quietly. Files that couldn't be saved are listed with the reason, on the receipt and inside every download.
- New files on your Dashboard. Courses you saved before show what changed, with a button that gets only the new things.
- Study packs for AI. A download can be a pack for NotebookLM, ChatGPT or Claude.
- Deadlines in your calendar. Every copy has a Deadlines.ics file.
- Save into a folder you choose (Chrome and Edge), such as one inside Google Drive or OneDrive.
- Teachers: students' work now stays out of a copy unless you turn on "Include students' work" in the settings. In 2.x it was always included.

The full list: https://coursedownloader.com/changelog/
```

The teacher line is there on purpose (parity-diffs row 18). It's the one change that turns off something v2 did by default, and a teacher who relies on it needs to find out from the notes, not from an archive with no submissions in it.

---

## 7. For you to confirm

**Claims in the copy:**

1. **"One click."** That's true with saved settings. A new user who skipped setup gets one question at their first download. I think the claim holds, but you decide.
2. **"Every file, page, assignment and grade"** in the short description. Locked and hidden files and third-party recordings can't be saved. The description says so under GOOD TO KNOW, and the receipt lists them.
3. **"On any school's Canvas address."** This matches the README and the custom-domain e2e test. Confirm it holds on Firefox, where host permissions behave differently.
4. **"Free, without ads, made by a student."** These are your promises and your current status.
5. **"It doesn't submit, post or change anything in your courses."** The one exception is the teacher-only, off-by-default .imscc export. It changes no course content, but it does add an entry under Export Course Content. The website makes the same claim.
6. **"Faster"** isn't quantified anywhere, on purpose. If you have a measured number, it would be stronger than the word.
7. **Firefox shortcut Alt+Shift+D** and **no folder picker on Firefox**, both from `wxt.config.ts` and docs/what-it-saves.md.
8. **Edge category:** check whether Education exists in Partner Center.

**Before submitting:**

- The name and summary need the `wxt.config.ts` change described at the top. Otherwise Chrome and Edge keep "Canvas Course Downloader & Exporter" and the old summary.
- `.output/chrome-mv3/manifest.json` looks stale: its action title is "Course Downloader", while `wxt.config.ts` says "Canvas Course Downloader". Rebuild before you zip.
- The live Chrome description describes 2.x (teachers' copies include all student work, a throttle setting). Replace it the same day 3.0 goes live.
- The AMO reviewer note offers a Canvas account only in general terms. Decide whether to give reviewers a test login.

**Left out on purpose:**

- **User counts and ratings.** The stores show them. The weekly count swung from 10.6k to about 3k because of a managed install leaving, so a number in the text would be wrong within weeks.
- **Review quotes.** The Chrome Web Store's spam policy rules out unattributed testimonials in descriptions, and real reviews already show under the listing.
- **Pip's name.** The name isn't final (`src/ui/brand.ts`), and the mascot works better seen than explained.
- **The "can my teacher see?" answer** from the website FAQ. It's honest and useful, but it raises a worry in a place built to sell. It's better on the site.
- **Comparisons with rivals**, the 30-release history, and "made in March 2026". None of these help someone decide in the store.
- **Coding-agent files** get one line. It's a small audience, and more detail would make the listing look like it's for developers.
