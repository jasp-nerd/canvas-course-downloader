import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

// Exports contain local dates; tests and golden files use UTC on every machine.
process.env.TZ = 'UTC';

export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    // jsdom, not happy-dom: DOMPurify's README calls happy-dom unsafe for sanitizer tests.
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts', 'e2e/**/*.test.ts'],
    env: { TZ: 'UTC' },
    mockReset: true,
    restoreMocks: true,
  },
});
