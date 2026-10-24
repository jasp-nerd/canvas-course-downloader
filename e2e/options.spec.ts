import type { Page, Worker } from '@playwright/test';
import { expect, resetExtensionStorage, test } from './fixtures';

const stored = (sw: Worker) =>
  sw.evaluate(() =>
    (
      globalThis as unknown as {
        chrome: { storage: { sync: { get(k: null): Promise<Record<string, unknown>> } } };
      }
    ).chrome.storage.sync.get(null),
  );

const open = (page: Page, extensionId: string, view = '') =>
  page.goto(`chrome-extension://${extensionId}/options.html${view}`);

test('shows settings v2 stored, and saves changes under the same keys', async ({
  page,
  extensionId,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, {
    zipMode: false,
    folderPrefix: 'Canvas',
    exportFormat: 'markdown',
    contentTypes: { files: true, pages: false },
  });
  await open(page, extensionId);
  await expect(page.getByRole('heading', { level: 1, name: 'Downloads' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Folders' })).toBeChecked();

  await open(page, extensionId, '#saving');
  await expect(page.getByLabel('Folder inside Downloads')).toHaveValue('Canvas');
  await open(page, extensionId, '#advanced');
  await expect(page.getByRole('radio', { name: /^Markdown/ })).toBeChecked();
  await open(page, extensionId, '#included');
  await expect(page.getByRole('checkbox', { name: /^Pages/ })).not.toBeChecked();

  await open(page, extensionId, '#downloads');
  await page.getByRole('radio', { name: 'One ZIP per course' }).check();
  await expect(page.getByRole('status')).toHaveText('Saved');
  expect(await stored(serviceWorker)).toMatchObject({ zipMode: true, folderPrefix: 'Canvas' });
});

test('each part of Settings is its own view with its own address', async ({
  page,
  extensionId,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await open(page, extensionId);
  const nav = page.getByRole('navigation', { name: 'Settings' });
  await expect(nav.getByRole('link', { name: 'Downloads' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  for (const [name, hash] of [
    ["What's included", '#included'],
    ['Saving', '#saving'],
    ['Advanced', '#advanced'],
    ['Help & support', '#help'],
    ['Downloads', '#downloads'],
  ]) {
    await nav.getByRole('link', { name }).click();
    await expect(page).toHaveURL(new RegExp(`${hash}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(name!);
    await expect(nav.getByRole('link', { name })).toHaveAttribute('aria-current', 'page');
  }
  await open(page, extensionId, '#advanced');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Advanced');
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Downloads');
});

test('"Saved" shows for a moment after each change', async ({
  page,
  extensionId,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await open(page, extensionId);
  await expect(page.getByRole('status')).toHaveText('');
  await page.getByRole('switch', { name: /^Only add what's new/ }).check();
  await expect(page.getByRole('status')).toHaveText('Saved');
  await expect(page.getByRole('status')).toHaveText('', { timeout: 3000 });
  expect(await stored(serviceWorker)).toMatchObject({ incrementalMode: true });

  await page.getByRole('switch', { name: /^Download new files automatically/ }).check();
  await expect(page.getByText('courses you saved are checked every few hours')).toBeVisible();
  await expect.poll(() => stored(serviceWorker)).toMatchObject({ autoDownloadNew: true });
});

test('presets set the content types and survive a reload', async ({
  page,
  extensionId,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await open(page, extensionId, '#included');
  await expect(page.getByRole('radio', { name: 'Everything' })).toBeChecked();
  await page.getByRole('radio', { name: 'Files only' }).check();
  await expect(page.getByRole('checkbox', { name: /^Assignments/ })).not.toBeChecked();
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Files only' })).toBeChecked();
  expect(await stored(serviceWorker)).toMatchObject({
    preset: 'files-only',
    contentTypes: { files: true, assignments: false },
  });

  await page.getByRole('checkbox', { name: /^Syllabus/ }).check();
  await expect(page.getByText('Custom')).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Files only' })).not.toBeChecked();
});

test('rejects a size limit that is not a whole number', async ({
  page,
  extensionId,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await open(page, extensionId, '#advanced');
  const size = page.getByLabel(/Files larger than/);
  await size.fill('-5');
  await size.blur();
  await expect(page.getByText('Enter a whole number of megabytes')).toBeVisible();
  expect(await stored(serviceWorker)).not.toHaveProperty('maxFileSizeMB');
  await size.fill('50');
  await size.blur();
  await expect(page.getByRole('status')).toHaveText('Saved');
  expect(await stored(serviceWorker)).toMatchObject({ maxFileSizeMB: 50 });

  await page.getByRole('switch', { name: /^Skip videos/ }).check();
  await expect.poll(() => stored(serviceWorker)).toMatchObject({ excludeVideos: true });
  await expect(page.getByRole('button', { name: 'Allow access' })).toBeVisible();
});

test('a study pack is chosen with the AI tool it is for, and needs no format', async ({
  page,
  extensionId,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await open(page, extensionId);
  await expect(page.getByRole('radio', { name: /^A copy to keep/ })).toBeChecked();
  await expect(page.getByRole('combobox', { name: 'For' })).toHaveCount(0);

  await page.getByRole('radio', { name: /^A study pack/ }).check();
  await expect(page.getByRole('combobox', { name: 'For' })).toHaveValue('notebooklm');
  await expect(page.getByText('A notebook in NotebookLM takes up to 50 files.')).toBeVisible();
  await page.getByRole('combobox', { name: 'For' }).selectOption('claude');
  await expect(
    page.getByText(
      'A project in Claude takes up to 20 files. A bigger course is split into projects',
    ),
  ).toBeVisible();
  await expect(page.getByRole('radio', { name: /^A study pack/ })).toHaveAccessibleName(
    /Sized for Claude/,
  );
  expect(await stored(serviceWorker)).toMatchObject({ profile: 'study', aiTarget: 'claude' });

  await open(page, extensionId, '#advanced');
  await expect(page.getByRole('radio', { name: /^Markdown/ })).toHaveCount(0);
  await expect(page.getByText('Study packs and files for code are always Markdown.')).toBeVisible();

  await open(page, extensionId, '#downloads');
  await page.getByRole('radio', { name: /^Files for code/ }).check();
  await expect(page.getByRole('combobox', { name: 'For' })).toHaveCount(0);
  await expect.poll(() => stored(serviceWorker)).toMatchObject({ profile: 'agents' });
});

test("teachers choose whether students' work is saved, off unless they turn it on", async ({
  page,
  extensionId,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await open(page, extensionId);
  const studentWork = page.getByRole('switch', {
    name: /^Include students' work in courses you teach/,
  });
  await expect(page.getByRole('radio', { name: 'A student' })).toBeChecked();
  await expect(studentWork).toHaveCount(0);

  await page.getByRole('radio', { name: 'A teacher' }).check();
  await expect(studentWork).not.toBeChecked();
  await expect(page.getByText('Submissions, grades and names.')).toBeVisible();
  await studentWork.check();
  await expect
    .poll(() => stored(serviceWorker))
    .toMatchObject({ role: 'teacher', includeStudentWork: true });

  await page.getByRole('radio', { name: 'A student' }).check();
  await expect(studentWork).toHaveCount(0);
  await expect.poll(() => stored(serviceWorker)).toMatchObject({ role: 'student' });
});

test('a chosen folder is shown with a Change button; closing the picker changes nothing', async ({
  page,
  extensionId,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await page.addInitScript(() => {
    // The real picker can't be automated: a folder in the page's private file system stands in.
    const w = window as unknown as Record<string, unknown>;
    w.showDirectoryPicker = async () => {
      if (w.pickerResult === 'abort') throw new DOMException('closed', 'AbortError');
      if (w.pickerResult === 'fail') throw new DOMException('denied', 'NotAllowedError');
      const root = await navigator.storage.getDirectory();
      return root.getDirectoryHandle('Canvas backup', { create: true });
    };
  });
  await open(page, extensionId);
  const folderOption = page.getByRole('radio', { name: /^A folder you choose/ });
  await expect(page.getByRole('radio', { name: /^Downloads folder/ })).toBeChecked();
  await expect(
    page.getByText('Pick or create a folder inside Downloads or Documents, not the folder itself.'),
  ).toBeVisible();

  await page.evaluate(
    () => ((window as unknown as Record<string, unknown>).pickerResult = 'abort'),
  );
  await folderOption.click();
  await expect(page.getByRole('radio', { name: /^Downloads folder/ })).toBeChecked();
  await expect(page.getByRole('alert')).toHaveCount(0);

  await page.evaluate(() => ((window as unknown as Record<string, unknown>).pickerResult = 'fail'));
  await folderOption.click();
  await expect(page.getByRole('alert')).toHaveText(
    "That folder couldn't be used. Try another one, or save to Downloads.",
  );
  await expect(page.getByRole('radio', { name: /^Downloads folder/ })).toBeChecked();

  await page.evaluate(() => ((window as unknown as Record<string, unknown>).pickerResult = 'ok'));
  await folderOption.click();
  await expect(folderOption).toBeChecked();
  await expect(page.getByText('Canvas backup')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Change' })).toBeVisible();
  await expect.poll(() => stored(serviceWorker)).toMatchObject({ saveTo: 'folder' });
  await open(page, extensionId, '#saving');
  await expect(page.getByLabel('Folder inside Canvas backup')).toBeVisible();
});

test('without folder access the option is off and says why', async ({
  page,
  extensionId,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await page.addInitScript(() => {
    delete (window as unknown as Record<string, unknown>).showDirectoryPicker;
  });
  await open(page, extensionId);
  await expect(page.getByRole('radio', { name: /^A folder you choose/ })).toBeDisabled();
  await expect(
    page.getByText("Your browser doesn't let extensions save to a folder you pick."),
  ).toBeVisible();

  // Brave has the API, but switched off.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'brave', { value: { isBrave: () => Promise.resolve(true) } });
  });
  await page.reload();
  await expect(page.getByRole('radio', { name: /^A folder you choose/ })).toBeDisabled();
  await expect(page.getByText('Brave turns this off.')).toBeVisible();
  await expect(page.getByText('brave://flags/#file-system-access-api')).toBeVisible();
});

test('folders get a hint about browsers that ask for every file', async ({
  page,
  extensionId,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await open(page, extensionId);
  const hint = page.getByText('If your browser asks where to save each file');
  await expect(hint).toHaveCount(0);
  await page.getByRole('radio', { name: 'Folders' }).check();
  await expect(hint).toBeVisible();
});

test('saving: the folder name inside Downloads, and what to do with a name that exists', async ({
  page,
  extensionId,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await open(page, extensionId, '#saving');
  await page.getByLabel('Folder inside Downloads').fill('  Canvas  ');
  await page.getByLabel('Folder inside Downloads').blur();
  await expect.poll(() => stored(serviceWorker)).toMatchObject({ folderPrefix: 'Canvas' });
  await expect(page.getByRole('radio', { name: 'Keep both' })).toBeChecked();
  await page.getByRole('radio', { name: 'Replace it' }).check();
  await expect.poll(() => stored(serviceWorker)).toMatchObject({ conflictAction: 'overwrite' });
});

test('the sidebar and Help keep the support links, the shortcut and the version', async ({
  page,
  extensionId,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await open(page, extensionId);
  const sidebar = page.getByRole('complementary');
  await expect(sidebar.getByRole('link', { name: 'Leave a review' })).toHaveAttribute(
    'href',
    /chromewebstore\.google\.com\/detail\/canvas-course-downloader\/mmnmcnffbkcnhcjiidmdnaclpfeekiol\/reviews\?utm_source=extension&utm_medium=options/,
  );
  // The star button shows GitHub's live count (the mock GitHub says 297).
  const star = sidebar.getByRole('link', { name: /^Star Course Downloader on GitHub/ });
  await expect(star).toHaveAttribute(
    'href',
    'https://github.com/jasp-nerd/canvas-course-downloader?utm_source=extension&utm_medium=options',
  );
  await expect(star).toHaveAccessibleName('Star Course Downloader on GitHub, 297 stars');
  await expect(star).toContainText('297');
  await expect(sidebar.getByText(/^Version \d+\.\d+\.\d+$/)).toBeVisible();

  await open(page, extensionId, '#help');
  const main = page.getByRole('main');
  await expect(main.getByText('right-click it and choose Extract All')).toBeVisible();
  // The donation ask: suggested amounts, each opening Ko-fi, with free ways to help beside it.
  const support = main.getByRole('region', { name: 'Help keep it free' });
  for (const amount of ['€3', '€5', '€10']) {
    await expect(support.getByRole('link', { name: new RegExp(`^${amount} `) })).toHaveAttribute(
      'href',
      'https://ko-fi.com/jaspnerd?utm_source=extension&utm_medium=options',
    );
  }
  await expect(support.getByText('These open Ko-fi, where you choose the amount.')).toBeVisible();
  await expect(support.getByRole('link', { name: 'Write a review' })).toHaveAttribute(
    'href',
    /chromewebstore\.google\.com.*utm_medium=options/,
  );
  await expect(
    support.getByRole('link', { name: 'Star Course Downloader on GitHub, 297 stars' }),
  ).toHaveAttribute(
    'href',
    'https://github.com/jasp-nerd/canvas-course-downloader?utm_source=extension&utm_medium=options',
  );
  // Each way to help is offered once on the page.
  await expect(main.getByRole('link', { name: /review/i })).toHaveCount(1);
  await expect(main.getByRole('link', { name: 'Buy me a coffee' })).toHaveCount(0);
  await expect(main.getByRole('link', { name: 'Sponsor on GitHub' })).toHaveAttribute(
    'href',
    /github\.com\/sponsors\/jasp-nerd\?utm_source=extension&utm_medium=options/,
  );
  await expect(main.getByRole('link', { name: 'Report a problem' })).toHaveAttribute(
    'href',
    /github\.com\/jasp-nerd\/canvas-course-downloader\/issues\/new\?title=Problem/,
  );
  await expect(main.getByRole('link', { name: 'Privacy' })).toHaveAttribute(
    'href',
    'https://github.com/jasp-nerd/canvas-course-downloader/blob/main/PRIVACY.md',
  );
  // Test browsers leave the suggested shortcut unassigned; real installs get Ctrl+Shift+D.
  await expect(main.getByRole('region', { name: 'Keyboard shortcut' })).toContainText(
    /downloads the course you're on|No shortcut is set/,
  );
  const pip = main.locator('img');
  await expect(pip).toHaveCount(1);
  expect(await pip.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(
    true,
  );
});

test("teachers can also save Canvas's course package, off unless they turn it on", async ({
  page,
  extensionId,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await open(page, extensionId);
  const coursePackage = page.getByRole('switch', { name: /^Also save Canvas's course package/ });
  await expect(coursePackage).toHaveCount(0);

  await page.getByRole('radio', { name: 'A teacher' }).check();
  await expect(coursePackage).not.toBeChecked();
  await expect(
    page.getByText(/Co-teachers see it under Settings › Export Course Content/),
  ).toBeVisible();
  await coursePackage.check();
  await expect.poll(() => stored(serviceWorker)).toMatchObject({ coursePackage: true });
});
