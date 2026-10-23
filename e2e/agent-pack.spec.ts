// "Files for coding agents": the copy in Markdown with AGENTS.md, llms.txt and course.json.
import { execFileSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { waitForDownloads } from './golden/collect';
import { CANVAS, expect, resetExtensionStorage, test, waitForExport } from './fixtures';

const unzip = (...args: string[]) => execFileSync('unzip', args, { encoding: 'utf8' });

test.beforeEach(({ downloadsDir }) => {
  for (const entry of readdirSync(downloadsDir))
    rmSync(path.join(downloadsDir, entry), { recursive: true });
});

test('a copy in Markdown with front matter, AGENTS.md, llms.txt and course.json', async ({
  page,
  serviceWorker,
  downloadsDir,
}) => {
  await resetExtensionStorage(serviceWorker, { profile: 'agents', exportFormat: 'html' });
  await page.goto(`${CANVAS}/courses/104`);
  const next = page.context().waitForEvent('page');
  await page.getByRole('button', { name: 'Download course' }).click();
  const tab = await next;
  await waitForExport(tab);
  // The receipt names the folder the ZIP unzips to, with a command to start an agent there.
  await expect(tab.getByText(/^cd ".+" && claude$/)).toHaveText(
    new RegExp(`${path.basename(downloadsDir)}/Academic Writing" && claude$`),
  );
  await expect(tab.getByRole('button', { name: 'Copy path' })).toBeVisible();
  await expect(tab.getByText(/AGENTS\.md at the top of the folder/)).toBeVisible();
  await waitForDownloads(downloadsDir);

  const zip = path.join(downloadsDir, 'Academic Writing.zip');
  const entries = unzip('-Z1', zip).trim().split('\n');
  expect(entries).toEqual(
    expect.arrayContaining([
      'AGENTS.md',
      'llms.txt',
      'course.json',
      'manifest.json',
      'Syllabus.md',
    ]),
  );
  // Markdown, whatever the format setting says, and no pages meant for people.
  expect(entries.filter((e) => e.endsWith('.html'))).toEqual([]);
  expect(entries).not.toContain('styles.css');
  expect(entries.filter((e) => e.endsWith('.pdf'))).toHaveLength(24);

  const assignment = unzip(
    '-p',
    zip,
    entries.find((e) => e.startsWith('Assignments/Assignment 1'))!,
  );
  expect(assignment).toMatch(/^---\ntype: "assignment"\ntitle: "Assignment 1"\n/);
  expect(assignment).toContain('module_position: 1');
  expect(assignment).toContain('points: 10');
  expect(assignment).toContain('---\n\n# Assignment 1\n');

  const course = JSON.parse(unzip('-p', zip, 'course.json')) as {
    modules: { name: string; items: { path?: string }[] }[];
    documents: { type: string; due_at?: string }[];
    files: unknown[];
  };
  expect(course.modules).toHaveLength(6);
  expect(course.modules[0]!.items.every((it) => it.path && entries.includes(it.path))).toBe(true);
  expect(course.documents.filter((d) => d.type === 'assignment' && d.due_at)).toHaveLength(5);
  expect(course.files).toHaveLength(24);

  const llms = unzip('-p', zip, 'llms.txt');
  expect(llms).toMatch(/^# Academic Writing\n/);
  expect(llms).toContain('## Week 1: ');
  expect(unzip('-p', zip, 'AGENTS.md')).toContain('# Canvas course export: Academic Writing');
});
