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

  it('keeps going when the connection drops for some files', async () => {
    mock.addFault({ path: '^/files/10101[0-4]/download', drop: true });
    const sink = memorySink();
    const result = await runExport(await plan(), { canvas: canvas(), sink });
    expect(result.outcome).toBe('partial');
    expect(result.failed).toHaveLength(5);
    expect(result.failed.every((f) => f.reason === 'transient')).toBe(true);
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

  it('counts the size of files handed to the browser by URL', async () => {
    const p = await plan('104', filesOnly);
    const sink = { ...memorySink(), writeUrl: () => Promise.resolve() };
    let bytes = 0;
    await runExport(p, { canvas: canvas(), sink, onProgress: (x) => (bytes = x.bytes) });
    const remote = p.files.reduce(
      (n, f) => n + (f.source.kind === 'remote' ? f.source.size : 0),
      0,
    );
    expect(bytes).toBeGreaterThanOrEqual(remote);
  });

  it('reports progress for every file', async () => {
    const p = await plan('104', filesOnly);
    const seen: RunProgress[] = [];
    await runExport(p, { canvas: canvas(), sink: memorySink(), onProgress: (x) => seen.push(x) });
    expect(seen).toHaveLength(p.files.length);
    expect(seen.at(-1)).toMatchObject({ total: p.files.length, done: p.files.length, failed: 0 });
  });
});
