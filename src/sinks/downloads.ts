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

type DownloadsApi = Pick<typeof browser.downloads, 'download' | 'onChanged'>;

interface Options {
  /** Folder inside Downloads, ending in "/", e.g. "Canvas/Linear Algebra/". */
  folder: string;
  conflictAction: 'uniquify' | 'overwrite';
  downloads: DownloadsApi;
  /** Downloads running at once. */
  concurrency?: number;
}

export function downloadsSink(options: Options): FileSink {
  const { downloads, folder } = options;
  const limit = options.concurrency ?? 4;
  const running = new Map<number, { path: string; done: () => void; blobUrl?: string }>();
  const failures: SinkFailure[] = [];
  const waiting: (() => void)[] = [];
  // Reserved before download() resolves, so writes arriving together can't all pass the limit.
  let active = 0;
  const finished: Promise<void>[] = [];

  const listener = (delta: Browser.downloads.DownloadDelta) => {
    const job = running.get(delta.id);
    const state = delta.state?.current;
    if (!job || (state !== 'complete' && state !== 'interrupted')) return;
    if (state === 'interrupted')
      failures.push({ path: job.path, reason: delta.error?.current ?? 'interrupted' });
    if (job.blobUrl) URL.revokeObjectURL(job.blobUrl);
    running.delete(delta.id);
    active--;
    job.done();
    waiting.shift()?.();
  };
  downloads.onChanged.addListener(listener);

  async function start(path: string, url: string, blobUrl?: string) {
    while (active >= limit) await new Promise<void>((r) => waiting.push(r));
    active++;
    let done!: () => void;
    finished.push(new Promise<void>((r) => (done = r)));
    // saveAs: false so Firefox doesn't ask per file when "always ask" is on.
    const id = await downloads.download({
      url,
      filename: folder + path,
      conflictAction: options.conflictAction,
      saveAs: false,
    });
    running.set(id, { path, done, blobUrl });
  }

  return {
    ordered: false,
    writeUrl: (path, url) => start(path, url),
    async write(path, body) {
      const bytes =
        body instanceof Uint8Array ? body : new Uint8Array(await new Response(body).arrayBuffer());
      // Blob URLs from this extension page; never data: URLs, which Firefox rejects.
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mimeTypeFor(path) }));
      await start(path, url, url);
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
): Promise<{ ok: true; savedName: string } | { ok: false; reason: string }> {
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
    // "uniquify" may have saved it as "Course (1).zip"; report the name it really got.
    const [item] = await downloads.search({ id: started.id });
    const saved = item?.filename.split(/[/\\]/).pop();
    return { ok: true, savedName: saved || filename.split('/').pop()! };
  } finally {
    URL.revokeObjectURL(url);
  }
}
