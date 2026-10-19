import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    // jsdom, not happy-dom: DOMPurify's README calls happy-dom unsafe for sanitizer tests.
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    mockReset: true,
    restoreMocks: true,
  },
});
