// The logo fills as courses save: on this tab (its favicon) and on the
// extension's toolbar icon, so progress shows while the user is in Canvas.
// action.setIcon needs no permission.
import { browser } from 'wxt/browser';
import { drawLogo } from '../../ui/logo';

function logoCanvas(size: number, filled: number) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  drawLogo(ctx, size, filled);
  return { canvas, ctx };
}

/** Shows the logo with `filled` of its 32 dots as this page's favicon. */
export function setFavicon(filled: number) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.append(link);
  }
  link.href = logoCanvas(32, filled).canvas.toDataURL('image/png');
}

export async function setToolbarIcon(filled: number) {
  const imageData = Object.fromEntries(
    [16, 32].map((size) => [size, logoCanvas(size, filled).ctx.getImageData(0, 0, size, size)]),
  );
  try {
    await browser.action.setIcon({ imageData });
  } catch {
    // Progress on the icon is a nicety; the page shows it too.
  }
}

/** Back to the icons in the manifest (wxt.config.ts). */
export async function resetToolbarIcon() {
  const path = Object.fromEntries(Object.entries(browser.runtime.getManifest().icons ?? {}));
  try {
    await browser.action.setIcon({ path });
  } catch {
    // As above: the icon is a nicety, and Firefox for Android has no toolbar.
  }
}
