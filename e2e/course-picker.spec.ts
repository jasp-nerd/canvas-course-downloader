// The dashboard flow: "Download courses" opens a picker over Canvas.
import { readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { waitForDownloads } from './golden/collect';
import { CANVAS, expect, resetExtensionStorage, test } from './fixtures';

test.beforeEach(async ({ serviceWorker, downloadsDir }) => {
  await resetExtensionStorage(serviceWorker, {});
  for (const entry of readdirSync(downloadsDir))
    rmSync(path.join(downloadsDir, entry), { recursive: true });
});

type Page = import('@playwright/test').Page;
type Chrome = {
  chrome: {
    storage: {
      local: {
        set(v: object): Promise<void>;
        get(k: null): Promise<Record<string, unknown>>;
        remove(k: string[]): Promise<void>;
      };
    };
  };
};

async function exportCourse(page: Page, courseId: number) {
  await page.goto(`${CANVAS}/courses/${courseId}`);
  const next = page.context().waitForEvent('page');
  await page.getByRole('button', { name: 'Download course', exact: true }).click();
  const tab = await next;
  await expect(tab.getByRole('heading', { name: 'Export finished' })).toBeVisible({
    timeout: 60_000,
  });
  await tab.close();
}

/** The colour of a course's dot, as the browser draws it. */
const dotColor = (dialog: import('@playwright/test').Locator, course: string) =>
  dialog
    .locator('label', { hasText: course })
    .locator('.dot')
    .evaluate((dot) => getComputedStyle(dot).backgroundColor);

async function openPicker(page: Page) {
  await page.goto(`${CANVAS}/`);
  await page.getByRole('button', { name: 'Download courses' }).click();
  const dialog = page.getByRole('dialog', { name: 'Download courses' });
  await expect(dialog.getByRole('group', { name: /Fall 2026/ })).toBeVisible();
  return dialog;
}

test('exports courses picked from Current and Past, keeping the selection across tabs', async ({
  page,
  downloadsDir,
}) => {
  const dialog = await openPicker(page);
  await dialog.getByRole('checkbox', { name: /Linear Algebra/ }).check();
  await dialog.getByRole('tab', { name: 'Past' }).click();
  await dialog.getByRole('checkbox', { name: /Calculus I/ }).check();
  await dialog.getByRole('tab', { name: 'Current' }).click();
  await expect(dialog.getByRole('checkbox', { name: /Linear Algebra/ })).toBeChecked();
  // Counted across Current and Past.
  await expect(dialog.getByText('2 selected')).toBeVisible();

  const exportTab = page.context().waitForEvent('page');
  await dialog.getByRole('button', { name: 'Download 2 courses' }).click();
  await expect(dialog).toBeHidden();
  const tab = await exportTab;
  await expect(tab.getByRole('heading', { name: 'Export finished' })).toBeVisible({
    timeout: 60_000,
  });
  await expect(tab.locator('[data-outcome="success"]')).toHaveCount(2);
  await waitForDownloads(downloadsDir);
  expect(readdirSync(downloadsDir).sort()).toEqual(['Calculus I.zip', 'Linear Algebra.zip']);
});

test('select all picks only the courses matching the search', async ({ page }) => {
  const dialog = await openPicker(page);
  // Matches CS 210, CS 340 and "Microeconomics" (name contains "cs").
  await dialog.getByLabel('Search courses').fill('cs');
  await dialog.getByRole('checkbox', { name: 'Select all matching' }).check();
  await expect(dialog.getByRole('button', { name: 'Download 3 courses' })).toBeEnabled();
  await dialog.getByLabel('Search courses').fill('');
  await expect(dialog.getByRole('checkbox', { name: /Linear Algebra/ })).not.toBeChecked();
});

test('says the user is signed out instead of "no courses"', async ({ page, mock }) => {
  await page.goto(`${CANVAS}/`);
  mock.state.signedIn = false;
  await page.getByRole('button', { name: 'Download courses' }).click();
  await expect(page.getByRole('dialog').getByText("You're signed out of Canvas")).toBeVisible();
});

test('Escape closes the picker', async ({ page }) => {
  const dialog = await openPicker(page);
  await expect(dialog.getByLabel('Search courses')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('a click outside closes the picker', async ({ page }) => {
  const dialog = await openPicker(page);
  await page.mouse.click(5, 5);
  await expect(dialog).toBeHidden();
});

test('opens above Canvas, whose main column is its own stacking layer', async ({ page }) => {
  await openPicker(page);
  // A hit inside the picker's shadow root reports its host element.
  const onTop = await page.evaluate(() =>
    document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.tagName.toLowerCase(),
  );
  expect(onTop).toBe('ccd-course-picker');
});

test('rows show the Canvas colour, what is new or saved, and the courses the user teaches', async ({
  page,
  serviceWorker,
  mock,
}) => {
  await exportCourse(page, 104);
  await exportCourse(page, 103);
  mock.state.newFileIn = [104];
  // Canvas pages check for news every few hours; forget the check the exports' pages made.
  await serviceWorker.evaluate(async () => {
    const { local } = (globalThis as unknown as Chrome).chrome.storage;
    await local.remove(Object.keys(await local.get(null)).filter((k) => k.startsWith('updates:')));
  });
  const dialog = await openPicker(page);
  await expect(dialog.getByRole('checkbox', { name: /Academic Writing.*1 new/ })).toBeVisible();
  await expect(dialog.getByRole('checkbox', { name: /Linear Algebra.*Saved today/ })).toBeVisible();
  await expect(
    dialog.getByRole('checkbox', { name: /Teaching Practicum.*You teach/ }),
  ).toBeVisible();
  await expect(dialog.getByRole('checkbox', { name: /Machine Learning/ })).not.toHaveAccessibleName(
    /new|Saved|teach/,
  );
  // MATH 221 · Fall 2026, in the course's colour from the user's Canvas.
  await expect(dialog.getByText('MATH 221 · Fall 2026')).toBeVisible();
  expect(await dotColor(dialog, 'Linear Algebra')).toBe('rgb(194, 65, 12)');
});

test('without Canvas colours, every course gets the same neutral dot', async ({ page, mock }) => {
  mock.addFault({ path: '^/api/v1/users/self/colors', status: 403 });
  const dialog = await openPicker(page);
  const neutral = await dotColor(dialog, 'Linear Algebra');
  expect(await dotColor(dialog, 'Machine Learning')).toBe(neutral);
  expect(neutral).not.toBe('rgb(194, 65, 12)');
});

test('the footer says what a download makes; Change and the settings button open Settings', async ({
  page,
  extensionId,
}) => {
  const dialog = await openPicker(page);
  await expect(dialog.getByText('A copy · ZIP', { exact: true })).toBeVisible();
  for (const name of ['Change', 'Settings']) {
    const settings = page.context().waitForEvent('page');
    await dialog.getByRole('button', { name, exact: true }).click();
    const tab = await settings;
    expect(tab.url()).toBe(`chrome-extension://${extensionId}/options.html`);
    await tab.close();
  }
});

test("a teacher's first download from the picker says how many of the courses they teach", async ({
  page,
  serviceWorker,
}) => {
  await serviceWorker.evaluate(() =>
    (globalThis as unknown as Chrome).chrome.storage.local.set({ askProfile: true }),
  );
  const dialog = await openPicker(page);
  // The taught course second: the picker knows the roles of all of them.
  await dialog.getByRole('checkbox', { name: /Linear Algebra/ }).check();
  await dialog.getByRole('checkbox', { name: /Teaching Practicum/ }).check();
  await dialog.getByRole('button', { name: 'Download 2 courses' }).click();
  const question = page.getByRole('dialog', { name: 'What should your downloads be?' });
  await expect(question.getByText('You teach 1 of these courses')).toBeVisible();
  await expect(question.getByRole('switch', { name: "Include students' work" })).toBeVisible();
  await question.getByRole('button', { name: 'Close' }).click();
  await expect(question).toBeHidden();
});
