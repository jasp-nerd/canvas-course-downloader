// Many schools run Canvas on their own domain (canvas.vu.nl, ...), which the
// extension has no host permission for. Exports there must work too.
import { readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { waitForDownloads } from './golden/collect';
import { CUSTOM_DOMAIN_CANVAS, expect, resetExtensionStorage, test } from './fixtures';

test.beforeEach(({ downloadsDir }) => {
  for (const entry of readdirSync(downloadsDir))
    rmSync(path.join(downloadsDir, entry), { recursive: true });
});

test('exports a course from Canvas on a school domain', async ({
  page,
  serviceWorker,
  downloadsDir,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await page.goto(`${CUSTOM_DOMAIN_CANVAS}/courses/104`);
  const next = page.context().waitForEvent('page');
  await page.getByRole('button', { name: 'Download course' }).click();
  const tab = await next;
  await expect(tab.getByRole('heading', { name: 'Export finished' })).toBeVisible({
    timeout: 60_000,
  });
  await expect(tab.locator('.result')).toHaveText(
    /^Saved \d+ files to Downloads\/Academic Writing\.zip$/,
  );
  await waitForDownloads(downloadsDir);
  expect(readdirSync(downloadsDir)).toEqual(['Academic Writing.zip']);
});
