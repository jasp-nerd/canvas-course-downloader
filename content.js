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
// Canvas API Helpers
// ---------------------------------------------------------------------------

/** Follows Canvas pagination links to collect all results. */
async function fetchAllPages(url) {
  const results = [];
  let next = url;

  while (next) {
    try {
      const res = await fetch(next, {
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
      console.error("[Canvas Downloader] API error:", err);
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

    filesToDownload.push({ url: file.url, filename: file.display_name, path: `Files/${folder}` });
  });

  // --- Hidden file extraction ------------------------------------------------
  /** Scans an HTML string for /files/ links and adds any not already queued. */
  async function extractLinkedFiles(html, source) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const links = doc.querySelectorAll('a[href*="/files/"]');

    for (const link of links) {
      const id = link.getAttribute("href")?.match(/\/files\/(\d+)/)?.[1];
      if (!id) continue;

      try {
        const res = await fetch(`${domain}/api/v1/files/${id}`);
        if (!res.ok) continue;
        const data = await res.json();

        if (!filesToDownload.some((f) => f.url === data.url)) {
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

  /** Wraps content in a minimal HTML page and returns a data-URI. */
  function toHtmlDataUri(title, body) {
    const html = `<html><head><title>${title}</title></head><body><h1>${title}</h1>${body}</body></html>`;
    return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  }

  // --- Pages -----------------------------------------------------------------
  log("Fetching pages...");
  const pages = await fetchAllPages(api("pages?per_page=100"));

  for (const meta of pages) {
    try {
      const res = await fetch(`${domain}/api/v1/courses/${courseId}/pages/${meta.url}`);
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

  let assignmentsBody = "<ul>";
  for (const a of assignments) {
    assignmentsBody += `<li><h2><a href="${a.html_url}">${a.name}</a></h2>`;
    if (a.due_at) assignmentsBody += `<p><strong>Due:</strong> ${new Date(a.due_at).toLocaleString()}</p>`;
    if (a.description) {
      assignmentsBody += `<div>${a.description}</div>`;
      await extractLinkedFiles(a.description, `Assignment: ${a.name}`);
    }
    assignmentsBody += "</li><hr/>";
  }
  assignmentsBody += "</ul>";

  filesToDownload.push({
    url: toHtmlDataUri("Assignments", assignmentsBody),
    filename: "Assignments.html",
    path: "",
  });

  // --- Announcements ---------------------------------------------------------
  log("Fetching announcements...");
  const announcements = await fetchAllPages(api("discussion_topics?only_announcements=true&per_page=100"));

  let announcementsBody = "<ul>";
  for (const a of announcements) {
    announcementsBody += `<li><h2><a href="${a.html_url}">${a.title}</a></h2>`;
    if (a.posted_at) announcementsBody += `<p><strong>Posted:</strong> ${new Date(a.posted_at).toLocaleString()}</p>`;
    if (a.message) {
      announcementsBody += `<div>${a.message}</div>`;
      await extractLinkedFiles(a.message, `Announcement: ${a.title}`);
    }
    announcementsBody += "</li><hr/>";
  }
  announcementsBody += "</ul>";

  filesToDownload.push({
    url: toHtmlDataUri("Announcements", announcementsBody),
    filename: "Announcements.html",
    path: "",
  });

  // --- Discussions -----------------------------------------------------------
  log("Fetching discussions...");
  const allTopics = await fetchAllPages(api("discussion_topics?per_page=100"));
  const discussions = allTopics.filter((d) => !d.is_announcement);

  let discussionsBody = "<ul>";
  for (const d of discussions) {
    discussionsBody += `<li><h2><a href="${d.html_url}">${d.title}</a></h2>`;
    if (d.user_name) discussionsBody += `<p><strong>Author:</strong> ${d.user_name}</p>`;
    if (d.posted_at) discussionsBody += `<p><strong>Posted:</strong> ${new Date(d.posted_at).toLocaleString()}</p>`;
    if (d.message) {
      discussionsBody += `<div>${d.message}</div>`;
      await extractLinkedFiles(d.message, `Discussion: ${d.title}`);
    }
    discussionsBody += "</li><hr/>";
  }
  discussionsBody += "</ul>";

  filesToDownload.push({
    url: toHtmlDataUri("Discussions", discussionsBody),
    filename: "Discussions.html",
    path: "",
  });

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
          const res = await fetch(item.url);
          if (!res.ok) continue;
          const data = await res.json();

          if (!filesToDownload.some((f) => f.url === data.url)) {
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
    const res = await fetch(`${domain}/api/v1/courses/${courseId}?include[]=syllabus_body`);
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
    alert("Could not determine course ID. Navigate to a Canvas course page.");
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
    alert("An error occurred. Check the developer console for details.");
    if (btn) { btn.textContent = originalText; btn.disabled = false; }
  }
}

// ---------------------------------------------------------------------------
// Multi-Course Selector Overlay (shown on homepage / dashboard)
// ---------------------------------------------------------------------------

function getOverlayStyles() {
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
    .cd-controls {
      padding: 12px 24px; border-bottom: 1px solid #e5e5e5;
      display: flex; gap: 12px; align-items: center;
    }
    .cd-controls button {
      background: none; border: none; color: #e82429;
      cursor: pointer; font-size: 13px; padding: 0; text-decoration: underline;
    }
    .cd-controls button:hover { color: #c51f23; }
    .cd-course-list { flex: 1; overflow-y: auto; padding: 8px 24px; }
    .cd-course-item {
      display: flex; align-items: center;
      padding: 10px 0; border-bottom: 1px solid #f0f0f0;
    }
    .cd-course-item:last-child { border-bottom: none; }
    .cd-course-item input[type="checkbox"] {
      margin-right: 12px; width: 16px; height: 16px;
      cursor: pointer; accent-color: #e82429;
    }
    .cd-course-item label { cursor: pointer; flex: 1; }
    .cd-course-name { font-size: 14px; font-weight: 500; color: #2d3b45; }
    .cd-course-code { font-size: 12px; color: #6b7b8d; margin-top: 2px; }
    .cd-modal-footer {
      padding: 16px 24px; border-top: 1px solid #e5e5e5;
      display: flex; justify-content: space-between; align-items: center;
    }
    .cd-download-btn {
      background: #e82429; color: #fff; border: none; border-radius: 6px;
      padding: 10px 24px; font-size: 14px; font-weight: 600; cursor: pointer;
    }
    .cd-download-btn:hover { background: #c51f23; }
    .cd-download-btn:disabled { background: #ccc; cursor: not-allowed; }
    .cd-selected-count { font-size: 13px; color: #6b7b8d; }
    .cd-progress { padding: 16px 24px; border-top: 1px solid #e5e5e5; font-size: 13px; color: #2d3b45; }
    .cd-progress-bar-bg { background: #e5e5e5; border-radius: 4px; height: 8px; margin-top: 8px; overflow: hidden; }
    .cd-progress-bar { background: #e82429; height: 100%; border-radius: 4px; transition: width 0.3s; width: 0%; }
    .cd-progress-status { margin-top: 6px; font-size: 12px; color: #6b7b8d; }
    .cd-loading { padding: 40px 24px; text-align: center; color: #6b7b8d; font-size: 14px; }
    .cd-github-footer {
      padding: 10px 24px 14px; text-align: center;
      font-size: 11px; color: #999; line-height: 1.5;
      border-top: 1px solid #e5e5e5;
    }
    .cd-github-footer a { color: #e82429; text-decoration: none; }
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

  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
  document.getElementById("cd-close").addEventListener("click", () => overlay.remove());

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
  document.getElementById("cd-controls").style.display = "flex";
  document.getElementById("cd-course-list").style.display = "block";
  document.getElementById("cd-footer").style.display = "flex";

  const listEl = document.getElementById("cd-course-list");

  for (const course of courses) {
    const term = course.term?.name || "";
    const item = document.createElement("div");
    item.className = "cd-course-item";
    item.innerHTML = `
      <input type="checkbox" id="cd-course-${course.id}" data-course-id="${course.id}" data-course-name="${course.name.replace(/"/g, "&quot;")}">
      <label for="cd-course-${course.id}">
        <div class="cd-course-name">${course.name}</div>
        <div class="cd-course-code">${course.course_code || ""}${term ? " &middot; " + term : ""}</div>
      </label>`;
    listEl.appendChild(item);
  }

  const updateCount = () => {
    const n = listEl.querySelectorAll("input:checked").length;
    document.getElementById("cd-selected-count").textContent = `${n} course${n !== 1 ? "s" : ""} selected`;
    document.getElementById("cd-download-btn").disabled = n === 0;
  };

  listEl.addEventListener("change", updateCount);
  document.getElementById("cd-select-all").addEventListener("click", () => {
    listEl.querySelectorAll("input").forEach((cb) => (cb.checked = true));
    updateCount();
  });
  document.getElementById("cd-deselect-all").addEventListener("click", () => {
    listEl.querySelectorAll("input").forEach((cb) => (cb.checked = false));
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

    const btn = document.createElement("button");
    btn.id = "canvas-downloader-btn";
    btn.textContent = "Download Course Content";
    btn.style.cssText = `
      background: #e82429; color: #fff; border: none; border-radius: 6px;
      padding: 6px 14px; font-size: 14px; cursor: pointer;
      margin-left: 15px; font-family: inherit; font-weight: 600;
    `;
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

    const btn = document.createElement("button");
    btn.id = "canvas-downloader-home-btn";
    btn.textContent = "Download Courses";
    btn.style.cssText = `
      background: #e82429; color: #fff; border: none; border-radius: 6px;
      padding: 8px 16px; font-size: 14px; font-weight: 600;
      cursor: pointer; margin-left: 15px; margin-bottom: 10px; font-family: inherit;
    `;
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

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
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
