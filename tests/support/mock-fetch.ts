// A fetch() for unit tests that sends every request to the in-process mock Canvas,
// whatever host the URL names (as Chrome's --host-resolver-rules does in e2e).
import https from 'node:https';
import type { MockCanvas } from '../../e2e/mock-canvas/server';

export function mockFetch(mock: MockCanvas): typeof fetch {
  return (input, init) =>
    new Promise((resolve, reject) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      const req = https.request(
        {
          host: '127.0.0.1',
          port: mock.port,
          path: url.pathname + url.search,
          method: init?.method ?? 'GET',
          rejectUnauthorized: false,
          headers: { ...(init?.headers as Record<string, string> | undefined), host: url.host },
          signal: init?.signal ?? undefined,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (c: Buffer) => chunks.push(c));
          res.on('end', () => {
            const headers = new Headers();
            for (const [k, v] of Object.entries(res.headers))
              if (v !== undefined) headers.set(k, String(v));
            resolve(new Response(Buffer.concat(chunks), { status: res.statusCode ?? 0, headers }));
          });
        },
      );
      // fetch() reports network failures as TypeError.
      req.on('error', (e) => reject(new TypeError(e.message)));
      req.end();
    });
}
