import { CANVAS, expect, resetExtensionStorage, test } from './fixtures';

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

async function exportCourse(page: import('@playwright/test').Page) {
  await page.goto(`${CANVAS}/courses/104`);
  const next = page.context().waitForEvent('page');
  await page.getByRole('button', { name: 'Download course' }).click();
  const tab = await next;
  await expect(tab.getByRole('heading', { name: 'Export finished' })).toBeVisible({
    timeout: 60_000,
  });
  return tab;
}

test('asks after the second good export, and 👍 leads to the store review', async ({
  page,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, FILES_ONLY);
  const first = await exportCourse(page);
  await expect(first.getByText('Did this work well for you?')).toHaveCount(0);
  await first.close();

  const second = await exportCourse(page);
  await expect(second.getByRole('heading', { name: 'Did this work well for you?' })).toBeVisible();
  await second.getByRole('button', { name: 'Yes' }).click();
  const review = second.getByRole('link', { name: 'Write a review' });
  await expect(review).toHaveAttribute(
    'href',
    /chromewebstore\.google\.com\/detail\/canvas-course-downloader\/mmnmcnffbkcnhcjiidmdnaclpfeekiol\/reviews\?utm_source=extension&utm_medium=support-card/,
  );
  await expect(second.getByRole('link', { name: 'Star on GitHub' })).toBeVisible();
  await second.close();

  const third = await exportCourse(page);
  await expect(third.getByText('Did this work well for you?')).toHaveCount(0);
});

test('👎 leads to the feedback form', async ({ page, serviceWorker }) => {
  await resetExtensionStorage(serviceWorker, FILES_ONLY);
  await (await exportCourse(page)).close();
  const tab = await exportCourse(page);
  await tab.getByRole('button', { name: 'Not really' }).click();
  await expect(tab.getByRole('link', { name: 'Tell me what went wrong' })).toHaveAttribute(
    'href',
    /issues\/new|docs\.google\.com\/forms/,
  );
});

test('never asks after a partial export', async ({ page, serviceWorker, mock }) => {
  await resetExtensionStorage(serviceWorker, FILES_ONLY);
  await (await exportCourse(page)).close();
  mock.addFault({ path: '^/files/104003/download', status: 404 });
  const tab = await exportCourse(page);
  await expect(tab.locator('[data-outcome="partial"]')).toBeVisible();
  await expect(tab.getByText('Did this work well for you?')).toHaveCount(0);
});
