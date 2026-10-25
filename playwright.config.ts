import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.ts',
  // One browser with the extension per worker, and one mock server per worker.
  workers: 1,
  // GitHub's runners are slower and noisier than a laptop: a retry there keeps one slow run
  // from failing CI, and the report still lists the test as flaky.
  retries: process.env.CI ? 2 : 0,
  timeout: process.env.CI ? 60_000 : 30_000,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  globalSetup: './e2e/global-setup.ts',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'e2e', testIgnore: ['golden/**'] },
    // Regenerates tests/golden from the v2 reference build: `pnpm golden:capture`.
    { name: 'golden', testMatch: 'golden/**/*.spec.ts' },
  ],
});
