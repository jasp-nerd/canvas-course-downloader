import { describe, expect, it } from 'vitest';
import type { DocumentEntry, PlannedFile, RemoteEntry, TextEntry } from '../engine/types';
import {
  AI_TARGETS,
  packContents,
  planStudyPack,
  type AiTarget,
  type StudyPackInput,
} from './study-pack';

const ORIGIN = 'https://school.instructure.com/courses/103';

const doc = (folder: string, title: string, url: string, extra: Partial<DocumentEntry> = {}) =>
  ({
    kind: 'document',
    folder,
    name: `${title}.html`,
    title,
    bodyHtml: `<p>Text of ${title}.</p>`,
    canvasUrls: [`${ORIGIN}/${url}`],
    ...extra,
  }) satisfies DocumentEntry;

const file = (id: string, name: string, extra: Partial<RemoteEntry> = {}) =>
  ({
    kind: 'remote',
    folder: 'Files/',
    name,
    url: `https://cdn.example/${id}`,
    size: 1000,
    contentType: 'application/pdf',
    modifiedAt: '2026-09-01T10:00:00Z',
    canvasId: id,
    ...extra,
  }) satisfies RemoteEntry;

const fileItem = (id: string, title: string) => ({
  title,
  type: 'File',
  url: `${ORIGIN}/files/${id}`,
});

function input(overrides: Partial<StudyPackInput> = {}): StudyPackInput {
  return {
    courseName: 'Linear Algebra',
    sourceUrl: ORIGIN,
    savedAt: new Date('2026-10-20T10:00:00Z'),
    version: '3.0.0',
    isTeacher: false,
    outline: [
      {
        name: 'Week 1: Vectors',
        items: [
          { title: 'Week 1', type: 'SubHeader' },
          fileItem('1', 'Lecture 1'),
          { title: 'Reading guide', type: 'Page', url: `${ORIGIN}/pages/reading-guide` },
          { title: 'Homework 1', type: 'Assignment', url: `${ORIGIN}/assignments/11` },
          { title: '3Blue1Brown', type: 'ExternalUrl', url: 'https://www.3blue1brown.com/' },
        ],
      },
      {
        name: 'Week 2: Matrices',
        items: [
          fileItem('2', 'Lecture 2'),
          // Listed again: stays in week 1.
          { title: 'Reading guide', type: 'Page', url: `${ORIGIN}/pages/reading-guide` },
          { title: 'Quiz 1', type: 'Quiz', url: `${ORIGIN}/quizzes/5` },
        ],
      },
    ],
    entries: [
      file('1', 'Lecture 1.pdf'),
      file('2', 'Lecture 2.pptx'),
      file('3', 'Formula sheet.pdf'),
      file('4', 'Recording.mp4', { contentType: 'video/mp4' }),
      doc('Pages/', 'Reading guide', 'pages/reading-guide', {
        bodyHtml: '<h2>Before class</h2><p>Watch <a href="https://youtu.be/abc123">this</a>.</p>',
      }),
      doc('Assignments/', 'Homework 1', 'assignments/11', {
        dueAt: '2026-09-14T21:59:00Z',
        points: 10,
      }),
      doc('Quizzes/Quiz 1/', 'Quiz 1', 'quizzes/5', { dueAt: '2026-09-10T21:59:00Z', points: 1 }),
      doc('Announcements/', 'Welcome', 'discussion_topics/7'),
      { ...doc('', 'Syllabus', 'assignments/syllabus'), name: 'Syllabus.html' },
      { ...doc('', 'Grading Weights', 'x'), canvasUrls: [] },
      { kind: 'text', folder: '', name: 'Grades.csv', content: 'Assignment,Score' },
      { kind: 'text', folder: 'Media/', name: 'Lecture recording.srt', content: '1\nHello' },
    ] satisfies (DocumentEntry | RemoteEntry | TextEntry)[],
    fileUrl: (id) => `${ORIGIN}/files/${id}`,
    notCaptured: [],
    gradingWeights: [
      { name: 'Homework', weight: 40 },
      { name: 'Exam', weight: 60 },
    ],
    target: AI_TARGETS.notebooklm,
    ...overrides,
  };
}

const paths = (files: PlannedFile[]) => files.map((f) => f.path).sort();
const text = (files: PlannedFile[], path: string) => {
  const found = files.find((f) => f.path === path);
  if (found?.source.kind !== 'text') throw new Error(`no text file ${path}`);
  return found.source.content;
};

describe('planStudyPack', () => {
  it('makes one flat folder: a guide, a Markdown file per module, and files by module', () => {
    const pack = planStudyPack(input());
    expect(paths(pack)).toEqual([
      '00 Course guide.md',
      '01 Week 1- Vectors.md',
      '02 Week 2- Matrices.md',
      '03 Other course content.md',
      'M01 Lecture 1.pdf',
      'M02 Lecture 2.pptx',
      'M03 Formula sheet.pdf',
      '_extras/links.txt',
      '_extras/skipped files.txt',
    ]);
  });

  it('puts each item in the first module that lists it, and the rest in order of kind', () => {
    const pack = planStudyPack(input());
    const week1 = text(pack, '01 Week 1- Vectors.md');
    expect(week1).toContain('# 01 Week 1: Vectors — Linear Algebra');
    expect(week1).toContain('> Canvas module 1 of 2.');
    expect(week1).toContain(`"M01 Lecture 1.pdf"`);
    expect(week1).toContain('## Reading guide');
    expect(week1).toContain('#### Before class');
    expect(week1).toContain('Assignment · due ');
    expect(week1).toContain('10 points');
    expect(text(pack, '02 Week 2- Matrices.md')).not.toContain('Reading guide');

    const other = text(pack, '03 Other course content.md');
    expect(other.indexOf('## Syllabus')).toBeLessThan(other.indexOf('## Welcome'));
    expect(other).toContain('## Video transcript: Lecture recording\n\n1\nHello');
    expect(other).not.toContain('Grading Weights');
  });

  it('writes a course guide with contents, deadlines by date and grading weights', () => {
    const guide = text(planStudyPack(input()), '00 Course guide.md');
    expect(guide).toContain(`Snapshot of the Canvas course at ${ORIGIN}, made on 2026-10-20`);
    expect(guide).toContain('This pack has 7 files.');
    expect(guide).toContain(
      '| 1 | Week 1: Vectors | 1 page, 1 assignment | 01 Week 1- Vectors.md; M01 Lecture 1.pdf |',
    );
    expect(guide.indexOf('| Quiz 1 (quiz)')).toBeLessThan(guide.indexOf('| Homework 1'));
    expect(guide).toContain('Homework 40% · Exam 60%');
    expect(guide).toContain('- 1 file, listed in _extras/skipped files.txt');
  });

  it("collects video and web links, and lists the files the tool doesn't take", () => {
    const pack = planStudyPack(input());
    expect(text(pack, '_extras/links.txt')).toBe(
      'https://youtu.be/abc123\nhttps://www.3blue1brown.com/\n',
    );
    expect(text(pack, '_extras/skipped files.txt')).toContain('Files/Recording.mp4');
  });

  it('only includes file types the chosen tool accepts', () => {
    const claude = paths(planStudyPack(input({ target: AI_TARGETS.claude })));
    expect(claude).toContain('M01 Lecture 1.pdf');
    expect(claude).not.toContain('M02 Lecture 2.pptx');

    const textOnly = planStudyPack(input({ target: AI_TARGETS.text }));
    expect(textOnly.filter((f) => f.source.kind === 'remote')).toEqual([]);
    expect(text(textOnly, '_extras/skipped files.txt')).toContain('This pack is text only.');
  });

  it('never includes other students’ work for teachers', () => {
    const entries = [
      ...input().entries,
      doc('Submissions/Homework 1/', 'Homework 1 — Jane Doe', 'x', { canvasUrls: [] }),
      file('9', 'jane.pdf', { folder: 'Submissions/Homework 1/' }),
    ];
    const asTeacher = planStudyPack(input({ entries, isTeacher: true }));
    expect(paths(asTeacher)).not.toContain('M03 jane.pdf');
    expect(text(asTeacher, '03 Other course content.md')).not.toContain('Jane Doe');

    const asStudent = planStudyPack(input({ entries }));
    expect(text(asStudent, '03 Other course content.md')).toContain('Homework 1 — Jane Doe');
  });

  it('splits a course into notebooks that each fit, each with its own guide', () => {
    const small: AiTarget = { ...AI_TARGETS.notebooklm, maxFiles: 4 };
    const pack = planStudyPack(input({ target: small }));
    const folders = Map.groupBy(pack, (f) => f.path.split('/')[0]!);
    expect([...folders.keys()].sort()).toEqual([
      'Notebook 1 of 3',
      'Notebook 2 of 3',
      'Notebook 3 of 3',
      '_extras',
    ]);
    for (const [folder, files] of folders) {
      if (folder !== '_extras') expect(files.length).toBeLessThanOrEqual(4);
    }
    const guide = text(pack, 'Notebook 1 of 3/00 Course guide.md');
    expect(guide).toContain('This notebook 1 of 3 has 3 files.');
    expect(guide).toContain('M02 Lecture 2.pptx (notebook 2)');
  });

  it('spreads a module with more files than a notebook takes over several', () => {
    const many = Array.from({ length: 5 }, (_, i) => file(`${100 + i}`, `Slides ${i}.pdf`));
    const pack = planStudyPack(
      input({
        outline: [{ name: 'Everything', items: many.map((f) => fileItem(f.canvasId, f.name)) }],
        entries: many,
        target: { ...AI_TARGETS.notebooklm, maxFiles: 3 },
      }),
    );
    expect(paths(pack)).toEqual([
      'Notebook 1 of 3/00 Course guide.md',
      'Notebook 1 of 3/M01 Slides 0.pdf',
      'Notebook 1 of 3/M01 Slides 1.pdf',
      'Notebook 2 of 3/00 Course guide.md',
      'Notebook 2 of 3/M01 Slides 2.pdf',
      'Notebook 2 of 3/M01 Slides 3.pdf',
      'Notebook 3 of 3/00 Course guide.md',
      'Notebook 3 of 3/M01 Slides 4.pdf',
    ]);
  });

  it('keeps names unique, also when they only differ in case', () => {
    const pack = planStudyPack(
      input({
        outline: [],
        entries: [file('1', 'Notes.pdf'), file('2', 'notes.pdf', { folder: 'Files/Old/' })],
      }),
    );
    expect(paths(pack)).toEqual(['00 Course guide.md', 'M01 Notes.pdf', 'M01 notes (2).pdf']);
  });

  it('numbers parts in pack order, so empty modules leave no gaps', () => {
    const pack = planStudyPack(
      input({
        outline: [
          { name: 'Manual', items: [] },
          { name: 'Week 1', items: [fileItem('1', 'Lecture 1')] },
        ],
      }),
    );
    expect(paths(pack)).toContain('M01 Lecture 1.pdf');
    expect(paths(pack)).toContain('02 Other course content.md');
    expect(paths(pack)).toContain('M02 Formula sheet.pdf');
    expect(text(pack, '02 Other course content.md')).toContain('# 02 Other course content');
  });

  it('calls it all "Course content" when no module has anything in the pack', () => {
    const pack = planStudyPack(
      input({
        outline: [
          { name: 'Manual', items: [] },
          { name: 'Week 1', items: [] },
        ],
      }),
    );
    expect(paths(pack)).toContain('01 Course content.md');
    expect(paths(pack)).toContain('M01 Lecture 1.pdf');
  });

  it('names the content "Course content" when the course has no modules', () => {
    const pack = planStudyPack(input({ outline: [] }));
    expect(text(pack, '01 Course content.md')).toContain(
      "> Course content that isn't in a module.",
    );
  });

  it('says in plain words what Canvas would not give', () => {
    const pack = planStudyPack(
      input({
        notCaptured: [
          {
            source: 'Page: Week 2',
            text: 'Old slides.pdf',
            url: `${ORIGIN}/files/5`,
            status: '403',
          },
        ],
      }),
    );
    expect(text(pack, '00 Course guide.md')).toContain(
      '- Old slides.pdf (Page: Week 2): No access (403)',
    );
  });
});

describe('packContents', () => {
  it('reads back the files a pack leaves out and the modules it holds', () => {
    expect(packContents(planStudyPack(input()), 'Linear Algebra')).toEqual({
      leftOut: ['Files/Recording.mp4'],
      modules: ['Week 1: Vectors', 'Week 2: Matrices'],
    });
  });

  it('names each module once when the pack is split into notebooks', () => {
    const small: AiTarget = { ...AI_TARGETS.notebooklm, maxFiles: 4 };
    expect(packContents(planStudyPack(input({ target: small })), 'Linear Algebra').modules).toEqual(
      ['Week 1: Vectors', 'Week 2: Matrices'],
    );
  });

  it('is empty for a pack without modules or left-out files', () => {
    const pack = planStudyPack(input({ outline: [], entries: [file('1', 'Notes.pdf')] }));
    expect(packContents(pack, 'Linear Algebra')).toEqual({ leftOut: [], modules: [] });
  });
});
