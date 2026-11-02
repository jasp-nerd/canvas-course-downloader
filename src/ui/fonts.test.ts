import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FONT_FILES, fromBase64, toBase64 } from './fonts';

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
