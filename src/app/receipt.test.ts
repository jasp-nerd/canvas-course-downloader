import { describe, expect, it } from 'vitest';
import { countKinds, folderOf, kindOf, settleKinds } from './receipt';

describe('kindOf', () => {
  it('groups a copy by its top-level folder', () => {
    expect(kindOf('Files/Week 4/Lecture 7.pdf', false)).toBe('files');
    expect(kindOf('Modules/Week 1/Slides.pdf', false)).toBe('files');
    expect(kindOf('Extracted_Files/Reading.pdf', false)).toBe('files');
    expect(kindOf('Pages/course-schedule.html', false)).toBe('pages');
    expect(kindOf('Assignments/Essay 1.html', false)).toBe('assignments');
    expect(kindOf('Quizzes/Quiz 1/Quiz 1.html', false)).toBe('quizzes');
    expect(kindOf('Discussions/Intro/_grades.csv', false)).toBe('discussions');
    expect(kindOf('Announcements/Welcome.html', false)).toBe('announcements');
    expect(kindOf('Submissions/Essay 1/essay.pdf', false)).toBe('submissions');
    expect(kindOf('Media/Lecture recording.mp4', false)).toBe('media');
  });

  it('puts the overview, syllabus, grades and other files at the top into one group', () => {
    for (const path of [
      'index.html',
      'Open me - Linear Algebra.html',
      'Syllabus.html',
      'Grades.csv',
    ])
      expect(kindOf(path, false)).toBe('course');
  });

  it('groups a study pack by what each file is, also when it is split into notebooks', () => {
    expect(kindOf('00 Course guide.md', true)).toBe('guide');
    expect(kindOf('Notebook 2 of 3/00 Course guide.md', true)).toBe('guide');
    expect(kindOf('01 Week 1: Vectors.md', true)).toBe('notes');
    expect(kindOf('Project 1 of 2/07 Other course content.md', true)).toBe('notes');
    expect(kindOf('M01 Lecture 1.pdf', true)).toBe('packFiles');
    expect(kindOf('_extras/skipped files.txt', true)).toBe('extras');
  });
});

describe('countKinds and settleKinds', () => {
  const paths = [
    'Files/a.pdf',
    'Files/b.pdf',
    'Pages/p.html',
    'index.html',
    'Assignments/One.html',
    'Files/c.pdf',
  ];

  it('after the run, counts everything planned as saved except what failed', () => {
    const settled = settleKinds(countKinds(paths, false), ['Files/b.pdf'], false);
    expect(settled.find((k) => k.id === 'files')).toMatchObject({ total: 3, done: 2, failed: 1 });
    expect(settled.find((k) => k.id === 'pages')).toMatchObject({ total: 1, done: 1, failed: 0 });
  });
});

describe('formatting', () => {
  it('finds the course folder from the full path of a file in it', () => {
    expect(
      folderOf(
        '/Users/sam/Downloads/Linear Algebra/Open me - Linear Algebra.html',
        'Open me - Linear Algebra.html',
      ),
    ).toBe('/Users/sam/Downloads/Linear Algebra');
    expect(folderOf('C:\\Users\\sam\\Downloads\\Linear Algebra\\Files\\a.pdf', 'Files/a.pdf')).toBe(
      'C:\\Users\\sam\\Downloads\\Linear Algebra',
    );
  });
});
