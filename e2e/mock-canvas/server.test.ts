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

describe('mock Canvas', () => {
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

  it('throttles like Canvas for exactly the number of requests the rule says', async () => {
    mock.addFault({ path: '^/api/v1/courses/101/pages', throttle: true, times: 2 });
    const throttled = await get('/api/v1/courses/101/pages');
    expect(throttled.status).toBe(403);
    expect(throttled.body).toContain('Rate Limit Exceeded');
    expect(throttled.headers['x-rate-limit-remaining']).toBe('0');
    expect((await get('/api/v1/courses/101/pages')).status).toBe(403);
    expect((await get('/api/v1/courses/101/pages')).status).toBe(200);
  });
});
