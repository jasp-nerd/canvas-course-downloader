import { describe, expect, it } from 'vitest';
import { dotsFor, drawLogo, type LogoCanvas } from './logo';
import { LOGO_ARROW, LOGO_DOTS } from './logo-paths';

describe('the logo as progress', () => {
  it('has 32 dots and an arrow', () => {
    expect(LOGO_DOTS).toHaveLength(32);
    expect(LOGO_ARROW).toMatch(/^M/);
  });

  it('fills no dot at the start and every dot only when done', () => {
    expect(dotsFor(0)).toBe(0);
    expect(dotsFor(0.001)).toBe(1);
    expect(dotsFor(0.5)).toBe(16);
    expect(dotsFor(0.999)).toBe(31);
    expect(dotsFor(1)).toBe(32);
    expect(dotsFor(Number.NaN)).toBe(0);
  });

  it('draws filled dots in one colour and the rest in the other, the arrow filled', () => {
    const fills: unknown[] = [];
    const ctx: LogoCanvas = {
      fillStyle: '',
      setTransform: () => {},
      fill() {
        fills.push(this.fillStyle);
      },
    };
    drawLogo(ctx, 16, 3, { on: 'red', off: 'pale' }, () => ({}) as Path2D);
    expect(fills).toHaveLength(33);
    expect(fills.slice(0, 3)).toEqual(['red', 'red', 'red']);
    expect(fills.slice(3, 32).every((f) => f === 'pale')).toBe(true);
    expect(fills[32]).toBe('red');
  });
});
