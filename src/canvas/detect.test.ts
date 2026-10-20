import { describe, expect, it } from 'vitest';
import { courseIdFromPath, isCanvasPage } from './detect';

const page = (html: string) => new DOMParser().parseFromString(html, 'text/html');

describe('isCanvasPage', () => {
  it('trusts instructure.com hosts without looking at the page', () => {
    expect(isCanvasPage(page(''), 'school.instructure.com')).toBe(true);
  });

  it('recognises Canvas on a school domain from two markers', () => {
    const doc = page(
      '<div class="ic-app"></div><script>ENV = { DOMAIN_ROOT_ACCOUNT_ID: "1" }</script>',
    );
    expect(isCanvasPage(doc, 'canvas.vu.nl')).toBe(true);
  });

  it('ignores a site with only one marker', () => {
    expect(isCanvasPage(page('<div class="ic-app"></div>'), 'example.com')).toBe(false);
  });

  // v2.0.3 regression: generic ids and a CSRF meta tag made other sites look like Canvas.
  it('ignores generic markup that many sites share', () => {
    const doc = page(
      '<meta name="csrf-token" content="x"><div id="application"><main id="main"></main></div>',
    );
    expect(isCanvasPage(doc, 'example.com')).toBe(false);
  });
});

describe('courseIdFromPath', () => {
  it.each([
    ['/courses/101', '101'],
    ['/courses/101/modules/items/5', '101'],
    ['/', null],
    ['/courses', null],
  ])('%s → %s', (path, id) => {
    expect(courseIdFromPath(path)).toBe(id);
  });
});
