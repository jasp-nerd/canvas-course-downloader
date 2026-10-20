import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { answerProfile, markNewUser, onboardingFor, shouldAskProfile } from './onboarding';

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

  it('saves only the profile when it is not a study pack', async () => {
    await markNewUser();
    await answerProfile({ profile: 'copy', aiTarget: 'notebooklm' });
    expect(await fakeBrowser.storage.sync.get(null)).toEqual({ profile: 'copy' });
  });
});
