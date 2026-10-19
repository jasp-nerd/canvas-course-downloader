// @vitest-environment node
import https from 'node:https';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MOCK_HOSTS, startMockCanvas, type MockCanvas } from './server.ts';

let mock: MockCanvas;

beforeAll(async () => {
  mock = await startMockCanvas();
});
afterAll(() => mock.close());
beforeEach(() => mock.reset());

interface Reply {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: string;
}

function get(path: string, host: string = MOCK_HOSTS.instructure, cookie?: string): Promise<Reply> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: '127.0.0.1',
        port: mock.port,
        path,
        rejectUnauthorized: false,
        headers: { host, ...(cookie ? { cookie } : {}) },
      },
      (res) => {
        let body = '';
        res.on('data', (c: Buffer) => (body += c.toString()));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

/** Parses a Link header into rel -> page number. */
function linkPages(header: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  for (const part of String(header).split(',')) {
    const m = /<([^>]+)>; rel="(\w+)"/.exec(part);
    if (m) out[m[2]!] = Number(new URL(m[1]!).searchParams.get('page'));
  }
  return out;
}

describe('mock Canvas', () => {
  it('paginates lists with a Canvas-style Link header', async () => {
    const first = await get('/api/v1/courses/101/files?per_page=10');
    expect(JSON.parse(first.body)).toHaveLength(10);
    expect(linkPages(first.headers.link)).toMatchObject({ current: 1, next: 2, last: 3 });

    const last = await get('/api/v1/courses/101/files?per_page=10&page=3');
    expect(JSON.parse(last.body)).toHaveLength(4);
    expect(linkPages(last.headers.link)).not.toHaveProperty('next');
  });

  it('builds file URLs on the host that was asked, so custom domains stay on their origin', async () => {
    const reply = await get('/api/v1/courses/101/files?per_page=1', MOCK_HOSTS.customDomain);
    const [file] = JSON.parse(reply.body) as { url: string }[];
    expect(file?.url).toMatch(/^https:\/\/canvas\.example\.edu\/files\/\d+\/download/);
  });

  it('answers unknown API paths with 501 and records them as unexpected', async () => {
    const reply = await get('/api/v1/courses/101/outcome_results');
    expect(reply.status).toBe(501);
    expect(mock.unexpected).toEqual(['GET /api/v1/courses/101/outcome_results']);
  });

  it('answers 404 for a course that does not exist, without counting it as unexpected', async () => {
    expect((await get('/api/v1/courses/999/files')).status).toBe(404);
    expect(mock.unexpected).toEqual([]);
  });

  it('throttles like Canvas for exactly the number of requests the rule says', async () => {
    mock.addFault({ path: '^/api/v1/courses/101/pages', throttle: true, times: 2 });
    const throttled = await get('/api/v1/courses/101/pages');
    expect(throttled.status).toBe(403);
    expect(throttled.body).toContain('Rate Limit Exceeded');
    expect(throttled.headers['x-rate-limit-remaining']).toBe('0');
    expect((await get('/api/v1/courses/101/pages')).status).toBe(403);
    expect((await get('/api/v1/courses/101/pages')).status).toBe(200);
  });

  it('returns 401 for API calls when the user is signed out', async () => {
    mock.state.signedIn = false;
    expect((await get('/api/v1/courses')).status).toBe(401);
  });

  it('requires the session cookie set by Canvas pages when asked to', async () => {
    mock.state.requireSessionCookie = true;
    expect((await get('/api/v1/courses')).status).toBe(401);
    const page = await get('/');
    const setCookie = String(page.headers['set-cookie']).split(';')[0];
    expect((await get('/api/v1/courses', MOCK_HOSTS.instructure, setCookie)).status).toBe(200);
  });

  it('serves a real PDF for file downloads', async () => {
    const reply = await get('/files/101001/download?download_frd=1');
    expect(reply.status).toBe(200);
    expect(reply.body.startsWith('%PDF-1.4')).toBe(true);
  });

  it('serves a page without Canvas markers on the non-Canvas host', async () => {
    const reply = await get('/', MOCK_HOSTS.notCanvas);
    expect(reply.body).not.toContain('ic-app');
  });

  it('logs every request except control endpoints', async () => {
    await get('/api/v1/courses');
    await get('/__health');
    expect(mock.log.map((e) => e.path)).toEqual(['/api/v1/courses']);
  });
});
