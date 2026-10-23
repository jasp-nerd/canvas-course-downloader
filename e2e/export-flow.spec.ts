// The whole user flow in a real browser: click "Download course" on a Canvas
// course page, let the Export tab run, and check what lands in Downloads
// against what v2.11.0 exported for the same course.
import { execFileSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { collectExport, waitForDownloads } from './golden/collect';
import { diffAgainstGolden } from './golden/compare';
import { CANVAS, expect, resetExtensionStorage, test, waitForExport } from './fixtures';

test.beforeEach(({ downloadsDir }) => {
  for (const entry of readdirSync(downloadsDir))
    rmSync(path.join(downloadsDir, entry), { recursive: true });
});

async function exportFromCoursePage(page: import('@playwright/test').Page, courseId: number) {
  await page.goto(`${CANVAS}/courses/${courseId}`);
  const exportTab = page.context().waitForEvent('page');
  await page.getByRole('button', { name: 'Download course' }).click();
  const tab = await exportTab;
  await waitForExport(tab);
  return tab;
}

test('exports a course as a ZIP that matches v2', async ({ page, serviceWorker, downloadsDir }) => {
  await resetExtensionStorage(serviceWorker, {});
  const tab = await exportFromCoursePage(page, 101);
  await expect(
    tab.getByRole('heading', { level: 1, name: 'Introduction to Psychology is saved' }),
  ).toBeVisible();
  // The path the browser really saved to, from the folder it's in.
  await expect(
    tab.getByText(`${path.basename(downloadsDir)}/Introduction to Psychology.zip`),
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
  await expect(tab.getByText("1 file couldn't be downloaded.")).toBeVisible();
  // Its kind's row on the receipt says so, and opens to name the file and why.
  await tab.getByText("1 couldn't be downloaded").click();
  await expect(tab.getByText(/Canvas had an error \(HTTP 500\)/)).toBeVisible();
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

test('names the file the browser actually saved when one with that name was there', async ({
  page,
  serviceWorker,
  downloadsDir,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await exportFromCoursePage(page, 104);
  await waitForDownloads(downloadsDir);
  const tab = await exportFromCoursePage(page, 104);
  await expect(
    tab.getByText(`${path.basename(downloadsDir)}/Academic Writing (1).zip`, { exact: true }),
  ).toBeVisible();
  await waitForDownloads(downloadsDir);
  expect(readdirSync(downloadsDir).sort()).toEqual([
    'Academic Writing (1).zip',
    'Academic Writing.zip',
  ]);
});
