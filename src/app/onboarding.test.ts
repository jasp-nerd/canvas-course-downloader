import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import {
  answerProfile,
  canvasToReturnTo,
  finishSetup,
  markNewUser,
  onboardingFor,
  SETUP_DEFAULTS,
  setupScreens,
  setupSettings,
  shouldAskProfile,
  type SetupAnswers,
} from './onboarding';

describe('onboardingFor', () => {
  it('welcomes a genuine first install', () => {
    expect(
      onboardingFor({ reason: 'install', installType: 'normal', syncHadSettings: false }),
    ).toBe('welcome');
  });
  it('stays quiet for installs pushed by a school', () => {
    expect(onboardingFor({ reason: 'install', installType: 'admin', syncHadSettings: false })).toBe(
      'none',
    );
  });
  it('stays quiet when browser sync installs it on another device', () => {
    expect(onboardingFor({ reason: 'install', installType: 'normal', syncHadSettings: true })).toBe(
      'none',
    );
  });
  it('notes what is new, without opening anything, for v2 users', () => {
    expect(
      onboardingFor({ reason: 'update', previousVersion: '2.11.0', syncHadSettings: true }),
    ).toBe('whats-new');
  });
  it.each([
    { reason: 'update' as const, previousVersion: '3.0.0' },
    { reason: 'chrome_update' as const },
    { reason: 'browser_update' as const },
  ])('does nothing for %j', (facts) => {
    expect(onboardingFor({ ...facts, syncHadSettings: true })).toBe('none');
  });
});

describe('the first-download question', () => {
  beforeEach(() => fakeBrowser.reset());

  it('is never asked of people who were not new users', async () => {
    expect(await shouldAskProfile()).toBe(false);
  });

  it('is asked of a new user, unless they already chose in Settings', async () => {
    await markNewUser();
    expect(await shouldAskProfile()).toBe(true);
    await fakeBrowser.storage.sync.set({ profile: 'agents' });
    expect(await shouldAskProfile()).toBe(false);
  });

  it('is asked once: the answer is saved as the setting', async () => {
    await markNewUser();
    await answerProfile({ profile: 'study', aiTarget: 'claude' });
    expect(await fakeBrowser.storage.sync.get(null)).toEqual({
      profile: 'study',
      aiTarget: 'claude',
    });
    await fakeBrowser.storage.sync.clear();
    expect(await shouldAskProfile()).toBe(false);
  });

  it("saves a teacher's choice about students' work with the answer, when it was asked", async () => {
    await markNewUser();
    await answerProfile({ profile: 'copy', aiTarget: 'notebooklm', includeStudentWork: true });
    expect(await fakeBrowser.storage.sync.get(null)).toEqual({
      profile: 'copy',
      includeStudentWork: true,
    });
  });

  it('saves only the profile when it is not a study pack', async () => {
    await markNewUser();
    await answerProfile({ profile: 'copy', aiTarget: 'notebooklm' });
    expect(await fakeBrowser.storage.sync.get(null)).toEqual({ profile: 'copy' });
  });
});

describe('setup after a new install', () => {
  beforeEach(() => fakeBrowser.reset());

  const answers = (changes: Partial<SetupAnswers> = {}): SetupAnswers => ({
    ...SETUP_DEFAULTS,
    ...changes,
  });
  const save = { zipMode: true, saveTo: 'downloads', incrementalMode: true };

  it('asks a follow-up question only for study packs and teachers', () => {
    expect(setupScreens('copy')).toEqual(['hello', 'goal', 'save', 'ready']);
    expect(setupScreens('code')).toEqual(['hello', 'goal', 'save', 'ready']);
    expect(setupScreens('study')).toEqual(['hello', 'goal', 'ai', 'save', 'ready']);
    expect(setupScreens('teach')).toEqual(['hello', 'goal', 'teacher', 'save', 'ready']);
  });

  it('starts a new user on a ZIP in Downloads that only adds what is new next time', () => {
    expect(SETUP_DEFAULTS).toEqual({
      goal: 'copy',
      includeStudentWork: false,
      aiTarget: 'notebooklm',
      ...save,
    });
  });

  it('keeps a copy', () => {
    expect(setupSettings(answers({ goal: 'copy' }))).toEqual({
      profile: 'copy',
      role: 'student',
      includeStudentWork: false,
      ...save,
    });
  });

  it('studies with AI, in the chosen tool', () => {
    expect(setupSettings(answers({ goal: 'study', aiTarget: 'claude', zipMode: false }))).toEqual({
      profile: 'study',
      aiTarget: 'claude',
      role: 'student',
      includeStudentWork: false,
      ...save,
      zipMode: false,
    });
  });

  it('builds with code', () => {
    expect(setupSettings(answers({ goal: 'code', incrementalMode: false }))).toEqual({
      profile: 'agents',
      role: 'student',
      includeStudentWork: false,
      ...save,
      incrementalMode: false,
    });
  });

  it('archives a course the user teaches, with or without student work', () => {
    expect(setupSettings(answers({ goal: 'teach' }))).toEqual({
      profile: 'copy',
      role: 'teacher',
      includeStudentWork: false,
      ...save,
    });
    expect(
      setupSettings(answers({ goal: 'teach', includeStudentWork: true, saveTo: 'folder' })),
    ).toEqual({
      profile: 'copy',
      role: 'teacher',
      includeStudentWork: true,
      ...save,
      saveTo: 'folder',
    });
  });

  it('never keeps student work for someone who is not archiving a course they teach', () => {
    // A teacher who went back and picked another goal.
    expect(setupSettings(answers({ goal: 'copy', includeStudentWork: true }))).toMatchObject({
      role: 'student',
      includeStudentWork: false,
    });
  });

  it('saves the answers and does not ask again at the first download', async () => {
    await markNewUser();
    await finishSetup(answers({ goal: 'study', aiTarget: 'chatgpt', zipMode: false }));
    expect(await fakeBrowser.storage.sync.get(null)).toEqual({
      profile: 'study',
      aiTarget: 'chatgpt',
      role: 'student',
      includeStudentWork: false,
      ...save,
      zipMode: false,
    });
    await fakeBrowser.storage.sync.clear();
    expect(await shouldAskProfile()).toBe(false);
  });
});

describe('the Canvas to go back to', () => {
  it('is the origin the content script last saw', () => {
    expect(canvasToReturnTo({ origin: 'https://school.instructure.com', at: 1 })).toBe(
      'https://school.instructure.com',
    );
    expect(canvasToReturnTo({ origin: 'https://canvas.example.edu:8443/courses/1', at: 1 })).toBe(
      'https://canvas.example.edu:8443',
    );
  });

  it.each([
    undefined,
    null,
    'https://school.instructure.com',
    {},
    { origin: 42 },
    { origin: 'not a url' },
    { origin: 'javascript:alert(1)' },
    { origin: 'file:///etc/passwd' },
  ])('is nothing for %j', (stored) => {
    expect(canvasToReturnTo(stored)).toBeNull();
  });
});
