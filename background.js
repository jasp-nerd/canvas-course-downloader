/**
 * Background service worker for Canvas Course Downloader.
 *
 * Manages download jobs with proper state tracking. Each file is tracked
 * through queued → downloading → complete/failed states using Chrome's
 * downloads.onChanged API. Supports retry, cancel, and real-time status
 * broadcasting to the content script.
 */

const STATE = { QUEUED: "queued", DOWNLOADING: "downloading", COMPLETE: "complete", FAILED: "failed" };

let jobs = [];
let nextJobId = 0;
let isProcessing = false;
let cancelled = false;
let sourceTabId = null;
let downloadSettings = { conflictAction: "uniquify", throttleMs: 250, folderPrefix: "" };

// Maps Chrome download IDs → job objects for onChanged tracking
const chromeIdToJob = new Map();

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function getStatus() {
  const completed = jobs.filter((j) => j.state === STATE.COMPLETE).length;
  const failed = jobs.filter((j) => j.state === STATE.FAILED).length;
  const downloading = jobs.filter((j) => j.state === STATE.DOWNLOADING).length;
  const queued = jobs.filter((j) => j.state === STATE.QUEUED).length;
  return {
    total: jobs.length,
    queued,
    downloading,
    completed,
    failed,
    currentFile: jobs.find((j) => j.state === STATE.DOWNLOADING)?.filename || null,
    failedFiles: jobs
      .filter((j) => j.state === STATE.FAILED)
      .map((j) => ({ id: j.id, filename: j.filename, path: j.path, error: j.error })),
    done: jobs.length > 0 && queued === 0 && downloading === 0,
    cancelled,
  };
}

function broadcastStatus() {
  updateBadge();
  if (sourceTabId) {
    chrome.tabs.sendMessage(sourceTabId, { type: "DOWNLOAD_STATUS", payload: getStatus() }).catch(() => {});
  }
}

function updateBadge() {
  const remaining = jobs.filter((j) => j.state === STATE.QUEUED || j.state === STATE.DOWNLOADING).length;
  if (remaining > 0) {
    chrome.action.setBadgeText({ text: String(remaining) });
    chrome.action.setBadgeBackgroundColor({ color: "#e82429" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

function notifyCompletion() {
  const { completed, failed } = getStatus();
  chrome.notifications.create("download-complete", {
    type: "basic",
    iconUrl: "icons/icon-128.png",
    title: "Canvas Course Downloader",
    message: `Downloads finished: ${completed} succeeded${failed > 0 ? `, ${failed} failed` : ""}.`,
  });
}

// ---------------------------------------------------------------------------
// Download tracking via chrome.downloads.onChanged
// ---------------------------------------------------------------------------

chrome.downloads.onChanged.addListener((delta) => {
  const job = chromeIdToJob.get(delta.id);
  if (!job) return;

  if (delta.state?.current === "complete") {
    job.state = STATE.COMPLETE;
    chromeIdToJob.delete(delta.id);
    broadcastStatus();
    scheduleNext();
  } else if (delta.state?.current === "interrupted") {
    job.state = STATE.FAILED;
    job.error = delta.error?.current || "Download interrupted";
    chromeIdToJob.delete(delta.id);
    broadcastStatus();
    scheduleNext();
  }
});

// ---------------------------------------------------------------------------
// Queue processing
// ---------------------------------------------------------------------------

function scheduleNext() {
  setTimeout(processQueue, downloadSettings.throttleMs || 250);
}

function processQueue() {
  if (cancelled) {
    isProcessing = false;
    const status = getStatus();
    if (status.done && jobs.length > 0) notifyCompletion();
    broadcastStatus();
    return;
  }

  const nextJob = jobs.find((j) => j.state === STATE.QUEUED);
  if (!nextJob) {
    isProcessing = false;
    const status = getStatus();
    if (status.done && jobs.length > 0) notifyCompletion();
    broadcastStatus();
    return;
  }

  isProcessing = true;
  nextJob.state = STATE.DOWNLOADING;
  broadcastStatus();

  const sanitizedName = nextJob.filename.replace(/[/\\?%*:|"<>]/g, "-");
  let fullPath = `${nextJob.path}${sanitizedName}`;
  if (fullPath.startsWith("/")) fullPath = fullPath.substring(1);

  const conflictAction = downloadSettings.conflictAction === "skip" ? "uniquify" : downloadSettings.conflictAction;
  chrome.downloads.download(
    { url: nextJob.url, filename: fullPath, conflictAction },
    (downloadId) => {
      if (chrome.runtime.lastError || !downloadId) {
        nextJob.state = STATE.FAILED;
        nextJob.error = chrome.runtime.lastError?.message || "Download failed to start";
        broadcastStatus();
        scheduleNext();
      } else {
        nextJob.chromeDownloadId = downloadId;
        chromeIdToJob.set(downloadId, nextJob);
        // onChanged listener handles completion/failure from here
      }
    }
  );
}

// ---------------------------------------------------------------------------
// Keyboard shortcut handler
// ---------------------------------------------------------------------------

chrome.commands.onCommand.addListener((command) => {
  if (command !== "download-current") return;
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab) return;
    chrome.tabs.sendMessage(tab.id, { action: "get_status" }, (response) => {
      if (chrome.runtime.lastError || !response?.isCanvas) return;
      const action = response.courseId ? "trigger_download" : "open_course_selector";
      chrome.tabs.sendMessage(tab.id, { action });
    });
  });
});

// ---------------------------------------------------------------------------
// Message handling
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_DOWNLOAD") {
    const { files, courseName, conflictAction, throttleMs, folderPrefix } = message.payload;
    const safeName = courseName.replace(/[/\\?%*:|"<>]/g, "-");

    // Store settings for this batch
    downloadSettings = {
      conflictAction: conflictAction || "uniquify",
      throttleMs: throttleMs || 250,
      folderPrefix: (folderPrefix || "").replace(/[/\\?%*:|"<>]/g, "-"),
    };

    // Reset if previous batch is done
    const prev = getStatus();
    if (prev.done || jobs.length === 0) {
      jobs = [];
      nextJobId = 0;
      cancelled = false;
      chromeIdToJob.clear();
    }

    sourceTabId = sender.tab?.id || sourceTabId;

    const prefix = downloadSettings.folderPrefix ? `${downloadSettings.folderPrefix}/` : "";
    const newJobs = files.map((file) => ({
      id: nextJobId++,
      url: file.url,
      filename: file.filename,
      path: `${prefix}${safeName}/${file.path}`.replace(/\/+/g, "/"),
      state: STATE.QUEUED,
      chromeDownloadId: null,
      error: null,
    }));

    jobs.push(...newJobs);
    broadcastStatus();
    if (!isProcessing) processQueue();

    sendResponse({ status: "queued", count: newJobs.length });
  } else if (message.type === "GET_DOWNLOAD_STATUS") {
    sendResponse(getStatus());
  } else if (message.type === "RETRY_FAILED") {
    const failedJobs = jobs.filter((j) => j.state === STATE.FAILED);
    failedJobs.forEach((j) => {
      j.state = STATE.QUEUED;
      j.error = null;
      j.chromeDownloadId = null;
    });
    cancelled = false;
    broadcastStatus();
    if (!isProcessing && failedJobs.length > 0) processQueue();
    sendResponse({ status: "retrying", count: failedJobs.length });
  } else if (message.type === "CANCEL_DOWNLOADS") {
    cancelled = true;
    const activeJob = jobs.find((j) => j.state === STATE.DOWNLOADING);
    if (activeJob?.chromeDownloadId) {
      chrome.downloads.cancel(activeJob.chromeDownloadId);
      activeJob.state = STATE.FAILED;
      activeJob.error = "Cancelled";
      chromeIdToJob.delete(activeJob.chromeDownloadId);
    }
    jobs
      .filter((j) => j.state === STATE.QUEUED)
      .forEach((j) => {
        j.state = STATE.FAILED;
        j.error = "Cancelled";
      });
    isProcessing = false;
    broadcastStatus();
    sendResponse({ status: "cancelled" });
  }
});
