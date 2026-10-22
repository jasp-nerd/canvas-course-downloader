import { defineConfig } from 'wxt';

// Permissions here are a public contract: adding a required permission that
// shows an install warning makes Chrome disable the extension for every
// existing user until they re-approve it. scripts/check-manifest.mjs compares
// every build against manifest.snapshot.json, and CI fails on any drift.
export default defineConfig({
  srcDir: 'src',
  imports: false,
  modules: ['@wxt-dev/module-svelte'],
  targetBrowsers: ['chrome', 'edge', 'firefox'],
  // WXT defaults Firefox to MV2, which drops optional_host_permissions.
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: 'Canvas Course Downloader & Exporter',
    description:
      'Download, export, and back up Canvas LMS course files, pages, assignments, grades, and more into organized folders.',
    icons: { 16: '/icons/icon-16.png', 48: '/icons/icon-48.png', 128: '/icons/icon-128.png' },
    permissions: ['activeTab', 'declarativeNetRequest', 'downloads', 'notifications', 'storage'],
    host_permissions: ['*://*.instructure.com/*'],
    optional_host_permissions: ['*://*.canvas-user-content.com/*'],
    declarative_net_request: {
      rule_resources: [{ id: 'ruleset_cors', enabled: true, path: 'rules.json' }],
    },
    action: { default_title: 'Canvas Course Downloader' },
    web_accessible_resources: [{ resources: ['icons/icon-128.png'], matches: ['https://*/*'] }],
    commands: {
      'download-current': {
        // Ctrl/Cmd+Shift+D is Firefox's "Bookmark all tabs" and can't be overridden there.
        suggested_key:
          browser === 'firefox'
            ? { default: 'Alt+Shift+D' }
            : { default: 'Ctrl+Shift+D', mac: 'Command+Shift+D' },
        description: 'Download current course or open course selector',
      },
    },
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          // Never change: Firefox ties storage and the AMO listing to this id.
          id: 'canvas-course-downloader@jasp-nerd',
          // optional_host_permissions needs 128; data_collection_permissions needs 140.
          strict_min_version: '140.0',
          data_collection_permissions: { required: ['none'] },
        },
      },
    }),
  }),
  zip: {
    // The repo root holds marketing material and old release zips; AMO only needs the build inputs.
    includeSources: [
      'src/**',
      'public/**',
      'package.json',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      'tsconfig.json',
      'wxt.config.ts',
      'svelte.config.js',
      'SOURCE_CODE_REVIEW.md',
      'LICENSE',
    ],
  },
});
