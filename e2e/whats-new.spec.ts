// "What's new": after a course is saved, opening Canvas shows new files and gets just those.
import { execFileSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { waitForDownloads } from './golden/collect';
import { CANVAS, expect, resetExtensionStorage, test, waitForExport } from './fixtures';

const today = new Date().toISOString().slice(0, 10);
const pdfsIn = (zip: string) =>
  execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter((e) => e.endsWith('.pdf'));

test.beforeEach(({ downloadsDir }) => {
  for (const entry of readdirSync(downloadsDir))
    rmSync(path.join(downloadsDir, entry), { recursive: true });
});

async function exportCourse(page: import('@playwright/test').Page, courseId: number) {
  await page.goto(`${CANVAS}/courses/${courseId}`);
  const next = page.context().waitForEvent('page');
  await page.getByRole('button', { name: /^Download course/ }).click();
  const tab = await next;
  await waitForExport(tab);
  await tab.close();
}

test('the dashboard says when a saved course has new files, and downloads just those', async ({
  page,
  serviceWorker,
  mock,
  downloadsDir,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await exportCourse(page, 104);
  mock.state.newFileIn = [104];

  await page.goto(`${CANVAS}/`);
  const note = page.getByRole('status').filter({ hasText: 'since your last download' });
  await expect(note).toContainText('1 new file since your last download');
  await expect(note).toContainText('Academic Writing (1)');

  const next = page.context().waitForEvent('page');
  await note.getByRole('button', { name: 'Download 1 new file' }).click();
  const tab = await next;
  await waitForExport(tab);
  await waitForDownloads(downloadsDir);
  expect(pdfsIn(path.join(downloadsDir, `Academic Writing (update ${today}).zip`))).toEqual([
    'Files/Lectures/Lecture 13 - Review session.pdf',
  ]);
  await tab.close();

  await page.reload();
  await page.getByRole('button', { name: 'Download courses' }).waitFor();
  await expect(page.getByText('since your last download')).toHaveCount(0);
});

test('dismissing the note keeps it away until there is newer news', async ({
  page,
  serviceWorker,
  mock,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await exportCourse(page, 104);
  mock.state.newFileIn = [104];
  await page.goto(`${CANVAS}/`);
  const note = page.getByRole('status').filter({ hasText: 'since your last download' });
  await note.getByRole('button', { name: 'Dismiss' }).click();
  await expect(note).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Download courses' }).waitFor();
  await expect(page.getByText('since your last download')).toHaveCount(0);
});

test('next to the course button, a chip says how many files are new since the last save', async ({
  page,
  serviceWorker,
  mock,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await exportCourse(page, 104);
  mock.state.newFileIn = [104];
  await page.goto(`${CANVAS}/courses/104`);
  const button = page.getByRole('button', { name: 'Download course', exact: true });
  // Saved a moment ago: "yesterday" only when the test runs across midnight.
  const chip = /^1 new since (earlier today|yesterday)$/;
  await expect(page.getByText(chip)).toBeVisible();
  // Screen readers hear it with the button.
  await expect(button).toHaveAccessibleDescription(/1 new since/);
});

test('downloads new files on its own when that is switched on', async ({
  page,
  serviceWorker,
  mock,
  downloadsDir,
}) => {
  await resetExtensionStorage(serviceWorker, { autoDownloadNew: true });
  await exportCourse(page, 104);
  mock.state.newFileIn = [104];
  await page.goto(`${CANVAS}/`);

  const update = path.join(downloadsDir, `Academic Writing (update ${today}).zip`);
  await expect
    .poll(() => readdirSync(downloadsDir), { timeout: 60_000 })
    .toContain(path.basename(update));
  await waitForDownloads(downloadsDir);
  expect(pdfsIn(update)).toEqual(['Files/Lectures/Lecture 13 - Review session.pdf']);
  await expect(page.getByText('since your last download')).toHaveCount(0);
  // The background export tab closes itself once everything is saved.
  await expect
    .poll(
      () =>
        page
          .context()
          .pages()
          .filter((p) => p.url().includes('/export.html') && p.url().includes('quiet=1')).length,
      { timeout: 10_000 },
    )
    .toBe(0);
});
