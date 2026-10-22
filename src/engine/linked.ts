// Files and media referenced inside Canvas HTML (pages, assignments,
// announcements, discussions, quizzes, submissions, the syllabus).
import { CanvasError } from '../canvas/client';
import {
  extractMediaRefs,
  mediaFilename,
  pickMediaSource,
  type MediaRef,
  type MediaSource,
} from '../export/media';
import {
  addCanvasFile,
  addText,
  failureStatus,
  noteNotCaptured,
  type CanvasFile,
  type CourseExport,
} from './context';
import type { RemoteEntry } from './types';

const FILE_LINKS =
  'a[href*="/files/"], img[src*="/files/"], iframe[src*="/files/"], source[src*="/files/"], video[src*="/files/"], audio[src*="/files/"], embed[src*="/files/"]';

/**
 * Whether a link points into this Canvas: relative, the same origin, or the
 * school's instructure.com name. "https://images.example.com/files/123/x.jpg"
 * isn't Canvas file 123.
 */
function isCanvasLink(ref: string, origin: string): boolean {
  try {
    const url = new URL(ref, origin);
    return url.origin === origin || url.hostname.endsWith('.instructure.com');
  } catch {
    return false; // Not a URL at all.
  }
}

function rethrowFatal(error: unknown) {
  if (error instanceof CanvasError && (error.kind === 'session' || error.kind === 'aborted'))
    throw error;
}

/** Queues every /files/<id> and Canvas media embed in `html` that isn't queued yet. */
export async function extractLinkedFiles(
  ctx: CourseExport,
  html: string,
  source: string,
): Promise<void> {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const link of doc.querySelectorAll(FILE_LINKS)) {
    const ref = link.getAttribute('href') || link.getAttribute('src') || '';
    if (!isCanvasLink(ref, ctx.origin)) continue;
    const id = /\/files\/(\d+)/.exec(ref)?.[1];
    if (!id || ctx.seenFileIds.has(id) || ctx.inaccessibleFileIds.has(id)) continue;

    // Canvas grants access to a file through the place it's linked from:
    // `location=course_syllabus_<id>` lets anyone who can see that syllabus read
    // the file, even in a course they're not enrolled in. Forward it.
    const params: Record<string, string> = {};
    try {
      const parsed = new URL(ref, ctx.origin);
      for (const key of ['location', 'verifier']) {
        const value = parsed.searchParams.get(key);
        if (value) params[key] = value;
      }
    } catch {
      // A malformed link carries no params.
    }
    const linkedCourse = /\/courses\/(\d+)\/files\//.exec(ref)?.[1];
    const sourceCourseId = linkedCourse && linkedCourse !== ctx.courseId ? linkedCourse : undefined;
    const report = (status: string) => {
      ctx.inaccessibleFileIds.add(id);
      noteNotCaptured(ctx, {
        source,
        text: link.textContent ?? '',
        url: ref,
        status,
        ...(sourceCourseId ? { sourceCourseId } : {}),
      });
    };

    let data: CanvasFile;
    try {
      data = await ctx.canvas.get<CanvasFile>(`/files/${id}`, params);
    } catch (error) {
      rethrowFatal(error);
      report(failureStatus(error));
      continue;
    }
    // A file locked for this user comes back without a url; fetching "" would save a Canvas page.
    if (!data.url) {
      report(data.locked_for_user ? 'locked' : 'no-url');
      continue;
    }
    const name = data.display_name || (link.textContent ?? '').trim() || `file_${id}`;
    addCanvasFile(
      ctx,
      { ...data, id: String(data.id ?? id) },
      'Extracted_Files/',
      name,
      sourceCourseId ? { sourceCourseId } : {},
    );
  }

  for (const ref of extractMediaRefs(html)) await resolveMedia(ctx, ref, source, 'Media/');
}

interface MediaInfo {
  media_id?: string;
  attachment_id?: string | number;
  title?: string;
  user_entered_title?: string;
  media_type?: string;
  media_sources?: MediaSource[];
  media_tracks?: unknown[];
}

/**
 * Resolves a Canvas media embed to its best downloadable flavor and queues it,
 * with captions as .srt beside it. The same video reached through another embed
 * form reuses the queued copy. Returns null when it can't be saved.
 */
export async function resolveMedia(
  ctx: CourseExport,
  ref: MediaRef,
  source: string,
  folder: string,
  prefix = '',
): Promise<RemoteEntry | null> {
  const key = `${ref.kind}:${ref.id}`;
  if (ctx.mediaByRef.has(key)) return ctx.mediaByRef.get(key)!;
  const entry = await resolveMediaUncached(ctx, ref, source, folder, prefix);
  ctx.mediaByRef.set(key, entry);
  return entry;
}

async function resolveMediaUncached(
  ctx: CourseExport,
  ref: MediaRef,
  source: string,
  folder: string,
  prefix: string,
): Promise<RemoteEntry | null> {
  const infoPath =
    ref.kind === 'attachment'
      ? `/media_attachments/${ref.id}/info`
      : `/media_objects/${encodeURIComponent(ref.id)}/info`;
  const infoUrl = `${ctx.origin}${infoPath}`;
  const label = ref.title || `media ${ref.id}`;
  const report = (text: string, status: string) =>
    noteNotCaptured(ctx, { source, text, url: ref.ref || infoUrl, status });

  let info: MediaInfo;
  try {
    info = await ctx.canvas.get<MediaInfo>(infoUrl, ref.params);
  } catch (error) {
    rethrowFatal(error);
    report(label, failureStatus(error));
    return null;
  }

  const mediaId = info.media_id || (ref.kind === 'media' ? ref.id : '');
  const attachmentId = ref.kind === 'attachment' ? ref.id : String(info.attachment_id ?? '');
  const keys: string[] = [];
  if (attachmentId) {
    for (const p of [
      `/media_attachments_iframe/${attachmentId}`,
      `/media_attachments/${attachmentId}`,
    ])
      keys.push(`${ctx.origin}${p}`, p);
  }
  if (mediaId) {
    for (const p of [`/media_objects_iframe/${mediaId}`, `/media_objects/${mediaId}`])
      keys.push(`${ctx.origin}${p}`, p);
    keys.push(`media:${mediaId}`);
  }

  const existing = mediaId ? ctx.mediaById.get(mediaId) : undefined;
  if (existing) {
    for (const k of keys) if (!existing.mediaKeys!.includes(k)) existing.mediaKeys!.push(k);
    return existing;
  }

  const best = pickMediaSource(info.media_sources);
  // No sources: Canvas is still transcoding, or the media server won't list them.
  if (!best) {
    report(info.title || label, 'no-media-sources');
    return null;
  }
  let url: string;
  try {
    url = new URL(best.url || best.src || '', ctx.origin).href;
  } catch {
    report(info.title || label, 'bad-media-url');
    return null;
  }

  const name = `${prefix}${mediaFilename(info, best, ref.title || `media_${ref.id}`)}`;
  const entry: RemoteEntry = {
    kind: 'remote',
    url,
    folder,
    name,
    // Kaltura reports flavor sizes in KB on some instances and bytes on others; better unknown.
    size: 0,
    contentType: best.content_type || (info.media_type === 'audio' ? 'audio/mp4' : 'video/mp4'),
    modifiedAt: '',
    mediaKeys: keys,
  };
  ctx.entries.push(entry);
  if (mediaId) ctx.mediaById.set(mediaId, entry);

  if (Array.isArray(info.media_tracks) && info.media_tracks.length && mediaId) {
    const tracksPath = attachmentId
      ? `/media_attachments/${attachmentId}/media_tracks`
      : `/media_objects/${encodeURIComponent(mediaId)}/media_tracks`;
    try {
      const tracks = await ctx.canvas.get<{ content?: string; locale?: string; kind?: string }[]>(
        tracksPath,
        {
          'include[]': 'content',
        },
      );
      const stem = name.replace(/\.[a-z0-9]+$/i, '');
      for (const t of Array.isArray(tracks) ? tracks : []) {
        if (!t.content) continue;
        const tag = [t.locale, t.kind && t.kind !== 'subtitles' ? t.kind : '']
          .filter(Boolean)
          .join('.');
        addText(ctx, folder, `${stem}${tag ? `.${tag}` : ''}.srt`, t.content);
      }
    } catch (error) {
      rethrowFatal(error);
    }
  }
  return entry;
}
