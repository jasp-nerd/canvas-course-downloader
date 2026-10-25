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

  const accents = {
    info:    { fg: "#1f2937", accent: "#6b7280" },
    success: { fg: "#1f2937", accent: "#16a34a" },
    error:   { fg: "#1f2937", accent: "#dc2626" },
  };
  const a = accents[type] || accents.info;

  const icons = {
    info:    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><circle cx="12" cy="16" r=".5" fill="currentColor"/></svg>`,
    success: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>`,
    error:   `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`,
  };

  const toast = document.createElement("div");
  toast.id = "cd-toast";
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 100001;
    background: #fff; color: ${a.fg};
    padding: 12px 14px 12px 12px; border-radius: 12px; font-size: 13px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    box-shadow: 0 12px 32px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.06);
    border: 1px solid rgba(0,0,0,0.04);
    max-width: 360px;
    display: flex; align-items: flex-start; gap: 10px;
    opacity: 0; transform: translateY(6px);
    transition: opacity 0.2s, transform 0.2s;
    letter-spacing: -0.005em;
  `;
  toast.innerHTML = `
    <span style="flex-shrink:0;color:${a.accent};margin-top:1px;">${icons[type] || icons.info}</span>
    <span style="flex:1;min-width:0;line-height:1.4;"></span>
  `;
  toast.querySelector("span:last-child").textContent = message;

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(6px)";
    setTimeout(() => toast.remove(), 200);
  }, 4000);
}

// ---------------------------------------------------------------------------
// Download Progress Panel
// ---------------------------------------------------------------------------

let downloadPanel = null;

// Content-script cancel flag. Set by the panel's Cancel button; read by the
// ZIP fetch loop and the multi-course selector loop so they stop iterating
// even though those loops run entirely in the content script (not in the
// background queue).
let downloadCancelled = false;

function createDownloadPanel() {
  if (downloadPanel) return downloadPanel;

  const brand = getCanvasBrandColor();
  const brandHover = darkenColor(brand);

  const panel = document.createElement("div");
  panel.id = "cd-download-panel";
  panel.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 100002;
    width: 360px; background: #fff; border-radius: 14px;
    box-shadow: 0 16px 40px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.06);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1f2937;
    overflow: hidden;
    border: 1px solid rgba(0,0,0,0.04);
  `;

  const iconBtn = `background:none;border:none;color:#6b7280;cursor:pointer;width:26px;height:26px;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;transition:background 0.12s,color 0.12s;`;

  panel.innerHTML = `
    <div id="cd-panel-header" style="padding:14px 16px 10px;display:flex;justify-content:space-between;align-items:center;gap:10px;">
      <div style="display:flex;align-items:center;gap:10px;min-width:0;">
        <div style="width:26px;height:26px;border-radius:7px;background:${brand};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 4v12"/><path d="M6 12l6 6 6-6"/><path d="M5 20h14"/>
          </svg>
        </div>
        <span id="cd-panel-title" style="font-weight:600;font-size:13.5px;color:#1f2937;letter-spacing:-0.005em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Downloading...</span>
      </div>
      <div style="display:flex;gap:2px;align-items:center;flex-shrink:0;">
        <button id="cd-panel-minimize" style="${iconBtn}" title="Minimize" aria-label="Minimize">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>
        </button>
        <button id="cd-panel-close" style="${iconBtn}" title="Close" aria-label="Close">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
    <div id="cd-panel-body">
      <div style="padding:2px 16px 14px;">
        <div id="cd-panel-current" style="font-size:12px;color:#6b7280;margin-bottom:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>
        <div style="background:#f3f4f6;border-radius:999px;height:6px;overflow:hidden;">
          <div id="cd-panel-bar" style="background:${brand};height:100%;border-radius:999px;transition:width 0.3s;width:0%;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11.5px;color:#6b7280;">
          <span id="cd-panel-stats"></span>
          <span id="cd-panel-pct" style="font-weight:600;color:#1f2937;"></span>
        </div>
      </div>
      <div id="cd-panel-actions" style="padding:0 16px 14px;display:flex;gap:8px;">
        <button id="cd-panel-cancel" style="font-family:inherit;background:none;border:none;border-radius:7px;padding:6px 10px;font-size:12.5px;font-weight:500;cursor:pointer;color:#6b7280;transition:background 0.12s,color 0.12s;">Cancel</button>
      </div>
      <div id="cd-panel-failed-section" style="display:none;padding:0 16px 14px;">
        <details>
          <summary style="font-size:12px;color:#b91c1c;cursor:pointer;font-weight:500;">Failed files</summary>
          <div id="cd-panel-failed-list" style="max-height:120px;overflow-y:auto;margin-top:6px;font-size:11px;color:#6b7280;"></div>
        </details>
      </div>
      <div id="cd-panel-done" style="display:none;padding:14px 16px 16px;text-align:center;">
        <div id="cd-panel-summary" style="font-size:13.5px;font-weight:500;color:#1f2937;"></div>
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:center;">
          <button id="cd-panel-retry" style="display:none;font-family:inherit;background:${brand};color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:12.5px;font-weight:600;cursor:pointer;transition:background 0.12s;">Retry failed</button>
          <button id="cd-panel-dismiss" style="font-family:inherit;background:none;border:none;border-radius:7px;padding:7px 14px;font-size:12.5px;font-weight:500;cursor:pointer;color:#6b7280;transition:background 0.12s,color 0.12s;">Dismiss</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(panel);
  downloadPanel = panel;

  // Minimize toggle (swap minus <-> plus icon)
  const MINUS_SVG = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>`;
  const PLUS_SVG = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`;
  let minimized = false;
  panel.querySelector("#cd-panel-minimize").addEventListener("click", () => {
    minimized = !minimized;
    panel.querySelector("#cd-panel-body").style.display = minimized ? "none" : "";
    panel.querySelector("#cd-panel-minimize").innerHTML = minimized ? PLUS_SVG : MINUS_SVG;
  });

  // Icon/ghost button hover states (inline since the panel is all inline-styled)
  panel.querySelectorAll("#cd-panel-minimize, #cd-panel-close").forEach((btn) => {
    btn.addEventListener("mouseenter", () => { btn.style.background = "#f9fafb"; btn.style.color = "#1f2937"; });
    btn.addEventListener("mouseleave", () => { btn.style.background = "none"; btn.style.color = "#6b7280"; });
  });
  panel.querySelectorAll("#cd-panel-cancel, #cd-panel-dismiss").forEach((btn) => {
    btn.addEventListener("mouseenter", () => { btn.style.background = "#f9fafb"; btn.style.color = "#1f2937"; });
    btn.addEventListener("mouseleave", () => { btn.style.background = "none"; btn.style.color = "#6b7280"; });
  });
  const retryBtn = panel.querySelector("#cd-panel-retry");
  retryBtn.addEventListener("mouseenter", () => { retryBtn.style.background = brandHover; });
  retryBtn.addEventListener("mouseleave", () => { retryBtn.style.background = brand; });

  // Close
  panel.querySelector("#cd-panel-close").addEventListener("click", () => {
    panel.remove();
    downloadPanel = null;
  });

  // Cancel
  panel.querySelector("#cd-panel-cancel").addEventListener("click", () => {
    downloadCancelled = true;
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
      background: rgba(0,0,0,0.45);
      z-index: 100000;
      display: flex; align-items: center; justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1f2937;
    }
    .cd-modal {
      background: #fff; border-radius: 16px;
      width: 560px; max-height: 80vh;
      display: flex; flex-direction: column;
      box-shadow: 0 24px 64px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .cd-modal *:focus-visible {
      outline: 2px solid ${brand}; outline-offset: 2px; border-radius: 6px;
    }

    /* Header */
    .cd-modal-header {
      padding: 18px 20px 14px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .cd-brand { display: flex; align-items: center; gap: 12px; }
    .cd-brand-mark {
      width: 32px; height: 32px; border-radius: 8px;
      display: block; flex-shrink: 0;
    }
    .cd-brand-title { font-size: 15px; font-weight: 600; color: #1f2937; letter-spacing: -0.01em; }
    .cd-header-actions { display: flex; align-items: center; gap: 2px; }
    .cd-icon-btn {
      width: 32px; height: 32px; border-radius: 8px;
      background: none; border: none; color: #6b7280; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      transition: background 0.12s, color 0.12s;
    }
    .cd-icon-btn:hover { background: #f9fafb; color: #1f2937; }
    .cd-icon-btn svg { width: 16px; height: 16px; }

    /* Tabs: segmented control */
    .cd-tabs {
      margin: 0 20px 16px; padding: 4px;
      background: #f3f4f6; border-radius: 10px;
      display: flex; gap: 2px;
    }
    .cd-tab {
      flex: 1; padding: 8px 12px;
      background: none; border: none; border-radius: 7px;
      font-size: 13px; font-weight: 500; color: #6b7280;
      cursor: pointer; font-family: inherit;
      transition: background 0.15s, color 0.15s, box-shadow 0.15s;
    }
    .cd-tab:hover { color: #1f2937; }
    .cd-tab.active {
      background: #fff; color: #1f2937; font-weight: 600;
      box-shadow: 0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04);
    }

    /* Search */
    .cd-modal .cd-search { padding: 0 20px 14px; position: relative; }
    .cd-modal .cd-search svg {
      position: absolute; left: 34px; top: 12px;
      width: 16px; height: 16px;
      color: #9ca3af; pointer-events: none;
    }
    .cd-modal .cd-search input,
    .cd-modal .cd-search input[type="text"] {
      width: 100%; box-sizing: border-box;
      height: 40px; line-height: 1.4;
      padding: 0 14px 0 40px;
      margin: 0;
      border: 1px solid #e5e7eb; border-radius: 10px;
      font-size: 13.5px; font-family: inherit;
      background: #fff; color: #1f2937; outline: none;
      box-shadow: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .cd-modal .cd-search input::placeholder { color: #9ca3af; opacity: 1; }
    .cd-modal .cd-search input:focus,
    .cd-modal .cd-search input[type="text"]:focus {
      border-color: ${brand};
      box-shadow: 0 0 0 3px ${brand}1f;
    }

    /* List-wide controls (above course list) */
    .cd-list-controls {
      display: flex; gap: 4px; align-items: center;
      padding: 0 20px 8px;
    }
    .cd-list-controls .cd-ghost-btn { padding: 5px 10px; font-size: 12px; }

    /* Course list */
    .cd-course-list { flex: 1; overflow-y: auto; padding: 4px 12px 8px; }
    .cd-empty-state {
      padding: 48px 24px; text-align: center; color: #6b7280;
    }
    .cd-empty-state .cd-empty-icon { font-size: 32px; margin-bottom: 12px; }
    .cd-empty-state .cd-empty-text { font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 4px; }
    .cd-empty-state .cd-empty-hint { font-size: 12px; }

    /* Term group */
    .cd-term-group { padding: 8px 0; }
    .cd-term-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 6px 8px;
    }
    .cd-term-label { display: flex; align-items: center; gap: 8px; }
    .cd-term-name {
      font-size: 10.5px; font-weight: 600; color: #6b7280;
      text-transform: uppercase; letter-spacing: 0.08em;
    }
    .cd-term-count {
      font-size: 10.5px; font-weight: 600; color: #6b7280;
      background: #f3f4f6; padding: 2px 7px; border-radius: 999px;
      letter-spacing: 0;
    }
    .cd-term-actions { display: flex; align-items: center; gap: 4px; }
    .cd-ghost-btn {
      font-family: inherit; font-size: 12px; font-weight: 500;
      color: #6b7280; background: none; border: none;
      padding: 4px 8px; border-radius: 6px; cursor: pointer;
      transition: background 0.12s, color 0.12s;
    }
    .cd-ghost-btn:hover { background: #f9fafb; color: #1f2937; }
    .cd-chevron-btn {
      width: 26px; height: 26px; border-radius: 6px;
      background: none; border: none; color: #9ca3af; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      transition: background 0.12s, color 0.12s, transform 0.2s;
    }
    .cd-chevron-btn:hover { background: #f9fafb; color: #1f2937; }
    .cd-chevron-btn svg { width: 14px; height: 14px; }
    .cd-chevron-btn.collapsed { transform: rotate(-90deg); }

    /* Course row */
    .cd-course-item {
      border-radius: 10px;
      position: relative;
      transition: background 0.1s;
    }
    .cd-course-item:hover { background: #f9fafb; }
    .cd-course-item.cd-selected { background: ${brand}14; }
    .cd-course-item.cd-selected::before {
      content: ""; position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 3px; background: ${brand};
    }
    /* Merge adjacent selected rows into a single visual block */
    .cd-course-item.cd-selected:has(+ .cd-course-item.cd-selected) {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
    .cd-course-item.cd-selected + .cd-course-item.cd-selected {
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }
    .cd-course-item input[type="checkbox"] {
      position: absolute; opacity: 0; pointer-events: none;
    }
    .cd-course-item label {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px;
      cursor: pointer; min-width: 0;
    }
    .cd-checkbox {
      width: 18px; height: 18px; border: 1.5px solid #d1d5db;
      border-radius: 5px; background: #fff;
      display: inline-flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      transition: background 0.12s, border-color 0.12s;
    }
    .cd-checkbox svg {
      width: 12px; height: 12px; color: #fff;
      opacity: 0; transition: opacity 0.12s;
    }
    .cd-course-item.cd-selected .cd-checkbox {
      background: ${brand}; border-color: ${brand};
    }
    .cd-course-item.cd-selected .cd-checkbox svg { opacity: 1; }
    .cd-course-item:hover:not(.cd-selected) .cd-checkbox { border-color: ${brand}; }
    .cd-course-meta { flex: 1; min-width: 0; display: block; }
    .cd-course-name {
      display: block;
      font-size: 13.5px; font-weight: 500; color: #1f2937;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      letter-spacing: -0.005em;
    }
    .cd-course-code {
      display: block;
      font-size: 11px; color: #9ca3af; margin-top: 1px;
      font-family: ui-monospace, "SF Mono", Menlo, monospace;
    }

    /* Footer */
    .cd-modal-footer {
      padding: 14px 20px;
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px;
      background: linear-gradient(to bottom, transparent, #fafafa 30%);
      border-top: 1px solid #e5e7eb;
    }
    .cd-footer-count {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: #6b7280;
    }
    .cd-footer-count strong { color: #1f2937; font-weight: 600; }
    .cd-footer-actions { display: flex; gap: 8px; align-items: center; }
    .cd-text-btn {
      font-family: inherit; font-size: 12.5px; font-weight: 500;
      color: #6b7280; background: none; border: none;
      padding: 6px 10px; border-radius: 7px; cursor: pointer;
    }
    .cd-text-btn:hover { background: #f9fafb; color: #1f2937; }
    .cd-download-btn {
      background: ${brand}; color: #fff; border: none; border-radius: 9px;
      padding: 9px 18px; font-size: 13.5px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      display: inline-flex; align-items: center; gap: 6px;
      transition: background 0.12s, transform 0.08s;
    }
    .cd-download-btn:hover { background: ${brandHover}; }
    .cd-download-btn:active { transform: scale(0.98); }
    .cd-download-btn:disabled {
      background: #e5e7eb; color: #9ca3af; cursor: not-allowed; transform: none;
    }
    .cd-download-btn svg { width: 14px; height: 14px; }

    /* Inline progress + finish screens */
    .cd-progress { padding: 24px 24px 20px; font-size: 13px; color: #1f2937; }
    .cd-progress-bar-bg { background: #f3f4f6; border-radius: 999px; height: 6px; margin-top: 12px; overflow: hidden; }
    .cd-progress-bar { background: ${brand}; height: 100%; border-radius: 999px; transition: width 0.3s; width: 0%; }
    .cd-progress-status { margin-top: 8px; font-size: 12px; color: #6b7280; }
    .cd-finish-screen { padding: 36px 24px 28px; text-align: center; display: none; }
    .cd-finish-icon { font-size: 40px; margin-bottom: 12px; }
    .cd-finish-title { font-size: 17px; font-weight: 600; color: #1f2937; margin-bottom: 4px; letter-spacing: -0.01em; }
    .cd-finish-subtitle { font-size: 13px; color: #6b7280; margin-bottom: 18px; }
    .cd-finish-btn {
      background: ${brand}; color: #fff; border: none; border-radius: 9px;
      padding: 9px 22px; font-size: 13.5px; font-weight: 600; cursor: pointer;
      font-family: inherit;
    }
    .cd-finish-btn:hover { background: ${brandHover}; }

    /* Loading */
    .cd-loading { padding: 56px 24px; text-align: center; color: #6b7280; font-size: 13px; }
    .cd-loading .cd-spinner {
      display: inline-block; width: 24px; height: 24px;
      border: 3px solid #f3f4f6; border-top-color: ${brand};
      border-radius: 50%; animation: cd-spin 0.8s linear infinite;
      margin-bottom: 12px;
    }
    @keyframes cd-spin { to { transform: rotate(360deg); } }

    /* Micro footer */
    .cd-github-footer {
      padding: 9px 20px 11px;
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      background: #fafafa;
      border-top: 1px solid #f0f0f0;
    }
    .cd-github-version {
      font-size: 11px; color: #b0b4ba;
      font-variant-numeric: tabular-nums;
    }
    .cd-github-links { display: flex; align-items: center; gap: 16px; }
    .cd-github-footer a {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 11.5px; color: #9ca3af; text-decoration: none;
      transition: color 0.12s;
    }
    .cd-github-footer a:hover { color: #4b5563; }
    .cd-github-footer svg { width: 14px; height: 14px; display: block; flex-shrink: 0; }
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
        <div class="cd-brand">
          <img class="cd-brand-mark" src="${chrome.runtime.getURL("icons/icon-128.png")}" alt="">
          <div class="cd-brand-title">Course Downloader</div>
        </div>
        <div class="cd-header-actions">
          <button class="cd-icon-btn" id="cd-settings" aria-label="Open settings" title="Settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          <button class="cd-icon-btn" id="cd-close" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="cd-tabs" role="tablist">
        <button class="cd-tab active" role="tab" aria-selected="true" data-tab="active" id="cd-tab-active">Active Courses</button>
        <button class="cd-tab" role="tab" aria-selected="false" data-tab="completed" id="cd-tab-past">Past Courses</button>
      </div>
      <div class="cd-loading" id="cd-loading"><div class="cd-spinner"></div><div>Loading courses...</div></div>
      <div class="cd-search" id="cd-search" style="display:none">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7"/>
          <path d="M21 21l-4.3-4.3"/>
        </svg>
        <input type="text" id="cd-search-input" placeholder="Search courses..." aria-label="Search courses">
      </div>
      <div class="cd-list-controls" id="cd-list-controls" style="display:none">
        <button class="cd-ghost-btn" id="cd-select-all" type="button">Select all</button>
        <button class="cd-ghost-btn" id="cd-deselect-all" type="button">Deselect all</button>
      </div>
      <div class="cd-course-list" id="cd-course-list" style="display:none" role="list" aria-live="polite"></div>
      <div class="cd-modal-footer" id="cd-footer" style="display:none">
        <div class="cd-footer-count" aria-live="polite">
          <span id="cd-selected-count"><strong>0</strong> selected</span>
        </div>
        <div class="cd-footer-actions">
          <button class="cd-download-btn" id="cd-download-btn" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 4v12"/>
              <path d="M6 12l6 6 6-6"/>
              <path d="M5 20h14"/>
            </svg>
            Download selected
          </button>
        </div>
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
        <span class="cd-github-version">v${chrome.runtime.getManifest().version}</span>
        <div class="cd-github-links">
          <a href="https://github.com/jasp-nerd/canvas-course-downloader" target="_blank" rel="noopener" title="View source on GitHub">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.29 0 .32.21.7.82.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z"/>
            </svg>
            GitHub
          </a>
          <a href="https://github.com/jasp-nerd/canvas-course-downloader/issues" target="_blank" rel="noopener" title="Report a bug or request a feature">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="8" y="6" width="8" height="14" rx="4"/>
              <path d="M19 7l-3 2M5 7l3 2M19 13h-3M8 13H5M19 19l-3-2M5 19l3-2M12 2v4"/>
            </svg>
            Report a bug
          </a>
        </div>
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
  document.getElementById("cd-settings").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
  });

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
      document.getElementById("cd-list-controls").style.display = "none";
      document.getElementById("cd-footer").style.display = "none";
      return;
    }

    document.getElementById("cd-list-controls").style.display = "flex";
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
      header.innerHTML = `
        <div class="cd-term-label">
          <span class="cd-term-name">${termName}</span>
          <span class="cd-term-count">${termCourses.length}</span>
        </div>
        <div class="cd-term-actions">
          <button class="cd-ghost-btn" data-term-action="toggle" type="button">Select all</button>
          <button class="cd-chevron-btn" aria-label="Collapse term" aria-expanded="true" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
        </div>`;
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
            <span class="cd-checkbox" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12l5 5L20 7"/>
              </svg>
            </span>
            <span class="cd-course-meta">
              <span class="cd-course-name">${course.name}</span>
              <span class="cd-course-code">${course.course_code || ""}</span>
            </span>
          </label>`;

        courseContainer.appendChild(item);
      }
      group.appendChild(courseContainer);
      listEl.appendChild(group);

      // Chevron collapse toggle
      const chevronBtn = header.querySelector(".cd-chevron-btn");
      chevronBtn.addEventListener("click", () => {
        const collapsed = chevronBtn.classList.toggle("collapsed");
        courseContainer.style.display = collapsed ? "none" : "";
        chevronBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
      });

      // Per-term select all
      header.querySelector(".cd-ghost-btn").addEventListener("click", () => {
        const items = courseContainer.querySelectorAll(".cd-course-item");
        const allSelected = Array.from(items).every((it) => it.classList.contains("cd-selected"));
        items.forEach((it) => {
          const cb = it.querySelector("input[type='checkbox']");
          cb.checked = !allSelected;
          it.classList.toggle("cd-selected", !allSelected);
        });
        updateCount();
      });
    }

    updateCount();
  }

  const updateCount = () => {
    const listEl = document.getElementById("cd-course-list");
    const total = listEl.querySelectorAll(".cd-course-item").length;
    const n = listEl.querySelectorAll(".cd-course-item.cd-selected").length;
    const countEl = document.getElementById("cd-selected-count");
    countEl.innerHTML = n === 0
      ? `<strong>0</strong> selected`
      : `<strong>${n}</strong> of ${total} selected`;
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
    document.getElementById("cd-list-controls").style.display = "none";
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

  // Sync selected-class whenever any checkbox toggles (label click or programmatic).
  listEl.addEventListener("change", (e) => {
    if (e.target.tagName !== "INPUT") return;
    const item = e.target.closest(".cd-course-item");
    if (item) item.classList.toggle("cd-selected", e.target.checked);
    updateCount();
  });

  const applyToAll = (selected) => {
    listEl.querySelectorAll(".cd-course-item").forEach((it) => {
      const cb = it.querySelector("input[type='checkbox']");
      cb.checked = selected;
      it.classList.toggle("cd-selected", selected);
    });
    updateCount();
  };
  document.getElementById("cd-select-all").addEventListener("click", () => applyToAll(true));
  document.getElementById("cd-deselect-all").addEventListener("click", () => applyToAll(false));

  // Bulk download handler
  document.getElementById("cd-download-btn").addEventListener("click", async () => {
    const selected = Array.from(listEl.querySelectorAll("input:checked")).map((cb) => ({
      id: cb.dataset.courseId,
      name: cb.dataset.courseName,
    }));
    if (selected.length === 0) return;

    document.getElementById("cd-download-btn").disabled = true;
    document.getElementById("cd-search").style.display = "none";
    document.getElementById("cd-list-controls").style.display = "none";
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
    downloadCancelled = false;

    for (let i = 0; i < selected.length; i++) {
      if (downloadCancelled) break;

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

    if (downloadCancelled) {
      document.getElementById("cd-finish-icon").textContent = "\u26D4";
      document.getElementById("cd-finish-title").textContent = "Cancelled";
      document.getElementById("cd-finish-subtitle").textContent = "Download was cancelled. Remaining courses were skipped.";
    } else if (failedCount === 0) {
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

  const brand = getCanvasBrandColor();
  const brandHover = darkenColor(brand);
  const downloadIcon = `
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0;">
      <path d="M12 4v12"/><path d="M6 12l6 6 6-6"/><path d="M5 20h14"/>
    </svg>`;

  const buildBtn = (id, label) => {
    const btn = document.createElement("button");
    btn.id = id;
    btn.innerHTML = `${downloadIcon}<span>${label}</span>`;
    btn.style.cssText = `
      display: inline-flex; align-items: center; gap: 7px;
      background: ${brand}; color: #fff; border: none; border-radius: 8px;
      padding: 7px 14px; font-size: 13.5px; font-weight: 600;
      cursor: pointer; margin-left: 12px;
      font-family: inherit; letter-spacing: -0.005em;
      box-shadow: 0 1px 2px rgba(0,0,0,0.06);
      transition: background 0.12s, transform 0.08s, box-shadow 0.12s;
      align-self: center; vertical-align: middle; flex-shrink: 0;
    `;
    btn.addEventListener("mouseenter", () => {
      btn.style.background = brandHover;
      btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.12)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = brand;
      btn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.06)";
    });
    btn.addEventListener("mousedown", () => (btn.style.transform = "scale(0.97)"));
    btn.addEventListener("mouseup", () => (btn.style.transform = ""));
    return btn;
  };

  if (getCourseId()) {
    // Course page — single download button
    if (document.getElementById("canvas-downloader-btn")) return;

    const btn = buildBtn("canvas-downloader-btn", "Download course content");
    btn.addEventListener("click", downloadCurrentCourse);

    // Prefer slotting into the breadcrumb list itself so the button sits next
    // to the course code instead of getting pushed to the far right of the
    // header by Canvas's flex layout (and any sibling buttons like Immersive
    // Reader). Falls back to broader header anchors if the list isn't found.
    const crumbList = document.querySelector("#breadcrumbs ol, #breadcrumbs ul, .ic-app-crumbs");
    if (crumbList) {
      crumbList.appendChild(btn);
      // Add a flex display to the breadcrumb list so the button sits inline with the breadcrumbs instead of wrapping below them.
      crumbList.style.display = "flex";
    } else {
      const anchor = findMountPoint(MOUNT_SELECTORS);
      if (!anchor) return;
      anchor.appendChild(btn);
    }
  } else {
    // Dashboard — multi-course selector button
    if (document.getElementById("canvas-downloader-home-btn")) return;
    const anchor = findMountPoint(DASHBOARD_SELECTORS);
    if (!anchor) return;

    const btn = buildBtn("canvas-downloader-home-btn", "Download courses");
    btn.addEventListener("click", openCourseSelector);
    anchor.appendChild(btn);
  }
}
