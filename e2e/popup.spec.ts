import { CANVAS, NOT_CANVAS, expect, openActionPopup, test } from './fixtures';

test('on a course page, the popup downloads that course', async ({
  page,
  serviceWorker,
  cdpPort,
}) => {
  await page.goto(`${CANVAS}/courses/101`);
  await page.getByRole('button', { name: 'Download course' }).waitFor();
  await page.bringToFront();
  const { popup, close } = await openActionPopup(serviceWorker, cdpPort);
  try {
    const exportTab = page.context().waitForEvent('page', (p) => p.url().includes('/export.html'));
    await popup.getByRole('button', { name: 'Download this course' }).click();
    const tab = await exportTab;
    expect(new URL(tab.url()).searchParams.get('courses')).toBe('101');
  } finally {
    await close();
  }
});

test('on the dashboard, the popup opens the course picker', async ({
  page,
  serviceWorker,
  cdpPort,
}) => {
  await page.goto(`${CANVAS}/`);
  await page.getByRole('button', { name: 'Download courses' }).waitFor();
  await page.bringToFront();
  const { popup, close } = await openActionPopup(serviceWorker, cdpPort);
  try {
    await expect(popup.getByRole('button', { name: 'Download this course' })).toHaveCount(0);
    await popup.getByRole('button', { name: 'Choose courses…' }).click();
    await expect(page.getByRole('dialog', { name: 'Download courses' })).toBeVisible();
  } finally {
    await close();
  }
});

test('elsewhere, the popup explains it works on Canvas', async ({
  page,
  serviceWorker,
  cdpPort,
}) => {
  await page.goto(`${NOT_CANVAS}/`);
  await page.bringToFront();
  const { popup, close } = await openActionPopup(serviceWorker, cdpPort);
  try {
    await expect(popup.getByText("Open your school's Canvas in this tab")).toBeVisible();
  } finally {
    await close();
  }
});
