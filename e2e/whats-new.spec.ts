// "What's new": after a course is saved, opening Canvas shows new files and gets just those.
import { execFileSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { waitForDownloads } from './golden/collect';
import type { Page } from '@playwright/test';
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

/** The Dashboard note, found by what it says: "1 new file in Academic Writing". */
const noteOn = (page: Page) => page.getByRole('status').filter({ hasText: / in Academic Writing/ });

async function exportCourse(page: Page, courseId: number) {
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
  const note = noteOn(page);
  await expect(note).toContainText('1 new file in Academic Writing');
  await expect(note).toContainText('Lecture 13 - Review session.pdf');

  const next = page.context().waitForEvent('page');
  await note.getByRole('button', { name: 'Download', exact: true }).click();
  const tab = await next;
  await waitForExport(tab);
  // The receipt names what the update brought, not every page it wrote again.
  await expect(tab.getByRole('heading', { name: 'Academic Writing is up to date' })).toBeVisible();
  const news = tab.getByRole('list', { name: "What's new" });
  await expect(news.getByRole('listitem')).toHaveCount(1);
  await expect(news).toContainText('Lecture 13 - Review session.pdf');
  await expect(news).toContainText('New');
  await waitForDownloads(downloadsDir);
  expect(pdfsIn(path.join(downloadsDir, `Academic Writing (update ${today}).zip`))).toEqual([
    'Files/Lectures/Lecture 13 - Review session.pdf',
  ]);
  await tab.close();

  // Gone without a reload, and after one.
  await expect(note).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Download courses' }).waitFor();
  await expect(noteOn(page)).toHaveCount(0);
});
