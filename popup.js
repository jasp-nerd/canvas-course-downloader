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

  document.getElementById("settingsLink").addEventListener("click", (e) => {
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

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(tab.id, { action: "get_status" }, (response) => {
      if (chrome.runtime.lastError || !response) {
        statusDiv.innerHTML = '<span class="error">Not on a Canvas page.</span>';
        return;
      }

      if (response.isCanvas && response.courseId) {
        statusDiv.innerHTML = `<span class="success">Course detected</span>`;
        downloadBtn.textContent = "Download Course Content";
        downloadBtn.disabled = false;

        // Show course info panel
        const infoSection = document.getElementById("courseInfo");
        infoSection.style.display = "block";

        const courseName = response.courseName || tab.title?.split(":")[0].trim() || `Course ${response.courseId}`;
        document.getElementById("courseName").innerHTML =
          `<span class="info-value">${courseName}</span>`;

        downloadBtn.addEventListener("click", () => {
          downloadBtn.disabled = true;
          downloadBtn.textContent = "Starting...";
          chrome.tabs.sendMessage(tab.id, { action: "trigger_download" }, () => {
            downloadBtn.textContent = "Downloads Queued!";
            setTimeout(() => window.close(), 1500);
          });
        });
      } else if (response.isCanvas && response.isHomepage) {
        statusDiv.innerHTML = '<span class="success">Canvas dashboard detected</span>';
        downloadBtn.textContent = "Select Courses to Download";
        downloadBtn.disabled = false;

        downloadBtn.addEventListener("click", () => {
          chrome.tabs.sendMessage(tab.id, { action: "open_course_selector" }, () => {
            window.close();
          });
        });
      } else {
        statusDiv.innerHTML = '<span class="error">Navigate to a Canvas page first.</span>';
      }
    });
  });
});

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
