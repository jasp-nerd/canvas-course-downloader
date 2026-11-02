import { describe, expect, it } from 'vitest';
import { renderCourseIndex, type CourseIndexInput } from './course-index';

const base: CourseIndexInput = {
  courseName: 'Linear Algebra <MATH 221>',
  sourceUrl: 'https://school.instructure.com/courses/103',
  savedAt: new Date('2026-10-20T10:00:00Z'),
  version: '3.0.0',
  outline: [
    {
      name: 'Week 1: Vectors',
      items: [
        {
          title: 'Lecture 01 - Vectors.pdf',
          type: 'File',
          url: 'https://school.instructure.com/courses/103/files/103002',
        },
        {
          title: 'Course schedule',
          type: 'Page',
          url: 'https://school.instructure.com/courses/103/pages/course-schedule',
        },
        { title: 'Khan Academy', type: 'ExternalUrl', url: 'https://www.khanacademy.org/math' },
        {
          title: 'Locked quiz',
          type: 'Quiz',
          url: 'https://school.instructure.com/courses/103/quizzes/9',
        },
      ],
    },
  ],
  localPaths: new Map([
    [
      'https://school.instructure.com/courses/103/files/103002',
      'Files/Lectures/Lecture 01 - Vectors.pdf',
    ],
    [
      'https://school.instructure.com/courses/103/pages/course-schedule',
      'Pages/course-schedule.html',
    ],
  ]),
  paths: [
    'Files/Lectures/Lecture 01 - Vectors.pdf',
    'Files/Syllabus.pdf',
    'Pages/course-schedule.html',
    'Syllabus.html',
    'Grades.csv',
    'styles.css',
  ],
  notCaptured: [],
  failed: [],
};

describe('renderCourseIndex', () => {
  it('links module items to the saved copies, and others to Canvas', () => {
    const html = renderCourseIndex(base);
    expect(html).toContain(
      '<a href="Files/Lectures/Lecture%2001%20-%20Vectors.pdf">Lecture 01 - Vectors.pdf</a>',
    );
    expect(html).toContain('<a href="Pages/course-schedule.html">Course schedule</a>');
    expect(html).toContain(
      '<a href="https://www.khanacademy.org/math">Khan Academy</a> <span class="kind">link</span>',
    );
    expect(html).toContain('Locked quiz</a> <span class="kind">only in Canvas</span>');
  });

  it('escapes Canvas text', () => {
    const html = renderCourseIndex(base);
    expect(html).toContain('<h1>Linear Algebra &lt;MATH 221&gt;</h1>');
    expect(html).not.toContain('<MATH 221>');
  });

  it('works from a double-click: no scripts, and a CSP that forbids them', () => {
    const html = renderCourseIndex(base);
    expect(html).not.toMatch(/<script/i);
    expect(html).toContain(`default-src 'none'`);
  });
});
