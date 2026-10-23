import { describe, expect, it } from 'vitest';
import { TimeLeft, timeLeftText } from './time-left';

/** Feeds `files` per second for `seconds`, one sample a second; returns the last estimate. */
function steady(estimator: TimeLeft, perSecond: number, seconds: number, total: number) {
  let left: number | null = null;
  for (let s = 0; s <= seconds; s++) left = estimator.update(s * 1000, s * perSecond, total);
  return left;
}

describe('TimeLeft', () => {
  it('says nothing for the first seconds, before the rate is known', () => {
    const estimator = new TimeLeft();
    expect(steady(estimator, 1, 3, 100)).toBeNull();
  });

  it('says nothing until enough files were measured', () => {
    const estimator = new TimeLeft();
    let left: number | null = null;
    for (let s = 0; s <= 12; s++) left = estimator.update(s * 1000, Math.floor(s / 4), 100);
    expect(left).toBeNull();
  });

  it('estimates from the measured rate once it is steady', () => {
    const estimator = new TimeLeft();
    const left = steady(estimator, 1, 12, 100);
    expect(left).not.toBeNull();
    expect(left!).toBeGreaterThan(80);
    expect(left!).toBeLessThan(95);
  });

  it('says nothing while the rate jumps around', () => {
    const estimator = new TimeLeft();
    // A burst, a stall, then a much faster stretch.
    const done = [0, 0, 0, 0, 0, 10, 10, 10, 10, 10, 40, 40];
    let left: number | null = null;
    done.forEach((d, s) => (left = estimator.update(s * 1000, d, 200)));
    expect(left).toBeNull();
  });

  it('needs estimates from different seconds to agree, not many from one burst', () => {
    const estimator = new TimeLeft();
    estimator.update(0, 0, 500);
    let left: number | null = null;
    for (let i = 0; i < 20; i++) left = estimator.update(6000 + i, 20 + i, 500);
    expect(left).toBeNull();
  });

  it('is zero when everything is done', () => {
    const estimator = new TimeLeft();
    steady(estimator, 1, 12, 100);
    expect(estimator.update(13_000, 100, 100)).toBe(0);
  });
});

describe('timeLeftText', () => {
  it('rounds to what a person would say', () => {
    expect(timeLeftText(20)).toBe('less than a minute left');
    expect(timeLeftText(70)).toBe('about 1 min left');
    expect(timeLeftText(260)).toBe('about 4 min left');
    expect(timeLeftText(2 * 3600 + 600)).toBe('about 2 h left');
  });
});
