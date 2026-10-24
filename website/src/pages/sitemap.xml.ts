import type { APIRoute } from 'astro';

// The pages people should find from search, each with the date its content last changed
// (not the build date: search engines only trust lastmod when it's accurate).
const PAGES: [string, string][] = [
  ['/', '2026-10-24'],
  ['/download/', '2026-10-24'],
  ['/for-teachers/', '2026-10-24'],
  ['/canvas-access-after-graduation/', '2026-10-24'],
  ['/privacy/', '2026-10-24'],
  ['/changelog/', '2026-10-24'],
  ['/about/', '2026-10-24'],
];

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const urls = PAGES.map(
    ([path, lastmod]) =>
      `  <url><loc>${new URL(`${base}${path}`, site)}</loc><lastmod>${lastmod}</lastmod></url>`,
  ).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
