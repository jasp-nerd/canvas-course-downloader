import { describe, expect, it } from 'vitest';
import { LINKS, feedbackUrl, reviewUrl, tracked } from './links';

describe('links', () => {
  it('points each browser at its own store', () => {
    expect(reviewUrl('chrome')).toContain('chromewebstore.google.com');
    expect(reviewUrl('firefox')).toContain('addons.mozilla.org');
    expect(reviewUrl('edge')).toBe('');
  });

  it('sends people who want to read more to the website', () => {
    expect(LINKS.website).toBe('https://coursedownloader.com');
    expect(LINKS.privacy).toBe('https://coursedownloader.com/privacy/');
    expect(LINKS.changelog).toBe('https://coursedownloader.com/changelog/');
    expect(LINKS.forIt).toBe('https://coursedownloader.com/for-teachers/#it');
  });

  it('opens the feedback form with the version and browser filled in', () => {
    const url = new URL(feedbackUrl('3.0.0', 'firefox'));
    expect(url.origin + url.pathname).toBe(
      'https://docs.google.com/forms/d/e/1FAIpQLScL8oNgjJ2KCYJGA3jxvQqy_Q2Ej9eYQ1C15p-7s4gDWBdzyQ/viewform',
    );
    expect(url.searchParams.get('entry.900642309')).toBe('3.0.0');
    expect(url.searchParams.get('entry.626675324')).toBe('firefox');
  });

  it('tags outbound links with where they were clicked', () => {
    expect(tracked('https://github.com/jasp-nerd/canvas-course-downloader', 'options')).toBe(
      'https://github.com/jasp-nerd/canvas-course-downloader?utm_source=extension&utm_medium=options',
    );
    expect(tracked('', 'options')).toBe('');
  });
});
