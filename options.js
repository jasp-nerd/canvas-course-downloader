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
    grades: true,
    linkedFiles: true,
  },
  conflictAction: "uniquify",
  throttleMs: 250,
  folderPrefix: "",
  zipMode: false,
  incrementalMode: false,
  excludeVideos: false,
  maxFileSizeMB: 0,
  preset: "full-archive",
};

const PRESETS = {
  "full-archive": {
    files: true, pages: true, assignments: true, discussions: true,
    announcements: true, modules: true, syllabus: true, grades: true,
    linkedFiles: true,
  },
  "files-only": {
    files: true, pages: false, assignments: false, discussions: false,
    announcements: false, modules: false, syllabus: false, grades: false,
    linkedFiles: false,
  },
  "text-only": {
    files: false, pages: true, assignments: true, discussions: true,
    announcements: true, modules: true, syllabus: true, grades: true,
    linkedFiles: false,
  },
  "linked-only": {
    files: false, pages: false, assignments: false, discussions: false,
    announcements: false, modules: false, syllabus: false, grades: false,
    linkedFiles: true,
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
    document.getElementById("zip-mode").checked = settings.zipMode;
    document.getElementById("incremental-mode").checked = settings.incrementalMode;
    document.getElementById("exclude-videos").checked = settings.excludeVideos;
    document.getElementById("max-file-size").value = settings.maxFileSizeMB || "";

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
    maxFileSizeMB: parseInt(document.getElementById("max-file-size").value, 10) || 0,
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
  loadScheduleConfig();
  renderCoursePickerForSchedule();

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

  // Schedule handlers
  document.getElementById("schedule-enabled").addEventListener("change", onScheduleToggle);
  document.getElementById("save-schedule-btn").addEventListener("click", saveScheduleConfig);
});

// ---------------------------------------------------------------------------
// Schedule Configuration
// ---------------------------------------------------------------------------

async function loadScheduleConfig() {
  const { scheduleConfig } = await chrome.storage.sync.get("scheduleConfig");
  const cfg = scheduleConfig || {};

  document.getElementById("schedule-enabled").checked = cfg.enabled || false;
  if (cfg.intervalMinutes) document.getElementById("schedule-interval").value = cfg.intervalMinutes;
  updateSchedulePanelState();

  chrome.runtime.sendMessage({ type: "GET_SCHEDULE_STATUS" }, (response) => {
    if (chrome.runtime.lastError || !response) return;
    updateScheduleStatus(response.lastRun, response.nextRunAt);
  });
}

async function saveScheduleConfig() {
  const enabled = document.getElementById("schedule-enabled").checked;
  const intervalMinutes = parseInt(document.getElementById("schedule-interval").value, 10);

  const checkedBoxes = document.querySelectorAll("#schedule-course-list input[type='checkbox']:checked");
  const courseIds = Array.from(checkedBoxes).map((cb) => Number(cb.dataset.courseId));
  const courseNames = {};
  checkedBoxes.forEach((cb) => { courseNames[cb.dataset.courseId] = cb.dataset.courseName; });

  if (enabled && courseIds.length === 0) {
    showScheduleError("Select at least one course to enable scheduling.");
    return;
  }

  const scheduleConfig = enabled ? { enabled, intervalMinutes, courseIds, courseNames } : null;
  await chrome.storage.sync.set({ scheduleConfig });

  if (enabled) {
    chrome.runtime.sendMessage({ type: "REGISTER_SCHEDULE", payload: { intervalMinutes } });
  } else {
    chrome.runtime.sendMessage({ type: "UNREGISTER_SCHEDULE" });
  }

  chrome.runtime.sendMessage({ type: "GET_SCHEDULE_STATUS" }, (response) => {
    if (chrome.runtime.lastError || !response) return;
    updateScheduleStatus(response.lastRun, response.nextRunAt);
  });

  showScheduleSaved();
}

async function fetchActiveCoursesFromOptions(canvasDomain) {
  const res = await fetch(`${canvasDomain}/api/v1/courses?enrollment_state=active&per_page=50`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Canvas API returned ${res.status}`);
  const courses = await res.json();
  return courses.filter((c) => c.name).sort((a, b) => a.name.localeCompare(b.name));
}

async function renderCoursePickerForSchedule() {
  const listEl = document.getElementById("schedule-course-list");
  const { canvasDomain } = await chrome.storage.local.get("canvasDomain");

  if (!canvasDomain) {
    listEl.innerHTML = '<p class="schedule-hint">Open a Canvas course page first to enable scheduling.</p>';
    document.getElementById("schedule-section").classList.add("schedule-disabled");
    return;
  }

  listEl.innerHTML = '<p class="schedule-hint">Loading courses...</p>';

  try {
    const [courses, { scheduleConfig }] = await Promise.all([
      fetchActiveCoursesFromOptions(canvasDomain),
      chrome.storage.sync.get("scheduleConfig"),
    ]);
    const savedIds = scheduleConfig?.courseIds || [];

    if (courses.length === 0) {
      listEl.innerHTML = '<p class="schedule-hint">No active courses found.</p>';
      return;
    }

    listEl.innerHTML = "";
    const group = document.createElement("div");
    group.className = "checkbox-group";
    for (const course of courses) {
      const label = document.createElement("label");
      const safeName = course.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); // XSS safety
      label.innerHTML = `<input type="checkbox" data-course-id="${course.id}" data-course-name="${safeName}" ${savedIds.includes(course.id) ? "checked" : ""}> ${safeName}`;
      group.appendChild(label);
    }
    listEl.appendChild(group);
  } catch (err) {
    console.warn("[Canvas Downloader] Could not load courses for schedule picker:", err);
    listEl.innerHTML = '<p class="schedule-hint">Could not load courses. Make sure you are logged in to Canvas.</p>';
  }
}

function updateSchedulePanelState() {
  const enabled = document.getElementById("schedule-enabled").checked;
  document.getElementById("schedule-section").classList.toggle("schedule-off", !enabled);
}

function onScheduleToggle() {
  updateSchedulePanelState();
  if (!document.getElementById("schedule-enabled").checked) {
    chrome.storage.sync.set({ scheduleConfig: null });
    chrome.runtime.sendMessage({ type: "UNREGISTER_SCHEDULE" });
    chrome.runtime.sendMessage({ type: "GET_SCHEDULE_STATUS" }, (response) => {
      if (chrome.runtime.lastError || !response) return;
      updateScheduleStatus(response.lastRun, response.nextRunAt);
    });
  }
}

function updateScheduleStatus(lastRun, nextRunAt) {
  const lastEl = document.getElementById("schedule-last-run");
  const nextEl = document.getElementById("schedule-next-run");

  lastEl.textContent = lastRun
    ? `Last run: ${new Date(lastRun.startedAt).toLocaleString()} (${lastRun.completed} succeeded, ${lastRun.failed} failed)`
    : "Last run: Never";

  nextEl.textContent = nextRunAt
    ? `Next run: ${new Date(nextRunAt).toLocaleString()}`
    : "Next run: Not scheduled";
}

function showScheduleError(msg) {
  const el = document.getElementById("schedule-save-status");
  el.textContent = msg;
  el.classList.remove("success");
  el.classList.add("error", "visible");
  setTimeout(() => el.classList.remove("visible"), 3000);
}

function showScheduleSaved() {
  const el = document.getElementById("schedule-save-status");
  el.textContent = "Schedule saved";
  el.classList.remove("error");
  el.classList.add("success", "visible");
  setTimeout(() => el.classList.remove("visible"), 2000);
}
