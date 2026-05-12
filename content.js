/**
 * Canvas Course Downloader — Content Script (Entry Point)
 *
 * Initializes the extension on Canvas pages: injects buttons,
 * handles SPA navigation, and listens for messages from the
 * popup and background service worker.
 *
 * Module load order (all share the global scope):
 *   helpers.js → detector.js → canvas-api.js → ui.js → downloader.js → content.js
 */

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

injectButton();

// Persist domain and check for deferred scheduled runs on Canvas pages
if (isCanvas()) {
  persistCanvasDomain();
  checkPendingDownload();
}

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
  if (request.type === "TRIGGER_SCHEDULED_DOWNLOAD") {
    runScheduledDownload(request.payload.courseIds, request.payload.courseNames);
    sendResponse({ status: "started" });
    return;
  }
  if (request.action === "trigger_download") {
    downloadCurrentCourse();
    sendResponse({ status: "started" });
  } else if (request.action === "open_course_selector") {
    openCourseSelector();
    sendResponse({ status: "opened" });
  } else if (request.action === "get_status") {
    sendResponse({ isCanvas: isCanvas(), courseId: getCourseId(), isHomepage: isCanvasHomepage(), courseName: getCourseId() ? getCourseName() : null });
  }
});

// Check if downloads are already in progress (e.g. after SPA navigation)
chrome.runtime.sendMessage({ type: "GET_DOWNLOAD_STATUS" }, (status) => {
  if (chrome.runtime.lastError || !status) return;
  if (status.total > 0 && !status.done) updateDownloadPanel(status);
});

// ---------------------------------------------------------------------------
// Scheduled Downloads Support
// ---------------------------------------------------------------------------

function persistCanvasDomain() {
  chrome.storage.local.get("canvasDomain", ({ canvasDomain }) => {
    if (!canvasDomain) chrome.storage.local.set({ canvasDomain: window.location.origin });
  });
}

async function checkPendingDownload() {
  const { pendingRun } = await chrome.storage.local.get("pendingRun");
  if (!pendingRun?.courseIds?.length) return;
  // Clear before running to prevent a second tab from also triggering
  await chrome.storage.local.remove("pendingRun");
  runScheduledDownload(pendingRun.courseIds, pendingRun.courseNames);
}

async function runScheduledDownload(courseIds, courseNames) {
  const domain = window.location.origin;
  const startedAt = Date.now();
  let completed = 0;
  let failed = 0;

  downloadCancelled = false;

  for (let i = 0; i < courseIds.length; i++) {
    if (downloadCancelled) break;
    const id = courseIds[i];
    const name = (courseNames && courseNames[id]) || `Course ${id}`;
    try {
      await downloadCourse(String(id), name, domain, null);
      completed++;
    } catch (err) {
      console.error(`[Canvas Downloader] Scheduled download failed for course ${id}:`, err);
      failed++;
    }
    if (i < courseIds.length - 1) await new Promise((r) => setTimeout(r, 500));
  }

  chrome.storage.local.set({
    lastScheduledRun: { startedAt, completedAt: Date.now(), completed, failed, courseIds },
  });
}
