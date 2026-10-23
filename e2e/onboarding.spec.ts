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
  await expect(question.getByText('Course Downloader', { exact: true })).toBeVisible();
  await expect(question.getByRole('radio', { name: /^A copy to keep/ })).toBeChecked();
  await expect(question.getByRole('radio', { name: /^Files for code/ })).not.toBeChecked();
  // Sam takes this course: nothing to decide about students' work.
  await expect(question.getByRole('switch')).toHaveCount(0);
  // The title is in Gabarito, which the page got from the background.
  const title = question.getByRole('heading', { name: 'What should your downloads be?' });
  expect(await title.evaluate((h) => getComputedStyle(h).fontFamily)).toMatch(/^"?Gabarito/);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          [...document.fonts].some((f) => f.family === 'Gabarito' && f.status === 'loaded') &&
          document.fonts.check('800 28px Gabarito'),
      ),
    )
    .toBe(true);
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
  await expect(tab.getByRole('heading', { name: 'Export finished' })).toBeVisible({
    timeout: 60_000,
  });
  await expect(tab.locator('.result')).toContainText('Academic Writing - AI study pack.zip');

  // Asked once: the next download starts straight away.
  const next = page.context().waitForEvent('page');
  await page.getByRole('button', { name: 'Download course' }).click();
  await expect(question).toBeHidden();
  await expect((await next).getByRole('heading', { name: 'Export finished' })).toBeVisible({
    timeout: 60_000,
  });
});

type Store = { set(v: object): Promise<void>; get(k: null): Promise<Record<string, unknown>> };
type Chrome = { chrome: { storage: { local: Store; sync: Store } } };

test("a teacher's first download also asks whether to include students' work", async ({
  page,
  serviceWorker,
  mock,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await serviceWorker.evaluate(() =>
    (globalThis as unknown as Chrome).chrome.storage.local.set({ askProfile: true }),
  );
  await page.goto(`${CANVAS}/courses/107`);
  await page.getByRole('button', { name: 'Download course' }).click();
  const question = page.getByRole('dialog', { name: 'What should your downloads be?' });
  await expect(question.getByText('You teach this course')).toBeVisible();
  const studentWork = question.getByRole('switch', { name: "Include students' work" });
  await expect(studentWork).not.toBeChecked();
  await expect(studentWork).toHaveAccessibleDescription(
    'Off: every page, file, quiz with answers and rubric, no student data. On: adds submissions, grades and names.',
  );
  await studentWork.check();

  // The choice is under test here, not the export: signed out, the export stops at once.
  mock.state.signedIn = false;
  const exportTab = page.context().waitForEvent('page');
  await question.getByRole('button', { name: 'Start download' }).click();
  await expect(question).toBeHidden();
  await (await exportTab).close();
  expect(
    await serviceWorker.evaluate(() =>
      (globalThis as unknown as Chrome).chrome.storage.sync.get(null),
    ),
  ).toEqual({ profile: 'copy', includeStudentWork: true });
});
