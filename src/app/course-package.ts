// Canvas's own course package (Common Cartridge, .imscc), for teachers who
// want to re-import their course into Canvas. Canvas builds it on its servers;
// we start the build (or reuse one this user already started), wait for it and
// return its download link. It's the extension's only write request, so it
// runs only when a teacher turns it on.

export type PackageResult =
  | { kind: 'ready'; url: string; size?: number }
  /** Only teachers, TAs and designers may export a course (403). */
  | { kind: 'not-allowed' }
  /** The security token was refused (422); read a fresh one from the page and try once more. */
  | { kind: 'token' }
  /** Signed out of Canvas (401). */
  | { kind: 'session' }
  | { kind: 'failed' }
  /** Still building after an hour: it can be downloaded later from the course's settings. */
  | { kind: 'slow' };

interface ContentExport {
  id: number;
  user_id?: number;
  export_type?: string;
  workflow_state?: string;
  progress_url?: string;
  attachment?: { url?: string; size?: number };
}

const BUILDING = new Set(['created', 'exporting', 'waiting_for_external_tool']);
const GIVE_UP_AFTER_MS = 60 * 60 * 1000;

/** The `_csrf_token` cookie Canvas sets for its own pages, as its X-CSRF-Token header wants it. */
export function csrfTokenFrom(cookie: string): string | undefined {
  const raw = cookie
    .split(/;\s*/)
    .find((c) => c.startsWith('_csrf_token='))
    ?.slice('_csrf_token='.length);
  return raw ? decodeURIComponent(raw) : undefined;
}

export async function requestCoursePackage(input: {
  origin: string;
  courseId: string;
  csrfToken: string;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  signal?: AbortSignal;
  /** 0 to 100, as Canvas reports the build. */
  onProgress?: (percent: number) => void;
}): Promise<PackageResult> {
  const fetch = input.fetch ?? globalThis.fetch;
  const sleep = input.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  const now = input.now ?? Date.now;
  const api = (path: string) => `${input.origin}/api/v1${path}`;
  const exportsPath = `/courses/${input.courseId}/content_exports`;
  const get = async <T>(url: string): Promise<[number, T | undefined]> => {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
      signal: input.signal,
    });
    return [res.status, res.ok ? ((await res.json()) as T) : undefined];
  };

  // Canvas doesn't deduplicate exports made through the API: reuse one this user is building.
  const [, self] = await get<{ id: number }>(api('/users/self'));
  const [listStatus, existing] = await get<ContentExport[]>(api(`${exportsPath}?per_page=20`));
  if (listStatus === 401) return { kind: 'session' };
  let job = (existing ?? []).find(
    (e) =>
      e.export_type === 'common_cartridge' &&
      e.user_id === self?.id &&
      BUILDING.has(e.workflow_state ?? ''),
  );

  if (!job) {
    const res = await fetch(api(exportsPath), {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRF-Token': input.csrfToken,
      },
      // Form-encoded: Canvas rejects export_type in a JSON body. No email when it's done.
      body: 'export_type=common_cartridge&skip_notifications=true',
      signal: input.signal,
    });
    if (res.status === 401) return { kind: 'session' };
    if (res.status === 403) return { kind: 'not-allowed' };
    if (res.status === 422) return { kind: 'token' };
    if (!res.ok) return { kind: 'failed' };
    job = (await res.json()) as ContentExport;
  }

  // Poll its progress, slowly: a build takes minutes, sometimes much longer.
  const started = now();
  let wait = 3000;
  for (;;) {
    if (!job.progress_url) break;
    const [, progress] = await get<{ workflow_state?: string; completion?: number }>(
      job.progress_url,
    );
    if (progress?.completion != null) input.onProgress?.(progress.completion);
    if (progress?.workflow_state === 'completed') break;
    if (progress?.workflow_state === 'failed') return { kind: 'failed' };
    if (now() - started >= GIVE_UP_AFTER_MS) return { kind: 'slow' };
    await sleep(wait);
    wait = Math.min(wait * 2, 30000);
  }

  const [, done] = await get<ContentExport>(api(`${exportsPath}/${job.id}`));
  const url = done?.attachment?.url;
  if (!url) return { kind: 'failed' };
  return {
    kind: 'ready',
    url,
    ...(done.attachment?.size != null ? { size: done.attachment.size } : {}),
  };
}
