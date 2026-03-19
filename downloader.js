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
    files: true, pages: true, assignments: true, discussions: true,
    announcements: true, modules: true, syllabus: true, grades: true,
    linkedFiles: true,
  },
  conflictAction: "uniquify",
  throttleMs: 250,
  folderPrefix: "",
  zipMode: false,
  incrementalMode: false,
  excludeVideos: false,
  maxFileSizeMB: 0,
  preset: "full-archive",
};

/** Loads user settings from chrome.storage.sync, falling back to defaults. */
function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(SETTING_DEFAULTS, (s) => resolve(s));
  });
}

// ---------------------------------------------------------------------------
// ZIP Download Helper
// ---------------------------------------------------------------------------

async function downloadAsZip(files, courseName, settings, log) {
  const zip = new JSZip();
  const safeName = sanitizeFilename(courseName);
  let completed = 0;
  let failed = 0;

  createDownloadPanel();

  for (const file of files) {
    const filePath = `${file.path}${file.filename}`;

    updateDownloadPanel({
      total: files.length, completed, failed, queued: files.length - completed - failed,
      downloading: 1, currentFile: file.filename, failedFiles: [], done: false, cancelled: false,
    });

    try {
      let content;
      if (file.url.startsWith("data:")) {
        // Decode data URI
        const commaIdx = file.url.indexOf(",");
        const encoded = file.url.substring(commaIdx + 1);
        content = decodeURIComponent(encoded);
      } else {
        const res = await fetch(file.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        content = await res.blob();
      }
      zip.file(filePath, content);
      completed++;
    } catch (err) {
      console.warn(`[Canvas Downloader] ZIP: failed to fetch ${file.filename}:`, err);
      failed++;
    }
  }

  log("Generating ZIP file...");
  updateDownloadPanel({
    total: files.length, completed, failed, queued: 0,
    downloading: 0, currentFile: "Generating ZIP...", failedFiles: [], done: false, cancelled: false,
  });

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 5 } });
  const url = URL.createObjectURL(blob);

  const prefix = settings.folderPrefix ? `${sanitizeFilename(settings.folderPrefix)}/` : "";
  const filename = `${prefix}${safeName}.zip`;

  await new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "START_DOWNLOAD", payload: { files: [{ url, filename, path: "" }], courseName: "", conflictAction: settings.conflictAction, throttleMs: 0, folderPrefix: "" } },
      (response) => {
        if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
        resolve(response);
      }
    );
  });

  // Clean up blob URL after a delay
  setTimeout(() => URL.revokeObjectURL(url), 60000);

  updateDownloadPanel({
    total: files.length, completed, failed, queued: 0, downloading: 0,
    currentFile: null, failedFiles: [], done: true, cancelled: false,
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
  const log = (msg) => {
    console.log(`[Canvas Downloader] [${courseName}] ${msg}`);
    if (onProgress) onProgress(msg);
  };

  const api = (path) => `${domain}/api/v1/courses/${courseId}/${path}`;
  const filesToDownload = [];
  const seenFileIds = new Set();

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
      filesToDownload.push({ url: file.url, filename: file.display_name, path: `Files/${folder}`, size: file.size || 0, contentType: file["content-type"] || "" });
    });
  }

  // --- Hidden file extraction ------------------------------------------------
  async function extractLinkedFiles(html, source) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const links = doc.querySelectorAll('a[href*="/files/"]');

    for (const link of links) {
      const id = link.getAttribute("href")?.match(/\/files\/(\d+)/)?.[1];
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
            filename: data.display_name || link.textContent.trim() || `file_${id}`,
            path: "Extracted_Files/",
            size: data.size || 0,
            contentType: data["content-type"] || "",
          });
        }
      } catch (err) {
        console.error(`[Canvas Downloader] Error fetching linked file ${id} from ${source}:`, err);
      }
    }
  }

  // --- Pages -----------------------------------------------------------------
  let pages = [];
  if (types.pages) {
    log("Fetching pages...");
    pages = await fetchAllPages(api("pages?per_page=100"));

    for (const meta of pages) {
      try {
        const res = await fetchWithRetry(`${domain}/api/v1/courses/${courseId}/pages/${meta.url}`);
        if (!res.ok) continue;
        const page = await res.json();

        filesToDownload.push({
          url: toHtmlDataUri(page.title, page.body || ""),
          filename: `${page.url}.html`,
          path: "Pages/",
        });

        if (types.linkedFiles && page.body) await extractLinkedFiles(page.body, `Page: ${page.title}`);
      } catch (err) {
        console.warn(`[Canvas Downloader] Could not fetch page ${meta.url}:`, err);
      }
    }
  }

  // --- Assignments -----------------------------------------------------------
  let assignments = [];
  if (types.assignments) {
    log("Fetching assignments...");
    assignments = await fetchAllPages(api("assignments?per_page=100"));

    for (const a of assignments) {
      let body = `<h2><a href="${a.html_url}">${a.name}</a></h2>`;
      if (a.due_at) body += `<p><strong>Due:</strong> ${new Date(a.due_at).toLocaleString()}</p>`;
      if (a.description) {
        body += `<div>${a.description}</div>`;
        if (types.linkedFiles) await extractLinkedFiles(a.description, `Assignment: ${a.name}`);
      }
      const safeName = sanitizeFilename(a.name).substring(0, 100);
      filesToDownload.push({
        url: toHtmlDataUri(a.name, body),
        filename: `${safeName}.html`,
        path: "Assignments/",
      });
    }
  }

  // --- Announcements ---------------------------------------------------------
  let announcements = [];
  if (types.announcements) {
    log("Fetching announcements...");
    announcements = await fetchAllPages(api("discussion_topics?only_announcements=true&per_page=100"));

    for (const a of announcements) {
      let body = `<h2><a href="${a.html_url}">${a.title}</a></h2>`;
      if (a.posted_at) body += `<p><strong>Posted:</strong> ${new Date(a.posted_at).toLocaleString()}</p>`;
      if (a.message) {
        body += `<div>${a.message}</div>`;
        if (types.linkedFiles) await extractLinkedFiles(a.message, `Announcement: ${a.title}`);
      }
      const safeName = sanitizeFilename(a.title).substring(0, 100);
      filesToDownload.push({
        url: toHtmlDataUri(a.title, body),
        filename: `${safeName}.html`,
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

    for (const d of discussions) {
      let body = `<h2><a href="${d.html_url}">${d.title}</a></h2>`;
      if (d.user_name) body += `<p><strong>Author:</strong> ${d.user_name}</p>`;
      if (d.posted_at) body += `<p><strong>Posted:</strong> ${new Date(d.posted_at).toLocaleString()}</p>`;
      if (d.message) {
        body += `<div>${d.message}</div>`;
        if (types.linkedFiles) await extractLinkedFiles(d.message, `Discussion: ${d.title}`);
      }
      const safeName = sanitizeFilename(d.title).substring(0, 100);
      filesToDownload.push({
        url: toHtmlDataUri(d.title, body),
        filename: `${safeName}.html`,
        path: "Discussions/",
      });
    }
  }

  // --- Modules ---------------------------------------------------------------
  let modules = [];
  if (types.modules) {
    log("Fetching modules...");
    modules = await fetchAllPages(api("modules?per_page=100"));

    let modulesBody = "";
    for (const mod of modules) {
      modulesBody += `<h2>${mod.name}</h2><ul>`;
      const items = await fetchAllPages(api(`modules/${mod.id}/items?per_page=100`));

      for (const item of items) {
        const label = item.html_url ? `<a href="${item.html_url}">${item.title}</a>` : item.title;
        modulesBody += `<li>${label} (${item.type})</li>`;

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
              });
            }
          } catch (err) {
            console.error(`[Canvas Downloader] Module file error (${item.title}):`, err);
          }
        }
      }
      modulesBody += "</ul>";
    }

    filesToDownload.push({
      url: toHtmlDataUri("Modules", modulesBody),
      filename: "Modules.html",
      path: "",
    });
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
          filesToDownload.push({
            url: toHtmlDataUri(`Syllabus — ${courseName}`, data.syllabus_body),
            filename: "Syllabus.html",
            path: "",
          });
        }
      }
    } catch (err) {
      console.error("[Canvas Downloader] Syllabus error:", err);
    }
  }

  // --- Grades ----------------------------------------------------------------
  if (types.grades) {
    log("Fetching grades...");
    try {
      const gradeAssignments = await fetchAllPages(
        api("assignments?per_page=100&include[]=submission")
      );
      if (gradeAssignments.length > 0) {
        const csvRows = ["Assignment,Due Date,Points Possible,Score,Grade"];
        for (const a of gradeAssignments) {
          const name = (a.name || "").replace(/"/g, '""');
          const due = a.due_at ? new Date(a.due_at).toLocaleDateString() : "";
          const possible = a.points_possible ?? "";
          const score = a.submission?.score ?? "";
          const grade = a.submission?.grade ?? "";
          csvRows.push(`"${name}","${due}",${possible},${score},"${grade}"`);
        }
        filesToDownload.push({
          url: `data:text/csv;charset=utf-8,${encodeURIComponent(csvRows.join("\n"))}`,
          filename: "Grades.csv",
          path: "",
        });
      }
    } catch (err) {
      console.error("[Canvas Downloader] Grades error:", err);
    }
  }

  // --- Incremental mode: filter out unchanged files --------------------------
  let skippedCount = 0;
  if (settings.incrementalMode) {
    const storageKey = `incremental_${courseId}`;
    const stored = await new Promise((r) => chrome.storage.local.get(storageKey, (d) => r(d[storageKey] || {})));

    const filtered = [];
    for (const file of filesToDownload) {
      if (!file.url.startsWith("data:")) {
        const fileKey = file.path + file.filename;
        if (stored[fileKey]) {
          skippedCount++;
          continue;
        }
      }
      filtered.push(file);
    }

    const newRecord = {};
    for (const file of filesToDownload) {
      if (!file.url.startsWith("data:")) {
        newRecord[file.path + file.filename] = Date.now();
      }
    }
    chrome.storage.local.set({ [storageKey]: newRecord });

    if (skippedCount > 0) {
      log(`Incremental mode: skipping ${skippedCount} previously downloaded files.`);
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
      // Skip data URIs (generated HTML/CSV/JSON) — always keep those
      if (file.url.startsWith("data:")) { kept.push(file); continue; }

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

  // --- Export manifest -------------------------------------------------------
  const manifest = {
    course: courseName,
    courseId,
    sourceUrl: `${domain}/courses/${courseId}`,
    exportDate: new Date().toISOString(),
    extensionVersion: chrome.runtime.getManifest().version,
    counts: {
      files: files.length,
      pages: pages.length,
      assignments: assignments.length,
      announcements: announcements.length,
      discussions: discussions.length,
      modules: modules.length,
      extractedFiles: filesToDownload.filter((f) => f.path === "Extracted_Files/").length,
      skippedIncremental: skippedCount,
      skippedFilters: filteredOutCount,
      total: filesToDownload.length,
    },
  };

  filesToDownload.push({
    url: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(manifest, null, 2))}`,
    filename: "manifest.json",
    path: "",
  });

  // --- Path length safety (Windows 260-char limit) -------------------------
  const safeCourse = sanitizeFilename(courseName);
  for (const file of filesToDownload) {
    file.filename = truncateFilename(file.filename, safeCourse, file.path);
  }

  // --- ZIP mode or individual download handoff --------------------------------
  log(`${filesToDownload.length} files ready.`);

  if (settings.zipMode && typeof JSZip !== "undefined") {
    return await downloadAsZip(filesToDownload, courseName, settings, log);
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
