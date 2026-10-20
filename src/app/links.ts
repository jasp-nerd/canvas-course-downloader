// Outbound links. A link left empty is hidden in the UI until it exists.

export const LINKS = {
  github: 'https://github.com/jasp-nerd/canvas-course-downloader',
  sponsors: 'https://github.com/sponsors/jasp-nerd',
  /** jasp's Ko-fi page, once created. */
  koFi: '',
  /** Google Form for "something's wrong" feedback, once created. */
  feedbackForm: '',
  privacy: 'https://github.com/jasp-nerd/canvas-course-downloader/blob/main/PRIVACY.md',
};

const REVIEW_PAGES: Record<string, string> = {
  chrome:
    'https://chromewebstore.google.com/detail/canvas-course-downloader/mmnmcnffbkcnhcjiidmdnaclpfeekiol/reviews',
  // The slug is claimed on the first AMO upload.
  firefox: 'https://addons.mozilla.org/firefox/addon/canvas-course-downloader/reviews/',
  // Edge assigns its listing id on first publish.
  edge: '',
};

/** The store review page for the browser this build is for; "" when there is none yet. */
export function reviewUrl(browserName: string = import.meta.env.BROWSER): string {
  return REVIEW_PAGES[browserName] ?? '';
}

/**
 * Tags a link with where it was clicked, so store and GitHub traffic stats show
 * what works. Nothing is sent from the extension itself.
 */
export function tracked(url: string, place: string): string {
  if (!url) return '';
  const u = new URL(url);
  u.searchParams.set('utm_source', 'extension');
  u.searchParams.set('utm_medium', place);
  return u.toString();
}

/**
 * Where "Tell me what went wrong" goes: the feedback form with version and
 * browser filled in (write {version} and {browser} into its prefill URL), or a
 * new GitHub issue until the form exists.
 */
export function feedbackUrl(version: string, browserName: string): string {
  if (LINKS.feedbackForm) {
    return LINKS.feedbackForm
      .replace('{version}', encodeURIComponent(version))
      .replace('{browser}', encodeURIComponent(browserName));
  }
  const url = new URL(`${LINKS.github}/issues/new`);
  url.searchParams.set('title', 'Problem: ');
  url.searchParams.set(
    'body',
    `What went wrong?\n\n\nVersion: ${version}\nBrowser: ${browserName}`,
  );
  return url.toString();
}
