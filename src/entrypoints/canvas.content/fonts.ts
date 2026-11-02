import { sendMessage } from '../../messaging';
import { fromBase64 } from '../../ui/fonts';

let loading: Promise<void> | undefined;

async function register(): Promise<void> {
  try {
    for (const face of await sendMessage('fontData')) {
      document.fonts.add(
        new FontFace(face.family, fromBase64(face.data), {
          weight: face.weight,
          unicodeRange: face.unicodeRange,
        }),
      );
    }
  } catch {
    // Firefox can refuse FontFace objects made in a content script (its Xray
    // wrappers), and the background is gone after an extension update. Either
    // way the theme's system fonts take over, which is fine.
  }
}

/** Figtree and Gabarito for our parts of the Canvas page: once per page, on first use. */
export function loadCanvasFonts(): Promise<void> {
  loading ??= register();
  return loading;
}
