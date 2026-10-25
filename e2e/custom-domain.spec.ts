// Many schools run Canvas on their own domain (canvas.vu.nl, ...), which the
// extension has no host permission for. Exports there must work too.
import { readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { waitForDownloads } from './golden/collect';
import {
  CUSTOM_DOMAIN_CANVAS,
  NOT_CANVAS,
  expect,
  resetExtensionStorage,
  test,
  waitForExport,
} from './fixtures';

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
  await waitForExport(tab);
  await expect(
    tab.getByRole('heading', { level: 1, name: 'Academic Writing is saved' }),
  ).toBeVisible();
  await expect(tab.getByText(`${path.basename(downloadsDir)}/Academic Writing.zip`)).toBeVisible();
  await waitForDownloads(downloadsDir);
  expect(readdirSync(downloadsDir)).toEqual(['Academic Writing.zip']);
});

test('remembers the last Canvas opened, so our pages can offer to go back to it', async ({
  page,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  const lastCanvas = () =>
    serviceWorker.evaluate(async () => {
      const { storage } = (
        globalThis as unknown as {
          chrome: { storage: { local: { get(k: string): Promise<Record<string, unknown>> } } };
        }
      ).chrome;
      return (await storage.local.get('lastCanvas')).lastCanvas;
    });
  const before = Date.now();
  await page.goto(`${CUSTOM_DOMAIN_CANVAS}/courses/104`);
  await expect.poll(lastCanvas).toEqual({ origin: CUSTOM_DOMAIN_CANVAS, at: expect.any(Number) });
  expect(((await lastCanvas()) as { at: number }).at).toBeGreaterThanOrEqual(before);

  // Other websites aren't Canvas.
  await page.goto(NOT_CANVAS);
  await page.waitForLoadState('load');
  expect(((await lastCanvas()) as { origin: string }).origin).toBe(CUSTOM_DOMAIN_CANVAS);
});
