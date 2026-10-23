import { describe, expect, it } from 'vitest';
import { shortDay } from './day';

// Tests run in UTC. Thursday 22 October 2026, 15:00.
const now = Date.UTC(2026, 9, 22, 15);
const at = (month: number, day: number, hour = 9, year = 2026) =>
  Date.UTC(year, month - 1, day, hour);

describe('shortDay', () => {
  it('says today and yesterday by calendar day, not by 24 hours', () => {
    expect(shortDay(at(10, 22, 0), now)).toBe('today');
    expect(shortDay(at(10, 21, 23), now)).toBe('yesterday');
    expect(shortDay(at(10, 21, 0), now)).toBe('yesterday');
  });

  it('names the weekday within the last week', () => {
    expect(shortDay(at(10, 20), now)).toBe('Tue');
    expect(shortDay(at(10, 16), now)).toBe('Fri');
  });

  it('gives the date for anything older, with the year when it differs', () => {
    expect(shortDay(at(10, 15), now)).toBe('Oct 15');
    expect(shortDay(at(5, 3), now)).toBe('May 3');
    expect(shortDay(at(12, 30, 9, 2025), now)).toBe('Dec 30, 2025');
  });
});
