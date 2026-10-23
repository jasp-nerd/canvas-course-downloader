import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../storage/settings';
import { dayLabel, modeLine, savedAtLabel, savedCourseRows } from './popup-view';

// Thursday 22 October 2026, 15:30 UTC (tests run in UTC).
const NOW = Date.UTC(2026, 9, 22, 15, 30);
const HOUR = 60 * 60 * 1000;

describe('modeLine', () => {
  it('says what a download makes, how it is packed and where it goes', () => {
    expect(modeLine(DEFAULT_SETTINGS, 'Downloads')).toBe('A copy to keep · ZIP · Downloads');
    expect(modeLine(DEFAULT_SETTINGS)).toBe('A copy to keep · ZIP');
  });

  it('names the AI tool of a study pack, and folders', () => {
    const study = { ...DEFAULT_SETTINGS, profile: 'study' as const, aiTarget: 'claude' as const };
    expect(modeLine(study, 'Downloads')).toBe('A study pack for Claude · ZIP · Downloads');
    const agents = { ...DEFAULT_SETTINGS, profile: 'agents' as const, zipMode: false };
    expect(modeLine(agents, 'Canvas backup')).toBe('Files for code · Folders · Canvas backup');
  });
});

describe('dayLabel', () => {
  it('says today and yesterday', () => {
    expect(dayLabel(NOW - HOUR, NOW)).toBe('today');
    expect(dayLabel(Date.UTC(2026, 9, 21, 23, 0), NOW)).toBe('yesterday');
  });

  it('names the weekday within a week, and the date before that', () => {
    expect(dayLabel(Date.UTC(2026, 9, 20, 14, 2), NOW)).toBe('Tue');
    expect(dayLabel(Date.UTC(2026, 9, 16, 9, 0), NOW)).toBe('Fri');
    expect(dayLabel(Date.UTC(2026, 9, 15, 9, 0), NOW)).toBe('Oct 15');
    expect(dayLabel(Date.UTC(2025, 9, 15, 9, 0), NOW)).toBe('Oct 15, 2025');
  });
});

describe('savedAtLabel', () => {
  it('adds the time in the clock style asked for', () => {
    expect(savedAtLabel(Date.UTC(2026, 9, 20, 14, 2), NOW, 'h23')).toBe('Tue 14:02');
    expect(savedAtLabel(Date.UTC(2026, 9, 20, 14, 2), NOW, 'h12')).toBe('Tue 2:02 PM');
    expect(savedAtLabel(NOW - HOUR, NOW, 'h23')).toBe('today 14:30');
  });
});

describe('savedCourseRows', () => {
  const saved = [
    { courseId: '1', courseName: 'Old', savedAt: NOW - 50 * HOUR, files: {} },
    { courseId: '2', courseName: 'Newest', savedAt: NOW - HOUR, files: {} },
    { courseId: '3', courseName: 'Middle', savedAt: NOW - 20 * HOUR, files: {} },
  ];

  it('lists the most recently saved first, with what the last check found', () => {
    const check = {
      checkedAt: NOW,
      courses: [
        { courseId: '2', courseName: 'Newest', newFiles: 4 },
        { courseId: '3', courseName: 'Middle', newFiles: 0 },
      ],
    };
    expect(savedCourseRows(saved, check, 2)).toEqual([
      { courseId: '2', courseName: 'Newest', savedAt: NOW - HOUR, newFiles: 4 },
      { courseId: '3', courseName: 'Middle', savedAt: NOW - 20 * HOUR, newFiles: 0 },
    ]);
  });

  it('says nothing about new files for a course the check has not seen', () => {
    expect(savedCourseRows(saved, null).map((r) => r.newFiles)).toEqual([null, null, null]);
  });
});
