import { defineConfig, passthroughImageService } from 'astro/config';

// One canonical origin with trailing slashes; SITE_URL and BASE_PATH let the same build
// run on a GitHub Pages address before the domain exists.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://coursedownloader.com',
  base: process.env.BASE_PATH ?? '/',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Images are encoded ahead of time (scripts/encode-shots.mjs), so no image library is needed.
  image: { service: passthroughImageService() },
  vite: {
    // The site reads the extension's logo, theme and documents from the repo root.
    server: { fs: { allow: ['..'] } },
  },
});
