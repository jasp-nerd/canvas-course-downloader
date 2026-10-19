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
// State persistence (chrome.storage.session)
// ---------------------------------------------------------------------------

// MV3 service workers idle out after ~30 s of inactivity, which wipes every
// global above. Persisting to session storage lets us rehydrate when the
// worker is woken by an event (e.g. chrome.downloads.onChanged) so in-flight
// queues don't get stranded mid-batch on long courses.

let stateLoadPromise = null;

function ensureStateLoaded() {
  if (!stateLoadPromise) {
    stateLoadPromise = chrome.storage.session.get({
      jobs: [],
      nextJobId: 0,
      isProcessing: false,
      cancelled: false,
      sourceTabId: null,
      downloadSettings: { conflictAction: "uniquify", throttleMs: 250, folderPrefix: "" },
    }).then((s) => {
      jobs = s.jobs;
      nextJobId = s.nextJobId;
      isProcessing = s.isProcessing;
      cancelled = s.cancelled;
      sourceTabId = s.sourceTabId;
      downloadSettings = s.downloadSettings;
      // chromeIdToJob is a derived index; rebuild it from the loaded jobs.
      chromeIdToJob.clear();
      for (const j of jobs) {
        if (j.chromeDownloadId != null) chromeIdToJob.set(j.chromeDownloadId, j);
      }
    });
  }
  return stateLoadPromise;
}

function persistState() {
  return chrome.storage.session.set({
    jobs, nextJobId, isProcessing, cancelled, sourceTabId, downloadSettings,
  });
}

// Kick off the initial load so it's already in flight when the first event
// handler awaits it.
ensureStateLoaded();

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

  if (completed > 0) {
    chrome.storage.local.get({ completedSessions: 0 }, ({ completedSessions }) => {
      chrome.storage.local.set({ completedSessions: completedSessions + 1 });
    });
  }
}

// ---------------------------------------------------------------------------
// Download tracking via chrome.downloads.onChanged
// ---------------------------------------------------------------------------

chrome.downloads.onChanged.addListener(async (delta) => {
  await ensureStateLoaded();
  const job = chromeIdToJob.get(delta.id);
  if (!job) return;

  if (delta.state?.current === "complete") {
    job.state = STATE.COMPLETE;
    chromeIdToJob.delete(delta.id);
    await persistState();
    broadcastStatus();
    scheduleNext();
  } else if (delta.state?.current === "interrupted") {
    job.state = STATE.FAILED;
    job.error = delta.error?.current || "Download interrupted";
    chromeIdToJob.delete(delta.id);
    await persistState();
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

async function processQueue() {
  if (cancelled) {
    isProcessing = false;
    await persistState();
    const status = getStatus();
    if (status.done && jobs.length > 0) notifyCompletion();
    broadcastStatus();
    return;
  }

  const nextJob = jobs.find((j) => j.state === STATE.QUEUED);
  if (!nextJob) {
    isProcessing = false;
    await persistState();
    const status = getStatus();
    if (status.done && jobs.length > 0) notifyCompletion();
    broadcastStatus();
    return;
  }

  isProcessing = true;
  nextJob.state = STATE.DOWNLOADING;
  await persistState();
  broadcastStatus();

  const sanitizedName = nextJob.filename.replace(/[/\\?%*:|"<>]/g, "-");
  let fullPath = `${nextJob.path}${sanitizedName}`;
  if (fullPath.startsWith("/")) fullPath = fullPath.substring(1);

  try {
    const downloadId = await chrome.downloads.download({ url: nextJob.url, filename: fullPath, conflictAction: downloadSettings.conflictAction });
    if (cancelled) {
      // User cancelled while this job was mid-handshake with chrome.downloads.
      // Cancel the started download immediately so the file isn't saved.
      chrome.downloads.cancel(downloadId);
    } else {
      nextJob.chromeDownloadId = downloadId;
      chromeIdToJob.set(downloadId, nextJob);
      await persistState();
      // onChanged listener handles completion/failure from here
    }
  } catch (err) {
    nextJob.state = STATE.FAILED;
    nextJob.error = err?.message || "Download failed to start";
    await persistState();
    broadcastStatus();
    scheduleNext();
  }
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
  // Async IIFE + `return true` keeps the message channel open across the
  // `await ensureStateLoaded()` and any subsequent `await persistState()` so
  // sendResponse still reaches the caller after the worker rehydrates.
  (async () => {
    await ensureStateLoaded();

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
      await persistState();
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
      await persistState();
      broadcastStatus();
      if (!isProcessing && failedJobs.length > 0) processQueue();
      sendResponse({ status: "retrying", count: failedJobs.length });
    } else if (message.type === "ENSURE_CDN_PERMISSION") {
      // Student-submitted files are served from Canvas's user-content CDN.
      // The host permission is optional: shipping it as required would
      // deactivate the extension for every existing user until they
      // re-approve it. Content scripts can't use chrome.permissions, so the
      // request happens here — Chrome forwards the user gesture from the
      // download click through sendMessage. After the first grant,
      // contains() short-circuits and no prompt is ever shown again.
      const cdnOrigin = { origins: ["*://*.canvas-user-content.com/*"] };
      try {
        if (await chrome.permissions.contains(cdnOrigin)) {
          sendResponse({ granted: true });
        } else {
          sendResponse({ granted: await chrome.permissions.request(cdnOrigin) });
        }
      } catch (err) {
        // No user gesture available or the prompt failed — the download
        // proceeds without CDN access; the options page offers a manual grant.
        sendResponse({ granted: false, error: err?.message });
      }
    } else if (message.type === "OPEN_OPTIONS") {
      chrome.runtime.openOptionsPage();
      sendResponse({ status: "ok" });
    } else if (message.type === "CANCEL_DOWNLOADS") {
      cancelled = true;
      const activeJob = jobs.find((j) => j.state === STATE.DOWNLOADING);
      if (activeJob) {
        if (activeJob.chromeDownloadId) {
          chrome.downloads.cancel(activeJob.chromeDownloadId);
          chromeIdToJob.delete(activeJob.chromeDownloadId);
        }
        activeJob.state = STATE.FAILED;
        activeJob.error = "Cancelled";
      }
      jobs
        .filter((j) => j.state === STATE.QUEUED)
        .forEach((j) => {
          j.state = STATE.FAILED;
          j.error = "Cancelled";
        });
      isProcessing = false;
      await persistState();
      broadcastStatus();
      sendResponse({ status: "cancelled" });
    }
  })();
  return true;
});
