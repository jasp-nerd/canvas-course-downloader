import {
  CANVAS,
  expect,
  openActionPopup,
  resetExtensionStorage,
  test,
  waitForExport,
} from './fixtures';

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
  // Other tests' Export tabs may still be open in this browser.
  const exportTabs = () =>
    page
      .context()
      .pages()
      .filter((p) => p.url().includes('/export.html')).length;
  const tabsBefore = exportTabs();
  await page.goto(`${CANVAS}/courses/104`);
  await page.getByRole('button', { name: 'Download course' }).click();
  const question = page.getByRole('dialog', { name: 'What should your downloads be?' });
  await expect(question.getByRole('radio', { name: /^A copy to keep/ })).toBeChecked();
  // Closing it starts nothing, and asks again next time.
  await question.getByRole('button', { name: 'Close' }).click();
  await expect(question).toBeHidden();
  expect(exportTabs()).toBe(tabsBefore);

  await page.getByRole('button', { name: 'Download course' }).click();
  await question.getByRole('radio', { name: /^A study pack for AI/ }).check();
  await expect(question.getByRole('combobox', { name: 'For' })).toHaveValue('notebooklm');
  await page.screenshot({ path: 'test-results/first-download-question.png' });
  const exportTab = page.context().waitForEvent('page');
  await question.getByRole('button', { name: 'Start download' }).click();
  const tab = await exportTab;
  await waitForExport(tab);
  await expect(
    tab.getByRole('heading', { level: 1, name: 'Your study pack is ready' }),
  ).toBeVisible();
  await expect(tab.getByText(/\/Academic Writing - AI study pack\.zip$/)).toBeVisible();

  // Asked once: the next download starts straight away.
  const next = page.context().waitForEvent('page');
  await page.getByRole('button', { name: 'Download course' }).click();
  await expect(question).toBeHidden();
  await waitForExport(await next);
});
