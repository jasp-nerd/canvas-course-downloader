/**
 * Canvas Course Downloader — Content Script
 *
 * Injected into Canvas LMS pages. Detects courses, fetches all available
 * content via the Canvas REST API, and sends files to the background
 * service worker for sequential downloading.
 *
 * Works on any Canvas LMS instance (Instructure-hosted or self-hosted).
 */

// ---------------------------------------------------------------------------
// Canvas Theme Detection
// ---------------------------------------------------------------------------

const FALLBACK_COLOR = "#e82429";

/** Reads the institution's Canvas brand color from CSS custom properties. */
function getCanvasBrandColor() {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  return (
    style.getPropertyValue("--ic-brand-primary").trim() ||
    style.getPropertyValue("--ic-brand-button--primary-bgd").trim() ||
    style.getPropertyValue("--ic-brand-global-nav-bgd").trim() ||
    FALLBACK_COLOR
  );
}

/** Returns a darker shade of a hex color for hover states. */
function darkenColor(hex, amount = 0.15) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xFF) - Math.round(255 * amount)));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) - Math.round(255 * amount)));
  const b = Math.max(0, Math.min(255, (num & 0xFF) - Math.round(255 * amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// ---------------------------------------------------------------------------
// Canvas Detection Helpers
// ---------------------------------------------------------------------------

function isCanvas() {
  return (
    window.location.hostname.includes("instructure.com") ||
    document.getElementById("application") !== null ||
    document.querySelector(".ic-app") !== null
  );
}

function getCourseId() {
  const match = window.location.pathname.match(/\/courses\/(\d+)/);
  return match ? match[1] : null;
}

function isCanvasHomepage() {
  return isCanvas() && !getCourseId();
}

function getCourseName() {
  const breadcrumb = document.querySelector('.ic-app-crumbs a[href*="/courses/"]');
  if (breadcrumb) return breadcrumb.textContent.trim();

  const title = document.querySelector("title");
  if (title) return title.textContent.split(":")[0].trim();

  return `Course_${getCourseId()}`;
}

// ---------------------------------------------------------------------------
// Toast Notifications
// ---------------------------------------------------------------------------

function showToast(message, type = "info") {
  const existing = document.getElementById("cd-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "cd-toast";
  const colors = { info: "#2d3b45", success: "#1a7f37", error: "#cf222e" };
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 100001;
    background: ${colors[type] || colors.info}; color: #fff;
    padding: 12px 20px; border-radius: 8px; font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2); max-width: 360px;
    opacity: 0; transition: opacity 0.3s;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => (toast.style.opacity = "1"));
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ---------------------------------------------------------------------------
// Download Progress Panel
// ---------------------------------------------------------------------------

let downloadPanel = null;

function createDownloadPanel() {
  if (downloadPanel) return downloadPanel;

  const brand = getCanvasBrandColor();

  const panel = document.createElement("div");
  panel.id = "cd-download-panel";
  panel.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 100002;
    width: 360px; background: #fff; border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    overflow: hidden;
  `;

  panel.innerHTML = `
    <div id="cd-panel-header" style="padding:14px 16px;background:${brand};color:#fff;display:flex;justify-content:space-between;align-items:center;">
      <span id="cd-panel-title" style="font-weight:600;font-size:14px;">Downloading...</span>
      <div style="display:flex;gap:8px;align-items:center;">
        <button id="cd-panel-minimize" style="background:none;border:none;color:#fff;cursor:pointer;font-size:18px;padding:0;line-height:1;" title="Minimize">&#8722;</button>
        <button id="cd-panel-close" style="background:none;border:none;color:#fff;cursor:pointer;font-size:18px;padding:0;line-height:1;" title="Close">&times;</button>
      </div>
    </div>
    <div id="cd-panel-body">
      <div style="padding:12px 16px;">
        <div id="cd-panel-current" style="font-size:12px;color:#6b7b8d;margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>
        <div style="background:#e5e5e5;border-radius:4px;height:6px;overflow:hidden;">
          <div id="cd-panel-bar" style="background:${brand};height:100%;border-radius:4px;transition:width 0.3s;width:0%;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:#6b7b8d;">
          <span id="cd-panel-stats"></span>
          <span id="cd-panel-pct"></span>
        </div>
      </div>
      <div id="cd-panel-actions" style="padding:0 16px 12px;display:flex;gap:8px;">
        <button id="cd-panel-cancel" style="background:none;border:1px solid #ddd;border-radius:4px;padding:6px 12px;font-size:12px;cursor:pointer;color:#666;">Cancel</button>
      </div>
      <div id="cd-panel-failed-section" style="display:none;padding:0 16px 12px;">
        <details>
          <summary style="font-size:12px;color:#cf222e;cursor:pointer;font-weight:500;">Failed files</summary>
          <div id="cd-panel-failed-list" style="max-height:120px;overflow-y:auto;margin-top:4px;font-size:11px;color:#666;"></div>
        </details>
      </div>
      <div id="cd-panel-done" style="display:none;padding:12px 16px;text-align:center;">
        <div id="cd-panel-summary" style="font-size:14px;font-weight:500;color:#2d3b45;"></div>
        <div style="margin-top:8px;display:flex;gap:8px;justify-content:center;">
          <button id="cd-panel-retry" style="display:none;background:${brand};color:#fff;border:none;border-radius:4px;padding:6px 14px;font-size:12px;cursor:pointer;font-weight:500;">Retry Failed</button>
          <button id="cd-panel-dismiss" style="background:none;border:1px solid #ddd;border-radius:4px;padding:6px 14px;font-size:12px;cursor:pointer;color:#666;">Dismiss</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(panel);
  downloadPanel = panel;

  // Minimize toggle
  let minimized = false;
  panel.querySelector("#cd-panel-minimize").addEventListener("click", () => {
    minimized = !minimized;
    panel.querySelector("#cd-panel-body").style.display = minimized ? "none" : "";
    panel.querySelector("#cd-panel-minimize").innerHTML = minimized ? "&#43;" : "&#8722;";
  });

  // Close
  panel.querySelector("#cd-panel-close").addEventListener("click", () => {
    panel.remove();
    downloadPanel = null;
  });

  // Cancel
  panel.querySelector("#cd-panel-cancel").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "CANCEL_DOWNLOADS" });
  });

  // Retry
  panel.querySelector("#cd-panel-retry").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "RETRY_FAILED" });
    panel.querySelector("#cd-panel-done").style.display = "none";
    panel.querySelector("#cd-panel-actions").style.display = "flex";
    panel.querySelector("#cd-panel-failed-section").style.display = "none";
  });

  // Dismiss
  panel.querySelector("#cd-panel-dismiss").addEventListener("click", () => {
    panel.remove();
    downloadPanel = null;
  });

  return panel;
}

function updateDownloadPanel(status) {
  const panel = downloadPanel || createDownloadPanel();
  const { total, completed, failed, queued, downloading, currentFile, failedFiles, done, cancelled } = status;

  const pct = total > 0 ? Math.round(((completed + failed) / total) * 100) : 0;

  panel.querySelector("#cd-panel-title").textContent =
    done ? (cancelled ? "Cancelled" : failed > 0 ? "Completed with errors" : "Download complete!") : "Downloading...";
  panel.querySelector("#cd-panel-bar").style.width = `${pct}%`;
  panel.querySelector("#cd-panel-pct").textContent = `${pct}%`;
  panel.querySelector("#cd-panel-stats").textContent = `${completed} done \u00B7 ${failed} failed \u00B7 ${queued + downloading} remaining`;

  if (currentFile && !done) {
    const el = panel.querySelector("#cd-panel-current");
    el.textContent = currentFile;
    el.title = currentFile;
  }

  if (done) {
    panel.querySelector("#cd-panel-actions").style.display = "none";
    panel.querySelector("#cd-panel-done").style.display = "block";
    panel.querySelector("#cd-panel-summary").textContent =
      `${completed} of ${total} files downloaded${failed > 0 ? `, ${failed} failed` : ""}`;
    panel.querySelector("#cd-panel-retry").style.display = failed > 0 ? "" : "none";

    if (failedFiles.length > 0) {
      panel.querySelector("#cd-panel-failed-section").style.display = "";
      panel.querySelector("#cd-panel-failed-list").innerHTML = failedFiles
        .map((f) => `<div style="padding:2px 0;border-bottom:1px solid #f0f0f0;">${f.filename} &mdash; <span style="color:#cf222e;">${f.error || "Unknown error"}</span></div>`)
        .join("");
    } else {
      panel.querySelector("#cd-panel-failed-section").style.display = "none";
    }
  } else {
    panel.querySelector("#cd-panel-actions").style.display = "flex";
    panel.querySelector("#cd-panel-done").style.display = "none";
  }
}

// ---------------------------------------------------------------------------
// Canvas API Helpers
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;

/** Fetches with an AbortController timeout. */
function fetchWithTimeout(url, options = {}, timeout = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

/** Fetches with retry and exponential backoff for transient errors. */
async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options);
      if (res.ok || (res.status < 500 && res.status !== 429)) return res;
      if (attempt === retries) return res;
      const delay = Math.min(1000 * 2 ** attempt, 8000);
      console.warn(`[Canvas Downloader] ${res.status} on ${url}, retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = Math.min(1000 * 2 ** attempt, 8000);
      console.warn(`[Canvas Downloader] Fetch error on ${url}, retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

/** Follows Canvas pagination links to collect all results. */
async function fetchAllPages(url) {
  const results = [];
  let next = url;

  while (next) {
    try {
      const res = await fetchWithRetry(next, {
        headers: { Accept: "application/json+canvas-string-ids" },
      });

      if (!res.ok) {
        console.warn(`[Canvas Downloader] ${res.status} ${res.statusText} — ${next}`);
        break;
      }

      results.push(...(await res.json()));

      // Parse the Link header for the next page
      const link = res.headers.get("link");
      const nextLink = link?.split(",").find((s) => s.includes('rel="next"'));
      next = nextLink ? nextLink.match(/<([^>]+)>/)?.[1] ?? null : null;
    } catch (err) {
      if (err.name === "AbortError") {
        console.warn(`[Canvas Downloader] Request timed out: ${next}`);
      } else {
        console.error("[Canvas Downloader] API error:", err);
      }
      break;
    }
  }

  return results;
}

/** Returns all active courses for the current user. */
async function fetchAllCourses() {
  const domain = window.location.origin;
  const courses = await fetchAllPages(
    `${domain}/api/v1/courses?per_page=100&enrollment_state=active&include[]=term`
  );
  return courses.filter((c) => c.name).sort((a, b) => a.name.localeCompare(b.name));
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
  const log = (msg) => {
    console.log(`[Canvas Downloader] [${courseName}] ${msg}`);
    if (onProgress) onProgress(msg);
  };

  const api = (path) => `${domain}/api/v1/courses/${courseId}/${path}`;
  const filesToDownload = [];
  const seenFileIds = new Set();

  // --- Files & Folders -------------------------------------------------------
  log("Fetching files...");
  const folders = await fetchAllPages(api("folders?per_page=100"));
  const folderPathById = {};
  folders.forEach((f) => (folderPathById[f.id] = f.full_name || f.name));

  const files = await fetchAllPages(api("files?per_page=100"));

  files.forEach((file) => {
    let folder = folderPathById[file.folder_id] || "";
    if (folder.startsWith("course files")) folder = folder.slice("course files".length);
    if (folder && !folder.endsWith("/")) folder += "/";
    if (folder.startsWith("/")) folder = folder.slice(1);

    seenFileIds.add(String(file.id));
    filesToDownload.push({ url: file.url, filename: file.display_name, path: `Files/${folder}` });
  });

  // --- Hidden file extraction ------------------------------------------------
  /** Scans an HTML string for /files/ links and adds any not already queued. */
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
          });
        }
      } catch (err) {
        console.error(`[Canvas Downloader] Error fetching linked file ${id} from ${source}:`, err);
      }
    }
  }

  /** Strips script tags from HTML to prevent XSS when opening exported files. */
  function sanitizeHtml(html) {
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  }

  /** Wraps content in a minimal HTML page and returns a data-URI. */
  function toHtmlDataUri(title, body) {
    const safeBody = sanitizeHtml(body);
    const html = `<html><head><title>${title}</title></head><body><h1>${title}</h1>${safeBody}</body></html>`;
    return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  }

  // --- Pages -----------------------------------------------------------------
  log("Fetching pages...");
  const pages = await fetchAllPages(api("pages?per_page=100"));

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

      if (page.body) await extractLinkedFiles(page.body, `Page: ${page.title}`);
    } catch (err) {
      console.warn(`[Canvas Downloader] Could not fetch page ${meta.url}:`, err);
    }
  }

  // --- Assignments -----------------------------------------------------------
  log("Fetching assignments...");
  const assignments = await fetchAllPages(api("assignments?per_page=100"));

  for (const a of assignments) {
    let body = `<h2><a href="${a.html_url}">${a.name}</a></h2>`;
    if (a.due_at) body += `<p><strong>Due:</strong> ${new Date(a.due_at).toLocaleString()}</p>`;
    if (a.description) {
      body += `<div>${a.description}</div>`;
      await extractLinkedFiles(a.description, `Assignment: ${a.name}`);
    }
    const safeName = a.name.replace(/[/\\?%*:|"<>]/g, "-").substring(0, 100);
    filesToDownload.push({
      url: toHtmlDataUri(a.name, body),
      filename: `${safeName}.html`,
      path: "Assignments/",
    });
  }

  // --- Announcements ---------------------------------------------------------
  log("Fetching announcements...");
  const announcements = await fetchAllPages(api("discussion_topics?only_announcements=true&per_page=100"));

  for (const a of announcements) {
    let body = `<h2><a href="${a.html_url}">${a.title}</a></h2>`;
    if (a.posted_at) body += `<p><strong>Posted:</strong> ${new Date(a.posted_at).toLocaleString()}</p>`;
    if (a.message) {
      body += `<div>${a.message}</div>`;
      await extractLinkedFiles(a.message, `Announcement: ${a.title}`);
    }
    const safeName = a.title.replace(/[/\\?%*:|"<>]/g, "-").substring(0, 100);
    filesToDownload.push({
      url: toHtmlDataUri(a.title, body),
      filename: `${safeName}.html`,
      path: "Announcements/",
    });
  }

  // --- Discussions -----------------------------------------------------------
  log("Fetching discussions...");
  const allTopics = await fetchAllPages(api("discussion_topics?per_page=100"));
  const discussions = allTopics.filter((d) => !d.is_announcement);

  for (const d of discussions) {
    let body = `<h2><a href="${d.html_url}">${d.title}</a></h2>`;
    if (d.user_name) body += `<p><strong>Author:</strong> ${d.user_name}</p>`;
    if (d.posted_at) body += `<p><strong>Posted:</strong> ${new Date(d.posted_at).toLocaleString()}</p>`;
    if (d.message) {
      body += `<div>${d.message}</div>`;
      await extractLinkedFiles(d.message, `Discussion: ${d.title}`);
    }
    const safeName = d.title.replace(/[/\\?%*:|"<>]/g, "-").substring(0, 100);
    filesToDownload.push({
      url: toHtmlDataUri(d.title, body),
      filename: `${safeName}.html`,
      path: "Discussions/",
    });
  }

  // --- Modules ---------------------------------------------------------------
  log("Fetching modules...");
  const modules = await fetchAllPages(api("modules?per_page=100"));

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
            const safeModName = mod.name.replace(/[/\\?%*:|"<>]/g, "-");
            filesToDownload.push({
              url: data.url,
              filename: data.display_name || item.title,
              path: `Modules/${safeModName}/`,
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

  // --- Syllabus --------------------------------------------------------------
  log("Fetching syllabus...");
  try {
    const res = await fetchWithRetry(`${domain}/api/v1/courses/${courseId}?include[]=syllabus_body`);
    if (res.ok) {
      const data = await res.json();
      if (data.syllabus_body) {
        await extractLinkedFiles(data.syllabus_body, "Syllabus");
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
      total: filesToDownload.length,
    },
  };

  filesToDownload.push({
    url: `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(manifest, null, 2))}`,
    filename: "manifest.json",
    path: "",
  });

  // --- Path length safety (Windows 260-char limit) -------------------------
  const MAX_PATH = 250; // leave margin for download directory prefix
  for (const file of filesToDownload) {
    const safeCourse = courseName.replace(/[/\\?%*:|"<>]/g, "-");
    const fullLen = safeCourse.length + 1 + file.path.length + file.filename.length;
    if (fullLen > MAX_PATH) {
      const ext = file.filename.includes(".") ? file.filename.slice(file.filename.lastIndexOf(".")) : "";
      const maxName = MAX_PATH - safeCourse.length - 1 - file.path.length - ext.length;
      if (maxName > 10) {
        file.filename = file.filename.slice(0, maxName) + ext;
      }
    }
  }

  // --- Hand off to background for downloading --------------------------------
  log(`Queuing ${filesToDownload.length} files for download...`);

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "START_DOWNLOAD", payload: { files: filesToDownload, courseName } },
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

// ---------------------------------------------------------------------------
// Multi-Course Selector Overlay (shown on homepage / dashboard)
// ---------------------------------------------------------------------------

function getOverlayStyles() {
  const brand = getCanvasBrandColor();
  const brandHover = darkenColor(brand);
  return `
    .cd-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 100000;
      display: flex; align-items: center; justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .cd-modal {
      background: #fff; border-radius: 10px;
      width: 520px; max-height: 80vh;
      display: flex; flex-direction: column;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .cd-modal-header {
      padding: 20px 24px 16px;
      border-bottom: 1px solid #e5e5e5;
      display: flex; justify-content: space-between; align-items: center;
    }
    .cd-modal-header h2 { margin: 0; font-size: 18px; font-weight: 600; color: #2d3b45; display: flex; align-items: center; gap: 10px; }
    .cd-modal-header h2 img { width: 28px; height: 28px; border-radius: 5px; }
    .cd-close-btn {
      background: none; border: none; font-size: 24px;
      cursor: pointer; color: #6b7b8d; padding: 0; line-height: 1;
    }
    .cd-close-btn:hover { color: #2d3b45; }
    .cd-search {
      padding: 12px 24px; border-bottom: 1px solid #e5e5e5;
    }
    .cd-search input {
      width: 100%; box-sizing: border-box; padding: 8px 12px;
      border: 1px solid #ddd; border-radius: 6px; font-size: 13px;
      font-family: inherit; outline: none;
    }
    .cd-search input:focus { border-color: ${brand}; }
    .cd-controls {
      padding: 12px 24px; border-bottom: 1px solid #e5e5e5;
      display: flex; gap: 12px; align-items: center;
    }
    .cd-controls button {
      background: none; border: none; color: ${brand};
      cursor: pointer; font-size: 13px; padding: 0; text-decoration: underline;
    }
    .cd-controls button:hover { color: ${brandHover}; }
    .cd-course-list { flex: 1; overflow-y: auto; padding: 8px 24px; }
    .cd-course-item {
      display: flex; align-items: center;
      padding: 10px 0; border-bottom: 1px solid #f0f0f0;
    }
    .cd-course-item:last-child { border-bottom: none; }
    .cd-course-item input[type="checkbox"] {
      margin-right: 12px; width: 16px; height: 16px;
      cursor: pointer; accent-color: ${brand};
    }
    .cd-course-item label { cursor: pointer; flex: 1; }
    .cd-course-name { font-size: 14px; font-weight: 500; color: #2d3b45; }
    .cd-course-code { font-size: 12px; color: #6b7b8d; margin-top: 2px; }
    .cd-term-group { margin-top: 4px; }
    .cd-term-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 0; cursor: pointer; user-select: none;
      border-bottom: 1px solid #e5e5e5;
    }
    .cd-term-header:hover { background: #f8f8f8; }
    .cd-term-name { font-size: 13px; font-weight: 600; color: #2d3b45; }
    .cd-term-toggle { font-size: 12px; color: #6b7b8d; }
    .cd-term-select { font-size: 11px; color: ${brand}; cursor: pointer; background: none; border: none; padding: 0; text-decoration: underline; }
    .cd-term-select:hover { color: ${brandHover}; }
    .cd-modal-footer {
      padding: 16px 24px; border-top: 1px solid #e5e5e5;
      display: flex; justify-content: space-between; align-items: center;
    }
    .cd-download-btn {
      background: ${brand}; color: #fff; border: none; border-radius: 6px;
      padding: 10px 24px; font-size: 14px; font-weight: 600; cursor: pointer;
    }
    .cd-download-btn:hover { background: ${brandHover}; }
    .cd-download-btn:disabled { background: #ccc; cursor: not-allowed; }
    .cd-selected-count { font-size: 13px; color: #6b7b8d; }
    .cd-progress { padding: 16px 24px; border-top: 1px solid #e5e5e5; font-size: 13px; color: #2d3b45; }
    .cd-progress-bar-bg { background: #e5e5e5; border-radius: 4px; height: 8px; margin-top: 8px; overflow: hidden; }
    .cd-progress-bar { background: ${brand}; height: 100%; border-radius: 4px; transition: width 0.3s; width: 0%; }
    .cd-progress-status { margin-top: 6px; font-size: 12px; color: #6b7b8d; }
    .cd-loading { padding: 40px 24px; text-align: center; color: #6b7b8d; font-size: 14px; }
    .cd-github-footer {
      padding: 10px 24px 14px; text-align: center;
      font-size: 11px; color: #999; line-height: 1.5;
      border-top: 1px solid #e5e5e5;
    }
    .cd-github-footer a { color: ${brand}; text-decoration: none; }
    .cd-github-footer a:hover { text-decoration: underline; }
  `;
}

async function openCourseSelector() {
  document.getElementById("cd-overlay")?.remove();

  const style = document.createElement("style");
  style.textContent = getOverlayStyles();
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.id = "cd-overlay";
  overlay.className = "cd-overlay";
  overlay.innerHTML = `
    <div class="cd-modal">
      <div class="cd-modal-header">
        <h2><img src="${chrome.runtime.getURL("icons/icon-128.png")}" alt="">Canvas Course Downloader</h2>
        <button class="cd-close-btn" id="cd-close">&times;</button>
      </div>
      <div class="cd-loading" id="cd-loading">Loading courses...</div>
      <div class="cd-search" id="cd-search" style="display:none">
        <input type="text" id="cd-search-input" placeholder="Search courses by name, code, or term...">
      </div>
      <div class="cd-controls" id="cd-controls" style="display:none">
        <button id="cd-select-all">Select All</button>
        <button id="cd-deselect-all">Deselect All</button>
      </div>
      <div class="cd-course-list" id="cd-course-list" style="display:none"></div>
      <div class="cd-modal-footer" id="cd-footer" style="display:none">
        <span class="cd-selected-count" id="cd-selected-count">0 courses selected</span>
        <button class="cd-download-btn" id="cd-download-btn" disabled>Download Selected</button>
      </div>
      <div class="cd-progress" id="cd-progress" style="display:none">
        <div id="cd-progress-text">Downloading...</div>
        <div class="cd-progress-bar-bg"><div class="cd-progress-bar" id="cd-progress-bar"></div></div>
        <div class="cd-progress-status" id="cd-progress-status"></div>
      </div>
      <div class="cd-github-footer">
        Free &amp; open source on <a href="https://github.com/jasp-nerd/canvas-course-downloader" target="_blank">GitHub</a><br>
        Enjoying it? A <a href="https://github.com/jasp-nerd/canvas-course-downloader" target="_blank">star</a> would mean a lot!
      </div>
    </div>`;

  document.body.appendChild(overlay);

  const closeOverlay = () => overlay.remove();
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeOverlay(); });
  document.getElementById("cd-close").addEventListener("click", closeOverlay);
  document.addEventListener("keydown", function escHandler(e) {
    if (e.key === "Escape") { closeOverlay(); document.removeEventListener("keydown", escHandler); }
  });

  // Fetch courses
  let courses;
  try {
    courses = await fetchAllCourses();
  } catch {
    document.getElementById("cd-loading").textContent = "Failed to load courses. Make sure you are logged in.";
    return;
  }

  if (courses.length === 0) {
    document.getElementById("cd-loading").textContent = "No active courses found.";
    return;
  }

  document.getElementById("cd-loading").style.display = "none";
  document.getElementById("cd-search").style.display = "block";
  document.getElementById("cd-controls").style.display = "flex";
  document.getElementById("cd-course-list").style.display = "block";
  document.getElementById("cd-footer").style.display = "flex";

  const listEl = document.getElementById("cd-course-list");

  // Group courses by term, sorted by start date (most recent first)
  const termMap = new Map();
  for (const course of courses) {
    const termName = course.term?.name || "Other";
    if (!termMap.has(termName)) {
      termMap.set(termName, { startAt: course.term?.start_at || null, courses: [] });
    }
    termMap.get(termName).courses.push(course);
  }

  const sortedTerms = Array.from(termMap.entries()).sort(([nameA, a], [nameB, b]) => {
    const isDefaultA = !a.startAt || nameA === "Other" || nameA.toLowerCase().includes("default");
    const isDefaultB = !b.startAt || nameB === "Other" || nameB.toLowerCase().includes("default");
    if (isDefaultA && !isDefaultB) return 1;
    if (!isDefaultA && isDefaultB) return -1;
    if (a.startAt && b.startAt) return new Date(b.startAt) - new Date(a.startAt);
    return nameA.localeCompare(nameB);
  });

  for (const [termName, { courses: termCourses }] of sortedTerms) {
    const group = document.createElement("div");
    group.className = "cd-term-group";
    group.dataset.term = termName.toLowerCase();

    const header = document.createElement("div");
    header.className = "cd-term-header";
    header.innerHTML = `
      <span class="cd-term-name">${termName} (${termCourses.length})</span>
      <span style="display:flex;gap:8px;align-items:center;">
        <button class="cd-term-select" data-term-action="toggle">Select all</button>
        <span class="cd-term-toggle">&#9660;</span>
      </span>`;
    group.appendChild(header);

    const courseContainer = document.createElement("div");
    courseContainer.className = "cd-term-courses";

    for (const course of termCourses) {
      const item = document.createElement("div");
      item.className = "cd-course-item";
      item.dataset.searchable = `${course.name} ${course.course_code || ""} ${termName}`.toLowerCase();
      item.innerHTML = `
        <input type="checkbox" id="cd-course-${course.id}" data-course-id="${course.id}" data-course-name="${course.name.replace(/"/g, "&quot;")}">
        <label for="cd-course-${course.id}">
          <div class="cd-course-name">${course.name}</div>
          <div class="cd-course-code">${course.course_code || ""}</div>
        </label>`;
      courseContainer.appendChild(item);
    }
    group.appendChild(courseContainer);
    listEl.appendChild(group);

    // Toggle collapse
    header.addEventListener("click", (e) => {
      if (e.target.classList.contains("cd-term-select")) return;
      const isHidden = courseContainer.style.display === "none";
      courseContainer.style.display = isHidden ? "" : "none";
      header.querySelector(".cd-term-toggle").textContent = isHidden ? "\u25BC" : "\u25B6";
    });

    // Select all in term
    header.querySelector(".cd-term-select").addEventListener("click", () => {
      const cbs = courseContainer.querySelectorAll("input[type='checkbox']:not(:disabled)");
      const allChecked = Array.from(cbs).every((cb) => cb.checked);
      cbs.forEach((cb) => (cb.checked = !allChecked));
      updateCount();
    });
  }

  // Search filter
  document.getElementById("cd-search-input").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase().trim();
    listEl.querySelectorAll(".cd-course-item").forEach((item) => {
      item.style.display = !q || item.dataset.searchable.includes(q) ? "" : "none";
    });
    listEl.querySelectorAll(".cd-term-group").forEach((group) => {
      const visibleItems = group.querySelectorAll(".cd-course-item:not([style*='display: none'])");
      group.style.display = visibleItems.length === 0 && q ? "none" : "";
    });
  });

  const updateCount = () => {
    const n = listEl.querySelectorAll("input:checked").length;
    document.getElementById("cd-selected-count").textContent = `${n} course${n !== 1 ? "s" : ""} selected`;
    document.getElementById("cd-download-btn").disabled = n === 0;
  };

  listEl.addEventListener("change", updateCount);
  document.getElementById("cd-select-all").addEventListener("click", () => {
    listEl.querySelectorAll("input:not(:disabled)").forEach((cb) => (cb.checked = true));
    updateCount();
  });
  document.getElementById("cd-deselect-all").addEventListener("click", () => {
    listEl.querySelectorAll("input:not(:disabled)").forEach((cb) => (cb.checked = false));
    updateCount();
  });

  // Bulk download handler
  document.getElementById("cd-download-btn").addEventListener("click", async () => {
    const selected = Array.from(listEl.querySelectorAll("input:checked")).map((cb) => ({
      id: cb.dataset.courseId,
      name: cb.dataset.courseName,
    }));
    if (selected.length === 0) return;

    document.getElementById("cd-download-btn").disabled = true;
    document.getElementById("cd-controls").style.display = "none";
    listEl.querySelectorAll("input").forEach((cb) => (cb.disabled = true));

    const bar = document.getElementById("cd-progress-bar");
    const text = document.getElementById("cd-progress-text");
    const status = document.getElementById("cd-progress-status");
    document.getElementById("cd-progress").style.display = "block";

    const domain = window.location.origin;

    for (let i = 0; i < selected.length; i++) {
      const pct = Math.round((i / selected.length) * 100);
      bar.style.width = `${pct}%`;
      text.textContent = `Downloading ${i + 1} of ${selected.length}: ${selected[i].name}`;
      status.textContent = "Starting...";

      try {
        await downloadCourse(selected[i].id, selected[i].name, domain, (msg) => {
          status.textContent = msg;
        });
      } catch (err) {
        console.error(`[Canvas Downloader] Failed: ${selected[i].name}`, err);
        status.textContent = `Error on ${selected[i].name}, continuing...`;
        await new Promise((r) => setTimeout(r, 1000));
      }

      if (i < selected.length - 1) await new Promise((r) => setTimeout(r, 500));
    }

    bar.style.width = "100%";
    text.textContent = `Done! Downloaded ${selected.length} course${selected.length !== 1 ? "s" : ""}.`;
    status.textContent = "All downloads have been queued.";
  });
}

// ---------------------------------------------------------------------------
// Button Injection
// ---------------------------------------------------------------------------

function injectButton() {
  if (!isCanvas()) return;

  if (getCourseId()) {
    // Course page — single download button
    if (document.getElementById("canvas-downloader-btn")) return;

    const anchor = document.getElementById("breadcrumbs") || document.querySelector(".ic-app-nav-toggle-and-crumbs");
    if (!anchor) return;

    const brand = getCanvasBrandColor();
    const btn = document.createElement("button");
    btn.id = "canvas-downloader-btn";
    btn.textContent = "Download Course Content";
    btn.style.cssText = `
      background: ${brand}; color: #fff; border: none; border-radius: 6px;
      padding: 6px 14px; font-size: 14px; cursor: pointer;
      margin-left: 15px; font-family: inherit; font-weight: 600;
    `;
    btn.addEventListener("mouseenter", () => (btn.style.background = darkenColor(brand)));
    btn.addEventListener("mouseleave", () => (btn.style.background = brand));
    btn.addEventListener("click", downloadCurrentCourse);
    anchor.appendChild(btn);
  } else {
    // Dashboard — multi-course selector button
    if (document.getElementById("canvas-downloader-home-btn")) return;

    const anchor =
      document.getElementById("breadcrumbs") ||
      document.querySelector(".ic-app-nav-toggle-and-crumbs") ||
      document.querySelector("#dashboard_header_container .ic-Dashboard-header__actions") ||
      document.querySelector("#dashboard_header_container") ||
      document.querySelector(".ic-Dashboard-header") ||
      document.getElementById("content");
    if (!anchor) return;

    const brand = getCanvasBrandColor();
    const btn = document.createElement("button");
    btn.id = "canvas-downloader-home-btn";
    btn.textContent = "Download Courses";
    btn.style.cssText = `
      background: ${brand}; color: #fff; border: none; border-radius: 6px;
      padding: 8px 16px; font-size: 14px; font-weight: 600;
      cursor: pointer; margin-left: 15px; margin-bottom: 10px; font-family: inherit;
    `;
    btn.addEventListener("mouseenter", () => (btn.style.background = darkenColor(brand)));
    btn.addEventListener("mouseleave", () => (btn.style.background = brand));
    btn.addEventListener("click", openCourseSelector);
    anchor.appendChild(btn);
  }
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

injectButton();

// Re-inject after Canvas SPA navigations
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(injectButton, 1000);
  }
}).observe(document, { subtree: true, childList: true });

// Listen for messages from the popup and background
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === "DOWNLOAD_STATUS") {
    updateDownloadPanel(request.payload);
    return;
  }
  if (request.action === "trigger_download") {
    downloadCurrentCourse();
    sendResponse({ status: "started" });
  } else if (request.action === "open_course_selector") {
    openCourseSelector();
    sendResponse({ status: "opened" });
  } else if (request.action === "get_status") {
    sendResponse({ isCanvas: isCanvas(), courseId: getCourseId(), isHomepage: isCanvasHomepage() });
  }
});

// Check if downloads are already in progress (e.g. after SPA navigation)
chrome.runtime.sendMessage({ type: "GET_DOWNLOAD_STATUS" }, (status) => {
  if (chrome.runtime.lastError || !status) return;
  if (status.total > 0 && !status.done) updateDownloadPanel(status);
});
