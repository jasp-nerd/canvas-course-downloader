// Canvas-native media: videos and audio uploaded or recorded in the editor.
// They play through Canvas's media player, so they never appear as /files/<id>
// links and need their own lookup.
import { sanitizeFilename } from './filenames';

export interface MediaRef {
  /** Which info endpoint resolves it: /media_attachments/:id or /media_objects/:id. */
  kind: 'attachment' | 'media';
  id: string;
  /** The URL as it appeared in the HTML. */
  ref: string;
  /** Access-granting query params to forward (verifier, location). */
  params: Record<string, string>;
  title: string;
}

const MEDIA_ID = '(m-[A-Za-z0-9_-]+|\\d+_[A-Za-z0-9]+)';
const ATTACHMENT = /\/media_attachments(?:_iframe)?\/(\d+)(?:[/?#]|$)/;
const MEDIA_OBJECT = new RegExp(`/media_objects(?:_iframe)?/${MEDIA_ID}(?:[/?#]|$)`);
const ENTRY_ID = new RegExp(`[?&]entryId=${MEDIA_ID}(?:[&#]|$)`);
const BARE_ID = new RegExp(`^${MEDIA_ID}$`);

/**
 * Every Canvas media embed in `html`, in all the forms old and new courses use:
 * media_attachments_iframe (2023+), media_objects_iframe, legacy
 * instructure_inline_media_comment anchors, and media_download?entryId= sources.
 */
export function extractMediaRefs(html: string): MediaRef[] {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const out: MediaRef[] = [];
  const seen = new Set<string>();
  const push = (kind: MediaRef['kind'], id: string, ref: string, title: string) => {
    if (seen.has(`${kind}:${id}`)) return;
    seen.add(`${kind}:${id}`);
    const params: Record<string, string> = {};
    try {
      const parsed = new URL(ref, 'https://canvas.invalid/');
      for (const key of ['verifier', 'location']) {
        const value = parsed.searchParams.get(key);
        if (value) params[key] = value;
      }
    } catch {
      // A malformed URL carries no params.
    }
    out.push({ kind, id, ref, params, title: title.trim() });
  };

  const candidates = doc.querySelectorAll(
    'iframe[src], video[src], audio[src], source[src], a[href], [data-media-id], [data-media_comment_id]',
  );
  for (const el of candidates) {
    const ref = el.getAttribute('src') || el.getAttribute('href') || '';
    const title = el.getAttribute('title') || el.getAttribute('data-title') || el.textContent || '';
    let m: RegExpExecArray | null;
    if ((m = ATTACHMENT.exec(ref))) push('attachment', m[1]!, ref, title);
    else if ((m = MEDIA_OBJECT.exec(ref))) push('media', m[1]!, ref, title);
    else if ((m = ENTRY_ID.exec(ref))) push('media', m[1]!, ref, title);
    else {
      const dataId = el.getAttribute('data-media-id') || el.getAttribute('data-media_comment_id');
      if (dataId && BARE_ID.test(dataId)) push('media', dataId, ref, title);
    }
  }
  return out;
}

export interface MediaSource {
  url?: string;
  src?: string;
  content_type?: string;
  bitrate?: string | number;
  isOriginal?: boolean | string;
  fileExt?: string;
}

/** The highest-bitrate single-file flavor; HLS/DASH playlists can't be saved as one file. */
export function pickMediaSource(sources: MediaSource[] | undefined): MediaSource | null {
  const usable = (sources ?? []).filter((s) => s && (s.url || s.src));
  if (usable.length === 0) return null;
  const score = (s: MediaSource) => {
    let n = parseInt(String(s.bitrate), 10) || 0;
    const type = String(s.content_type ?? '').toLowerCase();
    if (/mpegurl|dash|m3u8/.test(type) || /\.(m3u8|mpd)(\?|$)/.test(s.url ?? s.src ?? '')) n -= 1e9;
    if (s.isOriginal === true || s.isOriginal === '1') n += 1;
    return n;
  };
  return [...usable].sort((a, b) => score(b) - score(a))[0]!;
}

const MEDIA_EXT = /^(mp4|webm|ogg|mp3|m4a|mov|flv|wav|aac|m4v)$/;

/** The media title plus the flavor's extension. */
export function mediaFilename(
  info: { user_entered_title?: string; title?: string } | undefined,
  source: MediaSource | undefined,
  fallbackStem = 'media',
): string {
  let stem =
    sanitizeFilename(info?.user_entered_title || info?.title || fallbackStem).substring(0, 120) ||
    fallbackStem;
  let ext = String(source?.fileExt ?? '')
    .replace(/^\./, '')
    .toLowerCase();
  if (!ext) {
    const type = String(source?.content_type ?? '').toLowerCase();
    const sub = type.split('/')[1] ?? '';
    if (sub === 'mp4' && type.startsWith('audio/')) ext = 'm4a';
    else if (MEDIA_EXT.test(sub)) ext = sub;
    else ext = type.startsWith('audio/') ? 'm4a' : 'mp4';
  }
  const stemExt = /\.([a-z0-9]{2,4})$/i.exec(stem)?.[1]?.toLowerCase();
  if (stemExt && /^(mp4|webm|ogg|mp3|m4a|mov|flv|wav|aac|m4v|avi|mkv|wmv)$/.test(stemExt)) {
    stem = stem.slice(0, -(stemExt.length + 1));
  }
  return `${stem}.${ext}`;
}
