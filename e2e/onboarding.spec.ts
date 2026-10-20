import { CANVAS, expect, openActionPopup, resetExtensionStorage, test } from './fixtures';

test('a fresh install opens the welcome page once', ({ startupTabs }) => {
  expect(startupTabs).toHaveLength(1);
  expect(startupTabs[0]).toMatch(/\/welcome\.html$/);
});

test('the welcome page explains the two ways to download, with working images', async ({
  page,
  extensionId,
}) => {
  await page.goto(`chrome-extension://${extensionId}/welcome.html`);
  await expect(page.getByRole('heading', { name: "You're set up" })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Open a course in Canvas/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Or pick several courses/ })).toBeVisible();
  for (const img of await page.getByRole('img').all()) {
    expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(
      true,
    );
  }
});

test('people who updated from v2 see what is new once, in the popup only', async ({
  page,
  serviceWorker,
  cdpPort,
}) => {
  await serviceWorker.evaluate(() =>
    (
      globalThis as unknown as { chrome: { storage: { local: { set(v: object): Promise<void> } } } }
    ).chrome.storage.local.set({ whatsNew: '3.0' }),
  );
  await page.goto(`${CANVAS}/courses/101`);
  await page.bringToFront();
  const first = await openActionPopup(serviceWorker, cdpPort);
  try {
    await expect(first.popup.getByText(/New in 3\.0/)).toBeVisible();
    await first.popup.getByRole('button', { name: 'Got it' }).click();
  } finally {
    await first.close();
  }
  await page.bringToFront();
  const second = await openActionPopup(serviceWorker, cdpPort);
  try {
    await expect(second.popup.getByRole('button', { name: 'Download this course' })).toBeVisible();
    await expect(second.popup.getByText(/New in 3\.0/)).toHaveCount(0);
  } finally {
    await second.close();
  }
});

test("a new user's first download asks what downloads should be, once", async ({
  page,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await serviceWorker.evaluate(() =>
    (
      globalThis as unknown as { chrome: { storage: { local: { set(v: object): Promise<void> } } } }
    ).chrome.storage.local.set({ askProfile: true }),
  );
  const download = async () => {
    await page.goto(`${CANVAS}/courses/104`);
    const next = page.context().waitForEvent('page');
    await page.getByRole('button', { name: 'Download course' }).click();
    return next;
  };

  const tab = await download();
  await expect(tab.getByRole('heading', { name: 'Your first download' })).toBeVisible();
  await expect(tab.getByRole('radio', { name: /^A copy to keep/ })).toBeChecked();
  await expect(tab.getByRole('button', { name: 'Cancel' })).toHaveCount(0);
  await tab.getByRole('radio', { name: /^A study pack for AI/ }).check();
  await expect(tab.getByRole('combobox', { name: 'For' })).toHaveValue('notebooklm');
  await tab.locator('main').screenshot({ path: 'test-results/first-download-question.png' });
  await tab.getByRole('button', { name: 'Start download' }).click();
  await expect(tab.getByRole('heading', { name: 'Export finished' })).toBeVisible({
    timeout: 60_000,
  });
  await expect(tab.locator('.result')).toContainText('Academic Writing - AI study pack.zip');

  const again = await download();
  await expect(again.getByRole('heading', { name: 'Export finished' })).toBeVisible({
    timeout: 60_000,
  });
  await expect(again.getByRole('heading', { name: 'Your first download' })).toHaveCount(0);
});
