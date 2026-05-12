/**
 * Popup script for Canvas Course Downloader.
 *
 * Communicates with the content script to detect Canvas state
 * and trigger downloads or the course selector overlay.
 * Shows course info, content type tags, and active download queue status.
 */

const CONTENT_TYPE_LABELS = {
  files: "Files",
  pages: "Pages",
  assignments: "Assignments",
  discussions: "Discussions",
  announcements: "Announcements",
  modules: "Modules",
  syllabus: "Syllabus",
  grades: "Grades",
  linkedFiles: "Linked Files",
};

document.addEventListener("DOMContentLoaded", () => {
  const statusDiv = document.getElementById("status");
  const downloadBtn = document.getElementById("downloadBtn");
  const downloadBtnLabel = document.getElementById("downloadBtnLabel");

  const setStatus = (text, state) => {
    statusDiv.textContent = text;
    statusDiv.classList.remove("state-success", "state-error");
    if (state) statusDiv.classList.add(`state-${state}`);
  };

  document.getElementById("settingsLink").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  document.getElementById("scheduleNudge").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  // Load settings and show content type tags
  chrome.storage.sync.get({
    contentTypes: {
      files: true, pages: true, assignments: true, discussions: true,
      announcements: true, modules: true, syllabus: true, grades: true,
      linkedFiles: true,
    },
  }, (settings) => {
    const tagsEl = document.getElementById("contentTags");
    for (const [key, label] of Object.entries(CONTENT_TYPE_LABELS)) {
      const tag = document.createElement("span");
      tag.className = `content-tag${settings.contentTypes[key] ? " active" : ""}`;
      tag.textContent = label;
      tagsEl.appendChild(tag);
    }
  });

  // Check for active download queue
  chrome.runtime.sendMessage({ type: "GET_DOWNLOAD_STATUS" }, (status) => {
    if (chrome.runtime.lastError || !status || status.total === 0) return;
    showQueueStatus(status);
  });

  maybeShowFeedbackPrompt();

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(tab.id, { action: "get_status" }, (response) => {
      if (chrome.runtime.lastError || !response) {
        setStatus("Not on a Canvas page.", "error");
        return;
      }

      if (response.isCanvas && response.courseId) {
        setStatus("Course detected", "success");
        downloadBtnLabel.textContent = "Download course content";
        downloadBtn.disabled = false;

        // Show course info panel
        const infoSection = document.getElementById("courseInfo");
        infoSection.style.display = "block";

        const courseName = response.courseName || tab.title?.split(":")[0].trim() || `Course ${response.courseId}`;
        document.getElementById("courseName").innerHTML =
          `<span class="info-value">${courseName}</span>`;

        downloadBtn.addEventListener("click", () => {
          downloadBtn.disabled = true;
          downloadBtnLabel.textContent = "Starting...";
          chrome.tabs.sendMessage(tab.id, { action: "trigger_download" }, () => {
            downloadBtnLabel.textContent = "Queued!";
            setTimeout(() => window.close(), 1500);
          });
        });
      } else if (response.isCanvas && response.isHomepage) {
        setStatus("Canvas dashboard detected", "success");
        downloadBtnLabel.textContent = "Select courses to download";
        downloadBtn.disabled = false;

        downloadBtn.addEventListener("click", () => {
          chrome.tabs.sendMessage(tab.id, { action: "open_course_selector" }, () => {
            window.close();
          });
        });
      } else {
        setStatus("Navigate to a Canvas page first.", "error");
      }
    });
  });
});

const FEEDBACK_THRESHOLD = 3;

function maybeShowFeedbackPrompt() {
  chrome.storage.local.get({ completedSessions: 0, feedbackState: "pending" }, (data) => {
    if (data.feedbackState !== "pending" || data.completedSessions < FEEDBACK_THRESHOLD) return;

    const card = document.getElementById("feedbackCard");
    const ask = document.getElementById("feedbackAsk");
    const positive = document.getElementById("feedbackPositive");
    const negative = document.getElementById("feedbackNegative");
    card.style.display = "block";

    const markDone = (state) => chrome.storage.local.set({ feedbackState: state });

    document.getElementById("feedbackYes").addEventListener("click", () => {
      ask.style.display = "none";
      positive.style.display = "block";
      markDone("positive_clicked");
    });
    document.getElementById("feedbackNo").addEventListener("click", () => {
      ask.style.display = "none";
      negative.style.display = "block";
      markDone("negative_clicked");
    });
    document.getElementById("feedbackDismiss").addEventListener("click", () => {
      card.style.display = "none";
      markDone("dismissed");
    });
  });
}

function showQueueStatus(status) {
  const section = document.getElementById("queueSection");
  section.style.display = "block";

  const pct = status.total > 0 ? Math.round(((status.completed + status.failed) / status.total) * 100) : 0;

  document.getElementById("queueText").textContent =
    status.done
      ? (status.failed > 0 ? "Completed with errors" : "All downloads complete!")
      : `${status.completed + status.failed} of ${status.total} files`;
  document.getElementById("queueBar").style.width = `${pct}%`;
  document.getElementById("queueStats").textContent =
    `${status.completed} done \u00B7 ${status.failed} failed \u00B7 ${status.queued + status.downloading} remaining`;
}
