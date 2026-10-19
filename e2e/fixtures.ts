// Playwright fixtures: one Chrome for Testing per worker with the extension
// loaded and the mock Canvas hosts mapped to an in-process mock server.
//
// Use `test.use({ extensionPath: V2_BUILD })` to run the same scenario
// against the v2.11.0 reference build.
import { chromium, expect, test as base, type BrowserContext, type Worker } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { MOCK_HOSTS, startMockCanvas, type MockCanvas } from './mock-canvas/server.ts';

export const V3_BUILD = path.resolve('.output/chrome-mv3');
export const V2_BUILD = path.resolve('.output/legacy-v2');

export const CANVAS = `https://${MOCK_HOSTS.instructure}`;
export const CUSTOM_DOMAIN_CANVAS = `https://${MOCK_HOSTS.customDomain}`;
export const NOT_CANVAS = `https://${MOCK_HOSTS.notCanvas}`;

interface WorkerFixtures {
  extensionPath: string;
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

  extContext: [
    async ({ extensionPath, mock }, use) => {
      const userDataDir = mkdtempSync(path.join(os.tmpdir(), 'ccd-e2e-'));
      const rules = Object.values(MOCK_HOSTS)
        .map((host) => `MAP ${host} 127.0.0.1:${mock.port}`)
        .join(', ');
      const context = await chromium.launchPersistentContext(userDataDir, {
        // Chrome for Testing: branded Chrome ignores --load-extension since 137.
        channel: 'chromium',
        headless: !process.env.HEADED,
        ignoreHTTPSErrors: true,
        viewport: { width: 1280, height: 800 },
        args: [
          `--disable-extensions-except=${extensionPath}`,
          `--load-extension=${extensionPath}`,
          // DNS-level mapping, so service-worker and downloads traffic reach the mock too.
          `--host-resolver-rules=${rules}`,
          '--ignore-certificate-errors',
        ],
      });
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
