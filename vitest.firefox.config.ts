import { defineConfig } from 'vitest/config';

process.env.TZ = 'UTC';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['e2e/firefox/**/*.test.ts'],
    env: { TZ: 'UTC' },
    fileParallelism: false,
  },
});
