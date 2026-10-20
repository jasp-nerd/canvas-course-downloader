// Writes a planned export to a sink: fetches file bodies in parallel, keeps a
// ZIP's entries in order, and records every file that couldn't be saved.
import { CanvasError, type CanvasClient } from '../canvas/client';
import type { FileSink } from '../sinks/types';
import { csvRow } from './render';
import type { ExportPlan, PlannedFile } from './types';

export interface RunProgress {
  total: number;
  done: number;
  failed: number;
  bytes: number;
  current: string;
}

export interface RunResult {
  written: number;
  failed: { path: string; reason: string }[];
  cancelled: boolean;
  /** Success only when every planned file was written. */
  outcome: 'success' | 'partial' | 'failed' | 'cancelled';
}

export interface RunOptions {
  canvas: CanvasClient;
  sink: FileSink;
  signal?: AbortSignal;
  onProgress?: (progress: RunProgress) => void;
  /** File bodies fetched at once. Browsers allow 6 connections per host. */
  concurrency?: number;
}

/** Files up to this size are fetched ahead of their turn in a ZIP; larger ones stream when it's their turn. */
const PREFETCH_MAX_BYTES = 16 * 1024 * 1024;

type Body =
  { ok: true; data: ReadableStream<Uint8Array> | Uint8Array } | { ok: false; reason: string };

const reasonOf = (error: unknown) =>
  error instanceof CanvasError
    ? error.status
      ? `HTTP ${error.status}`
      : error.kind
    : 'network error';

export async function runExport(plan: ExportPlan, options: RunOptions): Promise<RunResult> {
  const { canvas, sink, signal } = options;
  const concurrency = options.concurrency ?? 4;
  const encoder = new TextEncoder();
  const failed: RunResult['failed'] = [];
  const progress: RunProgress = {
    total: plan.files.length,
    done: 0,
    failed: 0,
    bytes: 0,
    current: '',
  };
  const report = () => options.onProgress?.({ ...progress });

  async function fetchBody(file: PlannedFile, buffer: boolean): Promise<Body> {
    if (file.source.kind === 'text') return { ok: true, data: encoder.encode(file.source.content) };
    try {
      const res = await canvas.download(file.source.url);
      if (!buffer || !res.body) return { ok: true, data: res.body ?? new Uint8Array() };
      return { ok: true, data: new Uint8Array(await res.arrayBuffer()) };
    } catch (error) {
      if (error instanceof CanvasError && (error.kind === 'session' || error.kind === 'aborted'))
        throw error;
      return { ok: false, reason: reasonOf(error) };
    }
  }

  async function write(file: PlannedFile, body: Body) {
    progress.current = file.path;
    if (!body.ok) {
      failed.push({ path: file.path, reason: body.reason });
      progress.failed++;
    } else {
      try {
        const lastModified =
          file.source.kind === 'remote' && file.source.modifiedAt
            ? new Date(file.source.modifiedAt)
            : undefined;
        await sink.write(file.path, body.data, { lastModified });
        progress.done++;
        progress.bytes +=
          body.data instanceof Uint8Array
            ? body.data.byteLength
            : file.source.kind === 'remote'
              ? file.source.size
              : 0;
      } catch (error) {
        if (signal?.aborted) throw error;
        failed.push({ path: file.path, reason: reasonOf(error) });
        progress.failed++;
      }
    }
    report();
  }

  async function passUrl(file: PlannedFile, url: string) {
    progress.current = file.path;
    try {
      await sink.writeUrl!(file.path, url);
      progress.done++;
    } catch (error) {
      if (signal?.aborted) throw error;
      failed.push({ path: file.path, reason: reasonOf(error) });
      progress.failed++;
    }
    report();
  }

  // Pages like the overview are written last, when every other file's outcome is known.
  const late = plan.files.filter((f) => f.source.kind === 'text' && f.source.render);
  const files = plan.files.filter((f) => !late.includes(f));

  const prefetchable = (f: PlannedFile) =>
    f.source.kind === 'text' || (f.source.size > 0 && f.source.size <= PREFETCH_MAX_BYTES);

  try {
    if (sink.ordered) {
      // Keep up to `concurrency` small files downloading ahead of the one being written.
      const ahead = new Map<number, Promise<Body>>();
      for (let i = 0; i < files.length; i++) {
        if (signal?.aborted) throw new CanvasError('aborted', '');
        for (let j = i; j < files.length && ahead.size < concurrency; j++) {
          if (ahead.has(j) || !prefetchable(files[j]!)) continue;
          const pending = fetchBody(files[j]!, true);
          // Awaited when its turn comes; this only keeps a cancelled run from reporting it as unhandled.
          pending.catch(() => {});
          ahead.set(j, pending);
        }
        const file = files[i]!;
        const body = await (ahead.get(i) ?? fetchBody(file, false));
        ahead.delete(i);
        await write(file, body);
      }
    } else {
      let next = 0;
      const worker = async () => {
        while (next < files.length) {
          if (signal?.aborted) throw new CanvasError('aborted', '');
          const file = files[next++]!;
          if (file.source.kind === 'remote' && sink.writeUrl) await passUrl(file, file.source.url);
          else await write(file, await fetchBody(file, false));
        }
      };
      await Promise.all(Array.from({ length: concurrency }, worker));
    }

    if (failed.length) {
      const rows = [csvRow(['path', 'reason']), ...failed.map((f) => csvRow([f.path, f.reason]))];
      await sink.write('_download_errors.csv', encoder.encode(rows.join('\n')), {});
    }
    for (const file of late) {
      if (file.source.kind !== 'text' || !file.source.render) continue;
      await write(file, { ok: true, data: encoder.encode(file.source.render(failed)) });
    }
    for (const late of (await sink.close()) ?? []) {
      failed.push(late);
      progress.done--;
      progress.failed++;
    }
  } catch (error) {
    await sink.abort(error);
    if (error instanceof CanvasError && error.kind === 'aborted') {
      return { written: progress.done, failed, cancelled: true, outcome: 'cancelled' };
    }
    throw error;
  }

  const outcome = failed.length === 0 ? 'success' : progress.done > 0 ? 'partial' : 'failed';
  return { written: progress.done, failed, cancelled: false, outcome };
}
