import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { CanvasError, type CanvasClient } from '../canvas/client';
import { saveInventory } from '../storage/inventory';
import {
  checkForUpdates,
  countNew,
  dismissUpdates,
  loadUpdateCheck,
  markExported,
  noteDetails,
  notePreview,
  noteTitle,
  pendingUpdates,
  saveUpdateCheck,
  type UpdateCheck,
} from './updates';

const ORIGIN = 'https://school.instructure.com';
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const NOW = Date.UTC(2026, 9, 20, 12);

beforeEach(() => fakeBrowser.reset());

const inventory = {
  courseName: 'Linear Algebra',
  savedAt: 0,
  files: { '1': { path: 'Files/a.pdf', size: 100, modifiedAt: '2026-09-01T00:00:00Z' } },
};

/** A Canvas with these files; `calls` counts file listings, one per course per check. */
const fakeCanvas = (files: object[], other: Record<string, object[] | Error> = {}) => {
  let calls = 0;
  const answer = (path: string) => {
    if (path.endsWith('/files')) {
      calls++;
      return Promise.resolve(files);
    }
    const found = Object.entries(other).find(([end]) => path.endsWith(end))?.[1] ?? [];
    return found instanceof Error ? Promise.reject(found) : Promise.resolve(found);
  };
  const canvas = { list: answer, get: answer } as unknown as CanvasClient;
  return { canvas, calls: () => calls };
};

describe('countNew', () => {
  it('counts files that are new or changed, and ignores locked ones', () => {
    expect(
      countNew(inventory, [
        { id: 1, url: 'u', size: 100, modified_at: '2026-09-01T00:00:00Z' },
        { id: 2, url: 'u', size: 5 },
        { id: 3, url: '', size: 5 },
      ]),
    ).toBe(1);
    expect(
      countNew(inventory, [{ id: 1, url: 'u', size: 200, modified_at: '2026-09-01T00:00:00Z' }]),
    ).toBe(1);
  });
});

describe('checkForUpdates', () => {
  it('checks saved courses, names what is new, and asks Canvas again after 15 minutes', async () => {
    await saveInventory(ORIGIN, '103', inventory);
    const { canvas, calls } = fakeCanvas([
      { id: 1, url: 'u', size: 100, modified_at: '2026-09-01T00:00:00Z' },
      { id: 2, url: 'u', size: 5, display_name: 'Week 2.pdf', modified_at: '2026-10-02T00:00:00Z' },
    ]);
    const first = await checkForUpdates(canvas, ORIGIN, NOW);
    expect(pendingUpdates(first, NOW)).toEqual([
      {
        courseId: '103',
        courseName: 'Linear Algebra',
        newFiles: 1,
        items: [{ key: 'file:2:2026-10-02T00:00:00Z:5', name: 'Week 2.pdf', kind: 'file' }],
      },
    ]);
    await checkForUpdates(canvas, ORIGIN, NOW + 14 * MINUTE);
    expect(calls()).toBe(1);
    await checkForUpdates(canvas, ORIGIN, NOW + 15 * MINUTE);
    expect(calls()).toBe(2);
  });

  it('does nothing for someone who never exported from this Canvas', async () => {
    const { canvas, calls } = fakeCanvas([]);
    expect(await checkForUpdates(canvas, ORIGIN, NOW)).toBeNull();
    expect(calls()).toBe(0);
  });

  it('clears a course once it is exported', async () => {
    await saveUpdateCheck(ORIGIN, {
      checkedAt: NOW,
      courses: [{ courseId: '103', courseName: 'X', newFiles: 2 }],
    });
    await markExported(ORIGIN, '103');
    const { canvas } = fakeCanvas([]);
    expect(pendingUpdates(await checkForUpdates(canvas, ORIGIN, NOW), NOW)).toEqual([]);
  });
});

describe('hiding the note', () => {
  const file = (id: number, name: string) => ({
    key: `file:${id}`,
    name,
    kind: 'file' as const,
  });
  const check = (...items: ReturnType<typeof file>[]): UpdateCheck => ({
    checkedAt: NOW,
    courses: [{ courseId: '103', courseName: 'X', newFiles: items.length, items }],
  });
  const DAY = 24 * HOUR;

  it('keeps what it listed hidden for good, everywhere', async () => {
    await saveUpdateCheck(ORIGIN, check(file(1, 'Week 1.pdf')));
    await dismissUpdates(ORIGIN, NOW);
    const hidden = await loadUpdateCheck(ORIGIN);
    expect(pendingUpdates(hidden, NOW + HOUR)).toEqual([]);
    expect(pendingUpdates(hidden, NOW + 30 * DAY)).toEqual([]);
  });

  it('comes back for something it did not list, but not within a day of hiding it', async () => {
    await saveUpdateCheck(ORIGIN, check(file(1, 'Week 1.pdf')));
    await dismissUpdates(ORIGIN, NOW);
    const later = {
      ...(await loadUpdateCheck(ORIGIN))!,
      ...check(file(1, 'Week 1.pdf'), file(2, 'Week 2.pdf')),
    };
    expect(pendingUpdates(later, NOW + 2 * HOUR)).toEqual([]);
    // Then it lists everything that's new, as the download gets all of it.
    expect(pendingUpdates(later, NOW + DAY)[0]?.items?.map((i) => i.name)).toEqual([
      'Week 1.pdf',
      'Week 2.pdf',
    ]);
  });

  it('remembers what was hidden across checks, and forgets names that are gone', async () => {
    await saveInventory(ORIGIN, '103', inventory);
    const canvas = (ids: number[]) =>
      fakeCanvas(ids.map((id) => ({ id, url: 'u', size: id, modified_at: '2026-10-02T00:00:00Z' })))
        .canvas;
    await checkForUpdates(canvas([2, 3]), ORIGIN, NOW);
    await dismissUpdates(ORIGIN, NOW);
    await checkForUpdates(canvas([3]), ORIGIN, NOW + DAY);
    const next = await loadUpdateCheck(ORIGIN);
    expect(next?.dismissed).toEqual(['file:3:2026-10-02T00:00:00Z:3']);
    expect(pendingUpdates(next, NOW + 2 * DAY)).toEqual([]);
  });
});

describe('what else changed since the last save', () => {
  const saved = { ...inventory, savedAt: Date.UTC(2026, 9, 10) };
  const after = '2026-10-15T09:00:00Z';
  const before = '2026-10-01T09:00:00Z';

  it('counts announcements posted, and pages and assignments added or edited, since then', async () => {
    await saveInventory(ORIGIN, '103', saved);
    const { canvas } = fakeCanvas([], {
      '/discussion_topics': [
        { id: 7, title: 'Exam moved', posted_at: after },
        { id: 6, title: 'Welcome', posted_at: before },
      ],
      '/pages': [
        { page_id: 8, title: 'Week 3', created_at: after, updated_at: after },
        { page_id: 9, title: 'Syllabus', created_at: before, updated_at: after },
        { page_id: 5, title: 'Old', updated_at: before },
      ],
      '/assignments': [
        { id: 10, name: 'Essay 1', created_at: before, updated_at: after },
        { id: 4, name: 'Quiz', updated_at: before },
      ],
    });
    expect(pendingUpdates(await checkForUpdates(canvas, ORIGIN, NOW), NOW)).toEqual([
      {
        courseId: '103',
        courseName: 'Linear Algebra',
        newFiles: 0,
        newAnnouncements: 1,
        changedDocuments: 3,
        items: [
          { key: `announcement:7:${after}`, name: 'Exam moved', kind: 'announcement' },
          { key: `page:8:${after}`, name: 'Week 3', kind: 'page' },
          { key: `page:9:${after}`, name: 'Syllabus', kind: 'page', updated: true },
          { key: `assignment:10:${after}`, name: 'Essay 1', kind: 'assignment', updated: true },
        ],
      },
    ]);
  });

  it('still reports files when Canvas hides pages or announcements', async () => {
    await saveInventory(ORIGIN, '103', saved);
    const { canvas } = fakeCanvas([{ id: 2, url: 'u', size: 5, display_name: 'b.pdf' }], {
      '/pages': new CanvasError('permanent', '/pages', 404),
      '/discussion_topics': new CanvasError('permanent', '/discussion_topics', 403),
    });
    expect(pendingUpdates(await checkForUpdates(canvas, ORIGIN, NOW), NOW)).toEqual([
      {
        courseId: '103',
        courseName: 'Linear Algebra',
        newFiles: 1,
        items: [{ key: 'file:2::5', name: 'b.pdf', kind: 'file' }],
      },
    ]);
  });

  it('counts only files for courses saved by v2, which kept no date', async () => {
    await saveInventory(ORIGIN, '103', { ...saved, savedAt: 0 });
    const { canvas } = fakeCanvas([], { '/discussion_topics': [{ posted_at: after }] });
    expect(pendingUpdates(await checkForUpdates(canvas, ORIGIN, NOW), NOW)).toEqual([]);
  });
});

describe('how what is new reads', () => {
  it('names what is new in the note, grouped by course when there are several', () => {
    const a = {
      courseId: '1',
      courseName: 'Statistics',
      newFiles: 3,
      items: [
        { key: 'a', name: 'Week 5.pdf', kind: 'file' as const },
        { key: 'b', name: 'Week 6.pdf', kind: 'file' as const },
        { key: 'c', name: 'Week 7.pdf', kind: 'file' as const, updated: true },
      ],
    };
    const b = {
      courseId: '2',
      courseName: 'Ethics',
      newFiles: 0,
      changedDocuments: 1,
      items: [{ key: 'd', name: 'Final essay', kind: 'assignment' as const }],
    };
    expect(noteTitle([a])).toBe('3 new files in Statistics');
    expect(notePreview([a])).toBe('Week 5.pdf, Week 6.pdf and Week 7.pdf');
    // A new assignment is called one, not an "updated page".
    expect(noteTitle([b])).toBe('1 new assignment in Ethics');
    expect(noteTitle([a, b])).toBe('4 changes in 2 courses');
    expect(notePreview([a, b])).toBe(
      'Statistics: Week 5.pdf, Week 6.pdf and Week 7.pdf; Ethics: Final essay',
    );
    expect(noteDetails([a, b])).toBe(
      'Statistics\n  Week 5.pdf\n  Week 6.pdf\n  Week 7.pdf (updated)\nEthics\n  Final essay',
    );
    // Results from before names were kept say where, at least.
    const counted = { courseId: '1', courseName: 'Statistics', newFiles: 2 };
    expect(noteTitle([counted])).toBe('2 new files in Statistics');
    expect(notePreview([counted])).toBe('Statistics (2)');
  });
});
