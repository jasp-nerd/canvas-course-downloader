import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { CanvasError, type CanvasClient } from '../canvas/client';
import { saveInventory } from '../storage/inventory';
import {
  checkForUpdates,
  countNew,
  describeNew,
  downloadNewLabel,
  totalNew,
  markExported,
  pendingUpdates,
  saveUpdateCheck,
} from './updates';

const ORIGIN = 'https://school.instructure.com';
const HOUR = 60 * 60 * 1000;
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
  it('checks saved courses and caches the result for a few hours', async () => {
    await saveInventory(ORIGIN, '103', inventory);
    const { canvas, calls } = fakeCanvas([
      { id: 1, url: 'u', size: 100, modified_at: '2026-09-01T00:00:00Z' },
      { id: 2, url: 'u', size: 5 },
    ]);
    const first = await checkForUpdates(canvas, ORIGIN, NOW);
    expect(pendingUpdates(first)).toEqual([
      { courseId: '103', courseName: 'Linear Algebra', newFiles: 1 },
    ]);
    await checkForUpdates(canvas, ORIGIN, NOW + HOUR);
    expect(calls()).toBe(1);
    await checkForUpdates(canvas, ORIGIN, NOW + 4 * HOUR);
    expect(calls()).toBe(2);
  });

  it('does nothing for someone who never exported from this Canvas', async () => {
    const { canvas, calls } = fakeCanvas([]);
    expect(await checkForUpdates(canvas, ORIGIN, NOW)).toBeNull();
    expect(calls()).toBe(0);
  });

  it('clears a course once it is exported, and hides results the user dismissed', async () => {
    await saveUpdateCheck(ORIGIN, {
      checkedAt: NOW,
      courses: [{ courseId: '103', courseName: 'X', newFiles: 2 }],
    });
    await markExported(ORIGIN, '103');
    const { canvas } = fakeCanvas([]);
    expect(pendingUpdates(await checkForUpdates(canvas, ORIGIN, NOW))).toEqual([]);
    expect(
      pendingUpdates({
        checkedAt: NOW,
        dismissedAt: NOW,
        courses: [{ courseId: '1', courseName: 'Y', newFiles: 1 }],
      }),
    ).toEqual([]);
  });
});

describe('what else changed since the last save', () => {
  const saved = { ...inventory, savedAt: Date.UTC(2026, 9, 10) };
  const after = '2026-10-15T09:00:00Z';
  const before = '2026-10-01T09:00:00Z';

  it('counts announcements posted, and pages and assignments added or edited, since then', async () => {
    await saveInventory(ORIGIN, '103', saved);
    const { canvas } = fakeCanvas([], {
      '/discussion_topics': [{ posted_at: after }, { posted_at: before }],
      '/pages': [{ updated_at: after }, { updated_at: after }, { updated_at: before }],
      '/assignments': [{ updated_at: after }, { updated_at: before }],
    });
    expect(pendingUpdates(await checkForUpdates(canvas, ORIGIN, NOW))).toEqual([
      {
        courseId: '103',
        courseName: 'Linear Algebra',
        newFiles: 0,
        newAnnouncements: 1,
        changedDocuments: 3,
      },
    ]);
  });

  it('still reports files when Canvas hides pages or announcements', async () => {
    await saveInventory(ORIGIN, '103', saved);
    const { canvas } = fakeCanvas([{ id: 2, url: 'u', size: 5 }], {
      '/pages': new CanvasError('permanent', '/pages', 404),
      '/discussion_topics': new CanvasError('permanent', '/discussion_topics', 403),
    });
    expect(pendingUpdates(await checkForUpdates(canvas, ORIGIN, NOW))).toEqual([
      { courseId: '103', courseName: 'Linear Algebra', newFiles: 1 },
    ]);
  });

  it('counts only files for courses saved by v2, which kept no date', async () => {
    await saveInventory(ORIGIN, '103', { ...saved, savedAt: 0 });
    const { canvas } = fakeCanvas([], { '/discussion_topics': [{ posted_at: after }] });
    expect(pendingUpdates(await checkForUpdates(canvas, ORIGIN, NOW))).toEqual([]);
  });
});

describe('how what is new reads', () => {
  it('names files only when only files changed, and every kind otherwise', () => {
    expect(describeNew({ newFiles: 1 })).toBe('1 new file');
    expect(describeNew({ newFiles: 3 })).toBe('3 new files');
    expect(describeNew({ newFiles: 2, newAnnouncements: 1 })).toBe(
      '2 new files and 1 new announcement',
    );
    expect(describeNew({ newFiles: 0, newAnnouncements: 2, changedDocuments: 1 })).toBe(
      '2 new announcements and 1 updated page',
    );
    expect(describeNew({ newFiles: 1, newAnnouncements: 1, changedDocuments: 4 })).toBe(
      '1 new file, 1 new announcement and 4 updated pages',
    );
  });

  it("offers to download the new files, or what's new when there's more than files", () => {
    expect(downloadNewLabel({ newFiles: 2 })).toBe('Download 2 new files');
    expect(downloadNewLabel({ newFiles: 2, changedDocuments: 1 })).toBe("Download what's new");
  });

  it('adds up several courses', () => {
    expect(
      totalNew([
        { courseId: '1', courseName: 'A', newFiles: 1 },
        { courseId: '2', courseName: 'B', newFiles: 2, newAnnouncements: 1 },
      ]),
    ).toEqual({ newFiles: 3, newAnnouncements: 1, changedDocuments: 0 });
  });
});
