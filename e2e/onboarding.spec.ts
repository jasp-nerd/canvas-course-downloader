import type { Page, Worker } from '@playwright/test';
import type { browser } from 'wxt/browser';
import {
  CANVAS,
  expect,
  openActionPopup,
  resetExtensionStorage,
  test,
  waitForExport,
} from './fixtures';

type Chrome = { chrome: typeof browser };

const syncSettings = (sw: Worker) =>
  sw.evaluate(() => (globalThis as unknown as Chrome).chrome.storage.sync.get(null));
const askProfile = (sw: Worker) =>
  sw.evaluate(async () => {
    const local = await (globalThis as unknown as Chrome).chrome.storage.local.get('askProfile');
    return local.askProfile;
  });

/** Opens setup as a new user (whom install marks to be asked at the first download); returns console errors. */
async function openSetup(page: Page, sw: Worker, extensionId: string, local = {}) {
  await resetExtensionStorage(sw, {});
  await sw.evaluate(
    (more) =>
      (globalThis as unknown as Chrome).chrome.storage.local.set({ askProfile: true, ...more }),
    local,
  );
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`chrome-extension://${extensionId}/welcome.html`);
  return errors;
}

async function expectImagesLoaded(page: Page) {
  const images = page.locator('img');
  await expect(images.first()).toBeVisible();
  for (const img of await images.all()) {
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
      .toBe(true);
  }
}

/** Picks an answer the way people do, on its label: the radio itself is visually hidden. */
async function choose(page: Page, name: string | RegExp) {
  const radio = page.getByRole('radio', { name });
  await page.locator('label', { has: radio }).click();
  await expect(radio).toBeChecked();
}

const heading = (page: Page, name: string) => page.getByRole('heading', { name, level: 1 });
const SET = "You're all set";
const SAVE = 'How should we save your courses?';
const summary = (page: Page) =>
  page.getByRole('list', { name: 'Your downloads' }).getByRole('listitem');

test('a fresh install opens setup once', ({ startupTabs }) => {
  expect(startupTabs).toHaveLength(1);
  expect(startupTabs[0]).toMatch(/\/welcome\.html$/);
});

test('keeping a copy: a ZIP in Downloads that next time only adds what is new', async ({
  page,
  serviceWorker,
  extensionId,
}) => {
  const errors = await openSetup(page, serviceWorker, extensionId);
  await expect(heading(page, 'Never lose a course again')).toBeVisible();
  await expectImagesLoaded(page);
  const allowed = page.getByRole('button', { name: /Is this allowed at my school/ });
  await allowed.click();
  await expect(allowed).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText(/Your teacher isn't notified/)).toBeVisible();

  await page.getByRole('button', { name: 'Get started' }).click();
  await expect(heading(page, 'What do you want to do with your courses?')).toBeFocused();
  await expect(page.getByRole('img', { name: 'Step 2 of 4' })).toBeVisible();
  await expect(page.getByRole('radio', { name: /^Keep a copy/ })).toBeChecked();
  await expect(page.getByText(/^Open me - Linear Algebra\.html/)).toBeVisible();
  await expectImagesLoaded(page);

  // A double-click moves one screen on: the next screen's Continue sits under the cursor.
  await page.getByRole('button', { name: 'Continue' }).dblclick();
  await expect(heading(page, SAVE)).toBeFocused();
  await expect(page.getByRole('radio', { name: /^One ZIP per course/ })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Downloads' })).toBeChecked();
  await expect(page.getByRole('switch', { name: /only add what's new/ })).toBeChecked();
  await expectImagesLoaded(page);

  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(heading(page, SET)).toBeFocused();
  await expect(summary(page)).toHaveText([
    'A copy to keep',
    'One ZIP per course',
    'Downloads',
    "Only what's new",
  ]);
  await expect(page.getByRole('button', { name: 'Done' })).toBeVisible();
  await expect(page.getByText('Open any Canvas course; the button with our logo')).toBeVisible();
  await expectImagesLoaded(page);
  await expect
    .poll(() => syncSettings(serviceWorker))
    .toEqual({
      profile: 'copy',
      role: 'student',
      includeStudentWork: false,
      zipMode: true,
      saveTo: 'downloads',
      incrementalMode: true,
    });
  expect(await askProfile(serviceWorker)).toBeUndefined();
  expect(errors).toEqual([]);
});

test('studying with AI, by keyboard: Enter continues and focus moves to each question', async ({
  page,
  serviceWorker,
  extensionId,
}) => {
  const errors = await openSetup(page, serviceWorker, extensionId);
  await page.getByRole('button', { name: 'Get started' }).press('Enter');
  await expect(heading(page, 'What do you want to do with your courses?')).toBeFocused();
  await choose(page, /^Study with AI/);
  await expect(page.getByRole('img', { name: 'Step 2 of 5' })).toBeVisible();
  await expect(page.getByText('00 Course guide.md', { exact: true })).toBeVisible();
  await page.keyboard.press('Enter');

  await expect(heading(page, 'Which AI tool do you use?')).toBeFocused();
  const tools = page.getByRole('radiogroup', { name: 'AI tool' }).getByRole('radio');
  await expect(tools).toHaveCount(5);
  await expect(page.getByRole('radio', { name: /^NotebookLM Up to 50 files/ })).toBeChecked();
  await choose(page, /^Claude project Up to 20 files/);
  await expect(page.getByText('Your study pack for Claude')).toBeVisible();
  await expectImagesLoaded(page);
  await page.keyboard.press('Enter');

  await expect(heading(page, SAVE)).toBeFocused();
  await expect(page.getByRole('radio', { name: /^Folders/ })).toBeChecked();
  await expect(page.getByText('Folders are easier to drag into your AI tool.')).toBeVisible();
  // A study pack is always made whole, so "only what's new" isn't offered.
  await expect(page.getByRole('switch')).toHaveCount(0);
  await page.keyboard.press('Enter');

  await expect(heading(page, SET)).toBeFocused();
  await expect(summary(page)).toHaveText(['Study pack for Claude project', 'Folders', 'Downloads']);
  await expect
    .poll(() => syncSettings(serviceWorker))
    .toEqual({
      profile: 'study',
      aiTarget: 'claude',
      role: 'student',
      includeStudentWork: false,
      zipMode: false,
      saveTo: 'downloads',
      incrementalMode: true,
    });
  expect(await askProfile(serviceWorker)).toBeUndefined();
  expect(errors).toEqual([]);
});

test('building with code, then going back to the Canvas last used', async ({
  page,
  serviceWorker,
  extensionId,
}) => {
  const errors = await openSetup(page, serviceWorker, extensionId, {
    lastCanvas: { origin: CANVAS, at: Date.now() },
  });
  await page.getByRole('button', { name: 'Get started' }).click();
  await choose(page, /^Build with code/);
  await expect(page.getByText('AGENTS.md', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(heading(page, SAVE)).toBeVisible();
  await page.getByRole('switch', { name: /only add what's new/ }).uncheck();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(heading(page, SET)).toBeVisible();
  await expect(summary(page)).toHaveText([
    'Files for coding agents',
    'One ZIP per course',
    'Downloads',
    'Whole course each time',
  ]);
  await expect
    .poll(() => syncSettings(serviceWorker))
    .toEqual({
      profile: 'agents',
      role: 'student',
      includeStudentWork: false,
      zipMode: true,
      saveTo: 'downloads',
      incrementalMode: false,
    });
  expect(errors).toEqual([]);
  const go = page.getByRole('link', { name: `Go to ${new URL(CANVAS).host}` });
  await expect(go).toHaveAttribute('href', CANVAS);
  await go.click();
  await expect(page).toHaveURL(`${CANVAS}/`);
});

test('archiving a course I teach leaves student work out unless chosen', async ({
  page,
  serviceWorker,
  extensionId,
}) => {
  const errors = await openSetup(page, serviceWorker, extensionId);
  await page.getByRole('button', { name: 'Get started' }).click();
  await choose(page, /^Archive a course I teach/);
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(heading(page, "Leave your students' work out?")).toBeFocused();
  await expect(page.getByRole('radio', { name: /^Course content only/ })).toBeChecked();
  await expect(page.getByText('Student data: none included')).toBeVisible();
  await expectImagesLoaded(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(heading(page, SET)).toBeVisible();
  await expect(summary(page)).toHaveText([
    'Course archive',
    'No student data',
    'One ZIP per course',
    'Downloads',
    "Only what's new",
  ]);
  await expect
    .poll(() => syncSettings(serviceWorker))
    .toMatchObject({
      profile: 'copy',
      role: 'teacher',
      includeStudentWork: false,
    });

  // Back on every screen after the first; the summary follows the new answer.
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(heading(page, SAVE)).toBeFocused();
  await page.getByRole('button', { name: 'Back' }).click();
  await choose(page, /^Content and student work/);
  await expect(page.getByText('Student data: submissions, grades and names')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(summary(page)).toHaveText([
    'Course archive',
    'With student work',
    'One ZIP per course',
    'Downloads',
    "Only what's new",
  ]);
  await expect
    .poll(() => syncSettings(serviceWorker))
    .toEqual({
      profile: 'copy',
      role: 'teacher',
      includeStudentWork: true,
      zipMode: true,
      saveTo: 'downloads',
      incrementalMode: true,
    });
  expect(errors).toEqual([]);
});

test('skipping setup saves nothing, and the first download still asks', async ({
  page,
  serviceWorker,
  extensionId,
}) => {
  const errors = await openSetup(page, serviceWorker, extensionId);
  await page.getByRole('button', { name: 'Get started' }).click();
  await choose(page, /^Study with AI/);
  await page.getByRole('button', { name: 'Skip setup' }).click();

  await expect(heading(page, SET)).toBeFocused();
  await expect(page.getByText("We'll ask what you want at your first download.")).toBeVisible();
  await expect(summary(page)).toHaveCount(0);
  expect(await syncSettings(serviceWorker)).toEqual({});
  expect(await askProfile(serviceWorker)).toBe(true);
  expect(errors).toEqual([]);

  await page.goto(`${CANVAS}/courses/104`);
  await page.getByRole('button', { name: 'Download course' }).click();
  const question = page.getByRole('dialog', { name: 'What should your downloads be?' });
  await expect(question).toBeVisible();
  await question.getByRole('button', { name: 'Close' }).click();
});

test('saving into a folder I choose, where the browser can', async ({
  page,
  serviceWorker,
  extensionId,
}) => {
  // The real folder picker can't be automated; a folder in the browser's private file system stands in.
  await page.addInitScript(() => {
    window.showDirectoryPicker = async () =>
      (await navigator.storage.getDirectory()).getDirectoryHandle('Course backups', {
        create: true,
      });
  });
  const errors = await openSetup(page, serviceWorker, extensionId);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await choose(page, 'A folder I choose');
  await expect(page.getByText('In Course backups')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(summary(page)).toHaveText([
    'A copy to keep',
    'One ZIP per course',
    'Course backups',
    "Only what's new",
  ]);
  await expect.poll(() => syncSettings(serviceWorker)).toMatchObject({ saveTo: 'folder' });
  const stored = await page.evaluate(
    () =>
      new Promise<string | undefined>((resolve, reject) => {
        const open = indexedDB.open('canvas-course-downloader', 1);
        open.onerror = () => reject(new Error('IndexedDB unavailable'));
        open.onsuccess = () => {
          const get = open.result.transaction('handles').objectStore('handles').get('saveFolder');
          get.onsuccess = () =>
            resolve((get.result as FileSystemDirectoryHandle | undefined)?.name);
        };
      }),
  );
  expect(stored).toBe('Course backups');
  expect(errors).toEqual([]);
});

test('where the browser cannot choose a folder, setup says courses go to Downloads', async ({
  page,
  serviceWorker,
  extensionId,
}) => {
  // As in Firefox and Brave.
  await page.addInitScript(() => {
    window.showDirectoryPicker = undefined;
  });
  const errors = await openSetup(page, serviceWorker, extensionId);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('radio', { name: 'A folder I choose' })).toBeDisabled();
  await expect(page.getByText(/This browser can only save to Downloads/)).toBeVisible();
  expect(errors).toEqual([]);
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

test("the v3 note opens a What's new page, with the changes and a way to support them", async ({
  page,
  serviceWorker,
  cdpPort,
  extensionId,
}) => {
  await serviceWorker.evaluate(() =>
    (
      globalThis as unknown as { chrome: { storage: { local: { set(v: object): Promise<void> } } } }
    ).chrome.storage.local.set({ whatsNew: '3.0' }),
  );
  await page.goto(`${CANVAS}/courses/101`);
  await page.bringToFront();
  const { popup, close } = await openActionPopup(serviceWorker, cdpPort);
  const opened = page.context().waitForEvent('page');
  try {
    await popup.getByRole('button', { name: "See what's new" }).click();
  } finally {
    await close();
  }
  const news = await opened;
  const errors: string[] = [];
  news.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  expect(news.url()).toBe(`chrome-extension://${extensionId}/whats-new.html`);
  await expect(news.getByRole('heading', { level: 1, name: "What's new in 3.0" })).toBeVisible();
  await expect(news.getByRole('heading', { name: 'Exports run in their own tab' })).toBeVisible();
  const support = news.getByRole('region', { name: 'Help keep it free' });
  await expect(support.getByRole('link', { name: /^€3 / })).toHaveAttribute(
    'href',
    'https://ko-fi.com/jaspnerd?utm_source=extension&utm_medium=whats-new',
  );
  await expect(news.getByRole('link', { name: 'Every change on GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/jasp-nerd/canvas-course-downloader/releases',
  );
  // Opening the page counts as having seen the note.
  await expect
    .poll(() =>
      serviceWorker.evaluate(() =>
        (
          globalThis as unknown as {
            chrome: { storage: { local: { get(k: string): Promise<Record<string, unknown>> } } };
          }
        ).chrome.storage.local.get('whatsNew'),
      ),
    )
    .toEqual({});
  expect(errors).toEqual([]);
  await news.close();
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
