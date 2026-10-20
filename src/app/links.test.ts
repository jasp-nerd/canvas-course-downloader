import { describe, expect, it } from 'vitest';
import { reviewUrl, tracked } from './links';

describe('links', () => {
  it('points each browser at its own store', () => {
    expect(reviewUrl('chrome')).toContain('chromewebstore.google.com');
    expect(reviewUrl('firefox')).toContain('addons.mozilla.org');
    expect(reviewUrl('edge')).toBe('');
  });

  it('tags outbound links with where they were clicked', () => {
    expect(tracked('https://github.com/jasp-nerd/canvas-course-downloader', 'options')).toBe(
      'https://github.com/jasp-nerd/canvas-course-downloader?utm_source=extension&utm_medium=options',
    );
    expect(tracked('', 'options')).toBe('');
  });
});
