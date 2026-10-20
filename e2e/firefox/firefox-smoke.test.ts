// The Firefox build, in Firefox: install it, click "Download course" on the
// mock Canvas, and check the ZIP that lands in Downloads against v2's output.
// Run with `pnpm test:firefox` (needs Firefox 140+ installed).
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { collectExport, waitForDownloads } from '../golden/collect';
import { diffAgainstGolden } from '../golden/compare';
import { startMockCanvas, type MockCanvas } from '../mock-canvas/server';
import { launchFirefox } from './launch';

const BUILD = path.resolve('.output/firefox-mv3');
const freePort = () =>
  new Promise<number>((resolve) => {
    const server = createServer().listen(0, () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });
  });

let mock: MockCanvas;
let firefox: Awaited<ReturnType<typeof launchFirefox>>;
let downloads: string;

beforeAll(async () => {
  if (!existsSync(BUILD)) throw new Error('Build the Firefox version first: pnpm build:firefox');
  mock = await startMockCanvas();
  downloads = mkdtempSync(path.join(os.tmpdir(), 'ccd-ff-downloads-'));
  firefox = await launchFirefox({
    profile: path.join(os.tmpdir(), 'ccd-ff-profile'),
    port: await freePort(),
    prefs: {
      // Firefox has no --host-resolver-rules; this maps the mock hosts to 127.0.0.1.
      'network.dns.localDomains': 'school.instructure.com,canvas.example.edu',
      'network.trr.mode': 5,
      'browser.download.folderList': 2,
      'browser.download.dir': downloads,
      'browser.download.useDownloadDir': true,
      'browser.download.always_ask_before_handling_new_types': false,
      'intl.locale.requested': 'en-US',
    },
  });
  await firefox.browser.installExtension(BUILD);
}, 60_000);

afterAll(async () => {
  firefox?.close();
  await mock?.close();
  if (downloads) rmSync(downloads, { recursive: true, force: true });
});

it('exports a course as a ZIP that matches v2', async () => {
  const page = await firefox.browser.newPage();
  await page.goto(`https://school.instructure.com:${mock.port}/courses/101`);
  // A real click on the button inside our shadow root.
  const host = await page.waitForSelector('ccd-page-button', { timeout: 15_000 });
  const box = await host!.boundingBox();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

  for (let i = 0; i < 120 && !readdirSync(downloads).some((f) => f.endsWith('.zip')); i++) {
    await new Promise((r) => setTimeout(r, 500));
  }
  await waitForDownloads(downloads);
  expect(readdirSync(downloads)).toEqual(['Introduction to Psychology.zip']);
  // Firefox reaches the mock with its port in the URL; the golden files have none.
  const files = collectExport(downloads).map((f) =>
    f.text === undefined ? f : { ...f, text: f.text.replaceAll(`:${mock.port}`, '') },
  );
  expect(diffAgainstGolden('student-zip-default', files)).toEqual([]);
  expect(mock.unexpected).toEqual([]);
}, 120_000);
