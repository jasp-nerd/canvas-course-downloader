// "What's new": compares courses saved before with what Canvas has now. Runs
// from the content script, so it uses the page's own Canvas session.
import { browser } from 'wxt/browser';
import { CanvasError, type CanvasClient } from '../canvas/client';
import type { CanvasFile } from '../engine/context';
import { fileChanged, savedCourses, type CourseInventory } from '../storage/inventory';

const CHECK_EVERY_MS = 3 * 60 * 60 * 1000;

export interface CourseUpdate {
  courseId: string;
  courseName: string;
  /** Files Canvas has that weren't saved, plus saved files that changed since. */
  newFiles: number;
  /** Announcements posted since the course was last saved (left out when none). */
  newAnnouncements?: number;
  /** Pages and assignments added or edited since then (left out when none). */
  changedDocuments?: number;
}

export interface UpdateCheck {
  checkedAt: number;
  courses: CourseUpdate[];
  /** Set when the user dismissed the note; it shows again when newer results arrive. */
  dismissedAt?: number;
  /** Set when these results started an automatic download, so it starts only once. */
  autoStartedAt?: number;
}

const key = (origin: string) => `updates:${origin}`;

/** How many of `current` aren't in the inventory or changed since they were saved. */
export function countNew(inventory: CourseInventory, current: CanvasFile[]): number {
  let count = 0;
  for (const file of current) {
    if (!file.url) continue; // locked for this user; can't be downloaded anyway
    const saved = inventory.files[String(file.id)];
    const now = { size: file.size ?? 0, modifiedAt: file.modified_at ?? file.updated_at ?? '' };
    if (!saved || fileChanged(saved, now)) count++;
  }
  return count;
}

export async function loadUpdateCheck(origin: string): Promise<UpdateCheck | null> {
  const stored = await browser.storage.local.get<Record<string, UpdateCheck | undefined>>(
    key(origin),
  );
  return stored[key(origin)] ?? null;
}

export async function saveUpdateCheck(origin: string, check: UpdateCheck): Promise<void> {
  await browser.storage.local.set({ [key(origin)]: check });
}

/**
 * Checks the courses saved before from this Canvas, at most every few hours.
 * Courses Canvas no longer shows are skipped. Returns the latest results.
 */
export async function checkForUpdates(
  canvas: CanvasClient,
  origin: string,
  now = Date.now(),
): Promise<UpdateCheck | null> {
  const previous = await loadUpdateCheck(origin);
  if (previous && now - previous.checkedAt < CHECK_EVERY_MS) return previous;
  const saved = await savedCourses(origin);
  if (saved.length === 0) return null;
  const courses: CourseUpdate[] = [];
  for (const course of saved) {
    try {
      const files = await canvas.list<CanvasFile>(`/courses/${course.courseId}/files`);
      courses.push({
        courseId: course.courseId,
        courseName: course.courseName,
        newFiles: countNew(course, files),
        ...(await countChangedSince(canvas, course.courseId, course.savedAt)),
      });
    } catch (error) {
      if (error instanceof CanvasError && (error.kind === 'session' || error.kind === 'aborted'))
        throw error;
    }
  }
  const check: UpdateCheck = {
    checkedAt: now,
    courses,
    ...(previous?.dismissedAt ? { dismissedAt: previous.dismissedAt } : {}),
  };
  await saveUpdateCheck(origin, check);
  return check;
}

/** Newest first, one page each: enough to count what changed since a recent save. */
const RECENT: [
  kind: 'newAnnouncements' | 'changedDocuments',
  path: string,
  date: string,
  params: Record<string, string>,
][] = [
  ['newAnnouncements', 'discussion_topics', 'posted_at', { only_announcements: 'true' }],
  ['changedDocuments', 'pages', 'updated_at', { sort: 'updated_at', order: 'desc' }],
  ['changedDocuments', 'assignments', 'updated_at', {}],
];

/**
 * Announcements, pages and assignments that are newer than `savedAt`. Courses
 * saved by v2 have no date: then only files are compared. A section Canvas
 * hides from this user (404, 403) counts as nothing new.
 */
async function countChangedSince(
  canvas: CanvasClient,
  courseId: string,
  savedAt: number,
): Promise<Pick<CourseUpdate, 'newAnnouncements' | 'changedDocuments'>> {
  const counts: Pick<CourseUpdate, 'newAnnouncements' | 'changedDocuments'> = {};
  if (!savedAt) return counts;
  for (const [kind, path, date, params] of RECENT) {
    let items: Record<string, unknown>[];
    try {
      items = await canvas.get(`/courses/${courseId}/${path}`, { per_page: '50', ...params });
    } catch (error) {
      if (error instanceof CanvasError && (error.kind === 'session' || error.kind === 'aborted'))
        throw error;
      continue;
    }
    const newer = (Array.isArray(items) ? items : []).filter((item) => {
      const when = typeof item[date] === 'string' ? Date.parse(item[date]) : NaN;
      return when > savedAt;
    }).length;
    if (newer) counts[kind] = (counts[kind] ?? 0) + newer;
  }
  return counts;
}

/** Anything new in a course: files, announcements or changed documents. */
export const newItems = (c: CourseUpdate) =>
  c.newFiles + (c.newAnnouncements ?? 0) + (c.changedDocuments ?? 0);

/** After an export, its courses are up to date until the next check. */
export async function markExported(origin: string, courseId: string): Promise<void> {
  const check = await loadUpdateCheck(origin);
  if (!check) return;
  await saveUpdateCheck(origin, {
    ...check,
    courses: check.courses.map((c) =>
      c.courseId === courseId ? { courseId: c.courseId, courseName: c.courseName, newFiles: 0 } : c,
    ),
  });
}

/** Results worth showing: something new, and not dismissed since. */
export function pendingUpdates(check: UpdateCheck | null): CourseUpdate[] {
  if (!check || (check.dismissedAt && check.dismissedAt >= check.checkedAt)) return [];
  return check.courses.filter((c) => newItems(c) > 0);
}
