import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { githubStars, starLabel } from './github';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 24, 12);
const answer = (status: number, body: unknown) =>
  vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));

beforeEach(() => fakeBrowser.reset());

describe("the project's GitHub stars", () => {
  it('asks GitHub without cookies, then keeps the count for a day', async () => {
    const fetch = answer(200, { stargazers_count: 297 });
    expect(await githubStars(fetch, NOW)).toBe(297);
    expect(await githubStars(fetch, NOW + DAY - 1)).toBe(297);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]).toEqual([
      'https://api.github.com/repos/jasp-nerd/canvas-course-downloader',
      expect.objectContaining({ credentials: 'omit' }),
    ]);
    await githubStars(answer(200, { stargazers_count: 300 }), NOW + DAY);
    expect(await githubStars(fetch, NOW + DAY + 1)).toBe(300);
  });

  it('shows the last known count when GitHub says no, and waits a day before asking again', async () => {
    await githubStars(answer(200, { stargazers_count: 297 }), NOW);
    const limited = answer(403, { message: 'API rate limit exceeded' });
    expect(await githubStars(limited, NOW + DAY)).toBe(297);
    expect(await githubStars(limited, NOW + DAY + 1)).toBe(297);
    expect(limited).toHaveBeenCalledTimes(1);
  });

  it('has no number when it never got one, also offline', async () => {
    const offline = vi.fn(() => Promise.reject(new TypeError('offline')));
    expect(await githubStars(offline, NOW)).toBeNull();
  });

  it('writes big counts short', () => {
    expect(starLabel(297)).toBe('297');
    expect(starLabel(1234)).toBe('1.2k');
    expect(starLabel(2000)).toBe('2k');
    expect(starLabel(15400)).toBe('15k');
  });
});
