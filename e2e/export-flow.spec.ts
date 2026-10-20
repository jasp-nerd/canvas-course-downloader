// The whole user flow in a real browser: click "Download course" on a Canvas
// course page, let the Export tab run, and check what lands in Downloads
// against what v2.11.0 exported for the same course.
import { execFileSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { collectExport, waitForDownloads } from './golden/collect';
import { diffAgainstGolden } from './golden/compare';
import { CANVAS, expect, resetExtensionStorage, test } from './fixtures';

test.beforeEach(({ downloadsDir }) => {
  for (const entry of readdirSync(downloadsDir))
    rmSync(path.join(downloadsDir, entry), { recursive: true });
});

async function exportFromCoursePage(page: import('@playwright/test').Page, courseId: number) {
  await page.goto(`${CANVAS}/courses/${courseId}`);
  const exportTab = page.context().waitForEvent('page');
  await page.getByRole('button', { name: 'Download course' }).click();
  const tab = await exportTab;
  await expect(tab.getByRole('heading', { name: 'Export finished' })).toBeVisible({
    timeout: 60_000,
  });
  return tab;
}

test('exports a course as a ZIP that matches v2', async ({ page, serviceWorker, downloadsDir }) => {
  await resetExtensionStorage(serviceWorker, {});
  const tab = await exportFromCoursePage(page, 101);
  await expect(
    tab.getByText(/^Saved \d+ files to Downloads\/Introduction to Psychology\.zip$/),
  ).toBeVisible();
  await waitForDownloads(downloadsDir);
  expect(diffAgainstGolden('student-zip-default', collectExport(downloadsDir))).toEqual([]);
});

test('exports a course into folders that match v2', async ({
  page,
  serviceWorker,
  downloadsDir,
}) => {
  await resetExtensionStorage(serviceWorker, { zipMode: false });
  await exportFromCoursePage(page, 102);
  await waitForDownloads(downloadsDir);
  expect(diffAgainstGolden('student-folders', collectExport(downloadsDir))).toEqual([]);
});

test('says Partial and lists files that failed, instead of "complete"', async ({
  page,
  serviceWorker,
  downloadsDir,
  mock,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  mock.addFault({ path: '^/files/101003/download', status: 500 });
  const tab = await exportFromCoursePage(page, 101);
  await expect(tab.locator('.result')).toContainText("1 file couldn't be downloaded");
  await waitForDownloads(downloadsDir);
  const zip = path.join(downloadsDir, 'Introduction to Psychology.zip');
  // The overview inside the ZIP lists it too, as written after the downloads finished.
  expect(execFileSync('unzip', ['-p', zip, 'index.html'], { encoding: 'utf8' })).toContain(
    '1 item could not be saved',
  );
  expect(
    execFileSync('unzip', ['-p', zip, '_download_errors.csv'], { encoding: 'utf8' }),
  ).toContain('HTTP 500');
});
