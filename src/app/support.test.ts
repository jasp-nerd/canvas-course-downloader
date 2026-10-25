import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import {
  hideSupportCard,
  loadSupportState,
  supportCardAfterExport,
  supportCardFor,
} from './support';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 25, 12);
const state = (over: Partial<Parameters<typeof supportCardFor>[0]> = {}) => ({
  successfulExports: 1,
  timesShown: 0,
  lastShownAt: 0,
  optedOut: false,
  ...over,
});

beforeEach(() => fakeBrowser.reset());

describe('supportCardFor', () => {
  it('shows on the first successful export, since many people only download once', () => {
    expect(supportCardFor(state(), NOW)).toEqual({ variant: 0 });
  });
  it('shows at most once a week, as repeats of the same ask bring in less each time', () => {
    expect(supportCardFor(state({ timesShown: 1, lastShownAt: NOW - 6 * DAY }), NOW)).toBe(false);
    expect(supportCardFor(state({ timesShown: 1, lastShownAt: NOW - 7 * DAY }), NOW)).toEqual({
      variant: 1,
    });
  });
  it('takes turns between looks, so it stays noticeable', () => {
    const variants = [0, 1, 2, 3].map((timesShown) => supportCardFor(state({ timesShown }), NOW));
    expect(variants).toEqual([{ variant: 0 }, { variant: 1 }, { variant: 2 }, { variant: 0 }]);
  });
  it('stops only when someone chose "Don\'t show again"', () => {
    expect(supportCardFor(state({ optedOut: true }), NOW)).toBe(false);
  });
});

describe('support state', () => {
  it('shows on the first good export, then not again until a week later', async () => {
    expect(await supportCardAfterExport(NOW)).toEqual({ variant: 0 });
    expect(await supportCardAfterExport(NOW + DAY)).toBe(false);
    expect(await supportCardAfterExport(NOW + 7 * DAY)).toEqual({ variant: 1 });
  });

  it('stops for good after "Don\'t show again"', async () => {
    await supportCardAfterExport(NOW);
    await hideSupportCard();
    expect(await supportCardAfterExport(NOW + 30 * DAY)).toBe(false);
  });

  it("carries over v2's counter, and keeps v2's \"don't ask again\"", async () => {
    await fakeBrowser.storage.local.set({ completedSessions: 5, feedbackState: 'dismissed' });
    expect(await loadSupportState()).toEqual({
      successfulExports: 5,
      timesShown: 0,
      lastShownAt: 0,
      optedOut: true,
    });
  });

  it('asks people who answered v2 again, since answering no longer stops it', async () => {
    await fakeBrowser.storage.local.set({
      completedSessions: 3,
      feedbackState: 'positive_clicked',
    });
    expect(await supportCardAfterExport(NOW)).toEqual({ variant: 0 });
  });

  it("ignores an earlier 3.0 build's answered flag: only the opt-out stops it now", async () => {
    await fakeBrowser.storage.local.set({
      supportCard: { successfulExports: 4, timesShown: 2, lastShownAt: 1, done: true },
    });
    expect(await supportCardAfterExport(NOW)).toEqual({ variant: 2 });
  });
});
