// When to show the support card after an export. Everyone gets the same ask, a review
// with "tell me what's missing" beside it: sending only happy users to the store ("review
// gating") counts as review manipulation in store and consumer rules. Research on donation asks
// (Wikimedia's banner data, field experiments on repeat asks) finds most gifts come on the first
// one or two showings and each repeat brings in less, so it shows on the first good export, then
// at most once a week, in a different look each time so it stays noticeable. It sits beside the
// receipt and never interrupts; only "Don't show again" stops it.
import { browser } from 'wxt/browser';

export interface SupportState {
  /** Exports that finished with every file saved. */
  successfulExports: number;
  /** How often the card showed; picks its look. */
  timesShown: number;
  /** When the card last showed. */
  lastShownAt: number;
  /** Chose "Don't show again". Reviewing or giving doesn't count: the card stays. */
  optedOut: boolean;
}

const KEY = 'supportCard';
const WEEK = 7 * 24 * 60 * 60 * 1000;
export const SUPPORT_VARIANTS = 3;

export type SupportCardMode = false | { variant: number };

export function supportCardFor(state: SupportState, now: number): SupportCardMode {
  if (state.optedOut || state.successfulExports < 1) return false;
  if (state.lastShownAt && now - state.lastShownAt < WEEK) return false;
  return { variant: state.timesShown % SUPPORT_VARIANTS };
}

export async function loadSupportState(): Promise<SupportState> {
  const stored = await browser.storage.local.get<Record<string, unknown>>([
    KEY,
    'completedSessions',
    'feedbackState',
  ]);
  // Earlier 3.0 builds also kept done (any answer); it doesn't carry over, since answering no
  // longer stops the card.
  const saved = stored[KEY] as Partial<SupportState> | undefined;
  if (saved)
    return {
      successfulExports: saved.successfulExports ?? 0,
      timesShown: saved.timesShown ?? 0,
      lastShownAt: saved.lastShownAt ?? 0,
      optedOut: saved.optedOut ?? false,
    };
  // v2 kept its own counters; its "don't ask again" still holds.
  return {
    successfulExports: Number(stored.completedSessions) || 0,
    timesShown: 0,
    lastShownAt: 0,
    optedOut: stored.feedbackState === 'dismissed',
  };
}

export async function saveSupportState(state: SupportState): Promise<void> {
  await browser.storage.local.set({ [KEY]: state });
}

/** Records a fully successful export and returns whether to show the card now. */
export async function supportCardAfterExport(now = Date.now()): Promise<SupportCardMode> {
  const state = await loadSupportState();
  state.successfulExports++;
  const mode = supportCardFor(state, now);
  if (mode) {
    state.timesShown++;
    state.lastShownAt = now;
  }
  await saveSupportState(state);
  return mode;
}

export async function hideSupportCard(): Promise<void> {
  await saveSupportState({ ...(await loadSupportState()), optedOut: true });
}
