import { defineContentScript } from '#imports';

export default defineContentScript({
  // Canvas runs on custom domains (canvas.vu.nl, ...), so the match stays as broad as v2's.
  // main() must return early on non-Canvas pages: this script loads on every https page.
  matches: ['https://*/*'],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',
  main() {},
});
