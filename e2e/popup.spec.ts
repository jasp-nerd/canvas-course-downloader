import type { Page, Worker } from '@playwright/test';
import {
  CANVAS,
  NOT_CANVAS,
  expect,
  openActionPopup,
  resetExtensionStorage,
  test,
  waitForExport,
} from './fixtures';

const HOUR = 60 * 60 * 1000;

/** Lets an export the popup started finish, so it can't write to the next test's storage. */
async function finish(tab: Page) {
  await waitForExport(tab);
  await tab.close();
}

/** Writes storage.local as the content script and the Export tab would have left it. */
const seedLocal = (sw: Worker, values: Record<string, unknown>) =>
  sw.evaluate(
    (v) =>
      (
        globalThis as unknown as {
          chrome: { storage: { local: { set(v: object): Promise<void> } } };
        }
      ).chrome.storage.local.set(v),
    values,
  );

/** Courses saved before (oldest first), with what the last update check found. */
function savedBefore(courses: [id: number, name: string, newFiles: number][], now = Date.now()) {
  const values: Record<string, unknown> = {};
  courses.forEach(([id, courseName], i) => {
    values[`inventory:${CANVAS}:${id}`] = {
      courseName,
      savedAt: now - (courses.length - i) * 24 * HOUR,
      files: {},
    };
  });
  values[`updates:${CANVAS}`] = {
    checkedAt: now,
    courses: courses.map(([id, courseName, newFiles]) => ({
      courseId: String(id),
      courseName,
      newFiles,
    })),
  };
  return values;
}

test('on a course page, the popup shows the course and downloads it', async ({
  page,
  serviceWorker,
  cdpPort,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await page.goto(`${CANVAS}/courses/101`);
  await page.getByRole('button', { name: 'Download course' }).waitFor();
  await page.bringToFront();
  const { popup, close } = await openActionPopup(serviceWorker, cdpPort);
  try {
    await expect(popup.getByText('Introduction to Psychology')).toBeVisible();
    // Code and term side by side, without a "·" between them.
    const course = popup.getByRole('region', { name: 'This course' });
    await expect(course.getByText('PSY 101', { exact: true })).toBeVisible();
    await expect(course.getByText('Fall 2026', { exact: true })).toBeVisible();
    await expect(course.getByText(/·/)).toHaveCount(0);
    await expect(popup.getByText('One ZIP per course in Downloads')).toBeVisible();
    await expect(popup.getByText('Not saved yet')).toBeVisible();
    await expect(popup.getByRole('button', { name: 'Download new files' })).toHaveCount(0);
    const exportTab = page.context().waitForEvent('page', (p) => p.url().includes('/export.html'));
    await popup.getByRole('button', { name: 'Download this course' }).click();
    const tab = await exportTab;
    expect(new URL(tab.url()).searchParams.get('courses')).toBe('101');
    expect(new URL(tab.url()).searchParams.get('new')).toBeNull();
    await finish(tab);
  } finally {
    await close();
  }
});

test('on a course saved before with new files, the popup offers just those', async ({
  page,
  serviceWorker,
  cdpPort,
}) => {
  await resetExtensionStorage(serviceWorker, { profile: 'study', aiTarget: 'claude' });
  await seedLocal(serviceWorker, savedBefore([[104, 'Academic Writing', 3]]));
  await page.goto(`${CANVAS}/courses/104`);
  await page.getByRole('button', { name: /^Download course/ }).waitFor();
  await page.bringToFront();
  const { popup, close } = await openActionPopup(serviceWorker, cdpPort);
  try {
    await expect(popup.getByText(/^3 new since \w+/)).toBeVisible();
    await expect(popup.getByText(/^Last saved \w+ \d/)).toBeVisible();
    await expect(popup.getByText('Study pack for Claude in Downloads')).toBeVisible();
    await expect(popup.getByRole('button', { name: 'Download everything again' })).toBeVisible();
    const exportTab = page.context().waitForEvent('page', (p) => p.url().includes('/export.html'));
    await popup.getByRole('button', { name: 'Download new files' }).click();
    const tab = await exportTab;
    const url = new URL(tab.url());
    expect(url.searchParams.get('courses')).toBe('104');
    expect(url.searchParams.get('new')).toBe('1');
    await finish(tab);
  } finally {
    await close();
  }
});

test('with "Only add what\'s new" on, every download adds to the copy, so there is no "everything again"', async ({
  page,
  serviceWorker,
  cdpPort,
}) => {
  await resetExtensionStorage(serviceWorker, { incrementalMode: true });
  await seedLocal(serviceWorker, savedBefore([[104, 'Academic Writing', 3]]));
  await page.goto(`${CANVAS}/courses/104`);
  await page.getByRole('button', { name: /^Download course/ }).waitFor();
  await page.bringToFront();
  const { popup, close } = await openActionPopup(serviceWorker, cdpPort);
  try {
    await expect(popup.getByRole('button', { name: 'Download new files' })).toBeVisible();
    await expect(popup.getByRole('button', { name: 'Download everything again' })).toHaveCount(0);
  } finally {
    await close();
  }
});

test('on the dashboard, the popup opens the course picker', async ({
  page,
  serviceWorker,
  cdpPort,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await page.goto(`${CANVAS}/`);
  await page.getByRole('button', { name: 'Download courses' }).waitFor();
  await page.bringToFront();
  const { popup, close } = await openActionPopup(serviceWorker, cdpPort);
  try {
    await expect(popup.getByRole('button', { name: 'Download this course' })).toHaveCount(0);
    await expect(popup.getByText('Saved before')).toHaveCount(0);
    await popup.getByRole('button', { name: 'Pick courses to download' }).click();
    await expect(page.getByRole('dialog', { name: 'Download courses' })).toBeVisible();
  } finally {
    await close();
  }
});

test('on the dashboard, courses saved before show what is new, and one press gets it', async ({
  page,
  serviceWorker,
  cdpPort,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await seedLocal(
    serviceWorker,
    savedBefore([
      [101, 'Introduction to Psychology', 0],
      [102, 'Data Structures and Algorithms', 0],
      [103, 'Linear Algebra', 3],
      [105, 'Machine Learning', 0],
      [104, 'Academic Writing', 5],
    ]),
  );
  await page.goto(`${CANVAS}/`);
  await page.getByRole('button', { name: 'Download courses' }).waitFor();
  await page.bringToFront();
  const { popup, close } = await openActionPopup(serviceWorker, cdpPort);
  try {
    const list = popup.getByRole('list', { name: 'Saved before' });
    // The four saved most recently, newest first.
    await expect(list.getByRole('listitem')).toHaveText([
      /^Academic Writing\s*5 new$/,
      /^Machine Learning\s*Up to date$/,
      /^Linear Algebra\s*3 new$/,
      /^Data Structures and Algorithms\s*Up to date$/,
    ]);
    await expect(popup.getByText('One ZIP per course', { exact: true })).toBeVisible();
    const exportTab = page.context().waitForEvent('page', (p) => p.url().includes('/export.html'));
    await popup.getByRole('button', { name: 'Download all 8 new files' }).click();
    const tab = await exportTab;
    const url = new URL(tab.url());
    expect(url.searchParams.get('courses')?.split(',').sort()).toEqual(['103', '104']);
    expect(url.searchParams.get('new')).toBe('1');
    await finish(tab);
  } finally {
    await close();
  }
});

test('elsewhere, the popup sends you to the Canvas you used last', async ({
  page,
  serviceWorker,
  cdpPort,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await seedLocal(serviceWorker, { lastCanvas: { origin: CANVAS, at: Date.now() } });
  await page.goto(`${NOT_CANVAS}/`);
  await page.bringToFront();
  const { popup, close } = await openActionPopup(serviceWorker, cdpPort);
  try {
    await expect(popup.getByRole('heading', { name: 'Open your Canvas to start' })).toBeVisible();
    const canvasTab = page.context().waitForEvent('page', (p) => p.url().startsWith(CANVAS));
    await popup.getByRole('button', { name: 'Open school.instructure.com' }).click();
    await (await canvasTab).close();
  } finally {
    await close();
  }
});

test('elsewhere, without a Canvas seen before, the popup says where to go', async ({
  page,
  serviceWorker,
  cdpPort,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await page.goto(`${NOT_CANVAS}/`);
  await page.bringToFront();
  const { popup, close } = await openActionPopup(serviceWorker, cdpPort);
  try {
    await expect(popup.getByRole('heading', { name: 'Open your Canvas to start' })).toBeVisible();
    await expect(
      popup.getByText(
        "Go to your school's Canvas site and the download button shows up on your courses.",
      ),
    ).toBeVisible();
    await expect(popup.getByRole('button', { name: /^Open / })).toHaveCount(0);
    const options = page.context().waitForEvent('page', (p) => p.url().includes('/options.html'));
    await popup.getByRole('button', { name: 'Settings' }).click();
    await (await options).close();
  } finally {
    await close();
  }
});
