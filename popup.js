/**
 * Popup script for Canvas Course Downloader.
 *
 * Communicates with the content script to detect Canvas state
 * and trigger downloads or the course selector overlay.
 */

document.addEventListener("DOMContentLoaded", () => {
  const statusDiv = document.getElementById("status");
  const downloadBtn = document.getElementById("downloadBtn");

  document.getElementById("settingsLink").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(tab.id, { action: "get_status" }, (response) => {
      if (chrome.runtime.lastError || !response) {
        statusDiv.innerHTML = '<span class="error">Not on a Canvas page.</span>';
        return;
      }

      if (response.isCanvas && response.courseId) {
        // Single course page
        statusDiv.innerHTML = `<span class="success">Course ${response.courseId} detected.</span>`;
        downloadBtn.textContent = "Download Course Content";
        downloadBtn.disabled = false;

        downloadBtn.addEventListener("click", () => {
          downloadBtn.disabled = true;
          downloadBtn.textContent = "Starting...";
          chrome.tabs.sendMessage(tab.id, { action: "trigger_download" }, () => {
            setTimeout(() => window.close(), 1000);
          });
        });
      } else if (response.isCanvas && response.isHomepage) {
        // Canvas dashboard — offer multi-course selector
        statusDiv.innerHTML = '<span class="success">Canvas dashboard detected.</span>';
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
