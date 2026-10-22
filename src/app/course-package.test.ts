import { describe, expect, it } from 'vitest';
import { csrfTokenFrom, requestCoursePackage } from './course-package';

const ORIGIN = 'https://school.instructure.com';

/** A fake Canvas: answers by "METHOD path", records every request. */
function fakeCanvas(routes: Record<string, (init: RequestInit) => [number, unknown]>) {
  const requests: { key: string; init: RequestInit }[] = [];
  const fetch = ((input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(input instanceof Request ? input.url : input);
    const key = `${init.method ?? 'GET'} ${url.pathname}`;
    requests.push({ key, init });
    const route = routes[key];
    if (!route) return Promise.resolve(new Response('{}', { status: 404 }));
    const [status, body] = route(init);
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    );
  }) as typeof globalThis.fetch;
  return { fetch, requests };
}

const base = { origin: ORIGIN, courseId: '57', csrfToken: 'tok', sleep: async () => {} };

describe("Canvas's course package (.imscc)", () => {
  it('asks Canvas for one, waits until it is built and returns its download link', async () => {
    let polls = 0;
    const canvas = fakeCanvas({
      'GET /api/v1/users/self': () => [200, { id: 7 }],
      'GET /api/v1/courses/57/content_exports': () => [200, []],
      'POST /api/v1/courses/57/content_exports': () => [
        200,
        { id: 3, workflow_state: 'created', progress_url: `${ORIGIN}/api/v1/progress/9` },
      ],
      'GET /api/v1/progress/9': () => [
        200,
        { workflow_state: ++polls < 3 ? 'running' : 'completed', completion: polls * 30 },
      ],
      'GET /api/v1/courses/57/content_exports/3': () => [
        200,
        {
          id: 3,
          workflow_state: 'exported',
          attachment: { url: `${ORIGIN}/files/1/download?verifier=x`, size: 2048 },
        },
      ],
    });
    const result = await requestCoursePackage({ ...base, fetch: canvas.fetch });
    expect(result).toEqual({
      kind: 'ready',
      url: `${ORIGIN}/files/1/download?verifier=x`,
      size: 2048,
    });
    const post = canvas.requests.find((r) => r.key.startsWith('POST'))!;
    expect(new Headers(post.init.headers).get('X-CSRF-Token')).toBe('tok');
    expect(post.init.body).toBe('export_type=common_cartridge&skip_notifications=true');
    expect(post.init.credentials).toBe('include');
    expect(polls).toBe(3);
  });

  it('uses an export this user already started instead of starting another', async () => {
    const canvas = fakeCanvas({
      'GET /api/v1/users/self': () => [200, { id: 7 }],
      'GET /api/v1/courses/57/content_exports': () => [
        200,
        [
          {
            id: 2,
            user_id: 8,
            export_type: 'common_cartridge',
            workflow_state: 'exporting',
            progress_url: `${ORIGIN}/api/v1/progress/1`,
          },
          {
            id: 4,
            user_id: 7,
            export_type: 'common_cartridge',
            workflow_state: 'exporting',
            progress_url: `${ORIGIN}/api/v1/progress/5`,
          },
        ],
      ],
      'GET /api/v1/progress/5': () => [200, { workflow_state: 'completed' }],
      'GET /api/v1/courses/57/content_exports/4': () => [
        200,
        { id: 4, workflow_state: 'exported', attachment: { url: `${ORIGIN}/files/2/download` } },
      ],
    });
    const result = await requestCoursePackage({ ...base, fetch: canvas.fetch });
    expect(result).toMatchObject({ kind: 'ready', url: `${ORIGIN}/files/2/download` });
    expect(canvas.requests.some((r) => r.key.startsWith('POST'))).toBe(false);
  });

  it('says so when Canvas does not allow it, and never retries the request', async () => {
    const canvas = fakeCanvas({
      'GET /api/v1/users/self': () => [200, { id: 7 }],
      'GET /api/v1/courses/57/content_exports': () => [200, []],
      'POST /api/v1/courses/57/content_exports': () => [403, { status: 'unauthorized' }],
    });
    expect(await requestCoursePackage({ ...base, fetch: canvas.fetch })).toEqual({
      kind: 'not-allowed',
    });
    expect(canvas.requests.filter((r) => r.key.startsWith('POST'))).toHaveLength(1);
  });

  it('reports an expired security token so the caller can read a fresh one', async () => {
    const canvas = fakeCanvas({
      'GET /api/v1/users/self': () => [200, { id: 7 }],
      'GET /api/v1/courses/57/content_exports': () => [200, []],
      'POST /api/v1/courses/57/content_exports': () => [422, {}],
    });
    expect(await requestCoursePackage({ ...base, fetch: canvas.fetch })).toEqual({ kind: 'token' });
  });

  it('gives up waiting after an hour and says where to find it later', async () => {
    let clock = 0;
    const canvas = fakeCanvas({
      'GET /api/v1/users/self': () => [200, { id: 7 }],
      'GET /api/v1/courses/57/content_exports': () => [200, []],
      'POST /api/v1/courses/57/content_exports': () => [
        200,
        { id: 3, progress_url: `${ORIGIN}/api/v1/progress/9` },
      ],
      'GET /api/v1/progress/9': () => [200, { workflow_state: 'running' }],
    });
    const result = await requestCoursePackage({
      ...base,
      fetch: canvas.fetch,
      now: () => clock,
      sleep: (ms) => {
        clock += ms;
        return Promise.resolve();
      },
    });
    expect(result).toEqual({ kind: 'slow' });
  });

  it('reports a failed build', async () => {
    const canvas = fakeCanvas({
      'GET /api/v1/users/self': () => [200, { id: 7 }],
      'GET /api/v1/courses/57/content_exports': () => [200, []],
      'POST /api/v1/courses/57/content_exports': () => [
        200,
        { id: 3, progress_url: `${ORIGIN}/api/v1/progress/9` },
      ],
      'GET /api/v1/progress/9': () => [200, { workflow_state: 'failed' }],
    });
    expect(await requestCoursePackage({ ...base, fetch: canvas.fetch })).toEqual({
      kind: 'failed',
    });
  });
});

describe('the security token', () => {
  it('is read from the _csrf_token cookie, URL-decoded', () => {
    expect(csrfTokenFrom('a=1; _csrf_token=abc%2Bdef%3D%3D; b=2')).toBe('abc+def==');
    expect(csrfTokenFrom('a=1')).toBeUndefined();
  });
});
