// A teacher's copy of their own course leaves students' work out unless they
// ask for it: no roster, submissions, gradebook, quiz attempts or replies.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
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
afterAll(() => mock.close());
beforeEach(() => mock.reset());

/** The mock's course 101, seen by someone enrolled as `role`. */
function fetchAs(role: string): typeof fetch {
  const inner = mockFetch(mock);
  return async (input, init) => {
    const res = await inner(input, init);
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname !== '/api/v1/courses/101') return res;
    const course = (await res.json()) as Record<string, unknown>;
    return new Response(JSON.stringify({ ...course, enrollments: [{ type: role }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
}

const plan = (role: string, includeStudentWork?: boolean) =>
  planCourseExport({
    canvas: createCanvasClient({ origin: ORIGIN, fetch: fetchAs(role), sleep: async () => {} }),
    origin: ORIGIN,
    courseId: '101',
    options: exportOptionsFrom({ includeStudentWork }, 'test'),
  });

const asked = (pattern: RegExp) => mock.log.filter((r) => pattern.test(r.path)).map((r) => r.path);
const STUDENT_DATA = /\/users\b|\/submissions\b|\/discussion_topics\/\d+\/view|\/students\b/;

describe("a teacher's copy of their course", () => {
  it('leaves students out by default, and says so', async () => {
    const p = await plan('teacher');
    expect(p.studentWork).toEqual({ teacher: true, included: false });
    expect(asked(STUDENT_DATA)).toEqual([]);
    expect(p.files.filter((f) => f.path.startsWith('Submissions/'))).toEqual([]);
  });

  it('includes them when the teacher asks for it', async () => {
    const p = await plan('teacher', true);
    expect(p.studentWork).toEqual({ teacher: true, included: true });
    expect(asked(/\/courses\/101\/users\b/).length).toBeGreaterThan(0);
  });

  it("keeps a student's own work, whatever the setting", async () => {
    const p = await plan('student');
    expect(p.studentWork).toEqual({ teacher: false, included: true });
    expect(asked(/\/submissions\b/).length).toBeGreaterThan(0);
  });
});
