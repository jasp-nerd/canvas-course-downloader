// Saving into a folder the user chose (File System Access API). The real folder
// picker can't be automated, so the browser's private file system (OPFS) stands
// in for the chosen folder: the same handle type, the same writes.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { normalize } from './golden/collect';
import { diffAgainstGolden } from './golden/compare';
import { CANVAS, expect, resetExtensionStorage, test, waitForExport } from './fixtures';

/** Makes OPFS the "chosen folder" and empties it. Runs in an extension page. */
async function useOpfsAsFolder(extPage: Page) {
  await extPage.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    for await (const name of (root as unknown as { keys(): AsyncIterable<string> }).keys()) {
      await root.removeEntry(name, { recursive: true });
    }
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open('canvas-course-downloader', 1);
      open.onupgradeneeded = () => open.result.createObjectStore('handles');
      open.onerror = () => reject(new Error('IndexedDB unavailable'));
      open.onsuccess = () => {
        const tx = open.result.transaction('handles', 'readwrite');
        tx.objectStore('handles').put(root, 'saveFolder');
        tx.oncomplete = () => resolve();
      };
    });
  });
}

/** Every file in OPFS, as path → base64 bytes. */
const readOpfs = (extPage: Page) =>
  extPage.evaluate(async () => {
    const out: Record<string, string> = {};
    const walk = async (dir: FileSystemDirectoryHandle, prefix: string) => {
      for await (const [name, handle] of (
        dir as unknown as { entries(): AsyncIterable<[string, FileSystemHandle]> }
      ).entries()) {
        if (handle.kind === 'directory')
          await walk(handle as FileSystemDirectoryHandle, `${prefix}${name}/`);
        else {
          const bytes = new Uint8Array(
            await (await (handle as FileSystemFileHandle).getFile()).arrayBuffer(),
          );
          let binary = '';
          for (const b of bytes) binary += String.fromCharCode(b);
          out[prefix + name] = btoa(binary);
        }
      }
    };
    await walk(await navigator.storage.getDirectory(), '');
    return out;
  });

async function exportCourse(page: Page, courseId: number) {
  await page.goto(`${CANVAS}/courses/${courseId}`);
  const next = page.context().waitForEvent('page');
  await page.getByRole('button', { name: /^Download course/ }).click();
  const tab = await next;
  await waitForExport(tab);
  return tab;
}

test.beforeEach(({ downloadsDir }) => {
  for (const entry of readdirSync(downloadsDir))
    rmSync(path.join(downloadsDir, entry), { recursive: true });
});

test('streams the ZIP into the chosen folder, never into Downloads, and never overwrites', async ({
  page,
  serviceWorker,
  extContext,
  extensionId,
  downloadsDir,
}) => {
  await resetExtensionStorage(serviceWorker, { saveTo: 'folder' });
  const ext = await extContext.newPage();
  await ext.goto(`chrome-extension://${extensionId}/options.html`);
  await useOpfsAsFolder(ext);

  const tab = await exportCourse(page, 104);
  // A chosen folder has no "Show in folder"; the receipt says where instead.
  await expect(tab.getByText(/\/Academic Writing\.zip$/)).toBeVisible();
  await expect(tab.getByText(/^Saved in /)).toBeVisible();
  await expect(tab.getByRole('button', { name: 'Show in folder' })).toHaveCount(0);
  await exportCourse(page, 104);

  const files = await readOpfs(ext);
  expect(Object.keys(files).sort()).toEqual(['Academic Writing (2).zip', 'Academic Writing.zip']);
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ccd-opfs-'));
  const zip = path.join(dir, 'a.zip');
  writeFileSync(zip, Buffer.from(files['Academic Writing.zip']!, 'base64'));
  const pdfs = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' })
    .split('\n')
    .filter((e) => e.endsWith('.pdf'));
  rmSync(dir, { recursive: true });
  expect(pdfs).toHaveLength(24);
  expect(readdirSync(downloadsDir)).toEqual([]);
  await ext.close();
});

test('writes folders into the chosen folder that match v2', async ({
  page,
  serviceWorker,
  extContext,
  extensionId,
}) => {
  await resetExtensionStorage(serviceWorker, { saveTo: 'folder', zipMode: false });
  const ext = await extContext.newPage();
  await ext.goto(`chrome-extension://${extensionId}/options.html`);
  await useOpfsAsFolder(ext);

  await exportCourse(page, 102);
  const files = Object.entries(await readOpfs(ext)).map(([p, b64]) => {
    const normalized = normalize(p, Buffer.from(b64, 'base64'));
    return {
      path: p,
      sha256: createHash('sha256').update(normalized).digest('hex'),
      ...(/\.(html|md|csv|json|css)$/.test(p) ? { text: normalized.toString('utf8') } : {}),
    };
  });
  expect(diffAgainstGolden('student-folders', files)).toEqual([]);
  await ext.close();
});
