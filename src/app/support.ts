// When to ask for a store review after an export. Everyone gets the same ask,
// with "tell me what's missing" beside it: sending only happy users to the store
// ("review gating") counts as review manipulation in store and consumer rules.
// It asks rarely and stops for good once answered, so it never becomes a nag.
import { browser } from 'wxt/browser';

const DAY = 24 * 60 * 60 * 1000;
const MIN_EXPORTS = 2;
const MAX_TIMES_SHOWN = 2;
const MIN_DAYS_BETWEEN = 30;

export interface SupportState {
  /** Exports that finished with every file saved. */
  successfulExports: number;
  timesShown: number;
  lastShownAt: number;
  /** Answered, clicked a link, or chose "Don't show again". */
  done: boolean;
  /** When the first export that worked happened (since 3.0); the ask waits a day after it. */
  firstSuccessAt?: number;
}

const KEY = 'supportCard';
const FRESH: SupportState = { successfulExports: 0, timesShown: 0, lastShownAt: 0, done: false };

/**
 * Never on the first export, nor within a day of the first that worked (so not on
 * someone's first export after updating from 2.x either), at most twice, a month apart,
 * and never again once answered.
 */
export function shouldShowSupportCard(state: SupportState, now: number): boolean {
  if (state.done) return false;
  if (state.successfulExports < MIN_EXPORTS) return false;
  if (!state.firstSuccessAt || now - state.firstSuccessAt < DAY) return false;
  if (state.timesShown >= MAX_TIMES_SHOWN) return false;
  return now - state.lastShownAt >= MIN_DAYS_BETWEEN * DAY;
}

export async function loadSupportState(): Promise<SupportState> {
  const stored = await browser.storage.local.get<Record<string, unknown>>([
    KEY,
    'completedSessions',
    'feedbackState',
  ]);
  if (stored[KEY]) return { ...FRESH, ...(stored[KEY] as Partial<SupportState>) };
  // v2 kept its own counters; someone who already answered v2's prompt isn't asked again.
  const v2Answer = stored.feedbackState;
  return {
    ...FRESH,
    successfulExports: Number(stored.completedSessions) || 0,
    done:
      v2Answer === 'positive_clicked' ||
      v2Answer === 'negative_clicked' ||
      v2Answer === 'dismissed',
  };
}

export async function saveSupportState(state: SupportState): Promise<void> {
  await browser.storage.local.set({ [KEY]: state });
}

/** Records a fully successful export and returns whether to show the card now. */
export async function supportCardAfterExport(now = Date.now()): Promise<boolean> {
  const state = await loadSupportState();
  state.successfulExports++;
  state.firstSuccessAt ??= now;
  const show = shouldShowSupportCard(state, now);
  if (show) {
    state.timesShown++;
    state.lastShownAt = now;
  }
  await saveSupportState(state);
  return show;
}

export async function finishSupportCard(): Promise<void> {
  await saveSupportState({ ...(await loadSupportState()), done: true });
}
