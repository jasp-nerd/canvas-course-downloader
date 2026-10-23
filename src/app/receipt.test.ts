import { describe, expect, it } from 'vitest';
import {
  countKinds,
  describeFile,
  formatBytes,
  formatDuration,
  folderOf,
  kindOf,
  settleKinds,
  shortPath,
} from './receipt';

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

  it('counts planned files per kind in a fixed order, leaving out kinds with none', () => {
    expect(countKinds(paths, false)).toEqual([
      { id: 'files', label: 'Files', total: 3, done: 0, failed: 0 },
      { id: 'pages', label: 'Pages', total: 1, done: 0, failed: 0 },
      { id: 'assignments', label: 'Assignments', total: 1, done: 0, failed: 0 },
      { id: 'course', label: 'Overview and course info', total: 1, done: 0, failed: 0 },
    ]);
  });

  it('after the run, counts everything planned as saved except what failed', () => {
    const settled = settleKinds(countKinds(paths, false), ['Files/b.pdf'], false);
    expect(settled.find((k) => k.id === 'files')).toMatchObject({ total: 3, done: 2, failed: 1 });
    expect(settled.find((k) => k.id === 'pages')).toMatchObject({ total: 1, done: 1, failed: 0 });
  });
});

describe('describeFile', () => {
  it('shows a file by its folders below the kind', () => {
    expect(describeFile('Files/Week 4/Lecture 7. Eigenvalues.pdf', false)).toEqual({
      name: 'Week 4 / Lecture 7. Eigenvalues.pdf',
    });
  });

  it('shows a page Course Downloader made by its name and what it is', () => {
    expect(describeFile('Assignments/Problem set 3.html', false)).toEqual({
      name: 'Problem set 3',
      kind: 'assignment',
    });
    expect(describeFile('Pages/week-4-overview.md', false)).toEqual({
      name: 'week-4-overview',
      kind: 'page',
    });
  });

  it('keeps names at the top and in study packs as they are', () => {
    expect(describeFile('Open me - Linear Algebra.html', false)).toEqual({
      name: 'Open me - Linear Algebra.html',
    });
    expect(describeFile('Notebook 1 of 2/M01 Slides.pdf', true)).toEqual({
      name: 'Notebook 1 of 2 / M01 Slides.pdf',
    });
  });
});

describe('formatting', () => {
  it('writes sizes like a file manager does', () => {
    expect(formatBytes(512)).toBe('512 bytes');
    expect(formatBytes(24 * 1024)).toBe('24 KB');
    expect(formatBytes(8.4 * 1024 * 1024)).toBe('8.4 MB');
    expect(formatBytes(412 * 1024 * 1024)).toBe('412 MB');
    expect(formatBytes(1.2 * 1024 ** 3)).toBe('1.2 GB');
  });

  it('writes how long something took', () => {
    expect(formatDuration(800)).toBe('1 s');
    expect(formatDuration(45_000)).toBe('45 s');
    expect(formatDuration(130_000)).toBe('2 min 10 s');
    expect(formatDuration(120_000)).toBe('2 min');
    expect(formatDuration(3_900_000)).toBe('1 h 5 min');
  });

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

  it('shortens a full path to the folder it is in and the rest', () => {
    expect(shortPath('/Users/sam/Downloads/Linear Algebra.zip', 0)).toBe(
      'Downloads/Linear Algebra.zip',
    );
    expect(shortPath('/Users/sam/Downloads/Canvas/Linear Algebra.zip', 1)).toBe(
      'Downloads/Canvas/Linear Algebra.zip',
    );
    expect(shortPath('C:\\Users\\sam\\Downloads\\Linear Algebra.zip', 0)).toBe(
      'Downloads\\Linear Algebra.zip',
    );
  });
});
