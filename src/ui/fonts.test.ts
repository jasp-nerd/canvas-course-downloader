import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { FONT_FILES, fromBase64, readFonts, toBase64 } from './fonts';

/** The @font-face rules in fonts.css, as plain values. */
function facesInCss() {
  const css = readFileSync('src/ui/fonts.css', 'utf8');
  return [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map(([, body]) => {
    const value = (name: string) =>
      new RegExp(`${name}:\\s*([^;]+);`).exec(body!)![1]!.replace(/\s+/g, ' ').trim();
    return {
      family: value('font-family').replaceAll("'", ''),
      weight: value('font-weight'),
      unicodeRange: value('unicode-range'),
      url: /url\('([^']+)'\)/.exec(body!)![1],
    };
  });
}

describe('FONT_FILES', () => {
  it('describes the same faces as fonts.css, which extension pages use', () => {
    expect(FONT_FILES).toEqual(facesInCss());
  });
});

describe('base64', () => {
  it('round-trips bytes, also more than one call to String.fromCharCode can take', () => {
    const bytes = Uint8Array.from({ length: 200_000 }, (_, i) => (i * 7) % 256);
    expect(fromBase64(toBase64(bytes.buffer))).toEqual(bytes);
  });
});

describe('readFonts', () => {
  it("reads the extension's own font files and sends them as base64 with their descriptors", async () => {
    const fetched: string[] = [];
    vi.stubGlobal('fetch', (url: string) => {
      fetched.push(url);
      return Promise.resolve(new Response(new Uint8Array([1, 2, 3])));
    });
    const fonts = await readFonts();
    expect(fetched.map((url) => new URL(url).pathname)).toEqual(FONT_FILES.map((f) => f.url));
    expect(fonts[0]).toEqual({
      family: 'Figtree',
      weight: '300 900',
      unicodeRange: FONT_FILES[0].unicodeRange,
      data: toBase64(new Uint8Array([1, 2, 3]).buffer),
    });
    expect(fonts.map((f) => f.family)).toEqual(['Figtree', 'Figtree', 'Gabarito', 'Gabarito']);
  });
});
