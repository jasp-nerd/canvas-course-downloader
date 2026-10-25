/**
 * Canvas Course Downloader — Canvas Detection
 *
 * Identifies whether the current page is a Canvas LMS instance,
 * extracts course IDs, and determines page type.
 */

// ---------------------------------------------------------------------------
// Canvas Detection Helpers
// ---------------------------------------------------------------------------

/**
 * Canvas-specific DOM signals used for detection.
 * Each must be unlikely to appear on non-Canvas sites.
 * We require at least 2 to match to avoid false positives.
 */
const CANVAS_SIGNALS = [
  () => document.querySelector(".ic-app") !== null,
  () => document.querySelector('link[href*="brandable_css"]') !== null,
  () => document.querySelector('meta[name="apple-itunes-app"][content*="480883488"]') !== null,
  () => document.querySelector(".ic-app-nav-toggle-and-crumbs") !== null,
  () => {
    const scripts = document.querySelectorAll("script:not([src])");
    for (const s of scripts) {
      if (s.textContent.includes("DOMAIN_ROOT_ACCOUNT_ID")) return true;
    }
    return false;
  },
];

/** Minimum number of Canvas-specific signals required for detection on non-Instructure domains. */
const CANVAS_SIGNAL_THRESHOLD = 2;

/** Breadcrumb / header selectors for button injection, tried in order.
 * Prefer the flex container that wraps both the hamburger and the breadcrumbs
 * so the button sits inline next to the course code. */
const MOUNT_SELECTORS = [
  ".ic-app-nav-toggle-and-crumbs",
  "#breadcrumbs",
  ".ic-app-crumbs",
];

/** Dashboard header selectors for the home-page button, tried in order. */
const DASHBOARD_SELECTORS = [
  "#breadcrumbs",
  ".ic-app-nav-toggle-and-crumbs",
  "#dashboard_header_container .ic-Dashboard-header__actions",
  "#dashboard_header_container",
  ".ic-Dashboard-header",
  "#content",
];

function isCanvas() {
  if (window.location.hostname.includes("instructure.com")) return true;
  let hits = 0;
  for (const signal of CANVAS_SIGNALS) {
    if (signal()) hits++;
    if (hits >= CANVAS_SIGNAL_THRESHOLD) return true;
  }
  return false;
}

function getCourseId() {
  const match = window.location.pathname.match(/\/courses\/(\d+)/);
  return match ? match[1] : null;
}

function isCanvasHomepage() {
  return isCanvas() && !getCourseId();
}

function getCourseName() {
  const breadcrumb = document.querySelector('.ic-app-crumbs a[href*="/courses/"]');
  if (breadcrumb) return breadcrumb.textContent.trim();

  const title = document.querySelector("title");
  if (title) return title.textContent.split(":")[0].trim();

  return `Course_${getCourseId()}`;
}

/**
 * Finds the first matching mount point from a list of selectors.
 * Returns null if none match (graceful degradation).
 */
function findMountPoint(selectors) {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}
