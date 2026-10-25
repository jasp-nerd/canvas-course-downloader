// Canvas REST client: pagination, retries and a concurrency limit that adapts to
// Canvas's rate-limit headers.
//
// Canvas throttles per user with a leaky bucket that the user's own Canvas tabs
// share. Every request in flight reserves ~50 units of a ~600 budget, and Canvas
// reports what's left in X-Rate-Limit-Remaining. The limit grows by one after a
// full window of responses with room to spare and halves when the budget runs
// low, so exports run several times faster than one-at-a-time without slowing
// the student's own Canvas pages. (A formula computed from the header alone
// overshoots: requests still in transit aren't in Canvas's count yet.)

export type CanvasErrorKind = 'throttled' | 'transient' | 'session' | 'permanent' | 'aborted';

export class CanvasError extends Error {
  constructor(
    readonly kind: CanvasErrorKind,
    readonly url: string,
    readonly status?: number,
  ) {
    super(`Canvas request ${kind}${status ? ` (${status})` : ''}: ${url}`);
    this.name = 'CanvasError';
  }
}

export interface CanvasClientOptions {
  /** e.g. "https://school.instructure.com" */
  origin: string;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
  /** Called when Canvas asks us to slow down, with the pause in ms. */
  onThrottle?: (pauseMs: number) => void;
  signal?: AbortSignal;
}

const RESERVE = 250;
const HEADROOM = 350;
const MAX_CONCURRENCY = 6;
const START_CONCURRENCY = 2;
const MAX_THROTTLE_RETRIES = 8;
const MAX_TRANSIENT_RETRIES = 4;
const TIMEOUT_MS = 30_000;

/** The URL of the next page from a Link header, or null on the last page. */
export function nextPageUrl(link: string | null): string | null {
  for (const part of (link ?? '').split(',')) {
    const m = /<([^>]+)>;\s*rel="next"/.exec(part);
    if (m) return m[1]!;
  }
  return null;
}

export function createCanvasClient(options: CanvasClientOptions) {
  const doFetch = options.fetch ?? fetch.bind(globalThis);
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const random = options.random ?? Math.random;

  let limit = START_CONCURRENCY;
  let inFlight = 0;
  let paused = false;
  let pauseId = 0;
  let throttleStreak = 0;
  let healthySinceChange = 0;
  const waiting: (() => void)[] = [];

  function pump() {
    while (!paused && waiting.length && inFlight < limit) {
      inFlight++;
      waiting.shift()!();
    }
  }

  function acquire(): Promise<void> {
    return new Promise((resolve) => {
      waiting.push(resolve);
      pump();
    });
  }

  function release(remaining: number | null) {
    inFlight--;
    if (remaining !== null && remaining < RESERVE) {
      limit = Math.max(1, Math.ceil(limit / 2));
      healthySinceChange = 0;
    } else if (remaining !== null && remaining >= HEADROOM && ++healthySinceChange >= limit) {
      limit = Math.min(MAX_CONCURRENCY, limit + 1);
      healthySinceChange = 0;
    }
    pump();
  }

  /** Stops starting requests for a while; a later throttle replaces an earlier pause. */
  function throttle(retryAfterSeconds: number | null) {
    throttleStreak++;
    const backoff = Math.min(60, 2 ** throttleStreak) * (0.5 + random() / 2) * 1000;
    const pause = Math.max(backoff, (retryAfterSeconds ?? 0) * 1000);
    paused = true;
    limit = 1;
    const id = ++pauseId;
    options.onThrottle?.(pause);
    void sleep(pause).then(() => {
      if (id !== pauseId) return;
      paused = false;
      pump();
    });
  }

  async function request(
    url: string,
    expect: 'json' | 'html' | 'body' = 'json',
  ): Promise<{ data: unknown; link: string | null; response?: Response }> {
    let throttles = 0;
    let transients = 0;
    // A server error says more than a dropped connection on a later retry.
    let lastStatus: number | undefined;
    for (;;) {
      if (options.signal?.aborted) throw new CanvasError('aborted', url);
      await acquire();
      let remaining: number | null = null;
      // The timeout covers waiting for headers only; a large file may stream for minutes.
      const timeout = new AbortController();
      const timer = setTimeout(() => timeout.abort(), TIMEOUT_MS);
      try {
        const res = await doFetch(url, {
          credentials: 'include',
          headers: { Accept: expect === 'json' ? 'application/json' : '*/*' },
          signal: AbortSignal.any([timeout.signal, ...(options.signal ? [options.signal] : [])]),
        });
        clearTimeout(timer);
        const header = res.headers.get('x-rate-limit-remaining');
        remaining = header === null ? null : Number(header);
        if (expect === 'body' && res.ok) return { data: null, link: null, response: res };
        const body = await res.text();

        if (res.status === 429 || (res.status === 403 && /Rate Limit Exceeded/i.test(body))) {
          const retryAfter = res.headers.get('retry-after');
          throttle(retryAfter ? Number(retryAfter) : null);
          if (++throttles > MAX_THROTTLE_RETRIES)
            throw new CanvasError('throttled', url, res.status);
          continue;
        }
        // Canvas sends 401 both when logged out ("unauthenticated") and when an
        // area is hidden from this user ("unauthorized"); only the first pauses the export.
        if (res.status === 401) {
          throw new CanvasError(/unauthenticated/.test(body) ? 'session' : 'permanent', url, 401);
        }
        if (res.status >= 500) {
          lastStatus = res.status;
          if (++transients > MAX_TRANSIENT_RETRIES)
            throw new CanvasError('transient', url, res.status);
          await sleep(random() * Math.min(30, 2 ** (transients - 1)) * 1000);
          continue;
        }
        if (!res.ok) throw new CanvasError('permanent', url, res.status);
        throttleStreak = 0;
        if (expect === 'html') return { data: body, link: null };
        // A login page instead of JSON means the session expired.
        if (!(res.headers.get('content-type') ?? '').includes('json'))
          throw new CanvasError('session', url, res.status);
        return {
          data: JSON.parse(body.replace(/^while\(1\);/, '')),
          link: res.headers.get('link'),
        };
      } catch (error) {
        if (error instanceof CanvasError) throw error;
        if (options.signal?.aborted) throw new CanvasError('aborted', url);
        // Network failure or timeout.
        if (++transients > MAX_TRANSIENT_RETRIES)
          throw new CanvasError('transient', url, lastStatus);
        await sleep(random() * Math.min(30, 2 ** (transients - 1)) * 1000);
      } finally {
        clearTimeout(timer);
        release(remaining);
      }
    }
  }

  function apiUrl(path: string, params: Record<string, string | string[]> = {}): string {
    const url = new URL(path.startsWith('http') ? path : `/api/v1${path}`, options.origin);
    for (const [key, value] of Object.entries(params)) {
      for (const v of Array.isArray(value) ? value : [value]) url.searchParams.append(key, v);
    }
    return url.toString();
  }

  return {
    /** One API object, e.g. `get('/courses/101')`. */
    async get<T>(path: string, params?: Record<string, string | string[]>): Promise<T> {
      return (await request(apiUrl(path, params))).data as T;
    },

    /**
     * A file body as a streaming Response. The request counts against Canvas's
     * rate limit only until the headers arrive, so long downloads don't hold
     * back API calls.
     */
    async download(url: string): Promise<Response> {
      return (await request(url, 'body')).response!;
    },

    /** A Canvas web page (not the API) as HTML, e.g. a quiz's review page. */
    async getHtml(url: string): Promise<string> {
      return (await request(new URL(url, options.origin).toString(), 'html')).data as string;
    },

    /** Every page of an API list. Throws if any page fails, rather than returning part of it. */
    async list<T>(path: string, params: Record<string, string | string[]> = {}): Promise<T[]> {
      const items: T[] = [];
      let url: string | null = apiUrl(path, { per_page: '100', ...params });
      while (url) {
        const page: { data: unknown; link: string | null } = await request(url);
        items.push(...(page.data as T[]));
        url = nextPageUrl(page.link);
      }
      return items;
    },

    /** Current concurrency limit, for tests and diagnostics. */
    get concurrency() {
      return limit;
    },
  };
}

export type CanvasClient = ReturnType<typeof createCanvasClient>;
