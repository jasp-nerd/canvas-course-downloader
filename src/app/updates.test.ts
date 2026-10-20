import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import type { CanvasClient } from '../canvas/client';
import { saveInventory } from '../storage/inventory';
import {
  checkForUpdates,
  countNew,
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

const fakeCanvas = (files: object[]) => {
  let calls = 0;
  const canvas = { list: () => (calls++, Promise.resolve(files)) } as unknown as CanvasClient;
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
