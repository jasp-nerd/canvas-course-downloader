// Canvas's own course package (.imscc) for teachers: the one write request the
// extension makes needs Canvas's security token, which only the Canvas page can read.
import type { Worker } from '@playwright/test';
import type { browser } from 'wxt/browser';
import { CANVAS, expect, resetExtensionStorage, test } from './fixtures';

type Chrome = { chrome: typeof browser };
const sessionToken = (sw: Worker) =>
  sw.evaluate(async (key) => {
    const stored = await (globalThis as unknown as Chrome).chrome.storage.session.get(key);
    return stored[key] as string | undefined;
  }, `csrf:${CANVAS}`);

test("the page's security token reaches the export, in memory only, when the package is on", async ({
  page,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, { coursePackage: true, profile: 'copy' });
  await serviceWorker.evaluate(() =>
    (globalThis as unknown as Chrome).chrome.storage.session.clear(),
  );
  await page
    .context()
    .addCookies([{ name: '_csrf_token', value: 'mock%2Btoken%3D%3D', url: CANVAS, secure: true }]);
  await page.goto(`${CANVAS}/courses/101`);
  const tab = page.context().waitForEvent('page');
  await page.getByRole('button', { name: 'Download course' }).click();
  const exportTab = await tab;
  expect(exportTab.url()).not.toContain('mock');
  await expect.poll(() => sessionToken(serviceWorker)).toBe('mock+token==');
  await exportTab.close();
});

test('without the package, the token is never read or passed on', async ({
  page,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, { profile: 'copy' });
  await serviceWorker.evaluate(() =>
    (globalThis as unknown as Chrome).chrome.storage.session.clear(),
  );
  await page
    .context()
    .addCookies([{ name: '_csrf_token', value: 'mock%2Btoken%3D%3D', url: CANVAS, secure: true }]);
  await page.goto(`${CANVAS}/courses/101`);
  const tab = page.context().waitForEvent('page');
  await page.getByRole('button', { name: 'Download course' }).click();
  const exportTab = await tab;
  await exportTab.waitForLoadState();
  expect(await sessionToken(serviceWorker)).toBeUndefined();
  await exportTab.close();
});
