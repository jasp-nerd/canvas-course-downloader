// Proves the harness against the v2.11.0 reference build: the mock Canvas is
// reachable from a real browser with the extension loaded.
import { CANVAS, CUSTOM_DOMAIN_CANVAS, NOT_CANVAS, V2_BUILD, expect, test } from './fixtures.ts';

test.use({ extensionPath: V2_BUILD });

test('v2 adds its buttons to the Canvas dashboard and course page', async ({ page }) => {
  await page.goto(`${CANVAS}/`);
  await expect(page.locator('#canvas-downloader-home-btn')).toBeVisible();

  await page.goto(`${CANVAS}/courses/101`);
  await expect(page.locator('#canvas-downloader-btn')).toBeVisible();
});

test('v2 detects Canvas on a custom domain from page markers', async ({ page }) => {
  await page.goto(`${CUSTOM_DOMAIN_CANVAS}/`);
  await expect(page.locator('#canvas-downloader-home-btn')).toBeVisible();
});

test('v2 adds nothing to a site that is not Canvas', async ({ page }) => {
  await page.goto(`${NOT_CANVAS}/`);
  await page.waitForLoadState('load');
  // The content script runs at document_idle; give it time to (not) act.
  await page.waitForTimeout(1000);
  await expect(page.locator('[id^="canvas-downloader"]')).toHaveCount(0);
});
