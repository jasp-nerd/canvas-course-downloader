import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { startMockCanvas, type MockCanvas } from '../../e2e/mock-canvas/server';
import { mockFetch } from '../../tests/support/mock-fetch';
import { createCanvasClient } from '../canvas/client';
import { exportOptionsFrom } from './options';
import { planCourseExport } from './plan';

const ORIGIN = 'https://school.instructure.com';
let mock: MockCanvas;
beforeAll(async () => {
  mock = await startMockCanvas();
});
afterEach(() => {
  mock.state.faults = [];
});
afterAll(() => mock.close());

const plan = () =>
  planCourseExport({
    canvas: createCanvasClient({
      origin: ORIGIN,
      fetch: mockFetch(mock),
      sleep: () => Promise.resolve(),
    }),
    origin: ORIGIN,
    courseId: '101',
    options: exportOptionsFrom({}, 'test'),
  });

describe('a part of the course Canvas refuses', () => {
  it('is not reported when Canvas says it does not exist: the course has that tab turned off', async () => {
    mock.addFault({ path: '^/api/v1/courses/101/pages', status: 404 });
    mock.addFault({ path: '^/api/v1/courses/101/quizzes', status: 404 });
    const result = await plan();
    expect(result.notCaptured).toEqual([]);
    expect(result.files.map((f) => f.path)).not.toContain('_inaccessible_links.csv');
  });

  it('is reported when Canvas refuses access, so people know it is missing', async () => {
    mock.addFault({ path: '^/api/v1/courses/101/files', status: 403 });
    const result = await plan();
    expect(result.notCaptured).toEqual([
      expect.objectContaining({ source: 'Files', status: '403' }),
    ]);
  });
});
