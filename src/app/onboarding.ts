// What a new install or an update shows. Existing users are never interrupted:
// nothing opens on update, browser start or browser update.

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
