// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { goldenTextPath, normalize } from './collect.ts';

describe('golden normalization', () => {
  it('masks only the export time and extension version in manifest.json', () => {
    const raw = JSON.stringify({
      course: 'X',
      exportDate: '2026-10-19T12:00:00.000Z',
      extensionVersion: '2.11.0',
      counts: { files: 3 },
    });
    const out = JSON.parse(
      normalize('Course.zip!/manifest.json', Buffer.from(raw)).toString(),
    ) as Record<string, unknown>;
    expect(out).toEqual({
      course: 'X',
      exportDate: '<export-date>',
      extensionVersion: '<extension-version>',
      counts: { files: 3 },
    });
  });

  it('leaves other files byte-for-byte unchanged', () => {
    const html = Buffer.from('<p>exportDate: 2026-10-19</p>');
    expect(normalize('Course/Pages/a.html', html)).toBe(html);
  });

  it('stores ZIP entries under a folder git does not ignore', () => {
    expect(goldenTextPath('Intro to Psychology.zip!/Pages/a.html')).toBe(
      'Intro to Psychology (zip)/Pages/a.html',
    );
    expect(goldenTextPath('Course/Pages/a.html')).toBe('Course/Pages/a.html');
  });
});
