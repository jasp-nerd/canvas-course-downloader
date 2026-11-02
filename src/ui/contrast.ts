// Canvas buttons use each school's brand colour, which can be light (yellow,
// light blue). Pick text that stays readable on it.

const DARK_TEXT = '#1d2733';
const LIGHT_TEXT = '#ffffff';

/** sRGB channels 0-255 from "#rgb", "#rrggbb" or "rgb(r, g, b)"; null when unreadable. */
export function parseColor(color: string): [number, number, number] | null {
  const c = color.trim();
  let m = /^#([0-9a-f]{3})$/i.exec(c);
  if (m) return [...m[1]!].map((h) => parseInt(h + h, 16)) as [number, number, number];
  m = /^#([0-9a-f]{6})$/i.exec(c);
  if (m)
    return [0, 2, 4].map((i) => parseInt(m![1]!.slice(i, i + 2), 16)) as [number, number, number];
  m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(c);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  return null;
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: string, b: string): number {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return 1;
  const [hi, lo] = [luminance(ca), luminance(cb)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** The text colour with the better contrast on `background`. */
export function readableTextOn(background: string): string {
  return contrastRatio(background, LIGHT_TEXT) >= contrastRatio(background, DARK_TEXT)
    ? LIGHT_TEXT
    : DARK_TEXT;
}

/** The school's button colour from Canvas's theme variables, and text that's readable on it. */
export function canvasButtonColors(root: Element = document.documentElement): {
  background: string;
  text: string;
} {
  const style = getComputedStyle(root);
  const background =
    style.getPropertyValue('--ic-brand-button--primary-bgd').trim() ||
    style.getPropertyValue('--ic-brand-primary').trim() ||
    '#0b6bcb';
  return { background, text: readableTextOn(background) };
}
