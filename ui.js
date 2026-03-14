/**
 * Canvas Course Downloader — UI Components
 *
 * Toast notifications, download progress panel, course selector overlay,
 * and button injection into Canvas pages.
 */

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
        .map((f) => `<div style="padding:2px 0;border-bottom:1px solid #f0f0f0;">${sanitizeHtml(f.filename)} &mdash; <span style="color:#cf222e;">${sanitizeHtml(f.error || "Unknown error")}</span></div>`)
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
// Course Selector Overlay Styles
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
      background: #fff; border-radius: 12px;
      width: 560px; max-height: 80vh;
      display: flex; flex-direction: column;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .cd-modal *:focus-visible {
      outline: 2px solid ${brand}; outline-offset: 2px; border-radius: 3px;
    }
    .cd-modal-header {
      padding: 20px 24px 16px;
      border-bottom: 1px solid #e5e5e5;
      display: flex; justify-content: space-between; align-items: center;
    }
    .cd-modal-header h2 { margin: 0; font-size: 18px; font-weight: 700; color: #2d3b45; display: flex; align-items: center; gap: 10px; }
    .cd-modal-header h2 img { width: 28px; height: 28px; border-radius: 5px; }
    .cd-close-btn {
      background: none; border: none; font-size: 24px;
      cursor: pointer; color: #6b7b8d; padding: 4px 8px; line-height: 1;
      border-radius: 4px; transition: background 0.15s;
    }
    .cd-close-btn:hover { color: #2d3b45; background: #f0f0f0; }
    .cd-tabs {
      display: flex; border-bottom: 1px solid #e5e5e5;
    }
    .cd-tab {
      flex: 1; padding: 10px 16px; font-size: 13px; font-weight: 500;
      background: none; border: none; border-bottom: 2px solid transparent;
      cursor: pointer; color: #6b7b8d; transition: all 0.15s;
    }
    .cd-tab:hover { color: #2d3b45; background: #fafafa; }
    .cd-tab.active { color: ${brand}; border-bottom-color: ${brand}; font-weight: 600; }
    .cd-search {
      padding: 12px 24px; border-bottom: 1px solid #e5e5e5;
    }
    .cd-search input {
      width: 100%; box-sizing: border-box; padding: 10px 14px;
      border: 1px solid #ddd; border-radius: 8px; font-size: 13px;
      font-family: inherit; outline: none; transition: border-color 0.15s;
    }
    .cd-search input:focus { border-color: ${brand}; box-shadow: 0 0 0 3px ${brand}22; }
    .cd-controls {
      padding: 10px 24px; border-bottom: 1px solid #e5e5e5;
      display: flex; gap: 12px; align-items: center;
    }
    .cd-controls button {
      background: none; border: none; color: ${brand};
      cursor: pointer; font-size: 13px; padding: 2px 0; text-decoration: underline;
    }
    .cd-controls button:hover { color: ${brandHover}; }
    .cd-course-list { flex: 1; overflow-y: auto; padding: 4px 24px 8px; }
    .cd-empty-state {
      padding: 40px 24px; text-align: center; color: #6b7b8d;
    }
    .cd-empty-state .cd-empty-icon { font-size: 32px; margin-bottom: 12px; }
    .cd-empty-state .cd-empty-text { font-size: 14px; font-weight: 500; color: #2d3b45; margin-bottom: 4px; }
    .cd-empty-state .cd-empty-hint { font-size: 12px; }
    .cd-course-item {
      display: flex; align-items: center;
      padding: 10px 8px; border-radius: 8px;
      margin: 2px 0; transition: background 0.1s;
    }
    .cd-course-item:hover { background: #f8f9fa; }
    .cd-course-item input[type="checkbox"] {
      margin-right: 12px; width: 16px; height: 16px;
      cursor: pointer; accent-color: ${brand}; flex-shrink: 0;
    }
    .cd-course-item label { cursor: pointer; flex: 1; min-width: 0; }
    .cd-course-name { font-size: 14px; font-weight: 500; color: #2d3b45; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cd-course-code { font-size: 12px; color: #6b7b8d; margin-top: 2px; }
    .cd-term-group { margin-top: 2px; }
    .cd-term-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 8px; cursor: pointer; user-select: none;
      border-radius: 6px; transition: background 0.1s;
    }
    .cd-term-header:hover { background: #f8f9fa; }
    .cd-term-name { font-size: 13px; font-weight: 600; color: #2d3b45; }
    .cd-term-count { font-size: 11px; color: #6b7b8d; margin-left: 6px; font-weight: 400; }
    .cd-term-toggle { font-size: 12px; color: #6b7b8d; transition: transform 0.2s; }
    .cd-term-select { font-size: 11px; color: ${brand}; cursor: pointer; background: none; border: none; padding: 2px 4px; text-decoration: underline; border-radius: 3px; }
    .cd-term-select:hover { color: ${brandHover}; }
    .cd-modal-footer {
      padding: 16px 24px; border-top: 1px solid #e5e5e5;
      display: flex; justify-content: space-between; align-items: center;
    }
    .cd-download-btn {
      background: ${brand}; color: #fff; border: none; border-radius: 8px;
      padding: 10px 24px; font-size: 14px; font-weight: 600; cursor: pointer;
      transition: background 0.15s, transform 0.1s;
    }
    .cd-download-btn:hover { background: ${brandHover}; }
    .cd-download-btn:active { transform: scale(0.98); }
    .cd-download-btn:disabled { background: #ccc; cursor: not-allowed; transform: none; }
    .cd-selected-count { font-size: 13px; color: #6b7b8d; }
    .cd-progress { padding: 20px 24px; border-top: 1px solid #e5e5e5; font-size: 13px; color: #2d3b45; }
    .cd-progress-bar-bg { background: #e5e5e5; border-radius: 6px; height: 8px; margin-top: 10px; overflow: hidden; }
    .cd-progress-bar { background: ${brand}; height: 100%; border-radius: 6px; transition: width 0.3s; width: 0%; }
    .cd-progress-status { margin-top: 8px; font-size: 12px; color: #6b7b8d; }
    .cd-finish-screen { padding: 32px 24px; text-align: center; display: none; }
    .cd-finish-icon { font-size: 40px; margin-bottom: 12px; }
    .cd-finish-title { font-size: 18px; font-weight: 600; color: #2d3b45; margin-bottom: 4px; }
    .cd-finish-subtitle { font-size: 13px; color: #6b7b8d; margin-bottom: 16px; }
    .cd-finish-btn {
      background: ${brand}; color: #fff; border: none; border-radius: 8px;
      padding: 10px 24px; font-size: 14px; font-weight: 600; cursor: pointer;
    }
    .cd-finish-btn:hover { background: ${brandHover}; }
    .cd-loading { padding: 48px 24px; text-align: center; color: #6b7b8d; font-size: 14px; }
    .cd-loading .cd-spinner { display: inline-block; width: 24px; height: 24px; border: 3px solid #e5e5e5; border-top-color: ${brand}; border-radius: 50%; animation: cd-spin 0.8s linear infinite; margin-bottom: 12px; }
    @keyframes cd-spin { to { transform: rotate(360deg); } }
    .cd-github-footer {
      padding: 8px 24px 10px; text-align: center;
      font-size: 10px; color: #bbb; line-height: 1.5;
    }
    .cd-github-footer a { color: #999; text-decoration: none; }
    .cd-github-footer a:hover { text-decoration: underline; color: #666; }
  `;
}

// ---------------------------------------------------------------------------
// Course Selector Overlay
// ---------------------------------------------------------------------------

async function openCourseSelector() {
  document.getElementById("cd-overlay")?.remove();

  const style = document.createElement("style");
  style.id = "cd-overlay-styles";
  style.textContent = getOverlayStyles();
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.id = "cd-overlay";
  overlay.className = "cd-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Course selector");
  overlay.innerHTML = `
    <div class="cd-modal" role="document">
      <div class="cd-modal-header">
        <h2><img src="${chrome.runtime.getURL("icons/icon-128.png")}" alt="">Course Downloader</h2>
        <button class="cd-close-btn" id="cd-close" aria-label="Close">&times;</button>
      </div>
      <div class="cd-tabs" role="tablist">
        <button class="cd-tab active" role="tab" aria-selected="true" data-tab="active" id="cd-tab-active">Active Courses</button>
        <button class="cd-tab" role="tab" aria-selected="false" data-tab="completed" id="cd-tab-past">Past Courses</button>
      </div>
      <div class="cd-loading" id="cd-loading"><div class="cd-spinner"></div><div>Loading courses...</div></div>
      <div class="cd-search" id="cd-search" style="display:none">
        <input type="text" id="cd-search-input" placeholder="Search courses..." aria-label="Search courses">
      </div>
      <div class="cd-controls" id="cd-controls" style="display:none">
        <button id="cd-select-all">Select All</button>
        <button id="cd-deselect-all">Deselect All</button>
      </div>
      <div class="cd-course-list" id="cd-course-list" style="display:none" role="list" aria-live="polite"></div>
      <div class="cd-modal-footer" id="cd-footer" style="display:none">
        <span class="cd-selected-count" id="cd-selected-count" aria-live="polite">0 courses selected</span>
        <button class="cd-download-btn" id="cd-download-btn" disabled>Download Selected</button>
      </div>
      <div class="cd-progress" id="cd-progress" style="display:none" aria-live="polite">
        <div id="cd-progress-text">Downloading...</div>
        <div class="cd-progress-bar-bg" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="cd-progress-bar" id="cd-progress-bar"></div></div>
        <div class="cd-progress-status" id="cd-progress-status"></div>
      </div>
      <div class="cd-finish-screen" id="cd-finish-screen">
        <div class="cd-finish-icon" id="cd-finish-icon"></div>
        <div class="cd-finish-title" id="cd-finish-title"></div>
        <div class="cd-finish-subtitle" id="cd-finish-subtitle"></div>
        <button class="cd-finish-btn" id="cd-finish-btn">Close</button>
      </div>
      <div class="cd-github-footer">
        <a href="https://github.com/jasp-nerd/canvas-course-downloader" target="_blank">⭐ Star on GitHub</a>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  // --- Focus trapping ---
  const modal = overlay.querySelector(".cd-modal");
  const focusableSelector = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function trapFocus(e) {
    if (e.key !== "Tab") return;
    const focusable = Array.from(modal.querySelectorAll(focusableSelector)).filter((el) => el.offsetParent !== null);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  const closeOverlay = () => {
    overlay.remove();
    document.getElementById("cd-overlay-styles")?.remove();
    document.removeEventListener("keydown", keyHandler);
  };

  function keyHandler(e) {
    if (e.key === "Escape") closeOverlay();
    trapFocus(e);
  }
  document.addEventListener("keydown", keyHandler);

  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeOverlay(); });
  document.getElementById("cd-close").addEventListener("click", closeOverlay);
  document.getElementById("cd-finish-btn").addEventListener("click", closeOverlay);

  // Focus the close button initially
  document.getElementById("cd-close").focus();

  // --- Course loading & tab switching ---
  const courseCache = {};
  let currentTab = "active";

  async function loadCourses(enrollmentState) {
    if (courseCache[enrollmentState]) return courseCache[enrollmentState];
    const courses = await fetchAllCourses(enrollmentState);
    courseCache[enrollmentState] = courses;
    return courses;
  }

  function renderCourses(courses) {
    const listEl = document.getElementById("cd-course-list");
    listEl.innerHTML = "";

    if (courses.length === 0) {
      listEl.innerHTML = `
        <div class="cd-empty-state">
          <div class="cd-empty-icon">&#128218;</div>
          <div class="cd-empty-text">No courses found</div>
          <div class="cd-empty-hint">${currentTab === "active" ? "No active enrollments. Try the Past Courses tab." : "No completed courses found."}</div>
        </div>`;
      document.getElementById("cd-controls").style.display = "none";
      document.getElementById("cd-footer").style.display = "none";
      return;
    }

    document.getElementById("cd-controls").style.display = "flex";
    document.getElementById("cd-footer").style.display = "flex";

    // Group by term
    const termMap = new Map();
    for (const course of courses) {
      const termName = course.term?.name || "Other";
      if (!termMap.has(termName)) termMap.set(termName, { startAt: course.term?.start_at || null, courses: [] });
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
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", termName);

      const header = document.createElement("div");
      header.className = "cd-term-header";
      header.setAttribute("role", "button");
      header.setAttribute("tabindex", "0");
      header.setAttribute("aria-expanded", "true");
      header.innerHTML = `
        <span><span class="cd-term-name">${termName}</span><span class="cd-term-count">(${termCourses.length})</span></span>
        <span style="display:flex;gap:8px;align-items:center;">
          <button class="cd-term-select" data-term-action="toggle" tabindex="0">Select all</button>
          <span class="cd-term-toggle">&#9660;</span>
        </span>`;
      group.appendChild(header);

      const courseContainer = document.createElement("div");
      courseContainer.className = "cd-term-courses";

      for (const course of termCourses) {
        const item = document.createElement("div");
        item.className = "cd-course-item";
        item.setAttribute("role", "listitem");
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
      const toggleCollapse = (e) => {
        if (e.target.classList.contains("cd-term-select")) return;
        if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
        if (e.type === "keydown") e.preventDefault();
        const isHidden = courseContainer.style.display === "none";
        courseContainer.style.display = isHidden ? "" : "none";
        header.querySelector(".cd-term-toggle").textContent = isHidden ? "\u25BC" : "\u25B6";
        header.setAttribute("aria-expanded", isHidden ? "true" : "false");
      };
      header.addEventListener("click", toggleCollapse);
      header.addEventListener("keydown", toggleCollapse);

      // Select all in term
      header.querySelector(".cd-term-select").addEventListener("click", (e) => {
        e.stopPropagation();
        const cbs = courseContainer.querySelectorAll("input[type='checkbox']:not(:disabled)");
        const allChecked = Array.from(cbs).every((cb) => cb.checked);
        cbs.forEach((cb) => (cb.checked = !allChecked));
        updateCount();
      });
    }

    updateCount();
  }

  const updateCount = () => {
    const listEl = document.getElementById("cd-course-list");
    const n = listEl.querySelectorAll("input:checked").length;
    document.getElementById("cd-selected-count").textContent = `${n} course${n !== 1 ? "s" : ""} selected`;
    document.getElementById("cd-download-btn").disabled = n === 0;
  };

  async function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll(".cd-tab").forEach((t) => {
      const isActive = t.dataset.tab === tab;
      t.classList.toggle("active", isActive);
      t.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    const listEl = document.getElementById("cd-course-list");
    const loading = document.getElementById("cd-loading");
    listEl.style.display = "none";
    loading.style.display = "block";
    document.getElementById("cd-search").style.display = "none";
    document.getElementById("cd-controls").style.display = "none";
    document.getElementById("cd-footer").style.display = "none";

    try {
      const courses = await loadCourses(tab === "active" ? "active" : "completed");
      loading.style.display = "none";
      listEl.style.display = "block";
      document.getElementById("cd-search").style.display = "block";
      document.getElementById("cd-search-input").value = "";
      renderCourses(courses);
    } catch {
      loading.innerHTML = '<div>Failed to load courses. Make sure you are logged in.</div>';
    }
  }

  // Tab click handlers
  document.getElementById("cd-tab-active").addEventListener("click", () => switchTab("active"));
  document.getElementById("cd-tab-past").addEventListener("click", () => switchTab("completed"));

  // Initial load
  await switchTab("active");

  // Search filter
  document.getElementById("cd-search-input").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase().trim();
    const listEl = document.getElementById("cd-course-list");
    listEl.querySelectorAll(".cd-course-item").forEach((item) => {
      item.style.display = !q || item.dataset.searchable.includes(q) ? "" : "none";
    });
    listEl.querySelectorAll(".cd-term-group").forEach((group) => {
      const visibleItems = group.querySelectorAll(".cd-course-item:not([style*='display: none'])");
      group.style.display = visibleItems.length === 0 && q ? "none" : "";
    });
  });

  const listEl = document.getElementById("cd-course-list");
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
    document.getElementById("cd-search").style.display = "none";
    document.querySelector(".cd-tabs").style.display = "none";
    listEl.style.display = "none";

    const bar = document.getElementById("cd-progress-bar");
    const barBg = bar.parentElement;
    const text = document.getElementById("cd-progress-text");
    const status = document.getElementById("cd-progress-status");
    document.getElementById("cd-progress").style.display = "block";
    document.getElementById("cd-footer").style.display = "none";

    const domain = window.location.origin;
    let failedCount = 0;

    for (let i = 0; i < selected.length; i++) {
      const pct = Math.round((i / selected.length) * 100);
      bar.style.width = `${pct}%`;
      barBg.setAttribute("aria-valuenow", pct);
      text.textContent = `Downloading ${i + 1} of ${selected.length}: ${selected[i].name}`;
      status.textContent = "Starting...";

      try {
        await downloadCourse(selected[i].id, selected[i].name, domain, (msg) => {
          status.textContent = msg;
        });
      } catch (err) {
        console.error(`[Canvas Downloader] Failed: ${selected[i].name}`, err);
        status.textContent = `Error on ${selected[i].name}, continuing...`;
        failedCount++;
        await new Promise((r) => setTimeout(r, 1000));
      }

      if (i < selected.length - 1) await new Promise((r) => setTimeout(r, 500));
    }

    // Show finish screen
    document.getElementById("cd-progress").style.display = "none";
    const finishScreen = document.getElementById("cd-finish-screen");
    finishScreen.style.display = "block";

    if (failedCount === 0) {
      document.getElementById("cd-finish-icon").textContent = "\u2705";
      document.getElementById("cd-finish-title").textContent = "All downloads queued!";
      document.getElementById("cd-finish-subtitle").textContent = `${selected.length} course${selected.length !== 1 ? "s" : ""} successfully processed.`;
    } else {
      document.getElementById("cd-finish-icon").textContent = "\u26A0\uFE0F";
      document.getElementById("cd-finish-title").textContent = "Downloads completed with errors";
      document.getElementById("cd-finish-subtitle").textContent = `${selected.length - failedCount} succeeded, ${failedCount} failed. Check the console for details.`;
    }

    document.getElementById("cd-finish-btn").focus();
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

    const anchor = findMountPoint(MOUNT_SELECTORS);
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

    const anchor = findMountPoint(DASHBOARD_SELECTORS);
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
