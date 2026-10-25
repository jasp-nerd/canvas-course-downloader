/**
 * Options page script for Canvas Course Downloader.
 *
 * Manages user preferences stored in chrome.storage.sync.
 */

const DEFAULTS = {
  contentTypes: {
    files: true,
    pages: true,
    assignments: true,
    submissions: true,
    discussions: true,
    announcements: true,
    modules: true,
    syllabus: true,
    grades: true,
    quizzes: true,
    linkedFiles: true,
  },
  conflictAction: "uniquify",
  throttleMs: 250,
  folderPrefix: "",
  zipMode: true,
  incrementalMode: false,
  excludeVideos: false,
  maxFileSizeMB: 0,
  preset: "full-archive",
  exportFormat: "html",
};

const PRESETS = {
  "full-archive": {
    files: true, pages: true, assignments: true, submissions: true, discussions: true,
    announcements: true, modules: true, syllabus: true, grades: true,
    quizzes: true, linkedFiles: true,
  },
  "files-only": {
    files: true, pages: false, assignments: false, submissions: false, discussions: false,
    announcements: false, modules: false, syllabus: false, grades: false,
    quizzes: false, linkedFiles: false,
  },
  "text-only": {
    files: false, pages: true, assignments: true, submissions: true, discussions: true,
    announcements: true, modules: true, syllabus: true, grades: true,
    quizzes: true, linkedFiles: false,
  },
  "linked-only": {
    files: false, pages: false, assignments: false, submissions: false, discussions: false,
    announcements: false, modules: false, syllabus: false, grades: false,
    quizzes: false, linkedFiles: true,
  },
};

function getCheckboxes() {
  return document.querySelectorAll('#content-types input[type="checkbox"]');
}

function detectPreset() {
  const current = {};
  getCheckboxes().forEach((cb) => (current[cb.dataset.key] = cb.checked));

  for (const [name, preset] of Object.entries(PRESETS)) {
    const matches = Object.keys(preset).every((k) => current[k] === preset[k]);
    if (matches) return name;
  }
  return "custom";
}

function setActivePreset(name) {
  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.preset === name);
  });
}

function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;
  getCheckboxes().forEach((cb) => {
    if (cb.dataset.key in preset) cb.checked = preset[cb.dataset.key];
  });
  setActivePreset(name);
}

function updateFileSizeFieldVisibility() {
  const on = document.getElementById("limit-file-size").checked;
  document.getElementById("max-file-size-field").style.display = on ? "" : "none";
}

function loadSettings() {
  chrome.storage.sync.get(DEFAULTS, (settings) => {
    // Content types
    getCheckboxes().forEach((cb) => {
      cb.checked = settings.contentTypes[cb.dataset.key] ?? true;
    });

    // Other fields
    document.getElementById("conflict").value = settings.conflictAction;
    document.getElementById("throttle").value = settings.throttleMs;
    document.getElementById("folder-prefix").value = settings.folderPrefix;
    document.getElementById("zip-mode").checked = settings.zipMode;
    document.getElementById("incremental-mode").checked = settings.incrementalMode;
    document.getElementById("exclude-videos").checked = settings.excludeVideos;
    document.getElementById("limit-file-size").checked = settings.maxFileSizeMB > 0;
    document.getElementById("max-file-size").value = settings.maxFileSizeMB || "";
    document.getElementById("export-format").value = settings.exportFormat || "html";
    updateFileSizeFieldVisibility();

    // Preset highlight
    const preset = detectPreset();
    setActivePreset(preset);
  });
}

function saveSettings() {
  const contentTypes = {};
  getCheckboxes().forEach((cb) => (contentTypes[cb.dataset.key] = cb.checked));

  const settings = {
    contentTypes,
    conflictAction: document.getElementById("conflict").value,
    throttleMs: parseInt(document.getElementById("throttle").value, 10) || 250,
    folderPrefix: document.getElementById("folder-prefix").value.trim(),
    zipMode: document.getElementById("zip-mode").checked,
    incrementalMode: document.getElementById("incremental-mode").checked,
    excludeVideos: document.getElementById("exclude-videos").checked,
    maxFileSizeMB: document.getElementById("limit-file-size").checked
      ? parseInt(document.getElementById("max-file-size").value, 10) || 0
      : 0,
    preset: detectPreset(),
    exportFormat: document.getElementById("export-format").value,
  };

  chrome.storage.sync.set(settings, () => {
    const status = document.getElementById("save-status");
    status.classList.add("visible");
    setTimeout(() => status.classList.remove("visible"), 2000);
  });
}

// Optional host permission for Canvas's user-content CDN (student-submitted
// files). Normally granted via the prompt on first download; this block is
// the manual fallback for users who declined it there.
const CDN_ORIGIN = { origins: ["*://*.canvas-user-content.com/*"] };

function refreshCdnPermissionUi() {
  chrome.permissions.contains(CDN_ORIGIN, (granted) => {
    document.getElementById("grant-cdn-permission").style.display = granted ? "none" : "";
    document.getElementById("cdn-permission-status").textContent = granted
      ? "✓ Access granted — submitted files are included in downloads."
      : "Not granted yet — submitted files will be skipped.";
  });
}

function initCdnPermission() {
  refreshCdnPermissionUi();
  document.getElementById("grant-cdn-permission").addEventListener("click", () => {
    chrome.permissions.request(CDN_ORIGIN, () => refreshCdnPermissionUi());
  });
}

function initNav() {
  const items = document.querySelectorAll(".nav-item");
  const panels = document.querySelectorAll(".panel");
  const content = document.querySelector(".content");

  document.getElementById("nav").addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-item");
    if (!btn) return;
    const section = btn.dataset.section;
    items.forEach((i) => i.classList.toggle("active", i === btn));
    panels.forEach((p) => p.classList.toggle("active", p.dataset.section === section));
    if (content) content.scrollTop = 0;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  initNav();
  initCdnPermission();

  // Preset buttons
  document.getElementById("preset-bar").addEventListener("click", (e) => {
    const btn = e.target.closest(".preset-btn");
    if (!btn || btn.dataset.preset === "custom") return;
    applyPreset(btn.dataset.preset);
  });

  // Checkbox changes update preset indicator
  document.getElementById("content-types").addEventListener("change", () => {
    setActivePreset(detectPreset());
  });

  // Show/hide the max file size input based on its toggle
  document.getElementById("limit-file-size").addEventListener("change", updateFileSizeFieldVisibility);

  // Save
  document.getElementById("save-btn").addEventListener("click", saveSettings);
});
