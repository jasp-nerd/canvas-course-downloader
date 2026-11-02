// Is this page Canvas? Canvas runs on *.instructure.com and on schools' own
// domains (canvas.vu.nl, ...), so off instructure.com we look for page markers
// only Canvas has, and require two so other sites never match by accident.

const SIGNALS: ((doc: Document) => boolean)[] = [
  (doc) => doc.querySelector('.ic-app') !== null,
  (doc) => doc.querySelector('link[href*="brandable_css"]') !== null,
  (doc) => doc.querySelector('meta[name="apple-itunes-app"][content*="480883488"]') !== null,
  (doc) => doc.querySelector('.ic-app-nav-toggle-and-crumbs') !== null,
  (doc) =>
    [...doc.querySelectorAll('script:not([src])')].some((s) =>
      s.textContent?.includes('DOMAIN_ROOT_ACCOUNT_ID'),
    ),
];

export function isCanvasPage(doc: Document, hostname: string): boolean {
  if (hostname.includes('instructure.com')) return true;
  let hits = 0;
  for (const signal of SIGNALS) if (signal(doc) && ++hits >= 2) return true;
  return false;
}

/** The course id in a Canvas URL path, e.g. "/courses/101/modules" → "101". */
export function courseIdFromPath(pathname: string): string | null {
  return /\/courses\/(\d+)/.exec(pathname)?.[1] ?? null;
}
