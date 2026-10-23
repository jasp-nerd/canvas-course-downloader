// "A study pack for AI": a flat ZIP that fits the chosen tool's file limit.
import { execFileSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { waitForDownloads } from './golden/collect';
import { CANVAS, expect, resetExtensionStorage, test, waitForExport } from './fixtures';

const unzip = (...args: string[]) => execFileSync('unzip', args, { encoding: 'utf8' });
const zipEntries = (zip: string) => unzip('-Z1', zip).trim().split('\n');

test.beforeEach(({ downloadsDir }) => {
  for (const entry of readdirSync(downloadsDir))
    rmSync(path.join(downloadsDir, entry), { recursive: true });
});

async function exportCourse(page: import('@playwright/test').Page, courseId: number) {
  await page.goto(`${CANVAS}/courses/${courseId}`);
  const next = page.context().waitForEvent('page');
  await page.getByRole('button', { name: 'Download course' }).click();
  const tab = await next;
  await waitForExport(tab);
  return tab;
}

test('makes a NotebookLM pack: a guide, one Markdown file per module and the slides', async ({
  page,
  serviceWorker,
  downloadsDir,
}) => {
  await resetExtensionStorage(serviceWorker, { profile: 'study', aiTarget: 'notebooklm' });
  const tab = await exportCourse(page, 104);
  await expect(
    tab.getByText(/^Academic Writing · \d+ sources · fits in one notebook$/),
  ).toBeVisible();
  const steps = tab.getByRole('list', { name: 'Three steps to start studying' });
  await expect(steps.getByRole('listitem')).toHaveCount(3);
  await expect(steps.getByRole('link', { name: 'Open NotebookLM' })).toHaveAttribute(
    'href',
    'https://notebooklm.google.com/',
  );
  await expect(steps.getByRole('listitem').nth(1)).toContainText('Unzip it first');
  await expect(steps.getByRole('button', { name: 'Show in folder' })).toBeVisible();

  // The starter prompt and the suggestions copy their text.
  await tab.evaluate(() => {
    navigator.clipboard.writeText = (text: string) => {
      (window as unknown as { copied: string }).copied = text;
      return Promise.resolve();
    };
  });
  const copied = () => tab.evaluate(() => (window as unknown as { copied?: string }).copied);
  await steps.getByRole('button', { name: 'Copy', exact: true }).click();
  expect(await copied()).toMatch(/^Quiz me on Week 1: .+\. Ask one question at a time/);
  await expect(steps.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();
  await steps.getByRole('button', { name: "What's due next?" }).click();
  expect(await copied()).toBe("What's due next?");
  await waitForDownloads(downloadsDir);

  expect(readdirSync(downloadsDir)).toEqual(['Academic Writing - AI study pack.zip']);
  const zip = path.join(downloadsDir, 'Academic Writing - AI study pack.zip');
  const entries = zipEntries(zip);
  expect(entries.length).toBeLessThanOrEqual(50 + 2); // plus _extras
  expect(entries).toContain('00 Course guide.md');
  // Week 6 only repeats items from earlier weeks, besides its slides.
  expect(entries.filter((e) => /^0[1-6] Week \d.*\.md$/.test(e))).toHaveLength(5);
  expect(entries.filter((e) => /^M06 .*\.pdf$/.test(e))).toHaveLength(1);
  expect(entries).toContain('07 Other course content.md');
  expect(entries.filter((e) => /^M01 .*\.pdf$/.test(e))).toHaveLength(1);
  expect(entries.filter((e) => e.includes('/') && !e.startsWith('_extras/'))).toEqual([]);
  // A copy's extras aren't in a pack.
  expect(entries).not.toContain('index.html');
  expect(entries).not.toContain('manifest.json');

  const guide = unzip('-p', zip, '00 Course guide.md');
  expect(guide).toContain('# Academic Writing — course guide');
  expect(guide).toContain('## Deadlines');
  expect(guide).toContain('2 quizzes, 3 discussions');
  expect(guide).toContain('Assignments 40% · Projects 60%');
  const week1 = unzip(
    '-p',
    zip,
    entries.find((e) => e.startsWith('01 Week 1'))!,
  );
  expect(week1).toContain('> Canvas module 1 of 6.');
  expect(week1).toMatch(/^## /m);
});

test('splits a course into projects that each fit in Claude', async ({
  page,
  serviceWorker,
  downloadsDir,
}) => {
  await resetExtensionStorage(serviceWorker, { profile: 'study', aiTarget: 'claude' });
  const tab = await exportCourse(page, 104);
  await expect(
    tab.getByText(/^Academic Writing · \d+ sources · split into \d+ projects$/),
  ).toBeVisible();
  const steps = tab.getByRole('list', { name: 'Three steps to start studying' });
  await expect(steps.getByRole('link', { name: 'Open Claude' })).toHaveAttribute(
    'href',
    'https://claude.ai/projects',
  );
  await expect(steps.getByRole('listitem').nth(1)).toContainText(
    'Add each folder to its own project',
  );
  await tab.locator('main').screenshot({ path: 'test-results/export-study-pack.png' });
  await waitForDownloads(downloadsDir);

  const entries = zipEntries(path.join(downloadsDir, 'Academic Writing - AI study pack.zip'));
  const byProject = Map.groupBy(
    entries.filter((e) => e.startsWith('Project ')),
    (e) => e.split('/')[0]!,
  );
  expect(byProject.size).toBeGreaterThan(1);
  expect(entries.filter((e) => !e.startsWith('Project ') && !e.startsWith('_extras/'))).toEqual([]);
  for (const [project, files] of byProject) {
    expect(files.length, project).toBeLessThanOrEqual(20);
    expect(files).toContain(`${project}/00 Course guide.md`);
  }
});

test('a pack is always complete, even with "only download what\'s new" on', async ({
  page,
  serviceWorker,
  downloadsDir,
}) => {
  await resetExtensionStorage(serviceWorker, { profile: 'study', incrementalMode: true });
  await exportCourse(page, 104);
  await waitForDownloads(downloadsDir);
  // A pack isn't a copy: the next export is a full pack again, not an update.
  await exportCourse(page, 104);
  await waitForDownloads(downloadsDir);
  expect(readdirSync(downloadsDir).sort()).toEqual([
    'Academic Writing - AI study pack (1).zip',
    'Academic Writing - AI study pack.zip',
  ]);
});
