import { describe, expect, it, vi } from 'vitest';
import { downloadsSink, mimeTypeFor } from './downloads';

/** A downloads API that finishes each download when the test says so. */
function fakeDownloads() {
  const listeners = new Set<
    (d: { id: number; state?: { current?: string }; error?: { current?: string } }) => void
  >();
  const started: { id: number; url: string; filename?: string; saveAs?: boolean }[] = [];
  let nextId = 1;
  const api = {
    download: vi.fn((opts: { url: string; filename?: string; saveAs?: boolean }) => {
      const id = nextId++;
      started.push({ id, ...opts });
      return Promise.resolve(id);
    }),
    onChanged: {
      addListener: (l: never) => void listeners.add(l),
      removeListener: (l: never) => void listeners.delete(l),
    },
  };
  const finish = (id: number, state: 'complete' | 'interrupted', error?: string) => {
    for (const l of [...listeners])
      l({ id, state: { current: state }, ...(error ? { error: { current: error } } : {}) });
  };
  return { api, started, finish };
}

describe('downloadsSink', () => {
  it('saves Canvas files by URL into the course folder, without a save dialog', async () => {
    const fake = fakeDownloads();
    const sink = downloadsSink({
      folder: 'Canvas/Linear Algebra/',
      conflictAction: 'uniquify',
      downloads: fake.api as never,
    });
    await sink.writeUrl!('Files/a.pdf', 'https://school.instructure.com/files/1/download');
    expect(fake.started[0]).toMatchObject({
      filename: 'Canvas/Linear Algebra/Files/a.pdf',
      saveAs: false,
    });
    fake.finish(1, 'complete');
    await expect(sink.close()).resolves.toEqual([]);
  });

  it('runs at most `concurrency` downloads at once', async () => {
    const fake = fakeDownloads();
    const sink = downloadsSink({
      folder: '',
      conflictAction: 'uniquify',
      downloads: fake.api as never,
      concurrency: 2,
    });
    const writes = [1, 2, 3].map((n) => sink.writeUrl!(`f${n}.pdf`, `https://x/${n}`));
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));
    expect(fake.started).toHaveLength(2);
    fake.finish(1, 'complete');
    await Promise.all(writes);
    expect(fake.started).toHaveLength(3);
    fake.finish(2, 'complete');
    fake.finish(3, 'complete');
    await sink.close();
  });

  it('reports downloads that fail after they started', async () => {
    const fake = fakeDownloads();
    const sink = downloadsSink({
      folder: '',
      conflictAction: 'uniquify',
      downloads: fake.api as never,
    });
    await sink.writeUrl!('big.mp4', 'https://x/big');
    fake.finish(1, 'interrupted', 'NETWORK_FAILED');
    await expect(sink.close()).resolves.toEqual([{ path: 'big.mp4', reason: 'NETWORK_FAILED' }]);
  });

  it('saves generated files from blob URLs and revokes them when done', async () => {
    const fake = fakeDownloads();
    const revoke = vi.spyOn(URL, 'revokeObjectURL');
    const sink = downloadsSink({
      folder: '',
      conflictAction: 'uniquify',
      downloads: fake.api as never,
    });
    await sink.write('Pages/a.html', new TextEncoder().encode('<p>x</p>'), {});
    expect(fake.started[0]!.url).toMatch(/^blob:/);
    expect(mimeTypeFor('Pages/a.html')).toBe('text/html;charset=utf-8');
    fake.finish(1, 'complete');
    await sink.close();
    expect(revoke).toHaveBeenCalledWith(fake.started[0]!.url);
  });
});
