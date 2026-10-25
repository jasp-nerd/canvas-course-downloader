import { describe, expect, it } from 'vitest';
import { contrastRatio, parseColor, readableTextOn } from './contrast';

describe('contrast', () => {
  it('parses the colour formats Canvas themes use', () => {
    expect(parseColor('#fc0')).toEqual([255, 204, 0]);
    expect(parseColor('#3375AE')).toEqual([51, 117, 174]);
    expect(parseColor('rgb(10, 20, 30)')).toEqual([10, 20, 30]);
    expect(parseColor('var(--x)')).toBeNull();
  });

  it('measures WCAG contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it.each([
    ['#3375AE', '#ffffff'],
    ['#0b6bcb', '#ffffff'],
    ['#ffcc00', '#1d2733'],
    ['#bfe3ff', '#1d2733'],
  ])('on %s uses %s', (bg, text) => {
    expect(readableTextOn(bg)).toBe(text);
    expect(contrastRatio(bg, text)).toBeGreaterThanOrEqual(4.5);
  });
});
