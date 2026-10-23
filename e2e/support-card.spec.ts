import { MASCOT_NAME } from '../src/ui/brand';
import { CANVAS, expect, resetExtensionStorage, test, waitForExport } from './fixtures';

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
const QUESTION = `Did ${MASCOT_NAME} get everything?`;

async function exportCourse(page: import('@playwright/test').Page) {
  await page.goto(`${CANVAS}/courses/104`);
  const next = page.context().waitForEvent('page');
  await page.getByRole('button', { name: 'Download course' }).click();
  const tab = await next;
  await waitForExport(tab);
  return tab;
}

test('asks after the second good export, and "Yes, all there" leads to the store review', async ({
  page,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, FILES_ONLY);
  const first = await exportCourse(page);
  await expect(first.getByText(QUESTION)).toHaveCount(0);
  await first.close();

  const second = await exportCourse(page);
  await expect(second.getByRole('heading', { name: QUESTION })).toBeVisible();
  await second.getByRole('button', { name: 'Yes, all there' }).click();
  const review = second.getByRole('link', { name: 'Write a review' });
  await expect(review).toHaveAttribute(
    'href',
    /chromewebstore\.google\.com\/detail\/canvas-course-downloader\/mmnmcnffbkcnhcjiidmdnaclpfeekiol\/reviews\?utm_source=extension&utm_medium=support-card/,
  );
  await expect(second.getByRole('link', { name: 'Star on GitHub' })).toBeVisible();
  await second.close();

  const third = await exportCourse(page);
  await expect(third.getByText(QUESTION)).toHaveCount(0);
});

test('"Something\'s missing" leads to the feedback form', async ({ page, serviceWorker }) => {
  await resetExtensionStorage(serviceWorker, FILES_ONLY);
  await (await exportCourse(page)).close();
  const tab = await exportCourse(page);
  await tab.getByRole('button', { name: "Something's missing" }).click();
  await expect(tab.getByRole('link', { name: 'Tell me what went wrong' })).toHaveAttribute(
    'href',
    /issues\/new|docs\.google\.com\/forms/,
  );
});

test('"Don\'t ask" hides it for good', async ({ page, serviceWorker }) => {
  await resetExtensionStorage(serviceWorker, FILES_ONLY);
  await (await exportCourse(page)).close();
  const tab = await exportCourse(page);
  await tab.getByRole('button', { name: "Don't ask" }).click();
  await expect(tab.getByText(QUESTION)).toHaveCount(0);
  const stored = await serviceWorker.evaluate(() =>
    (
      globalThis as unknown as {
        chrome: { storage: { local: { get(k: string): Promise<Record<string, unknown>> } } };
      }
    ).chrome.storage.local.get('supportCard'),
  );
  expect(stored.supportCard).toMatchObject({ done: true });
});

test('never asks after a partial export', async ({ page, serviceWorker, mock }) => {
  await resetExtensionStorage(serviceWorker, FILES_ONLY);
  await (await exportCourse(page)).close();
  mock.addFault({ path: '^/files/104003/download', status: 404 });
  const tab = await exportCourse(page);
  await expect(tab.getByText("1 file couldn't be downloaded.")).toBeVisible();
  await expect(tab.getByText(QUESTION)).toHaveCount(0);
});
