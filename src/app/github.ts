// The project's star count, for the "Star on GitHub" button. Asked of GitHub's
// public API at most once a day, without cookies: nothing about the user or
// their courses goes with it.
import { browser } from 'wxt/browser';

const API = 'https://api.github.com/repos/jasp-nerd/canvas-course-downloader';
const KEY = 'githubStars';
const DAY = 24 * 60 * 60 * 1000;

interface Cached {
  count: number | null;
  at: number;
}

/** The star count, from storage if it's under a day old; null when it was never known. */
export async function githubStars(
  fetchFn = globalThis.fetch,
  now = Date.now(),
): Promise<number | null> {
  const stored = await browser.storage.local.get<Record<string, Cached | undefined>>(KEY);
  const cached = stored[KEY];
  if (cached && now - cached.at < DAY) return cached.count;
  let count = cached?.count ?? null;
  try {
    const res = await fetchFn(API, {
      credentials: 'omit',
      headers: { Accept: 'application/vnd.github+json' },
    });
    const body = res.ok ? ((await res.json()) as { stargazers_count?: unknown }) : {};
    if (typeof body.stargazers_count === 'number') count = body.stargazers_count;
  } catch {
    // Offline or blocked: keep the last known count, and try again tomorrow.
  }
  // Also after a failure, so a rate limit isn't asked again on every page.
  await browser.storage.local.set({ [KEY]: { count, at: now } satisfies Cached });
  return count;
}

/** 297, 1.2k, 15k. */
export function starLabel(count: number): string {
  if (count < 1000) return String(count);
  const thousands = count / 1000;
  return `${thousands < 10 ? Number(thousands.toFixed(1)) : Math.round(thousands)}k`;
}
