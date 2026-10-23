// The Download tab: progress while a course saves (also on its browser tab and
// the toolbar icon), and the receipt afterwards.
import { readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import type { browser } from 'wxt/browser';
import { waitForDownloads } from './golden/collect';
import { CANVAS, expect, resetExtensionStorage, test, waitForExport } from './fixtures';

type Chrome = { chrome: typeof browser };

const FILES_ONLY = {
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

test.beforeEach(({ downloadsDir }) => {
  for (const entry of readdirSync(downloadsDir))
    rmSync(path.join(downloadsDir, entry), { recursive: true });
});

/** Starts a download of course 104 from its page and returns the Download tab. */
async function startDownload(page: Page) {
  await page.goto(`${CANVAS}/courses/104`);
  const next = page.context().waitForEvent('page');
  await page.getByRole('button', { name: 'Download course' }).click();
  return next;
}

test('the receipt counts what was saved by kind and shows the ZIP in its folder', async ({
  page,
  serviceWorker,
  downloadsDir,
}) => {
  await resetExtensionStorage(serviceWorker, FILES_ONLY);
  const tab = await startDownload(page);
  await waitForExport(tab);

  const inside = tab.getByRole('list', { name: "What's inside" });
  await expect(inside.getByRole('listitem')).toHaveText([
    /^\s*Files\s*24$/,
    /^\s*Overview and course info\s*4$/,
  ]);
  await expect(tab.getByText(/^Saved today at .+ · took .+$/)).toBeVisible();

  // Show in folder asks the browser to show the ZIP it saved, and nothing else.
  await waitForDownloads(downloadsDir);
  await tab.evaluate(() => {
    const w = window as unknown as Chrome & { shown: number[] };
    w.shown = [];
    w.chrome.downloads.show = (id: number) => void w.shown.push(id);
  });
  await tab.getByRole('button', { name: 'Show in folder' }).click();
  const zipId = await serviceWorker.evaluate(async () => {
    // Other tests in this browser saved a ZIP with that name before: take the latest.
    const [item] = await (globalThis as unknown as Chrome).chrome.downloads.search({
      filenameRegex: 'Academic Writing\\.zip$',
      orderBy: ['-startTime'],
      limit: 1,
    });
    return item!.id;
  });
  expect(await tab.evaluate(() => (window as unknown as { shown: number[] }).shown)).toEqual([
    zipId,
  ]);

  // How to open it, behind a link outside Windows.
  const howTo = tab.getByRole('button', { name: 'How to open a ZIP' });
  await expect(howTo).toHaveAttribute('aria-expanded', 'false');
  await howTo.click();
  await expect(howTo).toHaveAttribute('aria-expanded', 'true');
  await expect(tab.getByRole('region', { name: 'Opening it' })).toContainText(
    'Open me - Academic Writing.html',
  );
});

test('the browser tab and the toolbar icon fill as the course saves', async ({
  page,
  serviceWorker,
  mock,
}) => {
  await resetExtensionStorage(serviceWorker, FILES_ONLY);
  mock.state.fileDelayMs = 250;
  const tab = await startDownload(page);
  await tab.evaluate(() => {
    const w = window as unknown as Chrome & { icons: string[] };
    w.icons = [];
    w.chrome.action.setIcon = (details: object) => {
      w.icons.push(Object.keys(details).join());
      return Promise.resolve();
    };
  });
  await expect.poll(() => tab.title(), { timeout: 30_000 }).toMatch(/^\d+% · Academic Writing$/);
  const favicon = () => tab.locator('link[rel="icon"]').getAttribute('href');
  const during = await favicon();
  expect(during).toMatch(/^data:image\/png;base64,/);
  await expect(tab.getByRole('progressbar', { name: 'Saving Academic Writing' })).toBeVisible();

  await waitForExport(tab);
  await expect(tab).toHaveTitle('Academic Writing saved');
  expect(await favicon()).not.toBe(during);
  // Filled in steps while saving, then back to the normal icon.
  const icons = await tab.evaluate(() => (window as unknown as { icons: string[] }).icons);
  expect(icons.filter((i) => i === 'imageData').length).toBeGreaterThan(1);
  expect(icons.at(-1)).toBe('path');
});

test("a teacher's receipt says no student data was saved", async ({
  page,
  serviceWorker,
  mock,
}) => {
  await resetExtensionStorage(serviceWorker, { ...FILES_ONLY, role: 'teacher' });
  mock.state.teacherIn = [104];
  const tab = await startDownload(page);
  await waitForExport(tab);
  await expect(
    tab.getByRole('heading', { level: 1, name: 'Academic Writing is archived' }),
  ).toBeVisible();
  await expect(tab.getByText('Student data: none included')).toBeVisible();
  await expect(tab.getByText('Submissions, grades and names were left out.')).toBeVisible();
  await expect(tab.getByRole('button', { name: 'Change in Settings' })).toBeVisible();
});

test('signed out: says so plainly, and Try again starts over', async ({
  page,
  serviceWorker,
  mock,
}) => {
  await resetExtensionStorage(serviceWorker, FILES_ONLY);
  await page.goto(`${CANVAS}/courses/104`);
  await page.getByRole('button', { name: 'Download course' }).waitFor();
  mock.state.signedIn = false;
  const next = page.context().waitForEvent('page');
  await page.getByRole('button', { name: 'Download course' }).click();
  const tab = await next;
  await waitForExport(tab);
  await expect(
    tab.getByText('You were signed out of Canvas. Sign in again in any tab, then try again.'),
  ).toBeVisible();
  await expect(tab.getByRole('img', { name: /worried/ })).toBeVisible();

  mock.state.signedIn = true;
  await Promise.all([
    tab.waitForEvent('load'),
    tab.getByRole('button', { name: 'Try again' }).click(),
  ]);
  await waitForExport(tab);
  await expect(
    tab.getByRole('heading', { level: 1, name: 'Academic Writing is saved' }),
  ).toBeVisible();
});

test('Stop all stops, and says nothing was saved when the ZIP never was', async ({
  page,
  serviceWorker,
  mock,
  downloadsDir,
}) => {
  await resetExtensionStorage(serviceWorker, FILES_ONLY);
  mock.state.fileDelayMs = 500;
  const tab = await startDownload(page);
  await expect.poll(() => tab.title(), { timeout: 30_000 }).toMatch(/^\d+% · Academic Writing$/);
  await tab.getByRole('button', { name: 'Stop all' }).click();
  await waitForExport(tab);
  await expect(
    tab.getByRole('heading', { level: 1, name: 'You stopped the download' }),
  ).toBeVisible();
  await expect(tab.getByText(/nothing was saved/)).toBeVisible();
  expect(readdirSync(downloadsDir)).toEqual([]);
});

test('courses waiting their turn show their names, not "Course 105"', async ({
  page,
  serviceWorker,
  mock,
  extensionId,
}) => {
  await resetExtensionStorage(serviceWorker, FILES_ONLY);
  mock.state.fileDelayMs = 1500;
  await page.goto(
    `chrome-extension://${extensionId}/export.html?origin=${encodeURIComponent(CANVAS)}&courses=104,105,101`,
  );
  // While the first course is still saving, the two after it already have their names.
  await expect(page.getByRole('heading', { name: 'Saving Academic Writing' })).toBeVisible({
    timeout: 30_000,
  });
  const queue = page.getByRole('region', { name: /3 courses/ });
  await expect(queue.getByText('Machine Learning')).toBeVisible({ timeout: 3000 });
  await expect(queue.getByText('Introduction to Psychology')).toBeVisible({ timeout: 3000 });
  await expect(queue.getByText(/^Course \d+$/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Stop all' }).click();
  await waitForExport(page);
});
