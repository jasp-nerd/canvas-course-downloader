import { LOGO_ARROW, LOGO_DOTS } from './logo-paths';

/** How many of the logo's dots a progress from 0 to 1 fills; none at 0, all at 1. */
export function dotsFor(progress: number): number {
  if (!Number.isFinite(progress) || progress <= 0) return 0;
  if (progress >= 1) return LOGO_DOTS.length;
  return Math.min(LOGO_DOTS.length - 1, Math.max(1, Math.round(progress * LOGO_DOTS.length)));
}

/** The parts of a 2D canvas context the logo needs (OffscreenCanvas in the service worker). */
export interface LogoCanvas {
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  fill(path: Path2D): void;
  fillStyle: string | CanvasGradient | CanvasPattern;
}

/**
 * Draws the logo at `size` px with its first `filled` dots in `on` and the rest
 * in `off`, for the toolbar icon while a course saves.
 */
export function drawLogo(
  ctx: LogoCanvas,
  size: number,
  filled: number,
  colors: { on: string; off: string } = { on: '#d82828', off: '#f7d3d3' },
  makePath: (d: string) => Path2D = (d) => new Path2D(d),
): void {
  // The viewBox "-80 -80 1800 1800" with the trace's translate(0,1640) scale(0.1,-0.1).
  const s = size / 1800;
  ctx.setTransform(0.1 * s, 0, 0, -0.1 * s, 80 * s, 1720 * s);
  LOGO_DOTS.forEach((d, i) => {
    ctx.fillStyle = i < filled ? colors.on : colors.off;
    ctx.fill(makePath(d));
  });
  ctx.fillStyle = colors.on;
  ctx.fill(makePath(LOGO_ARROW));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
