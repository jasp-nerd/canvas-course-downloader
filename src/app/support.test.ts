import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import {
  hideSupportCard,
  loadSupportState,
  supportCardAfterExport,
  supportCardFor,
} from './support';

beforeEach(() => fakeBrowser.reset());

const HOUR = 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 25, 12);
const state = (successfulExports: number, lastShownAt = 0, optedOut = false) => ({
  successfulExports,
  lastShownAt,
  optedOut,
});

describe('supportCardFor', () => {
  it('never shows on the first export', () => {
    expect(supportCardFor(state(1), NOW)).toBe(false);
  });
  it('shows in full on every successful export after that', () => {
    for (const n of [2, 3, 10, 200]) expect(supportCardFor(state(n), NOW)).toBe('full');
  });
  it('shows a compact card within two hours of the last one, so a night of downloads repeats less', () => {
    expect(supportCardFor(state(4, NOW - HOUR), NOW)).toBe('compact');
    expect(supportCardFor(state(4, NOW - 2 * HOUR), NOW)).toBe('full');
  });
  it('stops only when someone chose "Don\'t show again"', () => {
    expect(supportCardFor(state(5, 0, true), NOW)).toBe(false);
  });
});

describe('support state', () => {
  it('shows from the second successful export on, every time', async () => {
    expect(await supportCardAfterExport(NOW)).toBe(false);
    expect(await supportCardAfterExport(NOW + 3 * HOUR)).toBe('full');
    expect(await supportCardAfterExport(NOW + 4 * HOUR)).toBe('compact');
    expect(await supportCardAfterExport(NOW + 7 * HOUR)).toBe('full');
  });

  it('stops for good after "Don\'t show again"', async () => {
    await supportCardAfterExport(NOW);
    await hideSupportCard();
    expect(await supportCardAfterExport(NOW + 3 * HOUR)).toBe(false);
  });

  it("carries over v2's counter, and keeps v2's \"don't ask again\"", async () => {
    await fakeBrowser.storage.local.set({ completedSessions: 5, feedbackState: 'dismissed' });
    expect(await loadSupportState()).toEqual({
      successfulExports: 5,
      lastShownAt: 0,
      optedOut: true,
    });
  });

  it('asks people who answered v2 again, since answering no longer stops it', async () => {
    await fakeBrowser.storage.local.set({
      completedSessions: 3,
      feedbackState: 'positive_clicked',
    });
    expect(await supportCardAfterExport(NOW)).toBe('full');
  });

  it("ignores an earlier 3.0 build's answered flag: only the opt-out stops it now", async () => {
    await fakeBrowser.storage.local.set({
      supportCard: { successfulExports: 4, timesShown: 2, lastShownAt: 1, done: true },
    });
    expect(await supportCardAfterExport(NOW)).toBe('full');
  });
});
