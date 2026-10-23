// Our typefaces for the dialogs on Canvas pages. Those live in shadow roots,
// where @font-face rules don't apply, and Canvas pages can't load the files
// from the extension without web_accessible_resources, which would change the
// manifest. So the background reads the files and sends them over, and the
// content script registers them with the FontFace API. Extension pages use
// fonts.css instead; a test keeps the two in step.
import { browser } from 'wxt/browser';
import type { FontData } from '../messaging';

const LATIN =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const LATIN_EXT =
  'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF';

export const FONT_FILES = [
  { family: 'Figtree', weight: '300 900', unicodeRange: LATIN, url: '/fonts/figtree-latin.woff2' },
  {
    family: 'Figtree',
    weight: '300 900',
    unicodeRange: LATIN_EXT,
    url: '/fonts/figtree-latin-ext.woff2',
  },
  {
    family: 'Gabarito',
    weight: '400 900',
    unicodeRange: LATIN,
    url: '/fonts/gabarito-latin.woff2',
  },
  {
    family: 'Gabarito',
    weight: '400 900',
    unicodeRange: LATIN_EXT,
    url: '/fonts/gabarito-latin-ext.woff2',
  },
] as const;

// Chrome's runtime messages are JSON, which can't carry an ArrayBuffer.
const CHUNK = 0x8000;

export function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  // In chunks: String.fromCharCode takes only so many arguments.
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function fromBase64(data: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
}

/** In the background: the font files from the extension package, for a content script. */
export function readFonts(): Promise<FontData[]> {
  return Promise.all(
    FONT_FILES.map(async ({ url, ...face }) => {
      const response = await fetch(browser.runtime.getURL(url));
      return { ...face, data: toBase64(await response.arrayBuffer()) };
    }),
  );
}
