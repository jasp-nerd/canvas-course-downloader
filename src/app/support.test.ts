import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import {
  finishSupportCard,
  loadSupportState,
  shouldShowSupportCard,
  supportCardAfterExport,
} from './support';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 20);

beforeEach(() => fakeBrowser.reset());

describe('shouldShowSupportCard', () => {
  const base = { successfulExports: 2, timesShown: 0, lastShownAt: 0, done: false };
  it('never shows on the first export', () => {
    expect(shouldShowSupportCard({ ...base, successfulExports: 1 }, NOW)).toBe(false);
  });
  it('shows from the second successful export', () => {
    expect(shouldShowSupportCard(base, NOW)).toBe(true);
  });
  it('waits 30 days before asking again', () => {
    expect(
      shouldShowSupportCard({ ...base, timesShown: 1, lastShownAt: NOW - 29 * DAY }, NOW),
    ).toBe(false);
    expect(
      shouldShowSupportCard({ ...base, timesShown: 1, lastShownAt: NOW - 30 * DAY }, NOW),
    ).toBe(true);
  });
  it('asks at most twice', () => {
    expect(
      shouldShowSupportCard({ ...base, timesShown: 2, lastShownAt: NOW - 90 * DAY }, NOW),
    ).toBe(false);
  });
  it('never asks again once answered or dismissed', () => {
    expect(shouldShowSupportCard({ ...base, done: true }, NOW)).toBe(false);
  });
});

describe('support state', () => {
  it('shows on the second successful export, not the first', async () => {
    expect(await supportCardAfterExport(NOW)).toBe(false);
    expect(await supportCardAfterExport(NOW)).toBe(true);
    expect(await supportCardAfterExport(NOW + DAY)).toBe(false);
  });

  it('stops for good after an answer', async () => {
    await supportCardAfterExport(NOW);
    await finishSupportCard();
    expect(await supportCardAfterExport(NOW + 100 * DAY)).toBe(false);
  });

  it("carries over v2's counters, and doesn't ask someone who already answered v2", async () => {
    await fakeBrowser.storage.local.set({
      completedSessions: 5,
      feedbackState: 'positive_clicked',
    });
    expect(await loadSupportState()).toMatchObject({ successfulExports: 5, done: true });
  });

  it('counts v2 exports for someone who never answered', async () => {
    await fakeBrowser.storage.local.set({ completedSessions: 3, feedbackState: 'pending' });
    expect(await supportCardAfterExport(NOW)).toBe(true);
  });
});
