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
});
