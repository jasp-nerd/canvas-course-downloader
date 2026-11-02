// Individual files saved through the browser's download manager, into
// Downloads/<folder>/. Canvas files go to the manager by URL, so the browser
// fetches them itself (with the user's cookies) and can resume them.
import type { Browser, browser } from 'wxt/browser';
import type { FileSink, SinkFailure } from './types';

// Without a type, Chrome sniffs a Blob as text/plain and renames "Page.html" to "Page.txt".
const MIME_TYPES: Record<string, string> = {
  html: 'text/html;charset=utf-8',
  md: 'text/markdown;charset=utf-8',
  csv: 'text/csv;charset=utf-8',
  json: 'application/json',
  css: 'text/css',
  srt: 'text/plain;charset=utf-8',
};
export const mimeTypeFor = (path: string) =>
  MIME_TYPES[path.slice(path.lastIndexOf('.') + 1).toLowerCase()] ?? 'application/octet-stream';

type DownloadsApi = Pick<
  typeof browser.downloads,
  'download' | 'onChanged' | 'search' | 'removeFile' | 'cancel'
>;

/** The answer was a web page, not the file: what Canvas sends when a session ended mid-download. */
export const NOT_A_FILE = 'NOT_A_FILE';
/** The browser never said whether it started the download. Seen after a 404. */
const DOWNLOAD_STUCK = 'DOWNLOAD_STUCK';
const START_TIMEOUT_MS = 2 * 60_000;

/** Whether a file came back as a web page though neither Canvas nor its name says it is one. */
export const isWebPageInstead = (path: string, expected: string, served?: string | null) =>
  /^(text\/html|application\/xhtml)/i.test(served ?? '') &&
  !/html/i.test(expected) &&
  !/\.[sx]?html?$/i.test(path);

/** Danger states that let a download go on by itself. */
const SAFE = new Set(['safe', 'accepted', 'allowlistedByPolicy', 'deepScannedSafe']);

interface Options {
  /** Folder inside Downloads, ending in "/", e.g. "Canvas/Linear Algebra/". */
  folder: string;
  conflictAction: 'uniquify' | 'overwrite';
  downloads: DownloadsApi;
  /** Downloads running at once. */
  concurrency?: number;
  /** Called with each file's download id, e.g. to show it in its folder later. */
  onStarted?: (path: string, id: number) => void;
}

interface Job {
  path: string;
  done: () => void;
  blobUrl?: string;
  /** Canvas's type for a file the browser fetches itself. Our own files need no check. */
  expected?: string;
}

export function downloadsSink(options: Options): FileSink {
  const { downloads, folder } = options;
  const limit = options.concurrency ?? 4;
  const running = new Map<number, Job>();
  const failures: SinkFailure[] = [];
  const waiting: (() => void)[] = [];
  // Reserved before download() resolves, so writes arriving together can't all pass the limit.
  let active = 0;
  const finished: Promise<void>[] = [];

  // A closed save window: with "Ask where to save each file" on, Chromium asks for every
  // file even with saveAs: false. One "no" stops the rest instead of opening hundreds more.
  let cancelled = false;
  const release = (id: number, job: Job) => {
    if (job.blobUrl) URL.revokeObjectURL(job.blobUrl);
    running.delete(id);
    active--;
    job.done();
    waiting.shift()?.();
  };
  /** A login page saved as the file would count as saved and never be fetched again. */
  async function checkFinished(id: number, job: Job) {
    try {
      const [item] = await downloads.search({ id });
      if (isWebPageInstead(job.path, job.expected ?? '', item?.mime)) {
        failures.push({ path: job.path, reason: NOT_A_FILE });
        await downloads.removeFile(id);
      }
    } catch {
      // Can't tell, or it's already gone. The file stays as the browser saved it.
    }
    release(id, job);
  }
  /** download(), but a browser that never answers can't stop the export. */
  function begin(request: Browser.downloads.DownloadOptions): Promise<number> {
    const started = downloads.download(request);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stuck = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        // If it starts after all, it's already reported as failed.
        void started.then((id) => downloads.cancel(id)).catch(() => {});
        reject(new Error(DOWNLOAD_STUCK));
      }, START_TIMEOUT_MS);
    });
    return Promise.race([started, stuck]).finally(() => clearTimeout(timer));
  }
  const listener = (delta: Browser.downloads.DownloadDelta) => {
    const job = running.get(delta.id);
    if (!job) return;
    // Chromium holds files it thinks may be harmful (.py, .jar, ...) until the user presses
    // Keep. Don't wait on them: they'd take up every download slot and stall the export.
    const danger = delta.danger?.current;
    if (danger && !SAFE.has(danger)) {
      failures.push({ path: job.path, reason: 'HELD_BY_BROWSER' });
      release(delta.id, job);
      return;
    }
    const state = delta.state?.current;
    if (state !== 'complete' && state !== 'interrupted') return;
    if (state === 'interrupted') {
      const reason = delta.error?.current ?? 'interrupted';
      if (reason === 'USER_CANCELED') cancelled = true;
      failures.push({ path: job.path, reason });
    } else if (job.expected !== undefined) {
      void checkFinished(delta.id, job);
      return;
    }
    release(delta.id, job);
  };
  downloads.onChanged.addListener(listener);

  async function start(path: string, url: string, blobUrl?: string, expected?: string) {
    while (active >= limit) await new Promise<void>((r) => waiting.push(r));
    if (cancelled) {
      failures.push({ path, reason: 'SKIPPED_AFTER_CANCEL' });
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      waiting.shift()?.();
      return;
    }
    active++;
    let done!: () => void;
    finished.push(new Promise<void>((r) => (done = r)));
    // saveAs: false so Firefox doesn't ask per file when "always ask" is on.
    let id: number;
    try {
      id = await begin({
        url,
        filename: folder + path,
        conflictAction: options.conflictAction,
        saveAs: false,
      });
    } catch (error) {
      // Refused outright, e.g. a file name the browser won't take: no events will follow.
      failures.push({ path, reason: error instanceof Error ? error.message : String(error) });
      release(-1, { path, done, blobUrl });
      return;
    }
    running.set(id, { path, done, blobUrl, expected });
    options.onStarted?.(path, id);
  }

  return {
    ordered: false,
    writeUrl: (path, url, contentType) => start(path, url, undefined, contentType ?? ''),
    async write(path, body) {
      const bytes =
        body instanceof Uint8Array ? body : new Uint8Array(await new Response(body).arrayBuffer());
      // Blob URLs from this extension page; never data: URLs, which Firefox rejects.
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mimeTypeFor(path) }));
      await start(path, url, url);
    },
    async settle() {
      await Promise.all(finished);
      return failures.splice(0);
    },
    async close() {
      await Promise.all(finished);
      downloads.onChanged.removeListener(listener);
      return failures;
    },
    abort() {
      downloads.onChanged.removeListener(listener);
      return Promise.resolve();
    },
  };
}

/**
 * Saves one Blob (e.g. a finished ZIP) through the downloads API and resolves
 * once the file is complete, or with the browser's error when it failed.
 */
export async function downloadBlob(
  downloads: DownloadsApi & Pick<typeof browser.downloads, 'search'>,
  blob: Blob,
  filename: string,
  conflictAction: 'uniquify' | 'overwrite',
): Promise<
  { ok: true; id: number; filename: string; savedName: string } | { ok: false; reason: string }
> {
  const url = URL.createObjectURL(blob);
  try {
    const started = { id: -1 };
    const outcome = new Promise<{ ok: true } | { ok: false; reason: string }>((resolve) => {
      const listener = (delta: Browser.downloads.DownloadDelta) => {
        if (delta.id !== started.id) return;
        const state = delta.state?.current;
        if (state !== 'complete' && state !== 'interrupted') return;
        downloads.onChanged.removeListener(listener);
        resolve(
          state === 'complete'
            ? { ok: true }
            : { ok: false, reason: delta.error?.current ?? 'interrupted' },
        );
      };
      downloads.onChanged.addListener(listener);
    });
    started.id = await downloads.download({ url, filename, conflictAction, saveAs: false });
    const result = await outcome;
    if (!result.ok) return result;
    // "uniquify" may have saved it as "Course (1).zip", and a save window lets the user
    // pick any folder: report the full path it really got.
    const [item] = await downloads.search({ id: started.id });
    const saved = item?.filename.split(/[/\\]/).pop();
    return {
      ok: true,
      id: started.id,
      filename: item?.filename ?? '',
      savedName: saved || filename.split('/').pop()!,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
