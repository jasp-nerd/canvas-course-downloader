// Renders the store images from compose/*.html at their exact pixel sizes. Run from the repo root,
// after capture.ts has filled captures/:
//
//   node media/store/v3/src/render.ts            # every image
//   node media/store/v3/src/render.ts marquee    # only the pages whose name matches
//
// Writes media/store/v3/{chrome,firefox,edge}/. Store limits: Chrome shows 5 screenshots,
// Edge 6, Firefox (AMO) has no limit and gets all seven.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const HERE = import.meta.dirname;
const STORE = path.resolve(HERE, '..');
const only = process.argv[2];

const SHOT = { width: 1280, height: 800 };
const SMALL = { width: 440, height: 280 };
const LARGE = { width: 1400, height: 560 };

const images: { page: string; size: { width: number; height: number }; out: string[] }[] = [
  {
    page: '01-course-page',
    size: SHOT,
    out: ['chrome/01-course-page', 'edge/01-course-page', 'firefox/01-course-page'],
  },
  { page: '02-picker', size: SHOT, out: ['chrome/02-picker', 'edge/02-picker', 'firefox/02-picker'] },
  {
    page: '03-open-me',
    size: SHOT,
    out: ['chrome/03-open-me', 'edge/03-open-me', 'firefox/03-open-me'],
  },
  {
    page: '04-study-pack',
    size: SHOT,
    out: ['chrome/04-study-pack', 'edge/04-study-pack', 'firefox/04-study-pack'],
  },
  {
    page: '05-whats-new',
    size: SHOT,
    out: ['chrome/05-whats-new', 'edge/05-whats-new', 'firefox/05-whats-new'],
  },
  { page: '06-partial', size: SHOT, out: ['edge/06-partial', 'firefox/06-partial'] },
  { page: '07-teacher', size: SHOT, out: ['firefox/07-teacher'] },
  { page: 'promo-small', size: SMALL, out: ['chrome/promo-small', 'edge/promo-small'] },
  { page: 'marquee', size: LARGE, out: ['chrome/marquee', 'edge/promo-large'] },
  { page: 'logo', size: { width: 300, height: 300 }, out: ['edge/logo'] },
];

const browser = await chromium.launch({ channel: 'chromium' });
try {
  for (const image of images) {
    if (only && !image.page.includes(only)) continue;
    const page = await browser.newPage({ viewport: image.size, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(path.join(HERE, 'compose', `${image.page}.html`)).href);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
    });
    // Text that runs past its box would be cut off in the image: say so instead.
    const overflow = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('h1, p, .fit')]
        .filter((el) => el.scrollWidth > el.clientWidth + 1)
        .map((el) => el.textContent?.trim()),
    );
    if (overflow.length) console.log(`warn ${image.page}: text overflows: ${overflow.join(' | ')}`);
    const transparent = image.page === 'logo';
    for (const out of image.out) {
      const file = path.join(STORE, `${out}.png`);
      mkdirSync(path.dirname(file), { recursive: true });
      await page.screenshot({ path: file, omitBackground: transparent });
    }
    console.log(`ok   ${image.page} -> ${image.out.join(', ')}`);
    await page.close();
  }
} finally {
  await browser.close();
}
