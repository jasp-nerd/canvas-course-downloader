import { describe, expect, it } from 'vitest';
import { renderIcs } from './calendar';

const NOW = new Date('2026-10-22T20:00:00Z');

describe('deadlines as a calendar file', () => {
  it('writes one event per deadline, in date order, with CRLF lines', () => {
    const ics = renderIcs({
      name: 'Linear Algebra deadlines',
      now: NOW,
      events: [
        { uid: 'b@school', title: 'Problem set 2', start: '2026-09-19T21:59:00Z' },
        {
          uid: 'a@school',
          title: 'Problem set 1',
          start: '2026-09-12T21:59:00Z',
          url: 'https://x/1',
        },
      ],
    });
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.split('\r\n').every((l) => !l.includes('\n'))).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics.indexOf('Problem set 1')).toBeLessThan(ics.indexOf('Problem set 2'));
    expect(ics).toContain('DTSTART:20260912T215900Z\r\nDTEND:20260912T215900Z');
    expect(ics).toContain('UID:a@school');
    expect(ics).toContain('DTSTAMP:20261022T200000Z');
    expect(ics).toContain('URL:https://x/1');
  });

  it('escapes text and folds long lines at 75 bytes, also inside UTF-8 characters', () => {
    const ics = renderIcs({
      name: 'Deadlines',
      now: NOW,
      events: [
        {
          uid: 'c@school',
          title: `Essay; part 1, draft\nfinal ${'é'.repeat(60)}`,
          start: '2026-10-01T10:00:00Z',
        },
      ],
    });
    for (const line of ics.split('\r\n'))
      expect(Buffer.byteLength(line, 'utf8')).toBeLessThanOrEqual(75);
    const unfolded = ics.replace(/\r\n /g, '');
    expect(unfolded).toContain(`SUMMARY:Essay\\; part 1\\, draft\\nfinal ${'é'.repeat(60)}`);
  });

  it('skips events without a valid date', () => {
    const ics = renderIcs({
      name: 'x',
      now: NOW,
      events: [{ uid: 'd@school', title: 'No date', start: 'not a date' }],
    });
    expect(ics).not.toContain('BEGIN:VEVENT');
  });
});
