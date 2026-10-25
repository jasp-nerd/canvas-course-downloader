import type { APIRoute } from 'astro';

// Everything may be crawled except the sample export, which is a demo copy of an invented course.
export const GET: APIRoute = ({ site }) =>
  new Response(
    `User-agent: *\nAllow: /\nDisallow: ${import.meta.env.BASE_URL}sample/\n\nSitemap: ${new URL(`${import.meta.env.BASE_URL}sitemap.xml`, site)}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
