// Exporting only what's new: files saved before are skipped, including ones v2 recorded.
import { execFileSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import type { Worker } from '@playwright/test';
import { waitForDownloads } from './golden/collect';
import { CANVAS, expect, resetExtensionStorage, test } from './fixtures';
import { files, findCourse, folders } from './mock-canvas/data';

const today = new Date().toISOString().slice(0, 10); // the test browser runs in UTC
const zipEntries = (zip: string) =>
  execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' }).trim().split('\n');

test.beforeEach(({ downloadsDir }) => {
  for (const entry of readdirSync(downloadsDir))
    rmSync(path.join(downloadsDir, entry), { recursive: true });
});

async function exportCourse(page: import('@playwright/test').Page, courseId: number) {
  await page.goto(`${CANVAS}/courses/${courseId}`);
  const next = page.context().waitForEvent('page');
  await page.getByRole('button', { name: 'Download course' }).click();
  const tab = await next;
  await expect(tab.getByRole('heading', { name: 'Export finished' })).toBeVisible({
    timeout: 60_000,
  });
  return tab;
}

const setLocal = (sw: Worker, values: Record<string, unknown>) =>
  sw.evaluate(
    (v) =>
      (
        globalThis as unknown as {
          chrome: { storage: { local: { set(x: object): Promise<void> } } };
        }
      ).chrome.storage.local.set(v),
    values,
  );

test('a second export with "only new" saves an update ZIP without the files saved before', async ({
  page,
  serviceWorker,
  downloadsDir,
}) => {
  await resetExtensionStorage(serviceWorker, { incrementalMode: true });
  await exportCourse(page, 104);
  const tab = await exportCourse(page, 104);
  await expect(tab.locator('.result')).toContainText('24 files you already had were skipped');
  await waitForDownloads(downloadsDir);

  const update = path.join(downloadsDir, `Academic Writing (update ${today}).zip`);
  const entries = zipEntries(update);
  expect(entries.filter((e) => e.endsWith('.pdf'))).toEqual([]);
  expect(entries).toContain('Pages/course-schedule.html');
  expect(
    zipEntries(path.join(downloadsDir, 'Academic Writing.zip')).filter((e) => e.endsWith('.pdf')),
  ).toHaveLength(24);
});

test("files v2 recorded aren't downloaded again after updating to v3", async ({
  page,
  serviceWorker,
  downloadsDir,
}) => {
  await resetExtensionStorage(serviceWorker, { incrementalMode: true });
  // v2 stored incremental_<courseId> with "<folder><display name>" → { t, m, s }.
  const course = findCourse(104)!;
  const folderPath = new Map(
    folders(course).map((f) => [f.id, String(f.full_name).replace(/^course files\/?/, '')]),
  );
  const v2Records = Object.fromEntries(
    files(course, CANVAS).map((f) => {
      const folder = folderPath.get(f.folder_id) ?? '';
      return [
        `Files/${folder ? `${folder}/` : ''}${f.display_name}`,
        { t: 1, m: f.updated_at, s: f.size },
      ];
    }),
  );
  await setLocal(serviceWorker, { incremental_104: v2Records });

  const tab = await exportCourse(page, 104);
  await expect(tab.locator('.result')).toContainText('24 files you already had were skipped');
  await waitForDownloads(downloadsDir);
  expect(readdirSync(downloadsDir)).toEqual([`Academic Writing (update ${today}).zip`]);
});
