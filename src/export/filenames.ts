// File and folder names that Chrome, Edge and Firefox accept from the downloads API
// and that extract cleanly from a ZIP on Windows, macOS and Linux.
//
// Chrome rejects a name it would have to change ("Invalid filename") and Firefox
// rejects one its sanitizer would change, instead of fixing it. So every rule here
// removes something a browser would refuse. Characters are mapped the way v2 did
// (reserved characters become "-") so existing users' files keep their names.

export type NameKind = 'file' | 'folder';

/** Length limits per component, in UTF-16 units and UTF-8 bytes. */
const LIMITS: Record<NameKind, { units: number; bytes: number }> = {
  file: { units: 100, bytes: 200 },
  folder: { units: 60, bytes: 120 },
};
const MAX_EXTENSION = 16;

// Extensions Windows shells act on; Chrome refuses them, Firefox renames them.
const SHELL_EXTENSION = /^(lnk|local|scf|url|desktop|webloc|\{.*\})$/i;
// Matched on the part before the first dot, on every OS (Chrome checks them everywhere).
const RESERVED_STEM = /^(CON|PRN|AUX|NUL|CLOCK\$|CONIN\$|CONOUT\$|COM[0-9¹²³]|LPT[0-9¹²³])$/;
const RESERVED_NAMES = new Set([
  'desktop.ini',
  'thumbs.db',
  '.ds_store',
  '.lock',
  '.dropbox',
  '.dropbox.attr',
]);

const encoder = new TextEncoder();
const byteLength = (s: string) => encoder.encode(s).length;
const graphemes = new Intl.Segmenter('en', { granularity: 'grapheme' });

const trimEnds = (s: string) => s.replace(/^[ .~]+|[ .~]+$/g, '');

/** A short, stable tag for a cut name, so truncated names stay unique across runs. */
function hashTag(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
  let out = '';
  for (let i = 0; i < 4; i++) out += alphabet[(h >>> (i * 5)) & 31];
  return out;
}

/** Cuts `s` to fit both limits without splitting a grapheme (emoji, accented letters). */
function cutGraphemes(s: string, units: number, bytes: number): string {
  let out = '';
  for (const { segment } of graphemes.segment(s)) {
    const next = out + segment;
    if (next.length > units || byteLength(next) > bytes) break;
    out = next;
  }
  return out;
}

function splitExtension(name: string): [stem: string, ext: string] {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ''];
}

function guardReserved(name: string): string {
  const firstStem = (name.split('.')[0] ?? '').trim().toUpperCase();
  if (RESERVED_STEM.test(firstStem) || RESERVED_NAMES.has(name.toLowerCase())) return `_${name}`;
  return name.replace(/^_vti_/i, '_vti-');
}

/**
 * Makes one path component (a file or folder name) safe to save.
 * Returns `fallback` when nothing usable is left.
 */
export function sanitizeFilename(
  name: string | null | undefined,
  kind: NameKind = 'file',
  fallback = 'untitled',
): string {
  let s = String(name ?? '')
    .toWellFormed()
    .normalize('NFC')
    .replace(/[\t\n\v\f\r\u0085\u2028\u2029\p{Zs}]/gu, ' ')
    .replace(/[\p{Cc}\p{Cf}\p{Noncharacter_Code_Point}]/gu, '')
    .replace(/[/\\?%*:|"<>]/g, '-');
  s = trimEnds(s);

  let [stem, ext] = splitExtension(s);
  // Firefox strips whitespace after a file's last dot, which it treats as a rejection.
  // Replacing that dot can expose an earlier one with the same problem, so repeat.
  while (kind === 'file' && /\s/.test(ext)) {
    s = `${stem}_${ext.slice(1)}`;
    [stem, ext] = splitExtension(s);
  }
  if (ext && SHELL_EXTENSION.test(ext.slice(1))) {
    s = kind === 'file' ? `${s}.txt` : `${stem}_${ext.slice(1)}`;
  }

  s = guardReserved(s);
  // Windows treats short names containing "~" as 8.3 aliases, which Chrome refuses there.
  if (s.length <= 12 && s.includes('~')) s = s.replace(/~/g, '-');

  const limit = LIMITS[kind];
  if (s.length > limit.units || byteLength(s) > limit.bytes) {
    const [longStem, longExt] = kind === 'file' ? splitExtension(s) : [s, ''];
    const keepExt = longExt.length <= MAX_EXTENSION ? longExt : '';
    const tag = `_${hashTag(s)}`;
    const room = {
      units: limit.units - keepExt.length - tag.length,
      bytes: limit.bytes - byteLength(keepExt) - tag.length,
    };
    s = guardReserved(trimEnds(cutGraphemes(longStem, room.units, room.bytes)) + tag + keepExt);
  }

  return s || fallback;
}
