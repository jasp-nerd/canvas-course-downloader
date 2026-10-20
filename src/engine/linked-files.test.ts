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
