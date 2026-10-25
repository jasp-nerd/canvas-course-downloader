// When to show the support card after an export. Everyone gets the same ask, a review
// with "tell me what's missing" beside it: sending only happy users to the store ("review
// gating") counts as review manipulation in store and consumer rules. The card sits beside the
// receipt and never interrupts, so it shows after every good export but the first, and only
// "Don't show again" stops it. Within two hours of the last one it shows compact, so a night of
// downloading at the end of term doesn't repeat the same card in full.
import { browser } from 'wxt/browser';

export interface SupportState {
  /** Exports that finished with every file saved. */
  successfulExports: number;
  /** When the card last showed, in full or compact. */
  lastShownAt: number;
  /** Chose "Don't show again". Reviewing or giving doesn't count: the card stays. */
  optedOut: boolean;
}

const KEY = 'supportCard';
const COMPACT_FOR = 2 * 60 * 60 * 1000;

export type SupportCardMode = false | 'full' | 'compact';

/** Not on someone's first export, then after every export that saved everything. */
export function supportCardFor(state: SupportState, now: number): SupportCardMode {
  if (state.optedOut || state.successfulExports < 2) return false;
  return now - state.lastShownAt < COMPACT_FOR ? 'compact' : 'full';
}

export async function loadSupportState(): Promise<SupportState> {
  const stored = await browser.storage.local.get<Record<string, unknown>>([
    KEY,
    'completedSessions',
    'feedbackState',
  ]);
  // Earlier 3.0 builds also kept timesShown and done (any answer); those don't carry over, since
  // answering no longer stops the card.
  const saved = stored[KEY] as Partial<SupportState> | undefined;
  if (saved)
    return {
      successfulExports: saved.successfulExports ?? 0,
      lastShownAt: saved.lastShownAt ?? 0,
      optedOut: saved.optedOut ?? false,
    };
  // v2 kept its own counters; its "don't ask again" still holds.
  return {
    successfulExports: Number(stored.completedSessions) || 0,
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
  if (mode) state.lastShownAt = now;
  await saveSupportState(state);
  return mode;
}

export async function hideSupportCard(): Promise<void> {
  await saveSupportState({ ...(await loadSupportState()), optedOut: true });
}
