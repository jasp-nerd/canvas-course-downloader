import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { hideSupportCard, loadSupportState, supportCardAfterExport } from './support';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 25, 12);

beforeEach(() => fakeBrowser.reset());

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
});
