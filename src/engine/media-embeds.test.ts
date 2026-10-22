import { describe, expect, it } from 'vitest';
import { createCanvasClient } from '../canvas/client';
import { addCanvasFile, newCourseExport } from './context';
import { extractLinkedFiles } from './linked';
import { exportOptionsFrom } from './options';
import type { RemoteEntry } from './types';

const ORIGIN = 'https://school.instructure.com';

/** Canvas's media endpoints for one uploaded video, file 123, with English captions. */
const canvasMedia: typeof fetch = (input) => {
  const url = new URL(input instanceof Request ? input.url : input.toString());
  const json = (body: unknown) =>
    Promise.resolve(
      new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } }),
    );
  if (url.pathname === '/media_attachments/123/info') {
    return json({
      media_id: 'm-lecture3',
      attachment_id: 123,
      title: 'logic-lecture3.mp4',
      media_type: 'video',
      media_sources: [
        {
          url: `${ORIGIN}/media_attachments/123/redirect?bitrate=900`,
          bitrate: '900',
          content_type: 'video/mp4',
        },
      ],
      media_tracks: [{ locale: 'en' }],
    });
  }
  if (url.pathname === '/api/v1/media_attachments/123/media_tracks') {
    return json([
      { locale: 'en', kind: 'subtitles', content: '1\n00:00:01,000 --> 00:00:02,000\nHello\n' },
    ]);
  }
  return Promise.resolve(new Response('not found', { status: 404 }));
};

function course() {
  return newCourseExport({
    origin: ORIGIN,
    courseId: '101',
    courseName: 'Logic',
    isTeacher: false,
    studentWork: true,
    options: exportOptionsFrom({}, 'test'),
    canvas: createCanvasClient({
      origin: ORIGIN,
      fetch: canvasMedia,
      sleep: () => Promise.resolve(),
    }),
  });
}

const EMBED = '<iframe src="/media_attachments_iframe/123?type=video" title="Lecture 3"></iframe>';

describe('a video embedded in a page', () => {
  it('links to the copy in Files when the same video is there, instead of saving it twice', async () => {
    const ctx = course();
    addCanvasFile(
      ctx,
      {
        id: 123,
        display_name: 'logic-lecture3.mp4',
        url: `${ORIGIN}/files/123/download`,
        size: 455e6,
        'content-type': 'video/mp4',
      },
      'Files/Slides for Logic/',
      'logic-lecture3.mp4',
    );
    await extractLinkedFiles(ctx, EMBED, 'Page: Week 3');

    const videos = ctx.entries.filter((e): e is RemoteEntry => e.kind === 'remote');
    expect(videos.map((v) => `${v.folder}${v.name}`)).toEqual([
      'Files/Slides for Logic/logic-lecture3.mp4',
    ]);
    expect(videos[0]!.mediaKeys).toContain(`${ORIGIN}/media_attachments_iframe/123`);
    // Captions still come along, next to that copy.
    expect(ctx.entries.filter((e) => e.kind === 'text').map((e) => `${e.folder}${e.name}`)).toEqual(
      ['Files/Slides for Logic/logic-lecture3.en.srt'],
    );
  });

  it('is saved in Media when the Files tab was not saved', async () => {
    const ctx = course();
    await extractLinkedFiles(ctx, EMBED, 'Page: Week 3');
    const videos = ctx.entries.filter((e): e is RemoteEntry => e.kind === 'remote');
    expect(videos.map((v) => `${v.folder}${v.name}`)).toEqual(['Media/logic-lecture3.mp4']);
  });
});
