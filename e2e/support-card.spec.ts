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
const QUESTION = 'Did it save you some time?';

async function exportCourse(page: import('@playwright/test').Page) {
  await page.goto(`${CANVAS}/courses/104`);
  const next = page.context().waitForEvent('page');
  await page.getByRole('button', { name: 'Download course' }).click();
  const tab = await next;
  await waitForExport(tab);
  return tab;
}

/** As if the card last showed more than a week ago. */
async function aWeekLater(serviceWorker: import('@playwright/test').Worker) {
  await serviceWorker.evaluate(async () => {
    const { storage } = (globalThis as unknown as Chrome).chrome;
    const { supportCard } = await storage.local.get<{ supportCard: { lastShownAt: number } }>(
      'supportCard',
    );
    await storage.local.set({
      supportCard: { ...supportCard, lastShownAt: supportCard.lastShownAt - 8 * 24 * 3600_000 },
    });
  });
}

test('shows on the first good export, then once a week in another look, and stays after a rating', async ({
  page,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, FILES_ONLY);
  const first = await exportCourse(page);
  await expect(first.getByRole('heading', { name: QUESTION })).toBeVisible();
  const coffee = first.getByRole('link', { name: 'Buy me a coffee on Ko-fi' });
  await expect(coffee).toHaveAttribute(
    'href',
    /^https:\/\/ko-fi\.com\/jaspnerd\?utm_source=extension&utm_medium=support-card$/,
  );
  const review = first.getByRole('link', { name: 'Rate it on Chrome' });
  await expect(review).toHaveAttribute(
    'href',
    /chromewebstore\.google\.com\/detail\/canvas-course-downloader\/mmnmcnffbkcnhcjiidmdnaclpfeekiol\/reviews\?utm_source=extension&utm_medium=support-card/,
  );
  await expect(first.getByRole('link', { name: 'Something missing? Tell me' })).toHaveAttribute(
    'href',
    /issues\/new|docs\.google\.com\/forms/,
  );
  // The store opens in a new tab. Close it, or the next export's tab can be mistaken for it.
  const store = first.context().waitForEvent('page');
  await review.click();
  await (await store).close();
  // Thanked, with the other way to help still there.
  await expect(first.getByRole('heading', { name: 'Thanks for rating it!' })).toBeVisible();
  await expect(coffee).toBeVisible();
  await first.close();

  // Not again the same week.
  const sameWeek = await exportCourse(page);
  await expect(sameWeek.getByRole('complementary', { name: /./ })).toHaveCount(0);
  await expect(sameWeek.getByText('Buy me a coffee')).toHaveCount(0);
  await sameWeek.close();

  await aWeekLater(serviceWorker);
  const nextWeek = await exportCourse(page);
  await expect(nextWeek.getByRole('heading', { name: "Glad it's all saved" })).toBeVisible();
  await expect(nextWeek.getByRole('link', { name: 'Buy me a coffee on Ko-fi' })).toBeVisible();
});

test('"Don\'t show again" hides it for good', async ({ page, serviceWorker }) => {
  await resetExtensionStorage(serviceWorker, FILES_ONLY);
  const tab = await exportCourse(page);
  await tab.getByRole('button', { name: "Don't show again" }).click();
  await expect(tab.getByText(QUESTION)).toHaveCount(0);
  const stored = await serviceWorker.evaluate(() =>
    (globalThis as unknown as Chrome).chrome.storage.local.get('supportCard'),
  );
  expect(stored.supportCard).toMatchObject({ optedOut: true });
  await tab.close();
  await aWeekLater(serviceWorker);
  const after = await exportCourse(page);
  await expect(after.getByText('Buy me a coffee')).toHaveCount(0);
});

test('never asks after a partial export', async ({ page, serviceWorker, mock }) => {
  // The very first export, which would show the card had it saved everything.
  await resetExtensionStorage(serviceWorker, FILES_ONLY);
  mock.addFault({ path: '^/files/104003/download', status: 404 });
  const tab = await exportCourse(page);
  await expect(tab.getByText("1 file couldn't be downloaded.")).toBeVisible();
  await expect(tab.getByText(QUESTION)).toHaveCount(0);
  // A partial export gets a way to report it, never a coffee.
  await expect(tab.getByRole('link', { name: 'Report a problem' })).toHaveAttribute(
    'href',
    /issues\/new|docs\.google\.com\/forms/,
  );
  await expect(tab.getByText(/coffee/i)).toHaveCount(0);
  // Rating is offered after a partial export too, so only happy users aren't the ones asked.
  await expect(tab.getByRole('link', { name: 'Rate it on Chrome' })).toHaveAttribute(
    'href',
    /chromewebstore\.google\.com.*utm_medium=partial/,
  );
});
