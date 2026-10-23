// The button we add to Canvas pages: what it says it does.
import { CANVAS, expect, resetExtensionStorage, test } from './fixtures';

test.beforeEach(async ({ serviceWorker }) => {
  await resetExtensionStorage(serviceWorker, {});
});

test('the course button explains itself under the button, on hover and on focus', async ({
  page,
}) => {
  const hint = 'Course Downloader: save this course to your computer';
  await page.goto(`${CANVAS}/courses/101`);
  const button = page.getByRole('button', { name: 'Download course', exact: true });
  await expect(button).toHaveAccessibleDescription(hint);
  const tip = page.getByRole('tooltip');
  await expect(tip).toBeHidden();

  await button.hover();
  await expect(tip).toHaveText(hint);
  const [b, t] = [(await button.boundingBox())!, (await tip.boundingBox())!];
  expect(t.y).toBeGreaterThan(b.y + b.height);
  expect(Math.abs(t.x - b.x)).toBeLessThan(2);
  await page.mouse.move(5, 400);
  await expect(tip).toBeHidden();

  await button.focus();
  await expect(tip).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(tip).toBeHidden();
});

test('the dashboard button says it saves courses', async ({ page }) => {
  await page.goto(`${CANVAS}/`);
  await expect(page.getByRole('button', { name: 'Download courses' })).toHaveAccessibleDescription(
    'Course Downloader: save courses to your computer',
  );
});
