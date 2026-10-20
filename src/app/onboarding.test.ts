import { describe, expect, it } from 'vitest';
import { onboardingFor } from './onboarding';

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
