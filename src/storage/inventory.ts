// What has been saved before, per Canvas instance and course, so later exports
// can download only what's new or changed. Lives in storage.local, which the
// content script can also read for the "what's new" check.
import { browser } from 'wxt/browser';

export interface SavedFile {
  /** Where it was saved, from the course root. */
  path: string;
  size: number;
  /** Canvas modified_at (content changes), else updated_at. */
  modifiedAt: string;
}

export interface CourseInventory {
  courseName: string;
  savedAt: number;
  /** By Canvas file id. */
  files: Record<string, SavedFile>;
}

/** v2's records: `incremental_<courseId>` → { "<folder><name>": { t, m, s } | timestamp }. */
export type LegacyRecords = Record<string, { m?: string; s?: number } | number>;

const key = (origin: string, courseId: string) => `inventory:${origin}:${courseId}`;

export async function loadInventory(
  origin: string,
  courseId: string,
): Promise<CourseInventory | null> {
  const k = key(origin, courseId);
  const stored = await browser.storage.local.get<Record<string, CourseInventory | undefined>>(k);
  return stored[k] ?? null;
}

/** v2 kept records per course id without the instance; used only until v3 has its own. */
export async function loadLegacyRecords(courseId: string): Promise<LegacyRecords> {
  const k = `incremental_${courseId}`;
  const stored = await browser.storage.local.get<Record<string, LegacyRecords | undefined>>(k);
  return stored[k] ?? {};
}

export async function saveInventory(
  origin: string,
  courseId: string,
  inventory: CourseInventory,
): Promise<void> {
  await browser.storage.local.set({ [key(origin, courseId)]: inventory });
}

/** Courses saved before from this Canvas instance. */
export async function savedCourses(
  origin: string,
): Promise<(CourseInventory & { courseId: string })[]> {
  const all = await browser.storage.local.get<Record<string, unknown>>(null);
  const prefix = `inventory:${origin}:`;
  return Object.entries(all)
    .filter(([k]) => k.startsWith(prefix))
    .map(([k, v]) => ({ ...(v as CourseInventory), courseId: k.slice(prefix.length) }));
}

/**
 * Whether a Canvas file differs from what was saved. Size and date are only
 * compared when both sides have them (Canvas leaves them out on some endpoints).
 */
export function fileChanged(
  saved: { size?: number; modifiedAt?: string },
  current: { size: number; modifiedAt: string },
): boolean {
  if (saved.size && current.size && saved.size !== current.size) return true;
  return !!(saved.modifiedAt && current.modifiedAt && saved.modifiedAt !== current.modifiedAt);
}
