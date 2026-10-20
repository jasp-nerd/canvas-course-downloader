// The dashboard flow: "Download courses" opens a picker over Canvas.
import { readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { waitForDownloads } from './golden/collect';
import { CANVAS, expect, resetExtensionStorage, test } from './fixtures';

test.beforeEach(async ({ serviceWorker, downloadsDir }) => {
  await resetExtensionStorage(serviceWorker, {});
  for (const entry of readdirSync(downloadsDir))
    rmSync(path.join(downloadsDir, entry), { recursive: true });
});

async function openPicker(page: import('@playwright/test').Page) {
  await page.goto(`${CANVAS}/`);
  await page.getByRole('button', { name: 'Download courses' }).click();
  const dialog = page.getByRole('dialog', { name: 'Download courses' });
  await expect(dialog.getByRole('group', { name: /Fall 2026/ })).toBeVisible();
  return dialog;
}

test('exports courses picked from Current and Past, keeping the selection across tabs', async ({
  page,
  downloadsDir,
}) => {
  const dialog = await openPicker(page);
  await dialog.getByRole('checkbox', { name: /Linear Algebra/ }).check();
  await dialog.getByRole('tab', { name: 'Past' }).click();
  await dialog.getByRole('checkbox', { name: /Calculus I/ }).check();
  await dialog.getByRole('tab', { name: 'Current' }).click();
  await expect(dialog.getByRole('checkbox', { name: /Linear Algebra/ })).toBeChecked();

  const exportTab = page.context().waitForEvent('page');
  await dialog.getByRole('button', { name: 'Download 2 courses' }).click();
  await expect(dialog).toBeHidden();
  const tab = await exportTab;
  await expect(tab.getByRole('heading', { name: 'Export finished' })).toBeVisible({
    timeout: 60_000,
  });
  await expect(tab.locator('[data-outcome="success"]')).toHaveCount(2);
  await waitForDownloads(downloadsDir);
  expect(readdirSync(downloadsDir).sort()).toEqual(['Calculus I.zip', 'Linear Algebra.zip']);
});

test('select all picks only the courses matching the search', async ({ page }) => {
  const dialog = await openPicker(page);
  // Matches CS 210, CS 340 and "Microeconomics" (name contains "cs").
  await dialog.getByLabel('Search courses').fill('cs');
  await dialog.getByRole('checkbox', { name: 'Select all matching' }).check();
  await expect(dialog.getByRole('button', { name: 'Download 3 courses' })).toBeEnabled();
  await dialog.getByLabel('Search courses').fill('');
  await expect(dialog.getByRole('checkbox', { name: /Linear Algebra/ })).not.toBeChecked();
});

test('says the user is signed out instead of "no courses"', async ({ page, mock }) => {
  await page.goto(`${CANVAS}/`);
  mock.state.signedIn = false;
  await page.getByRole('button', { name: 'Download courses' }).click();
  await expect(page.getByRole('dialog').getByText("You're signed out of Canvas")).toBeVisible();
});

test('Escape closes the picker', async ({ page }) => {
  const dialog = await openPicker(page);
  await expect(dialog.getByLabel('Search courses')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('a click outside closes the picker', async ({ page }) => {
  const dialog = await openPicker(page);
  await page.mouse.click(5, 5);
  await expect(dialog).toBeHidden();
});

test('opens above Canvas, whose main column is its own stacking layer', async ({ page }) => {
  await openPicker(page);
  // A hit inside the picker's shadow root reports its host element.
  const onTop = await page.evaluate(() =>
    document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.tagName.toLowerCase(),
  );
  expect(onTop).toBe('ccd-course-picker');
});
