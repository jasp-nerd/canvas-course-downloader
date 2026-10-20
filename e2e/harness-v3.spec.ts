// Proves the harness against the v3 build: extension pages load and render.
import { expect, test } from './fixtures.ts';

test('v3 popup and options pages render', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(page.getByRole('heading', { name: 'Canvas Course Downloader' })).toBeVisible();

  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(
    page.getByRole('heading', { name: 'Canvas Course Downloader settings' }),
  ).toBeVisible();
});
