// Captures the real extension UI for the 3.0 store images, against the in-process mock Canvas
// (invented "Sample University" data only). Run from the repo root after `pnpm build`:
//
//   node media/store/v3/src/capture.ts            # every capture
//   node media/store/v3/src/capture.ts course     # only the ones whose name matches
//
// Writes PNGs at deviceScaleFactor 2 to media/store/v3/src/captures/. render.ts composes them.
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type BrowserContext, type Page, type Route, type Worker } from '@playwright/test';
import { files, findCourse } from '../../../../e2e/mock-canvas/data.ts';
import { MOCK_HOSTS, startMockCanvas, type MockCanvas } from '../../../../e2e/mock-canvas/server.ts';
import { loadCanvasIcons, realisticPage } from './canvas-pages.ts';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const EXT = path.join(ROOT, '.output/chrome-mv3');
const OUT = path.join(import.meta.dirname, 'captures');
const CANVAS = `https://${MOCK_HOSTS.instructure}`;
const only = process.argv[2];

mkdirSync(OUT, { recursive: true });
await loadCanvasIcons();

// The mock names Academic Writing's lectures and modules "Academic Writing week 3"; in a store
// image "Week 2: Academic Writing week 3" reads like a bug. These invented topics stand in, in
// every response the browser gets (course page, API, files), so the extension sees them as data.
const TOPICS = [
  'What academic writing is',
  'Reading sources critically',
  'Finding a research question',
  'Building an argument',
  'Paragraphs that hold together',
  'Paraphrase, quote and cite',
  'Structuring the essay',
  'Writing the introduction',
  'Using evidence',
  'Style and clarity',
  'Revising your draft',
  'Peer review',
];
const renameTopics = (text: string) =>
  text.replace(/Academic Writing week (\d+)/g, (_, n: string) => TOPICS[Number(n) - 1] ?? _);

/** The size the mock's file list declares for each file id, so downloads weigh what they claim. */
const declared = new Map<number, number>(
  [101, 102, 103, 104, 105, 106, 107].flatMap((id) =>
    files(findCourse(id)!, CANVAS).map((f) => [Number(f.id), Number(f.size)] as [number, number]),
  ),
);

/**
 * Playwright's route.fetch() sends from Node, which skips Chrome's --host-resolver-rules and
 * would reach the real school.instructure.com. So each request goes to the mock by address.
 */
const viaMock = (route: Route, port: number) =>
  route.fetch({
    url: route.request().url().replace(CANVAS, `https://127.0.0.1:${port}`),
    headers: { ...route.request().headers(), host: MOCK_HOSTS.instructure },
  });

async function polish(route: Route, port: number) {
  const url = route.request().url();
  // Real-looking Canvas pages in place of the mock's plain Dashboard and course pages.
  const real = route.request().resourceType() === 'document' ? realisticPage(url) : null;
  if (real) {
    const res = await viaMock(route, port);
    return route.fulfill({
      status: 200,
      headers: { ...res.headers(), 'content-type': 'text/html; charset=utf-8' },
      body: renameTopics(real),
    });
  }
  const res = await viaMock(route, port);
  const headers = { ...res.headers() };
  delete headers['content-length'];
  const type = headers['content-type'] ?? '';
  const fileId = url.match(/\/files\/(\d+)\/download/)?.[1];
  if (fileId && type.includes('pdf')) {
    // The mock's PDFs are a few hundred bytes; pad them after %%EOF to their listed size, with
    // bytes a ZIP can't shrink, so a ZIP weighs what a real course would.
    const body = await res.body();
    const size = declared.get(Number(fileId)) ?? body.length;
    const padded = Buffer.concat([body, randomBytes(Math.max(0, size - body.length))]);
    return route.fulfill({ status: res.status(), headers, body: padded });
  }
  if (/json|html|text/.test(type)) {
    return route.fulfill({ status: res.status(), headers, body: renameTopics(await res.text()) });
  }
  return route.fulfill({ response: res });
}

interface Run {
  ctx: BrowserContext;
  sw: Worker;
  mock: MockCanvas;
  downloads: string;
  close(): Promise<void>;
}

/** A fresh browser with the extension, its downloads in a temp folder, like e2e/fixtures.ts. */
async function launch(viewport = { width: 1280, height: 800 }): Promise<Run> {
  const mock = await startMockCanvas();
  const userDataDir = mkdtempSync(path.join(tmpdir(), 'ccd-store-'));
  // Named like the real folder, since the receipt shows its name.
  const downloads = path.join(mkdtempSync(path.join(tmpdir(), 'ccd-store-dl-')), 'Downloads');
  mkdirSync(downloads);
  mkdirSync(path.join(userDataDir, 'Default'), { recursive: true });
  writeFileSync(
    path.join(userDataDir, 'Default', 'Preferences'),
    JSON.stringify({
      download: { default_directory: downloads, prompt_for_download: false, directory_upgrade: true },
    }),
  );
  const rules = Object.values(MOCK_HOSTS)
    .map((h) => `MAP ${h} 127.0.0.1:${mock.port}`)
    .join(', ');
  const ctx = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: !process.env.HEADED,
    ignoreHTTPSErrors: true,
    viewport,
    deviceScaleFactor: 2,
    env: { ...process.env, TZ: 'UTC' },
    timezoneId: 'UTC',
    locale: 'en-US',
    args: [
      `--disable-extensions-except=${EXT}`,
      `--load-extension=${EXT}`,
      `--host-resolver-rules=${rules}`,
      '--ignore-certificate-errors',
      '--lang=en-US',
      '--hide-scrollbars',
    ],
  });
  await ctx.route(`${CANVAS}/**`, (route) => polish(route, mock.port));
  // The picker shows the repo's GitHub stars; the mock's number is made up, so show the real one.
  // A failed fetch fails the capture rather than showing a wrong number.
  const stars = await fetch('https://api.github.com/repos/jasp-nerd/canvas-course-downloader', {
    signal: AbortSignal.timeout(20_000),
  })
    .then((r) => r.json() as Promise<{ stargazers_count: number }>)
    .then((r) => {
      if (typeof r.stargazers_count !== 'number') throw new Error('GitHub gave no star count');
      return r.stargazers_count;
    });
  await ctx.route('https://api.github.com/repos/**', (route) =>
    route.fulfill({
      json: { stargazers_count: stars },
      headers: { 'access-control-allow-origin': '*' },
    }),
  );
  const setup = await ctx.newPage();
  const cdp = await ctx.newCDPSession(setup);
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'default', downloadPath: downloads });
  await setup.close();
  const sw = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent('serviceworker'));
  // The welcome tab a fresh install opens.
  await new Promise((r) => setTimeout(r, 800));
  for (const p of ctx.pages()) if (p.url().endsWith('/welcome.html')) await p.close();
  return {
    ctx,
    sw,
    mock,
    downloads,
    async close() {
      await ctx.close();
      await mock.close();
      rmSync(userDataDir, { recursive: true, force: true });
      rmSync(path.dirname(downloads), { recursive: true, force: true });
    },
  };
}

/** Settings in storage.sync; the support card counts as just shown, so receipts stand alone. */
async function seed(sw: Worker, sync: Record<string, unknown>, local: Record<string, unknown> = {}) {
  await sw.evaluate(
    async ({ sync, local }) => {
      await chrome.storage.sync.clear();
      await chrome.storage.local.clear();
      await chrome.storage.sync.set(sync);
      await chrome.storage.local.set({
        supportCard: { successfulExports: 3, timesShown: 1, lastShownAt: Date.now(), optedOut: false },
        ...local,
      });
    },
    { sync, local },
  );
}

async function page(run: Run): Promise<Page> {
  return run.ctx.pages().find((p) => p.url() === 'about:blank') ?? (await run.ctx.newPage());
}

/** Clicks Download course on a course page and returns the export tab once it has finished. */
async function exportCourse(run: Run, courseId: number): Promise<Page> {
  const p = await page(run);
  await p.goto(`${CANVAS}/courses/${courseId}`);
  const tabP = run.ctx.waitForEvent('page');
  await p.getByRole('button', { name: 'Download course' }).click();
  const tab = await tabP;
  await tab.getByRole('status').filter({ hasText: /^Finished/ }).waitFor({ timeout: 90_000 });
  await tab.waitForTimeout(900);
  await tab.bringToFront();
  return tab;
}

/** Pages a little zoomed in, so they read at store size (the compose pages scale by 1152/1024). */
const CANVAS_VIEW = { width: 1024, height: 720 };

const shot = (name: string) => path.join(OUT, `${name}.png`);
const want = (name: string) => !only || name.includes(only);
const jobs: [string, () => Promise<void>][] = [];
const job = (name: string, fn: () => Promise<void>) => jobs.push([name, fn]);

// 1. The course page with its Download course button, the cursor about to press it.
job('course-page', async () => {
  const run = await launch(CANVAS_VIEW);
  try {
    await seed(run.sw, { profile: 'copy' });
    const p = await page(run);
    await p.goto(`${CANVAS}/courses/104`);
    const btn = p.getByRole('button', { name: 'Download course' });
    await btn.waitFor();
    await btn.hover();
    await p.waitForTimeout(400);
    await p.screenshot({ path: shot('course-page') });
    const box = await btn.boundingBox();
    writeFileSync(path.join(OUT, 'course-page.json'), JSON.stringify(box));
  } finally {
    await run.close();
  }
});

// 2. The course picker on the Dashboard, three courses ticked.
job('picker', async () => {
  // Short enough that the whole dialog fits the store image's window.
  const run = await launch({ width: 1024, height: 560 });
  try {
    await seed(run.sw, { profile: 'copy' });
    const p = await page(run);
    await p.goto(`${CANVAS}/`);
    await p.getByRole('button', { name: 'Download courses' }).click();
    for (const name of ['Academic Writing', 'Introduction to Psychology', 'Linear Algebra'])
      await p.getByRole('checkbox', { name: new RegExp(`^${name}`) }).check();
    const go = p.getByRole('button', { name: 'Download 3 courses' });
    await go.hover();
    await p.waitForTimeout(1200);
    await p.screenshot({ path: shot('picker-raw') });
    writeFileSync(path.join(OUT, 'picker-raw.json'), JSON.stringify(await go.boundingBox()));
  } finally {
    await run.close();
  }
});

// The export tab: a plain copy saved as folders, finished.
job('receipt-copy', async () => {
  const run = await launch({ width: 1280, height: 800 });
  try {
    await seed(run.sw, { profile: 'copy', zipMode: false });
    const tab = await exportCourse(run, 104);
    await tab.screenshot({ path: shot('receipt-copy'), fullPage: true });
    const list = readdirSync(run.downloads, { recursive: true }) as string[];
    writeFileSync(path.join(OUT, 'receipt-copy-files.txt'), list.join('\n'));
  } finally {
    await run.close();
  }
});

// 4. The study pack receipt.
job('receipt-study', async () => {
  const run = await launch(CANVAS_VIEW);
  try {
    await seed(run.sw, { profile: 'study', aiTarget: 'notebooklm' });
    const tab = await exportCourse(run, 104);
    await tab.screenshot({ path: shot('receipt-study'), fullPage: true });
  } finally {
    await run.close();
  }
});

// 6. A partial download: one lecture gone from Canvas.
job('receipt-partial', async () => {
  const run = await launch({ width: 1280, height: 800 });
  try {
    await seed(run.sw, { profile: 'copy' });
    const lecture = files(findCourse(104)!, CANVAS).find((f) =>
      String(f.display_name).startsWith('Lecture 02'),
    );
    run.mock.addFault({ path: `^/files/${lecture!.id}/download`, status: 404 });
    const tab = await exportCourse(run, 104);
    await tab.getByText(/couldn't be downloaded/).first().click();
    await tab.waitForTimeout(400);
    await tab.screenshot({ path: shot('receipt-partial'), fullPage: true });
    await tab.setViewportSize({ width: 1024, height: 720 });
    await tab.waitForTimeout(400);
    await tab.screenshot({ path: shot('receipt-partial-narrow'), fullPage: true });
  } finally {
    await run.close();
  }
});

// 7. The teacher receipt.
job('receipt-teacher', async () => {
  const run = await launch(CANVAS_VIEW);
  try {
    await seed(run.sw, { profile: 'copy', role: 'teacher' });
    const tab = await exportCourse(run, 107);
    await tab.screenshot({ path: shot('receipt-teacher'), fullPage: true });
  } finally {
    await run.close();
  }
});

// 3. The "Open me" page inside a saved copy, unzipped and opened from disk with the browser
// offline. One lecture fails, so the page has its "could not be saved" list.
job('open-me', async () => {
  const run = await launch({ width: 980, height: 800 });
  try {
    await seed(run.sw, { profile: 'copy' });
    const lecture = files(findCourse(104)!, CANVAS).find((f) =>
      String(f.display_name).startsWith('Lecture 02'),
    );
    run.mock.addFault({ path: `^/files/${lecture!.id}/download`, status: 404 });
    const tab = await exportCourse(run, 104);
    await tab.close();
    execFileSync('unzip', ['-q', '-o', 'Academic Writing.zip', '-d', 'Academic Writing'], {
      cwd: run.downloads,
    });
    await run.ctx.setOffline(true);
    const p = await run.ctx.newPage();
    await p.goto(
      pathToFileURL(path.join(run.downloads, 'Academic Writing', 'Open me - Academic Writing.html'))
        .href,
    );
    await p.waitForTimeout(600);
    await p.screenshot({ path: shot('open-me'), fullPage: true });
    // The list at the bottom on its own, for a panel beside the page's top.
    const head = (await p.locator('#not-saved').boundingBox())!;
    const table = (await p.locator('#not-saved + table').boundingBox())!;
    await p.screenshot({
      path: shot('open-me-missing'),
      fullPage: true,
      clip: {
        x: table.x - 24,
        y: head.y - 20,
        width: table.width + 48,
        height: table.y + table.height - head.y + 44,
      },
    });
  } finally {
    await run.close();
  }
});

// 5. The what's-new note on the Dashboard, for a course saved before. A recent check means the
// note reads storage and asks Canvas nothing.
job('whats-new', async () => {
  const run = await launch(CANVAS_VIEW);
  try {
    const saved = Object.fromEntries(
      files(findCourse(104)!, CANVAS).map((f) => [
        String(f.id),
        {
          path: `Files/${f.display_name}`,
          size: Number(f.size),
          modifiedAt: String(f.modified_at ?? f.updated_at),
        },
      ]),
    );
    const items = [
      ['file:104901', 'Lecture 13 - Review session.pdf', 'file'],
      ['file:104902', 'Week 11 slides.pdf', 'file'],
      ['file:104903', 'Essay rubric.docx', 'file'],
      ['announcement:9104', 'Room change for Thursday', 'announcement'],
    ].map(([key, name, kind]) => ({ key, name, kind }));
    await seed(
      run.sw,
      { profile: 'copy' },
      {
        [`inventory:${CANVAS}:104`]: {
          courseName: 'Academic Writing',
          savedAt: Date.now() - 6 * 24 * 3600 * 1000,
          files: saved,
        },
        [`updates:${CANVAS}`]: {
          checkedAt: Date.now(),
          courses: [
            {
              courseId: '104',
              courseName: 'Academic Writing',
              newFiles: 3,
              newAnnouncements: 1,
              items,
            },
          ],
        },
      },
    );
    const p = await page(run);
    await p.goto(`${CANVAS}/`);
    const note = p.locator('ccd-updates-note').locator('.note');
    await note.waitFor();
    const get = note.getByRole('button', { name: 'Download', exact: true });
    await get.hover();
    await p.waitForTimeout(800);
    await p.screenshot({ path: shot('whats-new') });
    writeFileSync(path.join(OUT, 'whats-new.json'), JSON.stringify(await get.boundingBox()));
  } finally {
    await run.close();
  }
});

for (const [name, fn] of jobs) {
  if (!want(name)) continue;
  const t = Date.now();
  try {
    await fn();
    console.log(`ok   ${name} (${Date.now() - t} ms)`);
  } catch (e) {
    console.log(`FAIL ${name}: ${(e as Error).message.split('\n')[0]}`);
  }
}
