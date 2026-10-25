/**
 * Canvas Course Downloader — Canvas API Helpers
 *
 * Handles all communication with the Canvas REST API, including
 * pagination, retry logic, and timeout handling.
 */

const FETCH_TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;

/** Fetches with an AbortController timeout. */
function fetchWithTimeout(url, options = {}, timeout = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

/** Fetches with retry and exponential backoff for transient errors. */
async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options);
      if (res.ok || (res.status < 500 && res.status !== 429)) return res;
      if (attempt === retries) return res;
      const delay = Math.min(1000 * 2 ** attempt, 8000);
      console.warn(`[Canvas Downloader] ${res.status} on ${url}, retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = Math.min(1000 * 2 ** attempt, 8000);
      console.warn(`[Canvas Downloader] Fetch error on ${url}, retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

/** Follows Canvas pagination links to collect all results. */
async function fetchAllPages(url) {
  const results = [];
  let next = url;

  while (next) {
    try {
      const res = await fetchWithRetry(next, {
        headers: { Accept: "application/json+canvas-string-ids" },
      });

      if (!res.ok) {
        console.warn(`[Canvas Downloader] ${res.status} ${res.statusText} — ${next}`);
        break;
      }

      results.push(...(await res.json()));

      next = parsePaginationLink(res.headers.get("link"));
    } catch (err) {
      if (err.name === "AbortError") {
        console.warn(`[Canvas Downloader] Request timed out: ${next}`);
      } else {
        console.error("[Canvas Downloader] API error:", err);
      }
      break;
    }
  }

  return results;
}

/** Returns courses for the current user. */
async function fetchAllCourses(enrollmentState = "active") {
  const domain = window.location.origin;
  const courses = await fetchAllPages(
    `${domain}/api/v1/courses?per_page=100&enrollment_state=${enrollmentState}&include[]=term`
  );
  return courses.filter((c) => c.name).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * True if the current user is a teacher/TA/designer in the course — i.e. has
 * access to the teacher-only endpoints (all submissions, full discussion
 * threads, every student's grades). Any failure resolves to `false` so the
 * caller falls back to plain student behavior.
 */
async function fetchCourseRole(domain, courseId) {
  try {
    const res = await fetchWithRetry(`${domain}/api/v1/courses/${courseId}?include[]=enrollments`, {
      headers: { Accept: "application/json+canvas-string-ids" },
    });
    if (!res.ok) return false;
    const course = await res.json();
    const teacherRoles = ["teacher", "ta", "designer"];
    return (course.enrollments || []).some((e) => teacherRoles.includes(e.type));
  } catch (err) {
    console.warn("[Canvas Downloader] Role detection failed, assuming student:", err);
    return false;
  }
}
