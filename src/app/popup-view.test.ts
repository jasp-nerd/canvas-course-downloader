import { describe, expect, it } from 'vitest';
import { savedCourseRows } from './popup-view';

// Thursday 22 October 2026, 15:30 UTC (tests run in UTC).
const NOW = Date.UTC(2026, 9, 22, 15, 30);
const HOUR = 60 * 60 * 1000;

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
      {
        courseId: '2',
        courseName: 'Newest',
        savedAt: NOW - HOUR,
        newFiles: 4,
        moreThanFiles: false,
      },
      {
        courseId: '3',
        courseName: 'Middle',
        savedAt: NOW - 20 * HOUR,
        newFiles: 0,
        moreThanFiles: false,
      },
    ]);
  });

  it('counts new announcements and updated pages too, and says so', () => {
    const check = {
      checkedAt: NOW,
      courses: [{ courseId: '2', courseName: 'Newest', newFiles: 1, newAnnouncements: 2 }],
    };
    expect(savedCourseRows(saved, check, 1)[0]).toMatchObject({ newFiles: 3, moreThanFiles: true });
  });

  it('says nothing about new files for a course the check has not seen', () => {
    expect(savedCourseRows(saved, null).map((r) => r.newFiles)).toEqual([null, null, null]);
  });
});
