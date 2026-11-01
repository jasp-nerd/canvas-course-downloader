// "What's new": compares courses saved before with what Canvas has now. Runs
// from the content script, so it uses the page's own Canvas session.
import { browser } from 'wxt/browser';
import { CanvasError, type CanvasClient } from '../canvas/client';
import type { CanvasFile } from '../engine/context';
import { fileChanged, savedCourses, type CourseInventory } from '../storage/inventory';

/** How often Canvas is asked; pages in between read the last answer from storage. */
export const CHECK_EVERY_MS = 15 * 60 * 1000;
/** After the note is hidden, it stays away at least this long, whatever comes in. */
const QUIET_AFTER_DISMISS_MS = 24 * 60 * 60 * 1000;
/** Names kept per course: enough for the note, which says "and 12 more" for the rest. */
const MAX_ITEMS = 50;

/** One new or changed thing in a course, by name. */
export interface UpdateItem {
  /** The same for one version of the thing, so what the user hid stays hidden. */
  key: string;
  name: string;
  kind: 'file' | 'announcement' | 'page' | 'assignment';
  /** Saved before and changed since, rather than new. */
  updated?: boolean;
}

export interface CourseUpdate {
  courseId: string;
  courseName: string;
  /** Files Canvas has that weren't saved, plus saved files that changed since. */
  newFiles: number;
  /** Announcements posted since the course was last saved (left out when none). */
  newAnnouncements?: number;
  /** Pages and assignments added or edited since then (left out when none). */
  changedDocuments?: number;
  /** What's new by name, files first, newest first (at most MAX_ITEMS). */
  items?: UpdateItem[];
}

export interface UpdateCheck {
  checkedAt: number;
  courses: CourseUpdate[];
  /** When the user last hid the note. */
  dismissedAt?: number;
  /** The items the note listed when it was hidden: they don't bring it back. */
  dismissed?: string[];
  /** Set when these results started an automatic download, so it starts only once. */
  autoStartedAt?: number;
}

/** Where the results for one Canvas are kept, in storage.local. */
export const updatesKey = (origin: string) => `updates:${origin}`;

/** The files in `current` that aren't in the inventory or changed since they were saved, newest first. */
export function newFiles(inventory: CourseInventory, current: CanvasFile[]): UpdateItem[] {
  const found: { item: UpdateItem; at: string }[] = [];
  for (const file of current) {
    if (!file.url) continue; // locked for this user; can't be downloaded anyway
    const saved = inventory.files[String(file.id)];
    const now = { size: file.size ?? 0, modifiedAt: file.modified_at ?? file.updated_at ?? '' };
    if (saved && !fileChanged(saved, now)) continue;
    found.push({
      at: now.modifiedAt,
      item: {
        key: `file:${file.id}:${now.modifiedAt}:${now.size}`,
        name: file.display_name || file.filename || `File ${file.id}`,
        kind: 'file',
        ...(saved ? { updated: true } : {}),
      },
    });
  }
  return found.sort((a, b) => b.at.localeCompare(a.at)).map((f) => f.item);
}

/** How many of `current` aren't in the inventory or changed since they were saved. */
export const countNew = (inventory: CourseInventory, current: CanvasFile[]): number =>
  newFiles(inventory, current).length;

export async function loadUpdateCheck(origin: string): Promise<UpdateCheck | null> {
  const stored = await browser.storage.local.get<Record<string, UpdateCheck | undefined>>(
    updatesKey(origin),
  );
  return stored[updatesKey(origin)] ?? null;
}

export async function saveUpdateCheck(origin: string, check: UpdateCheck): Promise<void> {
  await browser.storage.local.set({ [updatesKey(origin)]: check });
}

/**
 * Checks the courses saved before from this Canvas, at most every CHECK_EVERY_MS.
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
      const files = newFiles(
        course,
        await canvas.list<CanvasFile>(`/courses/${course.courseId}/files`),
      );
      const { items, ...counts } = await changedSince(canvas, course.courseId, course.savedAt);
      const all = [...files, ...items].slice(0, MAX_ITEMS);
      courses.push({
        courseId: course.courseId,
        courseName: course.courseName,
        newFiles: files.length,
        ...counts,
        ...(all.length ? { items: all } : {}),
      });
    } catch (error) {
      if (error instanceof CanvasError && (error.kind === 'session' || error.kind === 'aborted'))
        throw error;
    }
  }
  // What the user hid stays hidden; names that are gone are forgotten.
  const present = new Set(courses.flatMap((c) => (c.items ?? []).map((i) => i.key)));
  const dismissed = previous?.dismissed?.filter((k) => present.has(k));
  const check: UpdateCheck = {
    checkedAt: now,
    courses,
    ...(previous?.dismissedAt ? { dismissedAt: previous.dismissedAt } : {}),
    ...(dismissed?.length ? { dismissed } : {}),
  };
  await saveUpdateCheck(origin, check);
  return check;
}

/** Newest first, one page each: enough to find what changed since a recent save. */
const RECENT: [
  count: 'newAnnouncements' | 'changedDocuments',
  kind: 'announcement' | 'page' | 'assignment',
  path: string,
  date: string,
  params: Record<string, string>,
][] = [
  [
    'newAnnouncements',
    'announcement',
    'discussion_topics',
    'posted_at',
    { only_announcements: 'true' },
  ],
  ['changedDocuments', 'page', 'pages', 'updated_at', { sort: 'updated_at', order: 'desc' }],
  ['changedDocuments', 'assignment', 'assignments', 'updated_at', {}],
];

const text = (value: unknown) =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : '';

/**
 * Announcements, pages and assignments that are newer than `savedAt`. Courses
 * saved by v2 have no date: then only files are compared. A section Canvas
 * hides from this user (404, 403) counts as nothing new.
 */
async function changedSince(
  canvas: CanvasClient,
  courseId: string,
  savedAt: number,
): Promise<Pick<CourseUpdate, 'newAnnouncements' | 'changedDocuments'> & { items: UpdateItem[] }> {
  const counts: Pick<CourseUpdate, 'newAnnouncements' | 'changedDocuments'> = {};
  const items: UpdateItem[] = [];
  if (!savedAt) return { ...counts, items };
  for (const [count, kind, path, date, params] of RECENT) {
    let found: Record<string, unknown>[];
    try {
      found = await canvas.get(`/courses/${courseId}/${path}`, { per_page: '50', ...params });
    } catch (error) {
      if (error instanceof CanvasError && (error.kind === 'session' || error.kind === 'aborted'))
        throw error;
      continue;
    }
    const newer = (Array.isArray(found) ? found : []).filter(
      (item) => Date.parse(text(item[date])) > savedAt,
    );
    if (newer.length) counts[count] = (counts[count] ?? 0) + newer.length;
    for (const item of newer) {
      const id = text(item.page_id) || text(item.id) || text(item.url);
      const created = Date.parse(text(item.created_at));
      items.push({
        key: `${kind}:${id}:${text(item[date])}`,
        name: text(item.title) || text(item.name) || `Untitled ${kind}`,
        kind,
        // Edited since the save, rather than added: Canvas says when it was made.
        ...(kind !== 'announcement' && created <= savedAt ? { updated: true } : {}),
      });
    }
  }
  return { ...counts, items };
}

/** Anything new in a course: files, announcements or changed documents. */
export const newItems = (c: CourseUpdate) =>
  c.newFiles + (c.newAnnouncements ?? 0) + (c.changedDocuments ?? 0);

type NewCounts = Pick<CourseUpdate, 'newFiles' | 'newAnnouncements' | 'changedDocuments'>;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "3 new files", or every kind that changed: "2 new files and 1 new announcement". */
export function describeNew(c: NewCounts): string {
  const parts = [
    c.newFiles ? plural(c.newFiles, 'new file', 'new files') : '',
    c.newAnnouncements ? plural(c.newAnnouncements, 'new announcement', 'new announcements') : '',
    c.changedDocuments ? plural(c.changedDocuments, 'updated page', 'updated pages') : '',
  ].filter(Boolean);
  if (parts.length < 2) return parts[0] ?? plural(0, 'new file', 'new files');
  return `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
}

/** Several courses' changes added up. */
export const totalNew = (courses: CourseUpdate[]): Required<NewCounts> =>
  courses.reduce(
    (t, c) => ({
      newFiles: t.newFiles + c.newFiles,
      newAnnouncements: t.newAnnouncements + (c.newAnnouncements ?? 0),
      changedDocuments: t.changedDocuments + (c.changedDocuments ?? 0),
    }),
    { newFiles: 0, newAnnouncements: 0, changedDocuments: 0 },
  );

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

/** The user hid the note: everything it listed stays hidden, everywhere. */
export async function dismissUpdates(origin: string, now = Date.now()): Promise<void> {
  const check = await loadUpdateCheck(origin);
  if (!check) return;
  const listed = check.courses.flatMap((c) => (c.items ?? []).map((i) => i.key));
  await saveUpdateCheck(origin, {
    ...check,
    dismissedAt: now,
    dismissed: [...new Set([...(check.dismissed ?? []), ...listed])],
  });
}

/**
 * Courses the note should show. After the user hid it, nothing for a day, and
 * then only once something it didn't list has come in. It then shows all that's
 * new, as the download gets all of it.
 */
export function pendingUpdates(check: UpdateCheck | null, now = Date.now()): CourseUpdate[] {
  if (!check) return [];
  const withNews = check.courses.filter((c) => newItems(c) > 0);
  if (!check.dismissedAt) return withNews;
  if (now - check.dismissedAt < QUIET_AFTER_DISMISS_MS) return [];
  const hidden = new Set(check.dismissed ?? []);
  const unseen = withNews.some((c) => (c.items ?? []).some((i) => !hidden.has(i.key)));
  return unseen ? withNews : [];
}

const KIND_WORDS: Record<UpdateItem['kind'], [one: string, many: string]> = {
  file: ['file', 'files'],
  announcement: ['announcement', 'announcements'],
  page: ['page', 'pages'],
  assignment: ['assignment', 'assignments'],
};

/**
 * The note's title: "1 new file in Linear Algebra", "2 updated pages in Ethics",
 * or, when more than one kind of thing changed, "12 changes in 2 courses".
 */
export function noteTitle(courses: CourseUpdate[]): string {
  const where = courses.length === 1 ? courses[0]!.courseName : `${courses.length} courses`;
  const items = courses.flatMap((c) => c.items ?? []);
  // Checks before names were kept only have counts.
  if (!items.length) return `${describeNew(totalNew(courses))} in ${where}`;
  const total = courses.reduce((n, c) => n + Math.max(newItems(c), c.items?.length ?? 0), 0);
  const kinds = new Set(items.map((i) => i.kind));
  if (kinds.size > 1) return `${total} changes in ${where}`;
  const [one, many] = KIND_WORDS[items[0]!.kind];
  const state = items.every((i) => i.updated) ? 'updated' : 'new';
  return `${total} ${state} ${total === 1 ? one : many} in ${where}`;
}

/**
 * What's new by name: "Week 3.pdf, Quiz 2 and 4 more". With several courses,
 * grouped by course: "Statistics: Week 5.pdf and Week 6.pdf; Ethics: Exam moved".
 */
export function notePreview(courses: CourseUpdate[], show = 3): string {
  // Checks before names were kept: say where, at least.
  if (!courses.some((c) => c.items?.length))
    return courses.map((c) => `${c.courseName} (${newItems(c)})`).join(', ');
  const names = (c: CourseUpdate, n: number) =>
    listNames(
      (c.items ?? []).map((i) => shorten(i.name)),
      n,
      Math.max(newItems(c), c.items?.length ?? 0),
    );
  if (courses.length === 1) return names(courses[0]!, show);
  return courses.map((c) => `${c.courseName}: ${names(c, 2)}`).join('; ');
}

/** "Week 9 - Synthesising sources and buil….pdf": long names would push the rest out of the note. */
export function shorten(name: string, max = 40): string {
  if (name.length <= max) return name;
  const ext = /\.[a-z0-9]{1,5}$/i.exec(name)?.[0] ?? '';
  return `${name.slice(0, max - ext.length - 1).trimEnd()}…${ext}`;
}

/** Every name, a line each under its course: the note's tooltip, as the note itself is cut short. */
export function noteDetails(courses: CourseUpdate[]): string {
  return courses
    .map((c) => {
      const items = c.items ?? [];
      const rest = newItems(c) - items.length;
      const lines = items.map((i) => `${i.name}${i.updated ? ' (updated)' : ''}`);
      if (rest > 0) lines.push(`and ${rest} more`);
      return [c.courseName, ...lines.map((l) => `  ${l}`)].join('\n');
    })
    .join('\n');
}

/** "a, b and c", or "a, b, c and 4 more" past `show` names ("and 1 more" never: then it's named). */
export function listNames(names: string[], show = 3, total = names.length): string {
  const shown = names.slice(0, total - show === 1 ? show + 1 : show);
  const more = total - shown.length;
  if (more > 0) return `${shown.join(', ')} and ${more} more`;
  if (shown.length < 2) return shown[0] ?? '';
  return `${shown.slice(0, -1).join(', ')} and ${shown.at(-1)}`;
}
