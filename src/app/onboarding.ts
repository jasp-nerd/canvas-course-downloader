// What a new install or an update shows. Existing users are never interrupted:
// nothing opens on update, browser start or browser update.
import { browser } from 'wxt/browser';
import { saveSettings, type Settings } from '../storage/settings';

export type InstallReason =
  'install' | 'update' | 'chrome_update' | 'browser_update' | 'shared_module_update';

export interface InstallFacts {
  reason: InstallReason;
  previousVersion?: string;
  /** 'admin' when a school installed it by policy. */
  installType?: string;
  /** Settings already in storage.sync: a synced install on another device. */
  syncHadSettings: boolean;
}

export type Onboarding = 'welcome' | 'whats-new' | 'none';

export function onboardingFor(facts: InstallFacts): Onboarding {
  if (facts.reason === 'install') {
    // School-managed installs land on every student's browser unasked; don't greet them with a tab.
    if (facts.installType === 'admin') return 'none';
    // The same user on a second device has seen it before.
    if (facts.syncHadSettings) return 'none';
    return 'welcome';
  }
  if (facts.reason === 'update' && facts.previousVersion?.startsWith('2.')) return 'whats-new';
  return 'none';
}

/** Shown once in the popup to people who updated from v2. */
export const WHATS_NEW_3 =
  'New in 3.0: exports keep going when you leave Canvas, files that fail are listed instead of skipped silently, and the dashboard has a course picker.';

const ASK_PROFILE = 'askProfile';

/** A new user is asked what their downloads should be, once, at the first download. */
export async function markNewUser(): Promise<void> {
  await browser.storage.local.set({ [ASK_PROFILE]: true });
}

/** Asked only of new users who haven't chosen in Settings already. */
export async function shouldAskProfile(): Promise<boolean> {
  const [local, sync] = await Promise.all([
    browser.storage.local.get<Record<string, unknown>>(ASK_PROFILE),
    browser.storage.sync.get<Record<string, unknown>>('profile'),
  ]);
  return local[ASK_PROFILE] === true && sync.profile === undefined;
}

/** The answer to the first-download question. Teachers also say whether students' work goes in. */
export type ProfileAnswer = Pick<Settings, 'profile' | 'aiTarget'> &
  Partial<Pick<Settings, 'includeStudentWork'>>;

export async function answerProfile(choice: ProfileAnswer): Promise<void> {
  const { includeStudentWork, ...kind } = choice;
  await saveSettings({
    ...(kind.profile === 'study' ? kind : { profile: kind.profile }),
    ...(includeStudentWork === undefined ? {} : { includeStudentWork }),
  });
  await browser.storage.local.remove(ASK_PROFILE);
}
