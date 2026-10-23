// Mock Canvas LMS over HTTPS for e2e tests and agent checks.
//
// Chrome maps the hosts below to this server with --host-resolver-rules, so
// requests from content scripts, extension pages, the service worker and the
// downloads manager all reach it. It is strict: an API path it doesn't know is
// answered with 501 and recorded in `unexpected`, and tests fail on those.
import https from 'node:https';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Duplex } from 'node:stream';
import * as D from './data.ts';
import { coursePage, dashboardPage, plainPage } from './pages.ts';
import { ensureCerts } from './certs.ts';

export const MOCK_HOSTS = {
  instructure: 'school.instructure.com',
  customDomain: 'canvas.example.edu',
  notCanvas: 'not-canvas.example.com',
} as const;

export interface FaultRule {
  /** Regex source matched against path + query, e.g. "^/files/101002/download". */
  path: string;
  status?: number;
  /** Answer like Canvas's throttle: 403 "Rate Limit Exceeded" with X-Rate-Limit-Remaining 0. */
  throttle?: boolean;
  /** Destroy the socket without answering. */
  drop?: boolean;
  /** Answer 200 with a login page instead of JSON, as Canvas does when a session expired. */
  loginPage?: boolean;
  delayMs?: number;
  /** Number of matching requests to affect; every match when omitted. */
  times?: number;
}

export interface MockState {
  signedIn: boolean;
  requireSessionCookie: boolean;
  brand?: string;
  apiDelayMs: number;
  fileDelayMs: number;
  /** Rate-limit budget; X-Rate-Limit-Remaining is this minus 50 per API request in flight. */
  rateLimitBudget: number;
  /** Courses that got a new file after their first export. */
  newFileIn: number[];
  faults: FaultRule[];
}

export interface RequestLogEntry {
  method: string;
  host: string;
  path: string;
  status: number;
}

export interface MockCanvas {
  port: number;
  state: MockState;
  log: RequestLogEntry[];
  unexpected: string[];
  /** Highest number of API requests handled at the same time since the last reset. */
  stats: { maxConcurrentApi: number };
  addFault(rule: FaultRule): void;
  reset(): void;
  close(): Promise<void>;
}

const SESSION_COOKIE = 'canvas_session=mock-session';

const initialState = (): MockState => ({
  signedIn: true,
  requireSessionCookie: false,
  apiDelayMs: 0,
  fileDelayMs: 0,
  rateLimitBudget: 700,
  newFileIn: [],
  faults: [],
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A one-page PDF, so exported files are real, openable documents. */
function pdf(title: string, subtitle: string): Buffer {
  const esc = (s: string) => s.replace(/[()\\]/g, (m) => '\\' + m);
  const stream = `BT /F1 26 Tf 72 700 Td (${esc(title)}) Tj ET\nBT /F1 14 Tf 72 670 Td (${esc(subtitle)}) Tj ET\nBT /F1 11 Tf 72 640 Td (Sample file for tests. No real course content.) Tj ET`;
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('')}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, 'latin1');
}

type ApiResult = unknown[] | Record<string, unknown> | undefined;

function apiRoute(
  path: string,
  query: URLSearchParams,
  origin: string,
  state: MockState,
): ApiResult {
  let m: RegExpMatchArray | null;
  if (path === '/api/v1/users/self') return { id: 1, name: 'Sam Student', short_name: 'Sam' };
  if (path === '/api/v1/users/self/colors')
    return { custom_colors: Object.fromEntries(D.COURSES.map((c) => [`course_${c.id}`, c.color])) };
  if (path === '/api/v1/courses') {
    const state = query.get('enrollment_state') ?? 'active';
    return D.COURSES.filter((c) => c.state === state).map(
      ({ color: _c, state: _s, teaching, ...c }) => ({
        ...c,
        enrollments: [{ type: teaching ? 'teacher' : 'student' }],
      }),
    );
  }
  if ((m = path.match(/^\/api\/v1\/courses\/(\d+)$/))) {
    const c = D.findCourse(m[1]!);
    return (
      c && {
        id: c.id,
        name: c.name,
        course_code: c.course_code,
        term: c.term,
        enrollments: [
          c.teaching
            ? { type: 'teacher', role: 'TeacherEnrollment' }
            : { type: 'student', role: 'StudentEnrollment' },
        ],
        syllabus_body: D.syllabus(c),
      }
    );
  }
  if ((m = path.match(/^\/api\/v1\/files\/(\d+)$/))) {
    const id = Number(m[1]);
    return D.findFile(id, origin, state.newFileIn.includes(Math.floor(id / 1000)))?.file;
  }
  if (!(m = path.match(/^\/api\/v1\/courses\/(\d+)\/(.+)$/))) return undefined;
  const c = D.findCourse(m[1]!);
  if (!c) return undefined;
  const rest = m[2]!;
  if (rest === 'folders') return D.folders(c);
  if (rest === 'files') return D.files(c, origin, state.newFileIn.includes(c.id));
  if (rest === 'pages') return D.pages(c).map(({ body: _b, ...p }) => p);
  if ((m = rest.match(/^pages\/(.+)$/))) return D.pages(c).find((p) => p.url === m![1]);
  if (rest === 'assignments') return D.assignments(c);
  if ((m = rest.match(/^assignments\/(\d+)\/submissions\/self$/))) {
    const a = D.assignments(c).find((x) => x.id === Number(m![1]));
    return (
      a && {
        assignment_id: a.id,
        user_id: 1,
        ...(a.submission as object),
        submission_comments: [],
        submission_history: [],
        attachments: [],
      }
    );
  }
  if (rest === 'assignment_groups') return D.assignmentGroups(c);
  if (rest === 'discussion_topics')
    return D.discussions(c, query.get('only_announcements') === 'true');
  if ((m = rest.match(/^discussion_topics\/(\d+)\/view$/))) return D.discussionView(Number(m[1]));
  if (rest === 'modules') return D.modules(c);
  if ((m = rest.match(/^modules\/(\d+)\/items$/))) return D.moduleItems(c, Number(m[1]), origin);
  if (rest === 'quizzes') return D.quizzes(c);
  if (/^quizzes\/\d+\/submissions$/.test(rest)) return { quiz_submissions: [], submissions: [] };
  return undefined;
}

/** Canvas-style pagination: `page`/`per_page` (default 10, max 100) and a Link header. */
function paginate(items: unknown[], url: URL): { body: unknown[]; link: string } {
  const perPage = Math.min(Number(url.searchParams.get('per_page')) || 10, 100);
  const page = Math.max(Number(url.searchParams.get('page')) || 1, 1);
  const last = Math.max(Math.ceil(items.length / perPage), 1);
  const at = (p: number) => {
    const u = new URL(url);
    u.searchParams.set('page', String(p));
    u.searchParams.set('per_page', String(perPage));
    return u.toString();
  };
  const rels: [string, number][] = [
    ['current', page],
    ['first', 1],
    ['last', last],
  ];
  if (page < last) rels.push(['next', page + 1]);
  if (page > 1) rels.push(['prev', page - 1]);
  return {
    body: items.slice((page - 1) * perPage, page * perPage),
    link: rels.map(([rel, p]) => `<${at(p)}>; rel="${rel}"`).join(','),
  };
}

export async function startMockCanvas(port = 0): Promise<MockCanvas> {
  const { key, cert } = ensureCerts();
  const sockets = new Set<Duplex>();
  let activeApi = 0;
  const mock: MockCanvas = {
    port: 0,
    state: initialState(),
    log: [],
    unexpected: [],
    stats: { maxConcurrentApi: 0 },
    addFault: (rule) => mock.state.faults.push({ ...rule }),
    reset() {
      mock.state = initialState();
      mock.log.length = 0;
      mock.unexpected.length = 0;
      mock.stats.maxConcurrentApi = 0;
    },
    close: () =>
      new Promise((resolve) => {
        for (const s of sockets) s.destroy();
        server.close(() => resolve());
      }),
  };

  function send(
    res: ServerResponse,
    status: number,
    type: string,
    body: string | Buffer,
    headers: Record<string, string> = {},
  ) {
    const charset = type.startsWith('text/') || type.includes('json') ? '; charset=utf-8' : '';
    res.writeHead(status, { 'content-type': type + charset, ...headers });
    res.end(body);
  }

  /** Applies the first matching fault rule. Returns true when it answered the request. */
  async function applyFault(
    req: IncomingMessage,
    res: ServerResponse,
    target: string,
  ): Promise<boolean> {
    const rule = mock.state.faults.find(
      (f) => new RegExp(f.path).test(target) && (f.times ?? 1) > 0,
    );
    if (!rule) return false;
    if (rule.times !== undefined) rule.times -= 1;
    if (rule.delayMs) await sleep(rule.delayMs);
    if (rule.drop) {
      req.socket.destroy();
      return true;
    }
    if (rule.loginPage) {
      send(
        res,
        200,
        'text/html',
        '<!doctype html><html><body><form id="login_form">Log in</form></body></html>',
      );
      return true;
    }
    if (rule.throttle) {
      send(res, 403, 'text/plain', '403 Forbidden (Rate Limit Exceeded)\n', {
        'x-rate-limit-remaining': '0',
        'x-request-cost': '50',
      });
      return true;
    }
    if (rule.status) {
      send(
        res,
        rule.status,
        'application/json',
        JSON.stringify({ errors: [{ message: 'mock fault' }] }),
      );
      return true;
    }
    return false;
  }

  async function handle(req: IncomingMessage, res: ServerResponse) {
    const host = (req.headers.host ?? MOCK_HOSTS.instructure).replace(/:\d+$/, '');
    // Keep the port: Firefox tests reach the mock as school.instructure.com:<port>.
    const origin = `https://${req.headers.host ?? host}`;
    const url = new URL(req.url ?? '/', origin);
    const path = url.pathname.replace(/\/$/, '') || '/';
    const target = path + url.search;

    if (path === '/__health') return send(res, 200, 'text/plain', 'ok');
    if (path === '/__log')
      return send(
        res,
        200,
        'application/json',
        JSON.stringify({ log: mock.log, unexpected: mock.unexpected }),
      );
    if (path === '/__control' && req.method === 'POST') {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = JSON.parse(Buffer.concat(chunks).toString() || '{}') as {
        reset?: boolean;
        state?: Partial<MockState>;
        fault?: FaultRule;
      };
      if (body.reset) mock.reset();
      if (body.state) Object.assign(mock.state, body.state);
      if (body.fault) mock.addFault(body.fault);
      return send(res, 200, 'application/json', JSON.stringify(mock.state));
    }

    if (await applyFault(req, res, target)) return;

    if (host === MOCK_HOSTS.notCanvas) {
      return path === '/'
        ? send(res, 200, 'text/html', plainPage())
        : send(res, 404, 'text/plain', 'not found');
    }

    let m: RegExpMatchArray | null;
    const pageHeaders = {
      'set-cookie': `${SESSION_COOKIE}; Path=/; Secure; HttpOnly; SameSite=Lax`,
    };
    if (path === '/' || path === '/courses')
      return send(res, 200, 'text/html', dashboardPage(mock.state.brand), pageHeaders);
    if ((m = path.match(/^\/courses\/(\d+)$/))) {
      const c = D.findCourse(m[1]!);
      return c
        ? send(res, 200, 'text/html', coursePage(c, origin, mock.state.brand), pageHeaders)
        : send(res, 404, 'text/html', 'Page not found');
    }

    if ((m = path.match(/^(?:\/courses\/\d+)?\/files\/(\d+)\/download$/))) {
      const fileId = Number(m[1]);
      const found = D.findFile(
        fileId,
        origin,
        mock.state.newFileIn.includes(Math.floor(fileId / 1000)),
      );
      if (!found) return send(res, 404, 'text/plain', 'not found');
      if (mock.state.fileDelayMs) await sleep(mock.state.fileDelayMs);
      const name = found.file.display_name;
      return send(
        res,
        200,
        'application/pdf',
        pdf(name.replace(/\.pdf$/, ''), `${found.course.course_code} ${found.course.name}`),
        {
          'content-disposition': `attachment; filename="${encodeURIComponent(name)}"`,
        },
      );
    }

    if (path.startsWith('/api/v1/')) {
      activeApi++;
      mock.stats.maxConcurrentApi = Math.max(mock.stats.maxConcurrentApi, activeApi);
      res.on('close', () => activeApi--);
      if (mock.state.apiDelayMs) await sleep(mock.state.apiDelayMs);
      const hasSession = (req.headers.cookie ?? '').includes(SESSION_COOKIE);
      if (!mock.state.signedIn || (mock.state.requireSessionCookie && !hasSession)) {
        return send(
          res,
          401,
          'application/json',
          JSON.stringify({
            status: 'unauthenticated',
            errors: [{ message: 'user authorization required' }],
          }),
        );
      }
      const result = apiRoute(path, url.searchParams, origin, mock.state);
      if (result === undefined) {
        const known = /^\/api\/v1\/(courses|files)\/(\d+)/.exec(path);
        if (
          known &&
          !apiRoute(`/api/v1/${known[1]}/${known[2]}`, url.searchParams, origin, mock.state)
        ) {
          return send(
            res,
            404,
            'application/json',
            JSON.stringify({ errors: [{ message: 'The specified resource does not exist.' }] }),
          );
        }
        mock.unexpected.push(`${req.method} ${target}`);
        return send(
          res,
          501,
          'application/json',
          JSON.stringify({ errors: [{ message: `mock canvas: no handler for ${path}` }] }),
        );
      }
      const remaining = mock.state.rateLimitBudget - 50 * activeApi;
      const headers = { 'x-rate-limit-remaining': String(remaining), 'x-request-cost': '1' };
      if (Array.isArray(result)) {
        const { body, link } = paginate(result, url);
        return send(res, 200, 'application/json', JSON.stringify(body), { ...headers, link });
      }
      return send(res, 200, 'application/json', JSON.stringify(result), headers);
    }

    send(res, 404, 'text/plain', 'not found');
  }

  const server = https.createServer({ key, cert }, (req, res) => {
    res.on('finish', () => {
      const host = (req.headers.host ?? '').replace(/:\d+$/, '');
      if (!req.url?.startsWith('/__'))
        mock.log.push({
          method: req.method ?? 'GET',
          host,
          path: req.url ?? '',
          status: res.statusCode,
        });
    });
    handle(req, res).catch((error: unknown) => {
      if (!res.headersSent) send(res, 500, 'text/plain', String(error));
    });
  });
  server.on('connection', (s) => {
    sockets.add(s);
    s.on('close', () => sockets.delete(s));
  });

  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));
  mock.port = (server.address() as AddressInfo).port;
  return mock;
}
