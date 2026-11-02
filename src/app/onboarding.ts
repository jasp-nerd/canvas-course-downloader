// What a new install or an update shows. Existing users are never interrupted:
// nothing opens on update, browser start or browser update.
import { browser } from 'wxt/browser';
import type { AiTargetId } from '../export/study-pack';
import { DEFAULT_SETTINGS, saveSettings, type Settings } from '../storage/settings';

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

/** The first question of setup: what the new user wants to do with their courses. */
export type SetupGoal = 'copy' | 'study' | 'code' | 'teach';
export type SetupScreen = 'hello' | 'goal' | 'teacher' | 'ai' | 'save' | 'ready';

export interface SetupAnswers {
  goal: SetupGoal;
  /** Asked only when archiving a course the user teaches. */
  includeStudentWork: boolean;
  /** Asked only for study packs. */
  aiTarget: AiTargetId;
  zipMode: boolean;
  saveTo: Settings['saveTo'];
  incrementalMode: boolean;
}

/** Only for new users, so "only add what's new" starts on; existing users never see setup. */
export const SETUP_DEFAULTS: SetupAnswers = {
  goal: 'copy',
  includeStudentWork: false,
  aiTarget: DEFAULT_SETTINGS.aiTarget,
  zipMode: true,
  saveTo: 'downloads',
  incrementalMode: true,
};

export function setupScreens(goal: SetupGoal): SetupScreen[] {
  const followUp: SetupScreen[] = goal === 'teach' ? ['teacher'] : goal === 'study' ? ['ai'] : [];
  return ['hello', 'goal', ...followUp, 'save', 'ready'];
}

const GOAL_PROFILE: Record<SetupGoal, Settings['profile']> = {
  copy: 'copy',
  study: 'study',
  code: 'agents',
  teach: 'copy',
};

/**
 * The settings setup writes. Role and student work are always written, so a
 * user who reaches the end, goes back and picks another goal keeps no stale
 * teacher choice.
 */
export function setupSettings(answers: SetupAnswers): Partial<Settings> {
  const teach = answers.goal === 'teach';
  return {
    profile: GOAL_PROFILE[answers.goal],
    ...(answers.goal === 'study' ? { aiTarget: answers.aiTarget } : {}),
    role: teach ? 'teacher' : 'student',
    includeStudentWork: teach && answers.includeStudentWork,
    zipMode: answers.zipMode,
    saveTo: answers.saveTo,
    incrementalMode: answers.incrementalMode,
  };
}

/** Saves setup's answers; the first download then starts without asking. */
export async function finishSetup(answers: SetupAnswers): Promise<void> {
  await saveSettings(setupSettings(answers));
  await browser.storage.local.remove(ASK_PROFILE);
}

/** The Canvas origin from storage.local `lastCanvas` ({ origin, at }), or null when there's none to trust. */
export function canvasToReturnTo(stored: unknown): string | null {
  const origin = (stored as { origin?: unknown } | null | undefined)?.origin;
  if (typeof origin !== 'string' || !URL.canParse(origin)) return null;
  const url = new URL(origin);
  return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : null;
}
