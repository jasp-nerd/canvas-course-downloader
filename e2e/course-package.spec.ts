// Canvas's own course package (.imscc) for teachers: the one write request the
// extension makes, with Canvas's security token that only the Canvas page can read.
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { Worker } from '@playwright/test';
import type { browser } from 'wxt/browser';
import { CSRF_TOKEN } from './mock-canvas/server';
import { CANVAS, expect, resetExtensionStorage, test, waitForExport } from './fixtures';

type Chrome = { chrome: typeof browser };
/** Course 107 in the mock is one the user teaches. */
const TAUGHT = 107;

const sessionKeys = (sw: Worker) =>
  sw.evaluate(async () =>
    Object.keys(await (globalThis as unknown as Chrome).chrome.storage.session.get(null)),
  );
const packageRequests = (log: { method: string; path: string }[]) =>
  log.filter((r) => r.method === 'POST' && r.path.endsWith('/content_exports'));

test("a teacher's copy also brings Canvas's package, asked for with the page's token", async ({
  page,
  serviceWorker,
  mock,
  downloadsDir,
}) => {
  await resetExtensionStorage(serviceWorker, { coursePackage: true, profile: 'copy' });
  await page.goto(`${CANVAS}/courses/${TAUGHT}`);
  const next = page.context().waitForEvent('page');
  await page.getByRole('button', { name: 'Download course', exact: true }).click();
  const tab = await next;
  expect(tab.url()).not.toContain('token');
  await waitForExport(tab);

  const row = tab.getByRole('region').filter({ hasText: 'Canvas course package (.imscc) saved' });
  await expect(row).toBeVisible({ timeout: 30_000 });
  expect(mock.state.lastCsrfToken).toBe(CSRF_TOKEN);
  expect(packageRequests(mock.log)).toHaveLength(1);
  // Used once and gone: nothing keeps the token after the export tab took it.
  expect(await sessionKeys(serviceWorker)).toEqual([]);
  await expect
    .poll(() =>
      existsSync(downloadsDir) ? readdirSync(downloadsDir).filter((f) => f.endsWith('.imscc')) : [],
    )
    .toEqual([expect.stringMatching(/ - Canvas course package\.imscc$/)]);
  expect(path.basename(downloadsDir)).toBeTruthy();
});

test('without the option, Canvas is never asked and the token never read', async ({
  page,
  serviceWorker,
  mock,
}) => {
  await resetExtensionStorage(serviceWorker, { profile: 'copy' });
  await page.goto(`${CANVAS}/courses/${TAUGHT}`);
  const next = page.context().waitForEvent('page');
  await page.getByRole('button', { name: 'Download course', exact: true }).click();
  const tab = await next;
  await waitForExport(tab);
  expect(packageRequests(mock.log)).toEqual([]);
  expect(await sessionKeys(serviceWorker)).toEqual([]);
  await expect(tab.getByText('Canvas course package')).toHaveCount(0);
});

test('in a course the user takes, there is no package, even with the option on', async ({
  page,
  serviceWorker,
  mock,
}) => {
  await resetExtensionStorage(serviceWorker, { coursePackage: true, profile: 'copy' });
  await page.goto(`${CANVAS}/courses/101`);
  const next = page.context().waitForEvent('page');
  await page.getByRole('button', { name: 'Download course', exact: true }).click();
  const tab = await next;
  await waitForExport(tab);
  expect(packageRequests(mock.log)).toEqual([]);
});
