// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { startMockCanvas, type MockCanvas } from '../../e2e/mock-canvas/server';
import { mockFetch } from '../../tests/support/mock-fetch';
import { CanvasError, createCanvasClient, nextPageUrl } from './client';

let mock: MockCanvas;
beforeAll(async () => {
  mock = await startMockCanvas();
});
afterAll(() => mock.close());
beforeEach(() => mock.reset());

/** A client whose waits are recorded instead of slept, so tests run instantly. */
function client(extra: { onThrottle?: (ms: number) => void } = {}) {
  const sleeps: number[] = [];
  const canvas = createCanvasClient({
    origin: 'https://school.instructure.com',
    fetch: mockFetch(mock),
    sleep: (ms) => {
      sleeps.push(ms);
      return Promise.resolve();
    },
    random: () => 1,
    ...extra,
  });
  return { canvas, sleeps };
}

const apiCalls = (path: string) => mock.log.filter((e) => e.path.startsWith(path)).length;

describe('Canvas client', () => {
  it('follows Link headers through every page', async () => {
    const { canvas } = client();
    const files = await canvas.list<{ id: number }>('/courses/101/files', { per_page: '10' });
    expect(files).toHaveLength(24);
    expect(new Set(files.map((f) => f.id)).size).toBe(24);
    expect(apiCalls('/api/v1/courses/101/files')).toBe(3);
  });

  it('asks for 100 items per page by default', async () => {
    const { canvas } = client();
    await canvas.list('/courses/101/files');
    expect(mock.log[0]?.path).toContain('per_page=100');
  });

  it('fails the whole list when a later page fails, instead of returning part of it', async () => {
    mock.addFault({ path: 'files\\?.*page=2', status: 404 });
    const { canvas } = client();
    await expect(canvas.list('/courses/101/files', { per_page: '10' })).rejects.toMatchObject({
      kind: 'permanent',
      status: 404,
    });
  });

  it('waits and retries when Canvas throttles with 403 Rate Limit Exceeded', async () => {
    mock.addFault({ path: '^/api/v1/courses/101$', throttle: true, times: 2 });
    const pauses: number[] = [];
    const { canvas } = client({ onThrottle: (ms) => pauses.push(ms) });
    await expect(canvas.get('/courses/101')).resolves.toMatchObject({ id: 101 });
    expect(pauses).toEqual([2000, 4000]);
    expect(apiCalls('/api/v1/courses/101')).toBe(3);
  });

  it('honours Retry-After when Canvas sends one', async () => {
    mock.addFault({ path: '^/api/v1/courses/101$', status: 429, times: 1 });
    const { canvas, sleeps } = client();
    await canvas.get('/courses/101');
    expect(sleeps[0]).toBe(2000);
  });

  it('retries server errors and dropped connections, then succeeds', async () => {
    mock.addFault({ path: '^/api/v1/courses/101$', status: 503, times: 2 });
    mock.addFault({ path: '^/api/v1/courses/101$', drop: true, times: 1 });
    const { canvas } = client();
    await expect(canvas.get('/courses/101')).resolves.toMatchObject({ id: 101 });
    expect(apiCalls('/api/v1/courses/101')).toBe(3);
  });

  it('gives up on a server error after 4 retries', async () => {
    mock.addFault({ path: '^/api/v1/courses/101$', status: 500 });
    const { canvas } = client();
    await expect(canvas.get('/courses/101')).rejects.toMatchObject({
      kind: 'transient',
      status: 500,
    });
    expect(apiCalls('/api/v1/courses/101')).toBe(5);
  });

  it('reports a lost session at once on 401, without retrying', async () => {
    mock.state.signedIn = false;
    const { canvas } = client();
    await expect(canvas.get('/courses/101')).rejects.toMatchObject({
      kind: 'session',
      status: 401,
    });
    expect(apiCalls('/api/v1/courses/101')).toBe(1);
  });

  it('treats a 401 for a hidden area as that item being unavailable, not a lost session', async () => {
    mock.addFault({ path: '^/api/v1/courses/101/files', status: 401 });
    const { canvas } = client();
    await expect(canvas.list('/courses/101/files')).rejects.toMatchObject({
      kind: 'permanent',
      status: 401,
    });
  });

  it('treats a login page in place of JSON as a lost session', async () => {
    mock.addFault({ path: '^/api/v1/courses/101$', loginPage: true });
    const { canvas } = client();
    await expect(canvas.get('/courses/101')).rejects.toMatchObject({ kind: 'session' });
  });

  it('fails a single missing item as permanent', async () => {
    const { canvas } = client();
    const error: unknown = await canvas.get('/courses/999').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(CanvasError);
    expect(error).toMatchObject({ kind: 'permanent', status: 404 });
  });

  it('runs up to 6 requests at once when Canvas reports plenty of headroom', async () => {
    mock.state.apiDelayMs = 30;
    const { canvas } = client();
    await Promise.all(Array.from({ length: 30 }, () => canvas.get('/courses/101')));
    expect(mock.stats.maxConcurrentApi).toBe(6);
  });

  it('keeps fewer requests in flight when the rate-limit budget is low', async () => {
    mock.state.apiDelayMs = 30;
    mock.state.rateLimitBudget = 400;
    const { canvas } = client();
    await Promise.all(Array.from({ length: 30 }, () => canvas.get('/courses/101')));
    expect(mock.stats.maxConcurrentApi).toBeLessThanOrEqual(3);
  });

  it('stops when the export is cancelled', async () => {
    const controller = new AbortController();
    controller.abort();
    const canvas = createCanvasClient({
      origin: 'https://school.instructure.com',
      fetch: mockFetch(mock),
      signal: controller.signal,
    });
    await expect(canvas.get('/courses/101')).rejects.toMatchObject({ kind: 'aborted' });
    expect(mock.log).toHaveLength(0);
  });
});

describe('download', () => {
  it('returns a file body as a stream, with the same retries as API calls', async () => {
    mock.addFault({ path: '^/files/101001/download', status: 502, times: 1 });
    const { canvas } = client();
    const res = await canvas.download(
      'https://school.instructure.com/files/101001/download?download_frd=1',
    );
    expect(new TextDecoder().decode((await res.arrayBuffer()).slice(0, 8))).toBe('%PDF-1.4');
    expect(apiCalls('/files/101001/download')).toBe(2);
  });

  it('fails a missing file as permanent', async () => {
    const { canvas } = client();
    await expect(
      canvas.download('https://school.instructure.com/files/999999/download'),
    ).rejects.toMatchObject({
      kind: 'permanent',
      status: 404,
    });
  });
});

describe('getHtml', () => {
  it('returns a Canvas web page as text', async () => {
    const { canvas } = client();
    await expect(canvas.getHtml('/courses/101')).resolves.toContain('Introduction to Psychology');
  });
});

describe('nextPageUrl', () => {
  it('finds rel="next" among other relations', () => {
    expect(
      nextPageUrl(
        '<https://x/a?page=1>; rel="current",<https://x/a?page=2>; rel="next",<https://x/a?page=3>; rel="last"',
      ),
    ).toBe('https://x/a?page=2');
    expect(nextPageUrl('<https://x/a?page=3>; rel="last"')).toBeNull();
    expect(nextPageUrl(null)).toBeNull();
  });
});
