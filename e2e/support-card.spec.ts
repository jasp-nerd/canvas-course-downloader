import type { Worker } from '@playwright/test';
import type { browser } from 'wxt/browser';
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
const QUESTION = 'Could you leave a short review?';

async function exportCourse(page: import('@playwright/test').Page) {
  await page.goto(`${CANVAS}/courses/104`);
  const next = page.context().waitForEvent('page');
  await page.getByRole('button', { name: 'Download course' }).click();
  const tab = await next;
  await waitForExport(tab);
  return tab;
}

/** As if the first export that worked was a day ago: the ask never comes the same day. */
async function aDayLater(serviceWorker: Worker) {
  await serviceWorker.evaluate(async () => {
    const { storage } = (globalThis as unknown as Chrome).chrome;
    const { supportCard } = await storage.local.get<{ supportCard: { firstSuccessAt: number } }>(
      'supportCard',
    );
    await storage.local.set({
      supportCard: { ...supportCard, firstSuccessAt: supportCard.firstSuccessAt - 25 * 3600_000 },
    });
  });
}

test('asks everyone the same, a day after the first good export, and never again after', async ({
  page,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, FILES_ONLY);
  const first = await exportCourse(page);
  await expect(first.getByText(QUESTION)).toHaveCount(0);
  await first.close();

  // Not on the same day.
  const sameDay = await exportCourse(page);
  await expect(sameDay.getByText(QUESTION)).toHaveCount(0);
  await sameDay.close();

  await aDayLater(serviceWorker);
  const later = await exportCourse(page);
  await expect(later.getByRole('heading', { name: QUESTION })).toBeVisible();
  // One ask for everyone: no "was it good?" question first.
  await expect(later.getByRole('button', { name: /all there|missing/i })).toHaveCount(0);
  const review = later.getByRole('link', { name: 'Write a review' });
  await expect(review).toHaveAttribute(
    'href',
    /chromewebstore\.google\.com\/detail\/canvas-course-downloader\/mmnmcnffbkcnhcjiidmdnaclpfeekiol\/reviews\?utm_source=extension&utm_medium=support-card/,
  );
  await expect(later.getByRole('link', { name: 'Something missing? Tell me' })).toHaveAttribute(
    'href',
    /issues\/new|docs\.google\.com\/forms/,
  );
  await review.click();
  await expect(later.getByRole('heading', { name: 'Thank you!' })).toBeVisible();
  await expect(later.getByRole('link', { name: 'buy me a coffee' })).toHaveAttribute(
    'href',
    /^https:\/\/ko-fi\.com\/jaspnerd\?utm_source=extension&utm_medium=support-card$/,
  );
  await later.close();

  const after = await exportCourse(page);
  await expect(after.getByText(QUESTION)).toHaveCount(0);
});

test('"Don\'t ask again" hides it for good', async ({ page, serviceWorker }) => {
  await resetExtensionStorage(serviceWorker, FILES_ONLY);
  await (await exportCourse(page)).close();
  await aDayLater(serviceWorker);
  const tab = await exportCourse(page);
  await tab.getByRole('button', { name: "Don't ask again" }).click();
  await expect(tab.getByText(QUESTION)).toHaveCount(0);
  const stored = await serviceWorker.evaluate(() =>
    (globalThis as unknown as Chrome).chrome.storage.local.get('supportCard'),
  );
  expect(stored.supportCard).toMatchObject({ done: true });
});

test('never asks after a partial export', async ({ page, serviceWorker, mock }) => {
  await resetExtensionStorage(serviceWorker, FILES_ONLY);
  await (await exportCourse(page)).close();
  mock.addFault({ path: '^/files/104003/download', status: 404 });
  await aDayLater(serviceWorker);
  const tab = await exportCourse(page);
  await expect(tab.getByText("1 file couldn't be downloaded.")).toBeVisible();
  await expect(tab.getByText(QUESTION)).toHaveCount(0);
  // A partial export gets a way to report it, never a review or a coffee.
  await expect(tab.getByRole('link', { name: 'Report a problem' })).toHaveAttribute(
    'href',
    /issues\/new|docs\.google\.com\/forms/,
  );
  await expect(tab.getByText(/coffee/i)).toHaveCount(0);
});
