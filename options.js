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
    discussions: true,
    announcements: true,
    modules: true,
    syllabus: true,
    linkedFiles: true,
  },
  conflictAction: "uniquify",
  throttleMs: 250,
  folderPrefix: "",
  preset: "full-archive",
};

const PRESETS = {
  "full-archive": {
    files: true, pages: true, assignments: true, discussions: true,
    announcements: true, modules: true, syllabus: true, linkedFiles: true,
  },
  "files-only": {
    files: true, pages: false, assignments: false, discussions: false,
    announcements: false, modules: false, syllabus: false, linkedFiles: false,
  },
  "text-only": {
    files: false, pages: true, assignments: true, discussions: true,
    announcements: true, modules: true, syllabus: true, linkedFiles: false,
  },
  "linked-only": {
    files: false, pages: false, assignments: false, discussions: false,
    announcements: false, modules: false, syllabus: false, linkedFiles: true,
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
    preset: detectPreset(),
  };

  chrome.storage.sync.set(settings, () => {
    const status = document.getElementById("save-status");
    status.classList.add("visible");
    setTimeout(() => status.classList.remove("visible"), 2000);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();

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

  // Save
  document.getElementById("save-btn").addEventListener("click", saveSettings);
});
