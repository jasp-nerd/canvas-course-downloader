import { describe, expect, it, vi } from 'vitest';
import { downloadBlob, downloadsSink, mimeTypeFor } from './downloads';

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

  it('tells which download each file became, so the page can show it in its folder', async () => {
    const fake = fakeDownloads();
    const started: [string, number][] = [];
    const sink = downloadsSink({
      folder: 'Course/',
      conflictAction: 'uniquify',
      downloads: fake.api as never,
      onStarted: (path, id) => started.push([path, id]),
    });
    await sink.writeUrl!('Files/a.pdf', 'https://x/a');
    await sink.write('index.html', new TextEncoder().encode('<p>x</p>'), {});
    expect(started).toEqual([
      ['Files/a.pdf', 1],
      ['index.html', 2],
    ]);
    fake.finish(1, 'complete');
    fake.finish(2, 'complete');
    await sink.close();
  });
});

describe('downloadBlob', () => {
  function fakeApi(outcome: { state: string; error?: string }, filename: string) {
    const fake = fakeDownloads();
    const api = {
      ...fake.api,
      download: vi.fn(async (opts: { url: string }) => {
        const id = await fake.api.download(opts);
        setTimeout(() => fake.finish(id, outcome.state as 'complete', outcome.error));
        return id;
      }),
      search: vi.fn(() => Promise.resolve([{ id: 1, filename }])),
    };
    return api;
  }

  it('reports the download id and the full path the browser saved the ZIP at', async () => {
    const api = fakeApi({ state: 'complete' }, '/Users/sam/Desktop/Linear Algebra (1).zip');
    const saved = await downloadBlob(
      api as never,
      new Blob(['zip']),
      'Linear Algebra.zip',
      'uniquify',
    );
    expect(saved).toEqual({
      ok: true,
      id: 1,
      filename: '/Users/sam/Desktop/Linear Algebra (1).zip',
      savedName: 'Linear Algebra (1).zip',
    });
  });

  it("passes on the browser's reason when the ZIP wasn't saved, e.g. a closed save window", async () => {
    const api = fakeApi({ state: 'interrupted', error: 'USER_CANCELED' }, '');
    const saved = await downloadBlob(
      api as never,
      new Blob(['zip']),
      'Linear Algebra.zip',
      'uniquify',
    );
    expect(saved).toEqual({ ok: false, reason: 'USER_CANCELED' });
  });
});
