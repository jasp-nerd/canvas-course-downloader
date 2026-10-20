// Regenerates the screenshots the welcome page shows, from the mock Canvas, so
// they always match the current UI: `pnpm assets`.
import { CANVAS, expect, resetExtensionStorage, test } from '../fixtures';

test.use({ viewport: { width: 1000, height: 640 }, deviceScaleFactor: 2 });

test('welcome page screenshots', async ({ page, serviceWorker }) => {
  await resetExtensionStorage(serviceWorker, {});
  await page.setViewportSize({ width: 900, height: 600 });
  await page.goto(`${CANVAS}/courses/101`);
  await page.getByRole('button', { name: 'Download course' }).waitFor();
  await page
    .locator('.ic-app-nav-toggle-and-crumbs')
    .screenshot({ path: 'public/welcome/course-button.png' });

  await page.goto(`${CANVAS}/`);
  await page.getByRole('button', { name: 'Download courses' }).click();
  const dialog = page.getByRole('dialog', { name: 'Download courses' });
  await expect(dialog.getByRole('group', { name: /Fall 2026/ })).toBeVisible();
  await dialog.getByRole('checkbox', { name: /Linear Algebra/ }).check();
  await dialog.getByRole('checkbox', { name: /Machine Learning/ }).check();
  await page
    .locator('ccd-course-picker')
    .locator('.dialog')
    .screenshot({ path: 'public/welcome/picker.png' });
});
