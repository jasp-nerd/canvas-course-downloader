// Facts the pages repeat. Numbers are real and dated: update them, never round them up.

export const PRODUCT = 'Canvas Course Downloader';
export const SHORT = 'Course Downloader';

export const STORE = {
  chrome: 'https://chromewebstore.google.com/detail/mmnmcnffbkcnhcjiidmdnaclpfeekiol',
  // Empty until the listing exists; pages then point Firefox and Edge users to what works today.
  firefox: '',
  edge: '',
};

export const LINKS = {
  github: 'https://github.com/jasp-nerd/canvas-course-downloader',
  releases: 'https://github.com/jasp-nerd/canvas-course-downloader/releases',
  issues: 'https://github.com/jasp-nerd/canvas-course-downloader/issues/new',
  koFi: 'https://ko-fi.com/jaspnerd',
  sponsors: 'https://github.com/sponsors/jasp-nerd',
};

/** From the Chrome Web Store listing, checked on `checked`. */
export const STATS = {
  users: '3,000',
  rating: '4.8',
  ratings: 20,
  checked: '2026-10-24',
};

/** Store links carry where they were clicked, so the store's campaign report shows what works. */
export function tracked(url: string, campaign: string): string {
  if (!url) return '';
  const u = new URL(url);
  u.searchParams.set('utm_source', 'coursedownloader.com');
  u.searchParams.set('utm_medium', 'site');
  u.searchParams.set('utm_campaign', campaign);
  return u.toString();
}

/** A path inside the site, under the configured base. */
export function href(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path}`;
}

/** Phones can't run the extension, so their button writes the visitor an email with the install link. */
export function mailToSelf(site: URL): string {
  const subject = encodeURIComponent(PRODUCT);
  const body = encodeURIComponent(`Install it on my laptop: ${new URL(href('/download/'), site)}`);
  return `mailto:?subject=${subject}&body=${body}`;
}
