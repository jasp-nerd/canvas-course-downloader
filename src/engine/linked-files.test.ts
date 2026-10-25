import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LINKING_COURSE } from '../../e2e/mock-canvas/data';
import { startMockCanvas, type MockCanvas } from '../../e2e/mock-canvas/server';
import { mockFetch } from '../../tests/support/mock-fetch';
import { createCanvasClient } from '../canvas/client';
import { exportOptionsFrom } from './options';
import { planCourseExport } from './plan';
import { CONTENT_TYPES, type ContentType } from './types';

const ORIGIN = 'https://school.instructure.com';
let mock: MockCanvas;
beforeAll(async () => {
  mock = await startMockCanvas();
});
afterAll(() => mock.close());

const plan = async (...types: ContentType[]) =>
  (
    await planCourseExport({
      canvas: createCanvasClient({
        origin: ORIGIN,
        fetch: mockFetch(mock),
        sleep: () => Promise.resolve(),
      }),
      origin: ORIGIN,
      courseId: String(LINKING_COURSE),
      options: exportOptionsFrom(
        { contentTypes: Object.fromEntries(CONTENT_TYPES.map((t) => [t, types.includes(t)])) },
        'test',
      ),
    })
  ).files.map((f) => f.path);

describe('linked files', () => {
  it('are saved when they are the only thing chosen, without the pages they are in', async () => {
    const paths = await plan('linkedFiles');
    expect(paths.filter((p) => p.startsWith('Extracted_Files/'))).toEqual([
      'Extracted_Files/Lecture 01 - Machine Learning week 1.pdf',
    ]);
    expect(
      paths.filter((p) => /^(Pages|Assignments|Announcements|Discussions|Quizzes)\//.test(p)),
    ).toEqual([]);
    expect(paths).not.toContain('Syllabus.html');
    expect(paths).not.toContain('Modules.html');
  });

  it('are found in pages outside the modules when only modules are saved', async () => {
    const paths = await plan('modules', 'linkedFiles');
    expect(paths).toContain('Modules.html');
    // Pages are saved with Pages on; with Pages off they're read for links only, as in v2.
    expect(paths.filter((p) => p.startsWith('Pages/'))).toEqual([]);
    expect(paths).toContain('Extracted_Files/Lecture 01 - Machine Learning week 1.pdf');
  });

  it('are not looked for when not chosen', async () => {
    const paths = await plan('pages');
    expect(paths).toContain('Pages/exam-information.html');
    expect(paths.filter((p) => p.startsWith('Extracted_Files/'))).toEqual([]);
  });
});

describe('links that only look like Canvas files', () => {
  it('are left alone when they point to another site', async () => {
    const { extractLinkedFiles } = await import('./linked');
    const { newCourseExport } = await import('./context');
    const ctx = newCourseExport({
      origin: ORIGIN,
      courseId: String(LINKING_COURSE),
      courseName: 'Machine Learning',
      isTeacher: false,
      studentWork: true,
      options: exportOptionsFrom({}, 'test'),
      canvas: createCanvasClient({
        origin: ORIGIN,
        fetch: mockFetch(mock),
        sleep: () => Promise.resolve(),
      }),
    });
    const id = LINKING_COURSE * 1000 + 2;
    await extractLinkedFiles(
      ctx,
      // An unrelated file of this course has id + 1; nothing has 999999999.
      `<img src="https://images.example.com/files/${id + 1}/590x332.jpg"><img src="https://cdn.example.com/files/999999999/x.png"><a href="/courses/${LINKING_COURSE}/files/${id}">slides</a>`,
      'Page: Exam information',
    );
    expect(ctx.notCaptured).toEqual([]);
    expect(ctx.entries.map((e) => e.name)).toEqual(['Lecture 01 - Machine Learning week 1.pdf']);
  });
});
