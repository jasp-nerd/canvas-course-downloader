import { describe, expect, it } from 'vitest';
import { loadV2Helpers } from '../../tests/legacy/v2';
import { extractMediaRefs, mediaFilename, pickMediaSource } from './media';

const v2 = loadV2Helpers();

const EMBEDS = [
  '<iframe src="/media_attachments_iframe/123?type=video&verifier=abc" data-media-id="m-1x" title="Week 1 lecture"></iframe>',
  '<iframe src="https://school.instructure.com/media_objects_iframe/m-2y?type=video"></iframe>',
  '<a href="/media_objects/m-3z" class="instructure_inline_media_comment">Recording</a>',
  '<video data-media_comment_id="m-4w" src="/courses/1/media_download?entryId=m-4w&type=mp4"></video>',
  '<span data-media-id="0_abc123"></span><iframe src="/media_attachments_iframe/123"></iframe>',
  '<p>No media <a href="https://example.com">here</a></p>',
];

describe('media helpers match v2', () => {
  it.each(EMBEDS)('extracts refs from %s', (html) => {
    expect(extractMediaRefs(html)).toEqual(v2.extractMediaRefs(html));
  });

  it.each([
    [
      [
        { url: 'a.mp4', bitrate: '900', content_type: 'video/mp4' },
        { url: 'b.mp4', bitrate: '2400', content_type: 'video/mp4' },
      ],
    ],
    [
      [
        { url: 'p.m3u8', bitrate: '9000', content_type: 'application/x-mpegURL' },
        { url: 'c.mp4', bitrate: '400' },
      ],
    ],
    [
      [
        { url: 'o.mp4', bitrate: '900', isOriginal: '1' },
        { url: 'n.mp4', bitrate: '900' },
      ],
    ],
    [[]],
    [undefined],
  ])('picks a source from %j', (sources) => {
    expect(pickMediaSource(sources)).toEqual(v2.pickMediaSource(sources));
  });

  it.each([
    [{ title: 'Lecture 1.mp4' }, { content_type: 'video/mp4' }],
    [{ user_entered_title: 'Interview: part 2', title: 'x' }, { fileExt: 'webm' }],
    [{ title: 'Podcast' }, { content_type: 'audio/mp4' }],
    [undefined, { content_type: 'video/quicktime' }],
  ])('names %j / %j', (info, source) => {
    expect(mediaFilename(info, source, 'media_7')).toBe(v2.mediaFilename(info, source, 'media_7'));
  });
});
