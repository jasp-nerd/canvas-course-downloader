// Playwright fixtures: one Chrome for Testing per worker with the extension
// loaded and the mock Canvas hosts mapped to an in-process mock server.
//
// Use `test.use({ extensionPath: V2_BUILD })` to run the same scenario
// against the v2.11.0 reference build.
import { chromium, expect, test as base, type BrowserContext, type Worker } from '@playwright/test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import type { browser } from 'wxt/browser';
import { MOCK_HOSTS, startMockCanvas, type MockCanvas } from './mock-canvas/server.ts';

export const V3_BUILD = path.resolve('.output/chrome-mv3');
export const V2_BUILD = path.resolve('.output/legacy-v2');

export const CANVAS = `https://${MOCK_HOSTS.instructure}`;
export const CUSTOM_DOMAIN_CANVAS = `https://${MOCK_HOSTS.customDomain}`;
export const NOT_CANVAS = `https://${MOCK_HOSTS.notCanvas}`;

interface WorkerFixtures {
  extensionPath: string;
  /** Remote-debugging port, for attaching to targets Playwright doesn't see (the action popup). */
  cdpPort: number;
  /** Where Chrome saves downloads, with the folder structure the extension asked for. */
  downloadsDir: string;
  mock: MockCanvas;
  extContext: BrowserContext;
  serviceWorker: Worker;
  extensionId: string;
}

export const test = base.extend<object, WorkerFixtures>({
  extensionPath: [V3_BUILD, { option: true, scope: 'worker' }],

  mock: [
    async ({}, use) => {
      const mock = await startMockCanvas();
      await use(mock);
      await mock.close();
    },
    { scope: 'worker' },
  ],

  cdpPort: [
    async ({}, use) => {
      const port = await new Promise<number>((resolve) => {
        const server = createServer().listen(0, () => {
          const { port: free } = server.address() as { port: number };
          server.close(() => resolve(free));
        });
      });
      await use(port);
    },
    { scope: 'worker' },
  ],

  downloadsDir: [
    async ({}, use) => {
      const dir = mkdtempSync(path.join(os.tmpdir(), 'ccd-downloads-'));
      await use(dir);
      rmSync(dir, { recursive: true, force: true });
    },
    { scope: 'worker' },
  ],

  extContext: [
    async ({ extensionPath, mock, downloadsDir, cdpPort }, use) => {
      const userDataDir = mkdtempSync(path.join(os.tmpdir(), 'ccd-e2e-'));
      // Chrome's own download settings, so chrome.downloads keeps real names and subfolders.
      mkdirSync(path.join(userDataDir, 'Default'), { recursive: true });
      writeFileSync(
        path.join(userDataDir, 'Default', 'Preferences'),
        JSON.stringify({
          download: {
            default_directory: downloadsDir,
            prompt_for_download: false,
            directory_upgrade: true,
          },
        }),
      );
      const rules = Object.values(MOCK_HOSTS)
        .map((host) => `MAP ${host} 127.0.0.1:${mock.port}`)
        .join(', ');
      const context = await chromium.launchPersistentContext(userDataDir, {
        // Chrome for Testing: branded Chrome ignores --load-extension since 137.
        channel: 'chromium',
        headless: !process.env.HEADED,
        ignoreHTTPSErrors: true,
        viewport: { width: 1280, height: 800 },
        // Exports contain local dates. Pin the whole browser process (pages, service
        // worker, workers) to one zone and locale so results match on every machine.
        env: { ...process.env, TZ: 'UTC' },
        timezoneId: 'UTC',
        locale: 'en-US',
        args: [
          `--disable-extensions-except=${extensionPath}`,
          `--load-extension=${extensionPath}`,
          // DNS-level mapping, so service-worker and downloads traffic reach the mock too.
          `--host-resolver-rules=${rules}`,
          '--ignore-certificate-errors',
          '--lang=en-US',
          `--remote-debugging-port=${cdpPort}`,
        ],
      });
      // Playwright intercepts downloads by default and saves them under GUID names.
      // Hand them back to Chrome so the Preferences above apply.
      const setup = await context.newPage();
      const cdp = await context.newCDPSession(setup);
      await cdp.send('Browser.setDownloadBehavior', {
        behavior: 'default',
        downloadPath: downloadsDir,
      });
      await setup.close();

      await use(context);
      await context.close();
      rmSync(userDataDir, { recursive: true, force: true });
    },
    { scope: 'worker' },
  ],

  serviceWorker: [
    async ({ extContext }, use) => {
      const sw = extContext.serviceWorkers()[0] ?? (await extContext.waitForEvent('serviceworker'));
      await use(sw);
    },
    { scope: 'worker' },
  ],

  extensionId: [
    async ({ serviceWorker }, use) => {
      await use(new URL(serviceWorker.url()).host);
    },
    { scope: 'worker' },
  ],

  page: async ({ extContext, mock }, use) => {
    mock.reset();
    const page = await extContext.newPage();
    await use(page);
    await page.close();
    expect(mock.unexpected, 'Canvas API calls the mock has no handler for').toEqual([]);
  },
});

export { expect };

/**
 * Opens the real toolbar popup for the focused window (as a click on the
 * extension icon does) and returns it. The popup is a separate target that
 * the persistent context doesn't attach to, so it's reached over CDP.
 */
export async function openActionPopup(sw: Worker, cdpPort: number) {
  await sw.evaluate(() =>
    (globalThis as unknown as { chrome: typeof browser }).chrome.action.openPopup(),
  );
  const cdp = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`);
  for (let i = 0; i < 50; i++) {
    const popup = cdp
      .contexts()
      .flatMap((c) => c.pages())
      .find((p) => p.url().endsWith('/popup.html'));
    if (popup) return { popup, close: () => cdp.close() };
    await new Promise((r) => setTimeout(r, 100));
  }
  await cdp.close();
  throw new Error('The action popup did not open');
}

/** Clears extension storage and writes the given storage.sync settings, from the service worker. */
export async function resetExtensionStorage(sw: Worker, syncSettings: Record<string, unknown>) {
  await sw.evaluate(async (settings) => {
    const { storage } = (globalThis as unknown as { chrome: typeof browser }).chrome;
    await storage.sync.clear();
    await storage.local.clear();
    await storage.sync.set(settings);
  }, syncSettings);
}
