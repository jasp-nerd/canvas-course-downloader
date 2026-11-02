import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { startMockCanvas, type MockCanvas } from '../../e2e/mock-canvas/server';
import { mockFetch } from '../../tests/support/mock-fetch';
import { createCanvasClient } from '../canvas/client';
import { memorySink } from '../sinks/memory';
import { blobCollector, zipSink } from '../sinks/zip';
import { exportOptionsFrom } from './options';
import { planCourseExport } from './plan';
import { runExport, type RunProgress } from './run';

const ORIGIN = 'https://school.instructure.com';
let mock: MockCanvas;
beforeAll(async () => {
  mock = await startMockCanvas();
});
afterAll(() => mock.close());
beforeEach(() => mock.reset());

const canvas = () =>
  createCanvasClient({ origin: ORIGIN, fetch: mockFetch(mock), sleep: () => Promise.resolve() });
const plan = (courseId = '101', settings = {}) =>
  planCourseExport({
    canvas: canvas(),
    origin: ORIGIN,
    courseId,
    options: exportOptionsFrom(settings, 'test'),
  });

/** Unpacks a ZIP blob with the system unzip and returns its entry names in archive order plus contents. */
async function unzip(blob: Blob): Promise<{ order: string[]; files: Map<string, Buffer> }> {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ccd-zip-'));
  try {
    const zipPath = path.join(dir, 'out.zip');
    writeFileSync(zipPath, Buffer.from(await blob.arrayBuffer()));
    const order = execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' }).trim().split('\n');
    execFileSync('unzip', ['-q', zipPath, '-d', path.join(dir, 'x')]);
    return {
      order,
      files: new Map(order.map((name) => [name, readFileSync(path.join(dir, 'x', name))])),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('runExport', () => {
  it('writes a ZIP with every planned file, in plan order, with the same bytes as a folder export', async () => {
    const p = await plan();
    const zipped = blobCollector();
    const zipResult = await runExport(p, { canvas: canvas(), sink: zipSink(zipped.stream) });
    const folder = memorySink();
    await runExport(p, { canvas: canvas(), sink: folder });

    expect(zipResult.outcome).toBe('success');
    const zip = await unzip(await zipped.blob);
    expect(zip.order).toEqual(p.files.map((f) => f.path));
    for (const [name, bytes] of zip.files)
      expect(Buffer.compare(bytes, Buffer.from(folder.files.get(name)!))).toBe(0);
  });

  it('ends as Partial and lists the files that failed, instead of reporting success (v2 bug)', async () => {
    mock.addFault({ path: '^/files/101003/download', status: 500 });
    mock.addFault({ path: '^/files/101007/download', status: 404 });
    const p = await plan();
    const zipped = blobCollector();
    const result = await runExport(p, { canvas: canvas(), sink: zipSink(zipped.stream) });

    expect(result.outcome).toBe('partial');
    expect(result.failed.map((f) => f.reason).sort()).toEqual(['HTTP 404', 'HTTP 500']);
    const zip = await unzip(await zipped.blob);
    expect(zip.order).toContain('_download_errors.csv');
    expect(zip.order).toHaveLength(p.files.length - 2 + 1);
    expect(zip.files.get('_download_errors.csv')!.toString()).toContain('HTTP 500');
  });

  it('stops and reports Cancelled when the user cancels', async () => {
    const controller = new AbortController();
    const p = await plan();
    const seen: RunProgress[] = [];
    const result = await runExport(p, {
      canvas: canvas(),
      sink: memorySink(),
      signal: controller.signal,
      onProgress: (progress) => {
        seen.push(progress);
        if (progress.done === 3) controller.abort();
      },
    });
    expect(result.outcome).toBe('cancelled');
    expect(result.written).toBeLessThan(p.files.length);
  });

  const filesOnly = {
    contentTypes: {
      files: true,
      pages: false,
      assignments: false,
      submissions: false,
      discussions: false,
      announcements: false,
      modules: false,
      syllabus: false,
      grades: false,
      quizzes: false,
      linkedFiles: false,
    },
  };

  it('names in each report the file it is about, also when files finish out of order', async () => {
    const p = await plan('104', filesOnly);
    const slow = p.files[0]!.path;
    const memory = memorySink();
    const sink = {
      ...memory,
      async write(path: string, body: Uint8Array | ReadableStream<Uint8Array>) {
        if (path === slow) await new Promise((r) => setTimeout(r, 50));
        await memory.write(path, body, {});
      },
    };
    const seen: string[] = [];
    await runExport(p, { canvas: canvas(), sink, onProgress: (x) => seen.push(x.current) });
    expect(seen.sort()).toEqual(p.files.map((f) => f.path).sort());
  });

  it('fails a file Canvas answers with a login page, so it is tried again next time', async () => {
    const p = await plan();
    const file = p.files.find((f) => f.source.kind === 'remote' && !/html/.test(f.path))!;
    if (file.source.kind !== 'remote') throw new Error('no remote file');
    mock.addFault({ path: new URL(file.source.url).pathname, loginPage: true });
    const memory = memorySink();
    const result = await runExport(p, { canvas: canvas(), sink: memory });
    expect(result.failed).toEqual([{ path: file.path, reason: 'NOT_A_FILE' }]);
    expect(memory.files.has(file.path)).toBe(false);
  });

  it('lists a file the browser fails on later in the overview and the error list (folders)', async () => {
    const p = await plan('104');
    const lost = p.files.find((f) => f.source.kind === 'remote')!.path;
    const memory = memorySink();
    const pending = [{ path: lost, reason: 'SERVER_BAD_CONTENT' }];
    const result = await runExport(p, {
      canvas: canvas(),
      sink: {
        ...memory,
        writeUrl: (path) => memory.write(path, new Uint8Array(), {}),
        settle: () => Promise.resolve(pending.splice(0)),
      },
    });

    // What the export job leaves out of the inventory, so the file is tried again next time.
    expect(result.failed).toEqual([{ path: lost, reason: 'SERVER_BAD_CONTENT' }]);
    expect(result.outcome).toBe('partial');
    expect(result.written).toBe(p.files.length - 1);
    const text = (name: string) => new TextDecoder().decode(memory.files.get(name));
    expect(text('_download_errors.csv')).toContain(lost);
    const overview = text('index.html');
    expect(overview).toContain('1 item could not be saved');
    expect(overview).toContain(`<td>${lost}</td><td>Not found in Canvas (SERVER_BAD_CONTENT)</td>`);
    expect(overview).not.toContain(`href="${lost.split('/').map(encodeURIComponent).join('/')}"`);
  });
});
