/**
 * Canvas Course Downloader — Download Orchestration
 *
 * Settings management, ZIP bundling, course content fetching,
 * and download handoff to the background service worker.
 */

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const SETTING_DEFAULTS = {
  contentTypes: {
    files: true, pages: true, assignments: true, submissions: true, discussions: true,
    announcements: true, modules: true, syllabus: true, grades: true,
    quizzes: true, linkedFiles: true,
    offlineViewer: true, // Setting to allow budling of viewer inside of each course export
    saveJson: true // Setting to allow saving the course data as a json file Necessary for ^^^^^^^
  },
  conflictAction: "uniquify",
  throttleMs: 250,
  folderPrefix: "",
  zipMode: true,
  incrementalMode: false,
  excludeVideos: false,
  maxFileSizeMB: 0,
  preset: "full-archive",
  exportFormat: "html",
};

/** Loads user settings from chrome.storage.sync, falling back to defaults. */
function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(SETTING_DEFAULTS, (s) => resolve(s));
  }).then((s) => {
    // Double-check that if offlineViewer is selected, saveJson is selected
    if (s.contentTypes.offlineViewer && !s.contentTypes.saveJson) {
      s.contentTypes.saveJson = true;
    }
    return s;
  });
}

// ---------------------------------------------------------------------------
// Rubric + quiz rendering helpers
//
// These capture course elements modeled on dlxmax's canvas-teacher-export
// (MIT-licensed, github.com/dlxmax/canvas-teacher-export), ported from its
// Python/regex rendering to the extension's DOM/JS style.
// ---------------------------------------------------------------------------

/** Converts a Blob to a Base64 data-URI string asynchronously using FileReader. */
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Escapes text for safe interpolation into exported HTML. */
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

/** Renders a points value, dropping a redundant ".0" on whole numbers. */
function fmtPoints(v) {
  if (v == null || v === "") return "";
  const n = Number(v);
  return Number.isNaN(n) ? String(v) : String(n);
}

/**
 * Points label for one rubric rating tier. When the criterion uses point ranges
 * (criterion_use_range), Canvas shows each tier as "high to >low", where low is
 * the next lower tier's points (exclusive). Otherwise it's a single number.
 * Mirrors dlxmax's rating_points_label so range rubrics read correctly.
 */
function ratingPointsLabel(points, allPoints, useRange) {
  if (points == null) return "";
  const p = Number(points);
  if (!useRange || Number.isNaN(p)) return fmtPoints(points);
  const lowers = allPoints.filter((x) => x != null && Number(x) < p).map(Number);
  const low = lowers.length ? Math.max(...lowers) : 0;
  return `${fmtPoints(p)} to >${fmtPoints(low)}`;
}

/**
 * Renders a rubric *definition* (criteria + rating tiers). Part of the
 * assignment/quiz itself, so it's shown to students and teachers alike.
 */
function renderRubricDefinition(rubric) {
  if (!Array.isArray(rubric) || rubric.length === 0) return "";
  let html = "<h3>Rubric</h3><table><thead><tr><th>Criterion</th><th>Points</th><th>Rating tiers</th></tr></thead><tbody>";
  for (const crit of rubric) {
    const useRange = !!crit.criterion_use_range;
    const allPts = (crit.ratings || []).map((r) => r.points);
    const tiers = (crit.ratings || [])
      .map((r) => `<div><strong>${escapeHtml(ratingPointsLabel(r.points, allPts, useRange))}</strong>: ${escapeHtml(r.description || "")}${r.long_description ? ` — ${escapeHtml(r.long_description)}` : ""}</div>`)
      .join("");
    html += `<tr><td><strong>${escapeHtml(crit.description || "")}</strong>${crit.long_description ? `<div>${escapeHtml(crit.long_description)}</div>` : ""}</td><td>${fmtPoints(crit.points)}</td><td>${tiers}</td></tr>`;
  }
  return html + "</tbody></table>";
}

/**
 * Renders a per-student rubric *assessment* — the points and comments a grader
 * recorded against each criterion. Teacher-only (it lives on others'
 * submissions). `assessment` is the submission's rubric_assessment map keyed
 * by criterion id.
 */
function renderRubricAssessment(rubric, assessment) {
  if (!assessment || !Array.isArray(rubric) || rubric.length === 0) return "";
  let html = "<h3>Rubric assessment</h3><table><thead><tr><th>Criterion</th><th>Points</th><th>Comments</th></tr></thead><tbody>";
  for (const crit of rubric) {
    const a = assessment[crit.id] || {};
    const pts = a.points != null ? `${fmtPoints(a.points)} / ${fmtPoints(crit.points)}` : "—";
    html += `<tr><td>${escapeHtml(crit.description || "")}</td><td>${pts}</td><td>${escapeHtml(a.comments || "")}</td></tr>`;
  }
  return html + "</tbody></table>";
}

/**
 * Renders a quiz question bank, marking correct answers (answer weight > 0).
 * Teacher-only: Canvas refuses /quizzes/{id}/questions for students unless
 * they're actively taking the quiz.
 */
function renderQuizQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) return "";
  let html = "<h3>Questions &amp; answer key</h3>";
  questions.forEach((q, i) => {
    html += `<div class="quiz-question"><p><strong>Q${i + 1}.</strong> (${fmtPoints(q.points_possible)} pts) ${cleanCanvasHtml(q.question_text || "")}</p>`;
    const answers = q.answers || [];
    if (answers.length) {
      html += "<ul>";
      for (const ans of answers) {
        const correct = Number(ans.weight) > 0;
        const text = ans.html ? cleanCanvasHtml(ans.html) : escapeHtml(ans.text || "");
        html += `<li>${correct ? "<strong>✓ </strong>" : ""}${text}${correct ? " <em>(correct)</em>" : ""}</li>`;
      }
      html += "</ul>";
    }
    html += "</div>";
  });
  return html;
}

/**
 * Renders the student's own answered quiz questions (best effort). Canvas
 * returns these via /quiz_submissions/{id}/questions only when the instructor
 * left "let students see their responses" on; otherwise the caller falls back
 * to a score-only page.
 */
function renderOwnQuizAnswers(questions) {
  if (!Array.isArray(questions) || questions.length === 0) return "";
  let html = "<h3>Your answers</h3>";
  questions.forEach((q, i) => {
    html += `<div class="quiz-question"><p><strong>Q${i + 1}.</strong> ${cleanCanvasHtml(q.question_text || "")}</p>`;
    const answers = (q.answers || []).filter((a) => a.id != null);
    if (answers.length) {
      html += "<ul>";
      for (const ans of answers) {
        const text = ans.html ? cleanCanvasHtml(ans.html) : escapeHtml(ans.text || "");
        // `correct` is only present when the instructor exposes correctness.
        const mark = ans.correct === true ? " <em>(correct)</em>" : ans.correct === false ? " <em>(incorrect)</em>" : "";
        html += `<li>${text}${mark}</li>`;
      }
      html += "</ul>";
    }
    html += "</div>";
  });
  return html;
}

// ---------------------------------------------------------------------------
// Quiz Review Page Scraper (concluded-course fallback)
// ---------------------------------------------------------------------------

// Canvas returns 403 on quiz submission API endpoints for concluded courses,
// but the quiz review page is still accessible manually.
async function fetchQuizReviewViaHtml(quiz) {
  try {
    const historyUrl = quiz.html_url.replace(/\?.*$/, "") + "/history";
    const histRes = await fetchWithRetry(historyUrl);
    if (!histRes.ok) return null;

    const histDoc = new DOMParser().parseFromString(await histRes.text(), "text/html");
    const questionsEl = histDoc.querySelector("#questions");
    if (!questionsEl || questionsEl.querySelectorAll(".question").length === 0) return null;
    let html = "";
    for (const sel of [".quiz-submission-data", ".submission_details", ".quiz_score"]) {
      const el = histDoc.querySelector(sel);
      if (el) {
        const text = el.textContent.replace(/\s+/g, " ").trim();
        if (text) { html += `<p>${escapeHtml(text)}</p>`; break; }
      }
    }
    questionsEl.querySelectorAll(".question").forEach((q, i) => {
      const qTextEl = q.querySelector(".question_text");
      const ptsEl = q.querySelector(".user_points, .points_awarded");
      const pts = ptsEl ? ` · ${escapeHtml(ptsEl.textContent.trim())}` : "";
      const qText = qTextEl ? cleanCanvasHtml(qTextEl.innerHTML) : "";
      html += `<div class="quiz-question"><p><strong>Q${i + 1}${pts}.</strong> ${qText}</p>`;
      const answerDivs = q.querySelectorAll(".answer");
      if (answerDivs.length) {
        html += "<ul>";
        answerDivs.forEach((ans) => {
          const isSelected = ans.classList.contains("selected_answer");
          const isCorrect = ans.classList.contains("correct_answer");
          const htmlEl = ans.querySelector(".answer_html");
          const textEl = ans.querySelector(".answer_text");
          const source = (htmlEl && htmlEl.innerHTML.trim()) ? htmlEl.innerHTML : textEl ? textEl.innerHTML : null;
          const text = source
            ? cleanCanvasHtml(source).replace(/<\/?p[^>]*>/gi, " ").trim()
            : escapeHtml(ans.textContent.trim());
          let prefix = "";
          let style = "";
          if (isSelected && isCorrect) { prefix = "✓ "; style = ' style="color:#16a34a;font-weight:600"'; }
          else if (isSelected) { prefix = "✗ "; style = ' style="color:#dc2626;font-weight:600"'; }
          else if (isCorrect) { prefix = "◇ "; style = ' style="color:#16a34a"'; }
          html += `<li${style}>${prefix}${text}</li>`;
        });
        html += "</ul>";
      } else {
        const responseEl = q.querySelector(".quiz_response_text, .user_content");
        if (responseEl) html += `<p><strong>Your answer:</strong> ${cleanCanvasHtml(responseEl.innerHTML)}</p>`;
      }
      html += "</div>";
    });
    return html;
  } catch (err) {
    console.warn(`[Canvas Downloader] Quiz review scrape failed for "${quiz.title}":`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// ZIP Download Helper
// ---------------------------------------------------------------------------

// Above this estimated total size we skip ZIP bundling and fall through to
// per-file streaming downloads. ZIP output is buffered into a single Blob
// before chrome.downloads ingests it; tab processes get unstable above ~2 GB,
// so the threshold is conservative.
const ZIP_MAX_TOTAL_BYTES = 1.5 * 1024 * 1024 * 1024;

async function downloadAsZip(files, courseName, settings, log) {
  const safeName = sanitizeFilename(courseName);
  const totalFiles = files.length;
  let completed = 0;
  let failed = 0;
  const failedFiles = [];

  createDownloadPanel();

  // Bridge the existing cancel flag (set synchronously by the panel's Cancel
  // button) to a standard AbortController, so in-flight fetches actually stop
  // instead of running to completion and being discarded.
  const abortController = new AbortController();
  const cancelWatch = setInterval(() => {
    if (downloadCancelled && !abortController.signal.aborted) abortController.abort();
  }, 100);

  // client-zip pulls from this generator lazily: each yield happens after the
  // previous file's body has been fully streamed into the archive. We use the
  // yield boundary to update the panel, so progress reflects real archive
  // state, not just enqueue order.
  async function* fileSource() {
    const now = new Date();
    for (const file of files) {
      if (abortController.signal.aborted) return;

      const fullPath = `${file.path}${file.filename}`;
      updateDownloadPanel({
        total: totalFiles, completed, failed, queued: totalFiles - completed - failed,
        downloading: 1, currentFile: file.filename, failedFiles, done: false, cancelled: false,
      });

      try {
        let input;
        if (file.content !== undefined) {
          input = new TextEncoder().encode(file.content);
        } else if (file.buffer !== undefined) {
          input = new Uint8Array(file.buffer);
        } else if (file.url && (file.url.startsWith("data:") || file.url.startsWith("blob:"))) {
          const res = await fetch(file.url);
          input = new Uint8Array(await res.arrayBuffer());
        } else if (file.url) {
          const res = await fetch(file.url, { signal: abortController.signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          input = res.body;
        } else {
          throw new Error("No URL, content, or buffer found for file");
        }
        completed++;
        yield {
          name: fullPath,
          input,
          lastModified: now,
          ...(file.size ? { size: file.size } : {}),
        };
      } catch (err) {
        if (err && err.name === "AbortError") return;
        console.warn(`[Canvas Downloader] ZIP: failed to fetch ${file.filename}:`, err);
        failed++;
        failedFiles.push(file.filename);
      }
    }
  }

  log("Generating ZIP file (streaming)...");

  let blob;
  try {
    // client-zip returns a Response whose body streams ZIP bytes as the
    // generator is consumed. Calling .blob() lets the browser materialize the
    // archive from the stream — peak memory is bounded by the network chunk
    // size per file plus the final Blob, vs JSZip which buffered every input
    // file plus the entire output before emitting.
    const response = downloadZip(fileSource(), { buffersAreUTF8: true });
    blob = await response.blob();
  } catch (err) {
    clearInterval(cancelWatch);
    if (abortController.signal.aborted || downloadCancelled) {
      log("Cancelled during ZIP generation.");
      updateDownloadPanel({
        total: totalFiles, completed, failed, queued: 0, downloading: 0,
        currentFile: null, failedFiles, done: true, cancelled: true,
      });
      return;
    }
    console.error("[Canvas Downloader] ZIP generation failed:", err);
    log(`ZIP generation failed: ${err && err.message ? err.message : err}.`);
    updateDownloadPanel({
      total: totalFiles, completed, failed, queued: 0, downloading: 0,
      currentFile: "ZIP generation failed — see console", failedFiles, done: true, cancelled: false,
    });
    throw err;
  }

  clearInterval(cancelWatch);

  if (downloadCancelled) {
    log("Cancelled after ZIP was generated — not saving.");
    updateDownloadPanel({
      total: totalFiles, completed, failed, queued: 0, downloading: 0,
      currentFile: null, failedFiles, done: true, cancelled: true,
    });
    return;
  }

  // Convert the ZIP Blob to a Base64 data-URI string.
  // FileReader converts the Blob natively in C++, producing a standard JS string
  // that passes through chrome.runtime.sendMessage without ArrayBuffer serialization issues.
  const dataUrl = await blobToDataUrl(blob);

  await new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "START_DOWNLOAD",
        payload: {
          files: [{ url: dataUrl, filename: `${safeName}.zip`, path: "" }],
          courseName: "",
          conflictAction: settings.conflictAction,
          throttleMs: 0,
          folderPrefix: settings.folderPrefix,
        },
      },
      (response) => {
        if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
        resolve(response);
      }
    );
  });

  updateDownloadPanel({
    total: totalFiles, completed, failed, queued: 0, downloading: 0,
    currentFile: null, failedFiles, done: true, cancelled: false,
  });

  log(`ZIP created: ${safeName}.zip (${completed} files, ${failed} failed)`);
}

// ---------------------------------------------------------------------------
// Course Content Fetcher
// ---------------------------------------------------------------------------

/**
 * Downloads every available resource from a single Canvas course.
 *
 * @param {string} courseId   - The numeric Canvas course ID
 * @param {string} courseName - Human-readable course name (used for folder paths)
 * @param {string} domain     - Origin URL of the Canvas instance
 * @param {function} onProgress - Optional callback for UI status updates
 */
async function downloadCourse(courseId, courseName, domain, onProgress) {
  const settings = await loadSettings();
  const types = settings.contentTypes;
  // Back-compat: submissions had no separate toggle before v2.9.1 and rode on
  // the "assignments" type. Settings saved by older versions have no
  // `submissions` key, so inherit the assignments choice to preserve behavior.
  if (types.submissions === undefined) types.submissions = types.assignments;
  const isMarkdown = settings.exportFormat === "markdown";
  const docExt = isMarkdown ? "md" : "html";
  const log = (msg) => {
    console.log(`[Canvas Downloader] [${courseName}] ${msg}`);
    if (onProgress) onProgress(msg);
  };

  // Submission and discussion attachments are served from Canvas's
  // user-content CDN, an *optional* host permission (see ENSURE_CDN_PERMISSION
  // in background.js for why it can't be required). First download prompts
  // once; every later call resolves silently. Denial is non-fatal — the
  // affected files just fail and the user can grant access in Settings.
  if (types.submissions || types.discussions) {
    try {
      const perm = await chrome.runtime.sendMessage({ type: "ENSURE_CDN_PERMISSION" });
      if (!perm?.granted) {
        showToast(
          "Some submitted files may be skipped. Allow access to canvas-user-content.com in Settings to include them.",
          "info"
        );
      }
    } catch (err) {
      console.warn("[Canvas Downloader] CDN permission check failed:", err);
    }
  }

  const api = (path) => `${domain}/api/v1/courses/${courseId}/${path}`;
  const filesToDownload = [];
  const seenFileIds = new Set();
  // Maps Canvas module-item ids to the underlying { type, key } so cross-reference
  // rewriting can dereference /modules/items/<id> URLs to the actual resource.
  const moduleItemIdToResource = new Map();

  // Teacher/TA/designer sessions can reach endpoints students can't (all
  // submissions, full discussion threads, every student's grades). Detect the
  // role once and let each content block opt into the richer teacher fetches.
  // Students (or any failure) fall back to the exact behavior as before.
  const isTeacher = await fetchCourseRole(domain, courseId);
  log(isTeacher ? "Teacher role detected — archiving student data" : "Student role — archiving own view");

  // Fetch the course object itself so we can access the term name, other data.
  const courseData = await fetchWithRetry(api("?include[]=term"));
  const courseDataJson = await courseData.json();
  const courseTerm = courseDataJson?.term;
  console.log(`[Canvas Downloader] Course Term: ${JSON.stringify(courseTerm)}`);
  const useAssignmentGroups = courseDataJson?.apply_assignment_group_weights ?? true;


  // Counts surfaced in the export manifest.
  let discussionReplyCount = 0;
  let studentSubmissionCount = 0;
  let gradebookStudentCount = 0;
  let quizCount = 0;

  // --- Shared teacher roster + section map -----------------------------------
  // Fetched once and reused by the gradebook (section column + Students.csv),
  // the per-student submission pages, and quiz score tables. Only a teacher can
  // list the roster, so this stays empty for students.
  let students = [];
  const userIdToName = new Map();
  const userIdToSection = new Map();
  if (isTeacher && (types.grades || types.quizzes || types.assignments || types.discussions)) {
    log("Fetching roster...");
    students = await fetchAllPages(api("users?enrollment_type[]=student&per_page=100"));
    for (const s of students) userIdToName.set(String(s.id), s.sortable_name || s.name || `user_${s.id}`);
    try {
      const sections = await fetchAllPages(api("sections?include[]=students&per_page=100"));
      for (const sec of sections) {
        for (const stu of sec.students || []) userIdToSection.set(String(stu.id), sec.name || "");
      }
    } catch (err) {
      console.warn("[Canvas Downloader] Sections fetch failed:", err);
    }
  }

  /**
   * Builds a *raw* document entry (no data-URI encoding yet). Bodies stay as
   * HTML strings on the entry so the cross-reference rewrite pass can mutate
   * hrefs before final encoding. `resourceType` + `resourceId` let the URL
   * map identify this entry as the target of Canvas links pointing at it.
   */
  const buildDocEntry = (title, htmlBody, filenameStem, path, resourceType, resourceId = null) => ({
    rawBody: htmlBody,
    title,
    resourceType,
    resourceId,
    filename: `${filenameStem}.${docExt}`,
    path,
  });

  /** True if this entry is a generated document (raw body) OR a synthesized in-memory file (CSV, manifest). */
  const isSynthetic = (f) => f.rawBody !== undefined || f.content !== undefined || f.buffer !== undefined || (f.url && (f.url.startsWith("data:") || f.url.startsWith("blob:")));

  // --- Stylesheet for exported HTML ----------------------------------------
  if (!isMarkdown) {
    filesToDownload.push({
      content: FALLBACK_EXPORT_CSS,
      mimeType: "text/css;charset=utf-8",
      filename: "styles.css",
      path: "",
    });
  }

  // --- Files & Folders -------------------------------------------------------
  let files = [];
  if (types.files) {
    log("Fetching files...");
    const folders = await fetchAllPages(api("folders?per_page=100"));
    const folderPathById = {};
    folders.forEach((f) => (folderPathById[f.id] = f.full_name || f.name));

    files = await fetchAllPages(api("files?per_page=100"));

    files.forEach((file) => {
      let folder = folderPathById[file.folder_id] || "";
      if (folder.startsWith("course files")) folder = folder.slice("course files".length);
      if (folder && !folder.endsWith("/")) folder += "/";
      if (folder.startsWith("/")) folder = folder.slice(1);

      seenFileIds.add(String(file.id));
      filesToDownload.push({ url: file.url, filename: file.display_name, path: `Files/${folder}`, size: file.size || 0, contentType: file["content-type"] || "", updatedAt: file.updated_at || file.modified_at || "", canvasId: String(file.id) });
    });
    if (types.saveJson) {
      // Saves information about the files and folders to a JSON file for the viewer to use later.
      let files_obj = { files: files, folders: folders }; // store the files and folders arrays in a single object and saves them to the Files.json
      filesToDownload.push({
        content: JSON.stringify(sanitizeJsonHtml(files_obj)),
        mimeType: "application/json;charset=utf-8",
        filename: "Files.json",
        path: "Files/",
      });
    }
  }

  // --- Hidden file extraction ------------------------------------------------
  // Scans both anchors (a[href]) and embedded media (img/iframe/source[src]) for
  // /files/<id> references. Canvas embeds inline images as <img src=".../files/
  // <id>/preview">, which are otherwise neither downloaded nor link-rewritten —
  // so without this they render as broken images in the offline archive.
  async function extractLinkedFiles(html, source) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const links = doc.querySelectorAll(
      'a[href*="/files/"], img[src*="/files/"], iframe[src*="/files/"], source[src*="/files/"]'
    );

    for (const link of links) {
      const ref = link.getAttribute("href") || link.getAttribute("src") || "";
      const id = ref.match(/\/files\/(\d+)/)?.[1];
      if (!id || seenFileIds.has(id)) continue;

      try {
        const res = await fetchWithRetry(`${domain}/api/v1/files/${id}`);
        if (!res.ok) continue;
        const data = await res.json();

        const fileId = String(data.id || id);
        if (!seenFileIds.has(fileId)) {
          seenFileIds.add(fileId);
          filesToDownload.push({
            url: data.url,
            filename: data.display_name || (link.textContent || "").trim() || `file_${id}`,
            path: "Extracted_Files/",
            size: data.size || 0,
            contentType: data["content-type"] || "",
            updatedAt: data.updated_at || data.modified_at || "",
            canvasId: fileId,
          });
        }
      } catch (err) {
        console.error(`[Canvas Downloader] Error fetching linked file ${id} from ${source}:`, err);
      }
    }
  }

  // --- Pages: collect slugs from the Pages API list -------------------------
  // Bodies are fetched later, AFTER Modules, so we can also pull in pages that
  // only appear as module items (Canvas's Pages list omits those for students
  // when the page isn't in the main pages navigation).
  let pages = [];
  let pages_included_in_obj = []; // store the pages slugs in an array to save them to the pages.json for use later in the viewer.
  const pageSlugsToFetch = new Set();
  if (types.pages) {
    log("Fetching pages list...");
    pages = await fetchAllPages(api("pages?per_page=100"));
    for (const p of pages) {
      if (p.url) pageSlugsToFetch.add(p.url);
      pages_included_in_obj.push(p.url); // Pushes each included page
    }
  }

  // --- Assignments -----------------------------------------------------------
  // The assignment list is also needed to build the teacher gradebook columns,
  // so fetch it whenever assignments OR (teacher + grades) are requested, but
  // only emit the per-assignment documents when assignments itself is on.
  let assignments = [];
  const needAssignmentList = types.assignments || types.submissions || (isTeacher && types.grades);
  if (needAssignmentList) {
    log("Fetching assignments...");
    assignments = await fetchAllPages(api("assignments?per_page=100"));
  }
  if (types.assignments) {
    for (const a of assignments) {
      let body = "";
      if (a.due_at) body += `<p><strong>Due:</strong> ${formatDate(a.due_at)}</p>`;
      if (a.description) {
        body += `<div>${cleanCanvasHtml(a.description)}</div>`;
        if (types.linkedFiles) await extractLinkedFiles(a.description, `Assignment: ${a.name}`);
      }
      body += renderRubricDefinition(a.rubric);
      const safeName = sanitizeFilename(a.name).substring(0, 100);
      filesToDownload.push(buildDocEntry(a.name, body, safeName, "Assignments/", "assignment", String(a.id)));
    }
  }

  // --- Submissions -----------------------------------------------------------
  // Per assignment that accepts online submissions, one folder per student at
  // Submissions/<Assignment>/<Student>/ holding every attempt's files plus a page
  // with each attempt's grade, text, and the instructor comment thread. Every
  // attempt is kept (submission_history), not just the latest; files from older
  // attempts are prefixed "Attempt N - ". The teacher path also writes a
  // _grades.csv covering every student. Assignments with no online submission
  // type are skipped — their scores already live in Gradebook.csv / Grades.csv.
  const ONLINE_SUBMISSION_TYPES = new Set([
    "online_text_entry", "online_upload", "online_url", "media_recording", "student_annotation", "discussion_topic",
  ]);

  /**
   * Renders one submission (all attempts) into `folder`: each attempt's
   * attachments, a single page summarizing every attempt and the full comment
   * thread. Returns true if any attempt had real submitted content. Shared by
   * the teacher archive (every student) and the student self-export.
   */
  const renderSubmission = async (a, s, folder, studentName, section) => {
    const history = s.submission_history && s.submission_history.length ? s.submission_history : [s];
    const attempts = history.filter(
      (h) => h.submitted_at || (h.attachments && h.attachments.length) || h.body || h.url
    );
    if (attempts.length === 0) return false;
    const multi = attempts.length > 1;
    const attemptLabel = (h) => (multi ? `Attempt ${h.attempt || "?"} - ` : "");

    for (const h of attempts) {
      for (const att of h.attachments || []) {
        const fileId = String(att.id || "");
        if (att.url && fileId && !seenFileIds.has(fileId)) {
          seenFileIds.add(fileId);
          const base = att.display_name || att.filename || `attachment_${fileId}`;
          filesToDownload.push({
            url: att.url,
            filename: `${attemptLabel(h)}${base}`,
            path: folder,
            size: att.size || 0,
            contentType: att["content-type"] || "",
            updatedAt: att.updated_at || att.modified_at || "",
            canvasId: fileId,
          });
        }
      }
    }

    let body = `<p><strong>Student:</strong> ${escapeHtml(studentName)}${section ? ` · ${escapeHtml(section)}` : ""}</p>`;
    body += `<p><strong>Status:</strong> ${escapeHtml(s.workflow_state || "—")}</p>`;
    for (const h of attempts) {
      if (multi) body += `<h3>Attempt ${escapeHtml(String(h.attempt || "?"))}</h3>`;
      if (h.submitted_at) body += `<p><strong>Submitted:</strong> ${formatDate(h.submitted_at)}</p>`;
      if (h.score != null || h.grade != null) {
        body += `<p><strong>Grade:</strong> ${escapeHtml(String(h.grade ?? ""))} (${h.score ?? ""} / ${a.points_possible ?? "—"})${h.late ? " · <em>late</em>" : ""}</p>`;
      }
      if (h.body) {
        body += `<div>${cleanCanvasHtml(h.body)}</div>`;
        if (types.linkedFiles) await extractLinkedFiles(h.body, `Submission: ${a.name} — ${studentName}`);
      }
      if (h.url) body += `<p><strong>Submitted URL:</strong> <a href="${escapeHtml(h.url)}">${escapeHtml(h.url)}</a></p>`;
      const names = (h.attachments || []).map((att) => att.display_name || att.filename).filter(Boolean);
      if (names.length) body += `<p><strong>Files:</strong> ${names.map((n) => escapeHtml(attemptLabel(h) + n)).join(", ")}</p>`;
    }
    body += renderRubricAssessment(a.rubric, s.rubric_assessment);
    const comments = s.submission_comments || [];
    if (comments.length) {
      body += "<h3>Comments</h3><ul>";
      for (const c of comments) {
        const at = c.attempt ? ` · attempt ${c.attempt}` : "";
        body += `<li><strong>${escapeHtml(c.author_name || "Unknown")}</strong>${c.created_at ? ` · ${formatDate(c.created_at)}` : ""}${at}: ${cleanCanvasHtml(c.comment || "")}</li>`;
      }
      body += "</ul>";
    }
    const stem = sanitizeFilename(studentName).substring(0, 80) || "submission";
    filesToDownload.push(buildDocEntry(`${a.name} — ${studentName}`, body, stem, folder, "submission", null));
    return true;
  };

  // Teacher: archive every student's submissions, plus a per-assignment grades CSV.
  if (isTeacher && types.submissions && assignments.length > 0) {
    log("Fetching student submissions...");
    const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    for (const a of assignments) {
      if (!(a.submission_types || []).some((t) => ONLINE_SUBMISSION_TYPES.has(t))) continue;

      const safeAssignment = sanitizeFilename(a.name).substring(0, 80);
      const subs = await fetchAllPages(
        api(`assignments/${a.id}/submissions?per_page=100&include[]=user&include[]=submission_comments&include[]=submission_history&include[]=rubric_assessment`)
      );
      if (subs.length === 0) continue;

      const gradeRows = ['"Student","Section","Status","Submitted At","Score","Grade","Late","Missing"'];
      let anyRealSubmission = false;

      for (const s of subs) {
        const studentName = s.user?.sortable_name || s.user?.name || `user_${s.user_id}`;
        const section = userIdToSection.get(String(s.user_id)) || "";
        gradeRows.push([
          studentName, section, s.workflow_state || "", s.submitted_at ? formatDate(s.submitted_at) : "",
          s.score ?? "", s.grade ?? "", s.late ? "yes" : "", s.missing ? "yes" : "",
        ].map(csvCell).join(","));

        const safeStudent = sanitizeFilename(studentName).substring(0, 80) || `user_${s.user_id}`;
        const folder = `Submissions/${safeAssignment}/${safeStudent}/`;
        if (await renderSubmission(a, s, folder, studentName, section)) {
          anyRealSubmission = true;
          studentSubmissionCount++;
        }
      }

      if (anyRealSubmission && gradeRows.length > 1) {
        filesToDownload.push({
          url: `data:text/csv;charset=utf-8,${encodeURIComponent(gradeRows.join("\n"))}`,
          filename: "_grades.csv",
          path: `Submissions/${safeAssignment}/`,
        });
      }
    }
  }

  // Student: archive your own submissions (every attempt) the same way. The
  // /self endpoint is always readable for your own work, so this needs no
  // roster and runs whenever a student requests assignments.
  if (!isTeacher && types.submissions && assignments.length > 0) {
    let self_submission_obj = {} // a.id: response object for each assignment to save to submissions.json for use later in the viewer.
    log("Fetching your submissions...");
    for (const a of assignments) {
      if (!(a.submission_types || []).some((t) => ONLINE_SUBMISSION_TYPES.has(t))) continue;
      let s;
      try {
        const res = await fetchWithRetry(
          api(`assignments/${a.id}/submissions/self?include[]=user&include[]=submission_comments&include[]=submission_history&include[]=rubric_assessment`)
        );
        if (!res.ok) continue;
        s = await res.json();
      } catch (err) {
        console.warn(`[Canvas Downloader] Own submission fetch failed for ${a.name}:`, err);
        continue;
      }
      if (s) self_submission_obj[a.id] = s; // store the submission response object for this assignment
      const safeAssignment = sanitizeFilename(a.name).substring(0, 80);
      const studentName = s.user?.sortable_name || s.user?.name || "You";
      if (await renderSubmission(a, s, `Submissions/${safeAssignment}/`, studentName, "")) {
        studentSubmissionCount++;
      }
    }
    // Save the submissions object to a JSON file for use later in the viewer.
    if (types.saveJson) {
      filesToDownload.push({
        content: JSON.stringify(sanitizeJsonHtml(self_submission_obj)),
        mimeType: "application/json;charset=utf-8",
        filename: "Submissions.json",
        path: "Submissions/",
      });
    }
  }

  // --- Announcements ---------------------------------------------------------
  let announcements = [];
  if (types.announcements) {
    log("Fetching announcements...");
    announcements = await fetchAllPages(api("discussion_topics?only_announcements=true&per_page=100"));

    for (const a of announcements) {
      let body = "";
      if (a.posted_at) body += `<p><strong>Posted:</strong> ${formatDate(a.posted_at)}</p>`;
      if (a.message) {
        body += `<div>${cleanCanvasHtml(a.message)}</div>`;
        if (types.linkedFiles) await extractLinkedFiles(a.message, `Announcement: ${a.title}`);
      }
      const safeName = sanitizeFilename(a.title).substring(0, 100);
      filesToDownload.push(buildDocEntry(a.title, body, safeName, "Announcements/", "announcement", String(a.id)));
    }
    if (announcements.length > 0 && types.saveJson) {
      // Save the announcements object to a JSON file for use later in the viewer.
      filesToDownload.push({
        content: JSON.stringify(sanitizeJsonHtml(announcements)),
        mimeType: "application/json;charset=utf-8",
        filename: "Announcements.json",
        path: "Announcements/",
      });
    }
  }

  // --- Discussions -----------------------------------------------------------
  let discussions = [];
  if (types.discussions) {
    log("Fetching discussions...");
    const allTopics = await fetchAllPages(api("discussion_topics?per_page=100"));
    discussions = allTopics.filter((d) => !d.is_announcement);

    // Recursively renders the threaded reply tree from a topic's /view payload.
    // Side effects: extracts linked files and pushes reply attachments as files.
    const renderEntries = async (entries, participantName, topicTitle, attachmentPath, depth = 0) => {
      if (!Array.isArray(entries) || entries.length === 0) return "";
      let html = `<ul class="discussion-replies" style="list-style:none;margin:0;padding-left:${depth ? 24 : 0}px;border-left:${depth ? "2px solid #ddd" : "none"}">`;
      for (const e of entries) {
        const author = participantName.get(String(e.user_id)) || "Unknown user";
        const when = e.created_at ? formatDate(e.created_at) : "";
        const message = e.deleted ? "<em>[deleted]</em>" : cleanCanvasHtml(e.message || "");
        html += `<li style="margin:12px 0"><p style="margin:0 0 4px"><strong>${author}</strong>${when ? ` · <span style="color:#666">${when}</span>` : ""}</p><div>${message}</div>`;

        if (types.linkedFiles && e.message) await extractLinkedFiles(e.message, `Discussion reply: ${topicTitle}`);

        const atts = e.attachments || (e.attachment ? [e.attachment] : []);
        for (const att of atts) {
          const fileId = String(att.id || "");
          if (att.url && fileId && !seenFileIds.has(fileId)) {
            seenFileIds.add(fileId);
            filesToDownload.push({
              url: att.url,
              filename: att.display_name || att.filename || `attachment_${fileId}`,
              path: attachmentPath,
              size: att.size || 0,
              contentType: att["content-type"] || "",
              updatedAt: att.updated_at || att.modified_at || "",
              canvasId: fileId,
            });
          }
        }

        discussionReplyCount++;
        html += await renderEntries(e.replies, participantName, topicTitle, attachmentPath, depth + 1);
        html += "</li>";
      }
      html += "</ul>";
      return html;
    };
    let discussion_obj = {}; // store the discussions and their replies in an object to save them to discussions.json for use later in the viewer.
    for (const d of discussions) {
      let body = "";
      if (d.user_name) body += `<p><strong>Author:</strong> ${d.user_name}</p>`;
      if (d.posted_at) body += `<p><strong>Posted:</strong> ${formatDate(d.posted_at)}</p>`;
      if (d.message) {
        body += `<div>${cleanCanvasHtml(d.message)}</div>`;
        if (types.linkedFiles) await extractLinkedFiles(d.message, `Discussion: ${d.title}`);
      }

      // Full threaded view (replies). Not gated on role: students can read
      // /view for any discussion they can see, including their own posts.
      // Fails soft (e.g. 403 on require-initial-post or concluded courses) —
      // the opening message above is still exported.
      try {
        const res = await fetchWithRetry(api(`discussion_topics/${d.id}/view`), {
          headers: { Accept: "application/json+canvas-string-ids" },
        });
        if (res.ok) {
          const view = await res.json();
          const participantName = new Map((view.participants || []).map((p) => [String(p.id), p.display_name || p.name]));
          const safeTopic = sanitizeFilename(d.title).substring(0, 80);
          const repliesHtml = await renderEntries(view.view, participantName, d.title, `Discussions/${safeTopic}/`);
          if (repliesHtml) body += `<hr><h3>Replies</h3>${repliesHtml}`;
          d.view = view;
          discussion_obj[d.id] = d; // store the discussion topic and its replies in the discussions object
        } else {
          console.warn(`[Canvas Downloader] Discussion thread unavailable (${d.title}) — HTTP ${res.status}`);
        }
      } catch (err) {
        console.error(`[Canvas Downloader] Discussion thread error (${d.title}):`, err);
      }

      if (isTeacher) {
        // Graded discussions are backed by an assignment; capture per-student
        // scores into a _grades.csv beside the topic (dlxmax: grading was missing).
        if (d.assignment_id) {
          try {
            const gsubs = await fetchAllPages(
              api(`assignments/${d.assignment_id}/submissions?per_page=100&include[]=user`)
            );
            const graded = gsubs.filter((s) => s.score != null || s.grade != null || s.workflow_state === "graded");
            if (graded.length) {
              const safeTopic = sanitizeFilename(d.title).substring(0, 80);
              const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
              const rows = ['"Student","Section","Score","Grade","Submitted At","Workflow State"'];
              for (const s of graded) {
                const name = s.user?.sortable_name || s.user?.name || `user_${s.user_id}`;
                rows.push([
                  name, userIdToSection.get(String(s.user_id)) || "",
                  s.score ?? "", s.grade ?? "", s.submitted_at ? formatDate(s.submitted_at) : "", s.workflow_state || "",
                ].map(csvCell).join(","));
              }
              filesToDownload.push({
                url: `data:text/csv;charset=utf-8,${encodeURIComponent(rows.join("\n"))}`,
                filename: "_grades.csv",
                path: `Discussions/${safeTopic}/`,
              });
              body += `<p><em>Graded discussion — per-student scores in <code>${safeTopic}/_grades.csv</code>.</em></p>`;
            }
          } catch (err) {
            console.error(`[Canvas Downloader] Discussion grades error (${d.title}):`, err);
          }
        }
      }

      const safeName = sanitizeFilename(d.title).substring(0, 100);
      filesToDownload.push(buildDocEntry(d.title, body, safeName, "Discussions/", "discussion", String(d.id)));
    }
    if (types.saveJson){ // Saves the Discussions to the course file for the viewer
      filesToDownload.push({
        content: JSON.stringify(sanitizeJsonHtml(discussion_obj), null, 2),
        mimeType: "application/json;charset=utf-8",
        filename: `Discussions.json`,
        path: `Discussions/`,
      });
    }
  }

  // --- Modules ---------------------------------------------------------------
  let modules = [];
  let modules_obj = {} // initialize an empty object to hold module data
  if (types.modules) {
    log("Fetching modules...");
    modules = await fetchAllPages(api("modules?per_page=100"));
    const gradeAssignments = await fetchAllPages(
      api("assignments?per_page=100&include[]=submission&include[]=score_statistics")
    );
    let modulesBody = "";
    for (const [index, mod] of modules.entries()) { // added index parameter to the for loop
      log("Fetching module " + (index + 1) + "/" + modules.length);
      modulesBody += `<h2>${mod.name}</h2><ul>`;
      const items = await fetchAllPages(api(`modules/${mod.id}/items?per_page=100`));

      modules_obj[mod.id] = mod; // store the module object in the modules_obj using its id as the key
      modules_obj[mod.id].items = []; // store the items array in the module object

      
      for (const item of items) {
        const item_with_grade = gradeAssignments.find((a) => a.id === item.content_id);
        modules_obj[mod.id].items.push({ ...item, ...(item_with_grade ?? undefined) }); // store the item with grade in the module object

        const label = item.html_url ? `<a href="${item.html_url}">${item.title}</a>` : item.title;
        modulesBody += `<li>${label} (${item.type})</li>`;
        // Track module-item → underlying-resource linkage for cross-ref rewriting.
        if (item.id) {
          if (item.type === "Page" && item.page_url) {
            pages_included_in_obj.push(item.page_url);
            moduleItemIdToResource.set(String(item.id), { type: "page", key: item.page_url });
          } else if (item.content_id) {
            const typeKey = { Assignment: "assignment", Discussion: "discussion", File: "file", Quiz: "quiz" }[item.type];
            if (typeKey) moduleItemIdToResource.set(String(item.id), { type: typeKey, key: String(item.content_id) });
          }
        }

        // Surface module-only Pages so their bodies (and embedded files) get
        // exported. We don't gate on `types.pages` because the embedded files
        // (PDF slides etc.) are what makes the export usable — the page HTML
        // itself is only pushed downstream when `types.pages` is on.
        if (item.type === "Page") {
          let slug = item.page_url;
          // Some Canvas instances don't return `page_url` on module items; fall
          // back to parsing the slug out of the per-item API URL or html URL.
          if (!slug && item.url) {
            const m = item.url.match(/\/pages\/([^/?#]+)/);
            if (m) slug = decodeURIComponent(m[1]);
          }
          if (!slug && item.html_url) {
            const m = item.html_url.match(/\/pages\/([^/?#]+)/);
            if (m) slug = decodeURIComponent(m[1]);
          }
          if (slug) pageSlugsToFetch.add(slug);
        }

        if (item.type === "File" && item.url) {
          try {
            const res = await fetchWithRetry(item.url);
            if (!res.ok) continue;
            const data = await res.json();

            const fileId = String(data.id || "");
            if (fileId && !seenFileIds.has(fileId)) {
              seenFileIds.add(fileId);
              const safeModName = sanitizeFilename(mod.name);
              filesToDownload.push({
                url: data.url,
                filename: data.display_name || item.title,
                path: `Modules/${safeModName}/`,
                size: data.size || 0,
                contentType: data["content-type"] || "",
                updatedAt: data.updated_at || data.modified_at || "",
                canvasId: fileId,
              });
            }
          } catch (err) {
            console.error(`[Canvas Downloader] Module file error (${item.title}):`, err);
          }
        }
      }
      modulesBody += "</ul>";
    }

    filesToDownload.push(buildDocEntry("Modules", modulesBody, "Modules", "", "module-index"));
    if (types.saveJson){ // Saves Modules Data for use later in the viewer.
      filesToDownload.push({
        content: JSON.stringify(sanitizeJsonHtml(modules_obj), null, 2),
        mimeType: "application/json;charset=utf-8",
        filename: "Modules.json",
        path: "",
      });
    }
  }

  // --- Pages: fetch bodies for every slug (from Pages list + Modules) -------
  // We deduplicate via the Set, so a page appearing both in the Pages list
  // and as a module item is exported once. The fetch runs whenever we have
  // any slugs at all — even if the user unchecked Pages — so that embedded
  // files (PDF slides etc.) inside module-only pages still get extracted.
  let exportedPagesCount = 0;
  if (pageSlugsToFetch.size > 0) {
    log(`Fetching ${pageSlugsToFetch.size} page${pageSlugsToFetch.size === 1 ? "" : "s"}...`);
    console.log("[Canvas Downloader] Page slugs to fetch:", [...pageSlugsToFetch]);
    const pageDetailsMap = new Map();
    for (const slug of pageSlugsToFetch) {
      try {
        const res = await fetchWithRetry(`${domain}/api/v1/courses/${courseId}/pages/${slug}`);
        if (!res.ok) {
          console.warn(`[Canvas Downloader] Page fetch failed for "${slug}" — HTTP ${res.status}`);
          continue;
        }
        const page = await res.json();
        if (page && page.url) pageDetailsMap.set(page.url, page);

        if (types.pages) {
          filesToDownload.push(
            buildDocEntry(
              page.title,
              cleanCanvasHtml(page.body || ""),
              sanitizeFilename(page.url).substring(0, 100),
              "Pages/",
              "page",
              page.url
            )
          );
          exportedPagesCount++;
        }

        if (types.linkedFiles && page.body) await extractLinkedFiles(page.body, `Page: ${page.title}`);
      } catch (err) {
        console.warn(`[Canvas Downloader] Could not fetch page ${slug}:`, err);
      }
    }
    // Store the list of pages and their data to json file
    if (pages.length == 0) {
      pages = await fetchAllPages(api("pages?per_page=100"));
    }
    let pages_obj = (pages.length > 0 ? pages : [...pageDetailsMap.values()])
      .filter((p) => pages_included_in_obj.includes(p.url))
      .map((p) => pageDetailsMap.get(p.url) || p);
    let pages_path = "Pages/";
    if (types.saveJson){ // Saves the Pages to a json file for the viewer.
      filesToDownload.push({
        content: JSON.stringify(sanitizeJsonHtml(pages_obj), null, 2),
        mimeType: "application/json;charset=utf-8",
        filename: "Pages.json",
        path: pages_path,
      });
    }


  } else if (types.pages) {
    console.log("[Canvas Downloader] No pages found via Pages API list or Modules — nothing to fetch.");
  }
  // --- Home Page (front page) -------------------------------------------------------
  if (types.saveJson){
    try {
      let frontPageData = await fetchWithRetry(api('front_page'));
      let frontPageJson = await frontPageData.json();
      if (frontPageData && frontPageJson && frontPageJson.page_id){ // Saves the front page to a json file for the viewer.
        filesToDownload.push({
          content: JSON.stringify(sanitizeJsonHtml(frontPageJson), null, 2),
          mimeType: "application/json;charset=utf-8",
          filename: "FrontPage.json",
          path: "",
        });
      }
    } catch (err) {
      console.warn("[Canvas Downloader] Could not fetch front page:", err);
    }
  }
  // --- Syllabus --------------------------------------------------------------
  if (types.syllabus) {
    log("Fetching syllabus...");
    try {
      const res = await fetchWithRetry(`${domain}/api/v1/courses/${courseId}?include[]=syllabus_body`);
      if (res.ok) {
        const data = await res.json();
        if (data.syllabus_body) {
          if (types.linkedFiles) await extractLinkedFiles(data.syllabus_body, "Syllabus");
          filesToDownload.push(
            buildDocEntry(
              `Syllabus — ${courseName}`,
              cleanCanvasHtml(data.syllabus_body),
              "Syllabus",
              "",
              "syllabus"
            )
          );
        }
      }
    } catch (err) {
      console.error("[Canvas Downloader] Syllabus error:", err);
    }
  }

  // --- Gradebook (teacher only) ----------------------------------------------
  // A teacher has no own submission, so the personal Grades.csv below would be
  // empty. Instead emit a full Gradebook.csv: one row per student, one column
  // per assignment, built from the bulk submissions endpoint.
  if (isTeacher && types.grades && assignments.length > 0 && students.length > 0) {
    log("Fetching gradebook...");
    try {
      const allSubs = await fetchAllPages(api("students/submissions?student_ids[]=all&per_page=100"));

      // Index scores by "<userId>:<assignmentId>".
      const scoreByKey = new Map();
      for (const s of allSubs) scoreByKey.set(`${s.user_id}:${s.assignment_id}`, s.score ?? s.grade ?? "");

      const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
      const header = ["Student", "Login/SIS ID", "Section", ...assignments.map((a) => a.name)].map(q).join(",");
      const pointsRow = [q("Points Possible"), q(""), q(""), ...assignments.map((a) => a.points_possible ?? "")].join(",");
      const rows = [header, pointsRow];

      for (const stu of students) {
        const section = userIdToSection.get(String(stu.id)) || "";
        const cells = [q(stu.sortable_name || stu.name || `user_${stu.id}`), q(stu.login_id || stu.sis_user_id || ""), q(section)];
        for (const a of assignments) cells.push(scoreByKey.get(`${stu.id}:${a.id}`) ?? "");
        rows.push(cells.join(","));
        gradebookStudentCount++;
      }

      filesToDownload.push({
        content: rows.join("\n"),
        mimeType: "text/csv;charset=utf-8",
        filename: "Gradebook.csv",
        path: "",
      });

      // Roster CSV: one row per student with section, login, and email.
      const studentRows = ['"Student","Sortable Name","Login/SIS ID","Email","Section"'];
      for (const stu of students) {
        const section = userIdToSection.get(String(stu.id)) || "";
        studentRows.push([
          stu.name || "", stu.sortable_name || "",
          stu.login_id || stu.sis_user_id || "", stu.email || "", section,
        ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
      }
      filesToDownload.push({
        content: studentRows.join("\n"),
        mimeType: "text/csv;charset=utf-8",
        filename: "Students.csv",
        path: "",
      });
    } catch (err) {
      console.error("[Canvas Downloader] Gradebook error:", err);
    }
  }

  // --- Grades (student: own scores + class statistics) -----------------------
  if (types.grades && !isTeacher) {
    log("Fetching grades...");
    try {
      const gradeAssignments = await fetchAllPages(
        api("assignments?per_page=100&include[]=submission&include[]=score_statistics")
      );
      let assignments_obj = {} // initialize an empty object to hold assignment data for storage later
      if (gradeAssignments.length > 0) {
        const csvRows = [
          "Assignment,Due Date,Points Possible,Score,Grade,Low,Lower Quartile,Median,Mean,Upper Quartile,High",
        ];
        for (const a of gradeAssignments) {
          const name = (a.name || "").replace(/"/g, '""');
          const due = formatDate(a.due_at).slice(0, 10);
          const possible = a.points_possible ?? "";
          const score = a.submission?.score ?? "";
          const grade = a.submission?.grade ?? "";
          const stats = a.score_statistics || {};
          const low = stats.min ?? "";
          const lowerQuartile = stats.lower_quartile ?? "";
          const median = stats.median ?? "";
          const mean = stats.mean ?? "";
          const upperQuartile = stats.upper_quartile ?? "";
          const high = stats.max ?? "";
          csvRows.push(
            `"${name}","${due}",${possible},${score},"${grade}",${low},${lowerQuartile},${median},${mean},${upperQuartile},${high}`
          );
          assignments_obj[a.id] = a;
        }
        filesToDownload.push({
          content: csvRows.join("\n"),
          mimeType: "text/csv;charset=utf-8",
          filename: "Grades.csv",
          path: "",
        });
        // store the assignment data to a JSON file for use later
        if (types.assignments && types.saveJson) {
          filesToDownload.push({
            content: JSON.stringify(sanitizeJsonHtml(assignments_obj), null, 2),
            mimeType: "application/json;charset=utf-8",
            filename: "Assignments.json",
            path: "Assignments/",
          });
        }
      }
    } catch (err) {
      console.error("[Canvas Downloader] Grades error:", err);
    }
  }

  // --- Grading weights (both roles) ------------------------------------------
  // Assignment-group weights determine the final grade when the course applies
  // them. Students see these on their own grades page, so this isn't gated.
  // Furthermore, we store the grading periods to be able to calculate individual semester/quarter 
  // grades if it is a multi-term course.
  if (types.grades) {
    try {
      const groups = await fetchAllPages(api("assignment_groups?per_page=100"));
      if (groups.some((g) => Number(g.group_weight) > 0)) {
        let body = "<table><thead><tr><th>Group</th><th>Weight</th></tr></thead><tbody>";
        let total = 0;
        for (const g of groups) {
          total += Number(g.group_weight) || 0;
          body += `<tr><td>${escapeHtml(g.name || "")}</td><td>${fmtPoints(g.group_weight) || 0}%</td></tr>`;
        }
        body += `<tr><th>Total</th><th>${fmtPoints(total)}%</th></tr></tbody></table>`;
        filesToDownload.push(buildDocEntry(`Grading Weights — ${courseName}`, body, "Grading Weights", "", "grading-weights"));
      }
      if (types.saveJson){
        filesToDownload.push({ // store the assignment group data to json file for use later
          content: JSON.stringify(sanitizeJsonHtml(groups), null, 2),
          mimeType: "application/json;charset=utf-8",
          filename: "AssignmentGroups.json",
          path: "Assignments/",
        });
      }

      //store the grading periods data to json file for use later
      try {
        const gradingPeriodsResponse = await fetchWithRetry(api("grading_periods?per_page=100"));
        const gradingPeriods = await gradingPeriodsResponse.json();
        if (types.saveJson){ // store the grading periods data to json file for use later
          filesToDownload.push({
            content: JSON.stringify(sanitizeJsonHtml(gradingPeriods), null, 2),
            mimeType: "application/json;charset=utf-8",
            filename: "GradingPeriods.json",
            path: "Assignments/",
          });
        }
      } catch (err) {
        console.error("[Canvas Downloader] Grading periods error:", err);
      }
    } catch (err) {
      console.error("[Canvas Downloader] Grading weights error:", err);
    }
  }

  // --- Quizzes ---------------------------------------------------------------
  // Metadata + description for everyone. Teachers also get the question bank
  // with the answer key and a per-student score table + _grades.csv. Students
  // get their own score and, when the instructor left responses visible, their
  // own answered questions. Modeled on dlxmax's canvas-teacher-export.
  if (types.quizzes) {
    log("Fetching quizzes...");
    const quizzes = await fetchAllPages(api("quizzes?per_page=100"));
    for (const quiz of quizzes) {
      const safeQuiz = sanitizeFilename(quiz.title).substring(0, 80);
      const quizPath = `Quizzes/${safeQuiz}/`;
      let body = "";
      const meta = [];
      if (quiz.quiz_type) meta.push(`<strong>Type:</strong> ${escapeHtml(quiz.quiz_type)}`);
      if (quiz.points_possible != null) meta.push(`<strong>Points:</strong> ${fmtPoints(quiz.points_possible)}`);
      if (quiz.question_count != null) meta.push(`<strong>Questions:</strong> ${quiz.question_count}`);
      if (quiz.due_at) meta.push(`<strong>Due:</strong> ${formatDate(quiz.due_at)}`);
      if (quiz.time_limit) meta.push(`<strong>Time limit:</strong> ${quiz.time_limit} min`);
      if (meta.length) body += `<p>${meta.join(" · ")}</p>`;
      if (quiz.description) {
        body += `<div>${cleanCanvasHtml(quiz.description)}</div>`;
        if (types.linkedFiles) await extractLinkedFiles(quiz.description, `Quiz: ${quiz.title}`);
      }

      if (isTeacher) {
        // Full question bank + answer key.
        try {
          const questions = await fetchAllPages(api(`quizzes/${quiz.id}/questions?per_page=100`));
          body += renderQuizQuestions(questions);
        } catch (err) {
          console.error(`[Canvas Downloader] Quiz questions error (${quiz.title}):`, err);
        }
        // Per-student scores + _grades.csv. The quiz-submissions endpoint
        // returns a wrapped object ({ quiz_submissions, users }), not a bare
        // array, so it's fetched directly rather than via fetchAllPages.
        try {
          const res = await fetchWithRetry(api(`quizzes/${quiz.id}/submissions?per_page=100&include[]=user`), {
            headers: { Accept: "application/json+canvas-string-ids" },
          });
          if (res.ok) {
            const data = await res.json();
            const qsubs = data.quiz_submissions || [];
            const nameFromPayload = new Map((data.users || []).map((u) => [String(u.id), u.sortable_name || u.name]));
            const nameOf = (uid) => userIdToName.get(String(uid)) || nameFromPayload.get(String(uid)) || `user_${uid}`;
            if (qsubs.length) {
              // Sort by section then name so the table/CSV group by section
              // (dlxmax's feedback: scores were lumped together, section unlabeled).
              const sectionOf = (uid) => userIdToSection.get(String(uid)) || "";
              qsubs.sort((x, y) =>
                sectionOf(x.user_id).localeCompare(sectionOf(y.user_id)) ||
                nameOf(x.user_id).localeCompare(nameOf(y.user_id)));
              let table = "<h3>Student scores</h3><table><thead><tr><th>Student</th><th>Section</th><th>Score</th><th>Attempt</th><th>Finished</th></tr></thead><tbody>";
              const csv = ['"Student","Section","Score","Points Possible","Attempt","Finished At","Workflow State"'];
              for (const qs of qsubs) {
                const name = nameOf(qs.user_id);
                const section = sectionOf(qs.user_id);
                const score = qs.kept_score ?? qs.score ?? "";
                table += `<tr><td>${escapeHtml(name)}</td><td>${escapeHtml(section)}</td><td>${score} / ${fmtPoints(quiz.points_possible)}</td><td>${qs.attempt ?? ""}</td><td>${qs.finished_at ? formatDate(qs.finished_at) : ""}</td></tr>`;
                csv.push([name, section, score, quiz.points_possible ?? "", qs.attempt ?? "", qs.finished_at ? formatDate(qs.finished_at) : "", qs.workflow_state || ""].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
              }
              body += table + "</tbody></table>";
              filesToDownload.push({
                content: csv.join("\n"),
                mimeType: "text/csv;charset=utf-8",
                filename: "_grades.csv",
                path: quizPath,
              });
            }
          }
        } catch (err) {
          console.error(`[Canvas Downloader] Quiz submissions error (${quiz.title}):`, err);
        }
      } else {
        // Student: own score, plus own answered questions when allowed.
        try {
          const res = await fetchWithRetry(api(`quizzes/${quiz.id}/submissions?per_page=100`), {
            headers: { Accept: "application/json+canvas-string-ids" },
          });
          if (res.ok) {
            const data = await res.json();
            const qs = (data.quiz_submissions || [])[0];
            if (qs) {
              const score = qs.kept_score ?? qs.score ?? "—";
              body += `<h3>Your result</h3><p><strong>Score:</strong> ${score} / ${fmtPoints(quiz.points_possible)}${qs.attempt ? ` · attempt ${qs.attempt}` : ""}${qs.finished_at ? ` · finished ${formatDate(qs.finished_at)}` : ""}</p>`;
              try {
                const qres = await fetchWithRetry(`${domain}/api/v1/quiz_submissions/${qs.id}/questions`, {
                  headers: { Accept: "application/json+canvas-string-ids" },
                });
                if (qres.ok) {
                  const qdata = await qres.json();
                  body += renderOwnQuizAnswers(qdata.quiz_submission_questions || []);
                }
              } catch (err) {
                console.warn(`[Canvas Downloader] Own quiz answers unavailable (${quiz.title}):`, err);
              }
            }
          }
          else if (res.status === 403) {
            const scraped = await fetchQuizReviewViaHtml(quiz);
            if (scraped) body += scraped;
          }
        } catch (err) {
          console.error(`[Canvas Downloader] Quiz result error (${quiz.title}):`, err);
        }
      }

      filesToDownload.push(buildDocEntry(quiz.title, body, safeQuiz, quizPath, "quiz", String(quiz.id)));
      quizCount++;
    }
  }
  // --- Canvas Viewer Compiler --------------------------
  // Compiles the canvas viewer to download for the offline viewer mode
  if (types.offlineViewer && types.saveJson){
    try {
      const bundleJSURL = chrome.runtime.getURL("viewer/bundle.js");
      const viewerHTMLURL = chrome.runtime.getURL("viewer/Viewer.html");
      let bundleJS = await fetchWithRetry(bundleJSURL);
      let viewerRawHTML = await fetchWithRetry(viewerHTMLURL);
      if (bundleJS.ok && viewerRawHTML.ok){
        const bundleJSString = await bundleJS.text();
        let viewerHTML = await viewerRawHTML.text();
        
        // Collect matches from the raw HTML template BEFORE inlining JS/CSS code
        // to avoid matching <link> tags or <script> tags contained in vendor JS string literals
        const scriptRegex = /<\s*script\s+src\s*=\s*(["'])(.+?)\1\s*>\s*<\s*\/\s*script\s*>/gi; 
        const scriptMatches = [...viewerHTML.matchAll(scriptRegex)];

        const styleRegex = /<link\s+[^>]*href=["']([^"']+)["'][^>]*\/?>/gi;
        const styleMatches = [...viewerHTML.matchAll(styleRegex)];

        // 1. Inline bundle.js
        viewerHTML = viewerHTML.replace("<script src=\"./bundle.js\"></script>", ("\n<script>\n" + bundleJSString + "\n</script>"));

        // 2. Inline vendor scripts
        for (const match of scriptMatches) {
          const fullTag = match[0];
          const src = match[2]; // e.g., "./vendors/react.development.js"
          if (src && src.startsWith("./vendors/")) {
            const vendorURL = chrome.runtime.getURL("/viewer" + src.slice(1)); // removes the initial "." from the path
            const vendorResponse = await fetchWithRetry(vendorURL);
            if (vendorResponse.ok) {
              let vendorText = await vendorResponse.text();
              filesToDownload.push({
                content: vendorText,
                mimeType: "text/javascript;charset=utf-8",
                filename: sanitizeFilename(src.slice(10)),
                path: "vendors/",
              })
            } else {
              console.error("[Canvas Downloader] Failed to fetch vendor:", vendorURL);
              viewerHTML = viewerHTML.replace(fullTag, "");
            }
          }
        }

        // 3. Inline CSS stylesheets
        for (const styleMatch of styleMatches) {
          const fullTag = styleMatch[0];
          const href = styleMatch[1]; // e.g., "./style/style.css"
          if (href && href.startsWith("./style/")) {
            const styleURL = chrome.runtime.getURL("/viewer" + href.slice(1));
            const styleResponse = await fetchWithRetry(styleURL);
            if (styleResponse.ok) {
              const styleText = await styleResponse.text();
              viewerHTML = viewerHTML.replace(fullTag, `\n<style>\n${styleText}\n</style>`);
            } else {
              console.error("[Canvas Downloader] Failed to fetch style:", styleURL);
              viewerHTML = viewerHTML.replace(fullTag, "");
            }
          }
        }

        filesToDownload.push({
          content: viewerHTML,
          mimeType: "text/html;charset=utf-8",
          filename: sanitizeFilename(courseName + "-viewer.html"),
          path: "",
        });
      }
    } catch (err) {
      console.error("[Canvas Downloader] Canvas viewer compilation error:", err);
    }
  }

  // --- Incremental mode: filter out unchanged files --------------------------
  // Skips files whose path+name a previous download recorded, unless their
  // Canvas metadata (updated_at, size) shows they changed since — those are
  // re-downloaded. Generated documents (pages, assignments, CSVs) are always
  // re-exported. The inventory itself is written after the file filters below,
  // on every run, so downloads made before the toggle was enabled still count.
  let skippedCount = 0;
  const incrementalKey = `incremental_${courseId}`;
  const incrementalRecord = {};
  if (settings.incrementalMode) {
    const stored = await new Promise((r) => chrome.storage.local.get(incrementalKey, (d) => r(d[incrementalKey] || {})));

    const filtered = [];
    for (const file of filesToDownload) {
      if (!isSynthetic(file)) {
        const fileKey = file.path + file.filename;
        const entry = stored[fileKey];
        if (entry && !incrementalFileChanged(entry, file)) {
          incrementalRecord[fileKey] = entry;
          skippedCount++;
          continue;
        }
      }
      filtered.push(file);
    }

    if (skippedCount > 0) {
      log(`Incremental mode: skipping ${skippedCount} previously downloaded files.`);
    } else if (Object.keys(stored).length === 0) {
      log("Incremental mode: no earlier download on record — fetching everything once.");
    }
    filesToDownload.length = 0;
    filesToDownload.push(...filtered);
  }

  // --- File filters: exclude videos and large files --------------------------
  const VIDEO_EXTENSIONS = /\.(mp4|mov|avi|mkv|webm|wmv|flv|m4v)$/i;
  let filteredOutCount = 0;

  if (settings.excludeVideos || settings.maxFileSizeMB > 0) {
    const maxBytes = settings.maxFileSizeMB > 0 ? settings.maxFileSizeMB * 1024 * 1024 : Infinity;
    const before = filesToDownload.length;

    const kept = [];
    for (const file of filesToDownload) {
      // Always keep generated docs / synthesized data URIs (CSV, manifest, styles).
      if (isSynthetic(file)) { kept.push(file); continue; }

      if (settings.excludeVideos) {
        if (VIDEO_EXTENSIONS.test(file.filename) || (file.contentType && file.contentType.startsWith("video/"))) {
          continue;
        }
      }
      if (settings.maxFileSizeMB > 0 && file.size > maxBytes) {
        continue;
      }
      kept.push(file);
    }

    filteredOutCount = before - kept.length;
    filesToDownload.length = 0;
    filesToDownload.push(...kept);

    if (filteredOutCount > 0) {
      log(`File filters: excluded ${filteredOutCount} file(s).`);
    }
  }

  // --- Record download inventory for incremental mode ------------------------
  // Recorded on every run, even with incremental mode off, so enabling the
  // toggle later immediately skips what earlier runs already downloaded.
  // Files skipped as unchanged above keep their original entry; files excluded
  // by the video/size filters were not downloaded, so they are not recorded.
  for (const file of filesToDownload) {
    if (!isSynthetic(file)) {
      incrementalRecord[file.path + file.filename] = {
        t: Date.now(),
        m: file.updatedAt || "",
        s: file.size || 0,
      };
    }
  }
  chrome.storage.local.set({ [incrementalKey]: incrementalRecord });

  // --- Export manifest -------------------------------------------------------
  const manifest = {
    course: courseName,
    courseId,
    sourceUrl: `${domain}/courses/${courseId}`,
    exportDate: new Date().toISOString(),
    extensionVersion: chrome.runtime.getManifest().version,
    manifestVersion: 2, //used for detecting if downloaded course has data required to use viewer
    courseTerm: courseTerm,
    useAssignmentGroupsForWeighting: useAssignmentGroups,
    counts: {
      files: files.length,
      pages: exportedPagesCount,
      assignments: assignments.length,
      announcements: announcements.length,
      discussions: discussions.length,
      discussionReplies: discussionReplyCount,
      studentSubmissions: studentSubmissionCount,
      gradebookStudents: gradebookStudentCount,
      quizzes: quizCount,
      modules: modules.length,
      extractedFiles: filesToDownload.filter((f) => f.path === "Extracted_Files/").length,
      skippedIncremental: skippedCount,
      skippedFilters: filteredOutCount,
      total: filesToDownload.length,
    },
  };

  filesToDownload.push({
    content: JSON.stringify(sanitizeJsonHtml(manifest), null, 2),
    mimeType: "application/json;charset=utf-8",
    filename: "manifest.json",
    path: "",
  });

  // --- Path length safety (Windows 260-char limit) -------------------------
  const safeCourse = sanitizeFilename(courseName);
  for (const file of filesToDownload) {
    file.filename = truncateFilename(file.filename, safeCourse, file.path);
  }

  // --- De-duplicate identical output paths ---------------------------------
  // Canvas lets multiple items share a name (e.g. several quizzes titled
  // "Unnamed quiz", or truncation collapsing two long names). Without this they
  // map to the same path and silently overwrite each other in ZIP mode. Append
  // " (2)", " (3)", … on collision. Runs before the URL map is built so cross-
  // references point at the final, unique names. Case-insensitive to stay safe
  // on macOS/Windows filesystems.
  const usedPaths = new Set();
  for (const file of filesToDownload) {
    let name = file.filename;
    let key = (file.path + name).toLowerCase();
    if (usedPaths.has(key)) {
      const dot = name.lastIndexOf(".");
      const stem = dot > 0 ? name.slice(0, dot) : name;
      const ext = dot > 0 ? name.slice(dot) : "";
      let n = 2;
      do {
        name = `${stem} (${n})${ext}`;
        key = (file.path + name).toLowerCase();
        n++;
      } while (usedPaths.has(key));
      file.filename = name;
    }
    usedPaths.add(key);
  }

  // --- Cross-reference URL map -------------------------------------------
  // Walk filesToDownload (after truncation, so paths are final) and map every
  // exported resource's Canvas URL to its local "<path><filename>" target.
  const urlMap = new Map();
  for (const f of filesToDownload) {
    const target = `${f.path}${f.filename}`;
    if (f.resourceType === "page" && f.resourceId) {
      urlMap.set(`${domain}/courses/${courseId}/pages/${f.resourceId}`, target);
    } else if (f.resourceType === "assignment" && f.resourceId) {
      urlMap.set(`${domain}/courses/${courseId}/assignments/${f.resourceId}`, target);
    } else if (f.resourceType === "announcement" && f.resourceId) {
      urlMap.set(`${domain}/courses/${courseId}/discussion_topics/${f.resourceId}`, target);
      urlMap.set(`${domain}/courses/${courseId}/announcements/${f.resourceId}`, target);
    } else if (f.resourceType === "discussion" && f.resourceId) {
      urlMap.set(`${domain}/courses/${courseId}/discussion_topics/${f.resourceId}`, target);
      urlMap.set(`${domain}/courses/${courseId}/discussions/${f.resourceId}`, target);
    } else if (f.resourceType === "quiz" && f.resourceId) {
      urlMap.set(`${domain}/courses/${courseId}/quizzes/${f.resourceId}`, target);
    } else if (f.resourceType === "module-index") {
      // The Modules page links back to the Canvas /modules nav and to individual
      // module anchors; point them all at the local Modules overview.
      urlMap.set(`${domain}/courses/${courseId}/modules`, target);
      for (const mod of modules) urlMap.set(`${domain}/courses/${courseId}/modules/${mod.id}`, target);
    } else if (f.canvasId) {
      urlMap.set(`${domain}/courses/${courseId}/files/${f.canvasId}`, target);
      urlMap.set(`${domain}/files/${f.canvasId}`, target);
    }
  }
  // Dereference /modules/items/<id> URLs through the items→resource map.
  for (const [itemId, info] of moduleItemIdToResource) {
    let sourceUrl;
    if (info.type === "page") sourceUrl = `${domain}/courses/${courseId}/pages/${info.key}`;
    else if (info.type === "assignment") sourceUrl = `${domain}/courses/${courseId}/assignments/${info.key}`;
    else if (info.type === "discussion") sourceUrl = `${domain}/courses/${courseId}/discussion_topics/${info.key}`;
    else if (info.type === "quiz") sourceUrl = `${domain}/courses/${courseId}/quizzes/${info.key}`;
    else if (info.type === "file") sourceUrl = `${domain}/courses/${courseId}/files/${info.key}`;
    const resolved = sourceUrl && urlMap.get(sourceUrl);
    if (resolved) urlMap.set(`${domain}/courses/${courseId}/modules/items/${itemId}`, resolved);
  }

  // --- Rewrite + encode pass on generated docs ---------------------------
  // Converts raw HTML/MD page bodies into in-memory string payloads (`content`).
  // Passing raw string text avoids data-URI length limits on large files and allows
  // background.js to save the generated documents via chrome.downloads.download.
  for (const f of filesToDownload) {
    if (f.rawBody === undefined) continue;
    const rewritten = rewriteCanvasLinks(f.rawBody, urlMap, f.path);
    const content = isMarkdown
      ? toMarkdownString(f.title, htmlToMarkdown(rewritten))
      : toHtmlString(f.title, rewritten, f.path);
    f.content = content;
    f.mimeType = isMarkdown ? "text/markdown;charset=utf-8" : "text/html;charset=utf-8";
    delete f.rawBody;
    delete f.title;
    delete f.resourceType;
    delete f.resourceId;
  }

  // --- ZIP mode or individual download handoff --------------------------------
  log(`${filesToDownload.length} files ready.`);

  if (settings.zipMode && typeof downloadZip !== "undefined") {
    const estimatedBytes = filesToDownload.reduce((sum, f) => sum + (f.size || 0), 0);
    if (estimatedBytes > ZIP_MAX_TOTAL_BYTES) {
      const gb = (estimatedBytes / (1024 * 1024 * 1024)).toFixed(1);
      log(`Estimated archive size ~${gb} GB exceeds the bundling ceiling — falling back to individual file downloads.`);
      showToast(`Course is too large for ZIP bundling (~${gb} GB). Files will download individually.`, "info");
    } else {
      return await downloadAsZip(filesToDownload, courseName, settings, log);
    }
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "START_DOWNLOAD",
        payload: {
          files: filesToDownload,
          courseName,
          conflictAction: settings.conflictAction,
          throttleMs: settings.throttleMs,
          folderPrefix: settings.folderPrefix,
        },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("[Canvas Downloader] Background error:", chrome.runtime.lastError);
          return reject(chrome.runtime.lastError);
        }
        resolve(response);
      }
    );
  });
}

// ---------------------------------------------------------------------------
// Single-Course Download (triggered from a course page)
// ---------------------------------------------------------------------------

async function downloadCurrentCourse() {
  const courseId = getCourseId();
  if (!courseId) {
    showToast("Could not determine course ID. Navigate to a Canvas course page.", "error");
    return;
  }

  downloadCancelled = false;

  const courseName = getCourseName();
  const domain = window.location.origin;

  const btn = document.getElementById("canvas-downloader-btn");
  const originalText = btn?.textContent ?? "";
  if (btn) {
    btn.textContent = "Fetching data...";
    btn.disabled = true;
  }

  try {
    await downloadCourse(courseId, courseName, domain, (msg) => {
      if (btn) btn.textContent = msg;
    });
    if (btn) {
      btn.textContent = "Downloads Queued!";
      setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 3000);
    }
  } catch (err) {
    console.error("[Canvas Downloader] Error:", err);
    showToast("An error occurred. Check the developer console for details.", "error");
    if (btn) { btn.textContent = originalText; btn.disabled = false; }
  }
}
