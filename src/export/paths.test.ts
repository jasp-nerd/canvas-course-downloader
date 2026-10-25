import { describe, expect, it } from 'vitest';
import { loadV2Helpers } from '../../tests/legacy/v2';
import { formatDate } from './format';
import { relativeHref } from './paths';

const v2 = loadV2Helpers();

describe('relativeHref matches v2', () => {
  it.each([
    ['', 'Pages/foo.html'],
    ['Pages/', 'Assignments/bar.html'],
    ['Submissions/Assignment 1/', 'Extracted_Files/x.png'],
    ['deep/nested/folder', 'Files/a.pdf'],
  ])('from %j to %j', (from, to) => {
    expect(relativeHref(from, to)).toBe(v2.relativeUrlFromTo(from, to));
  });
});

describe('formatDate matches v2', () => {
  it.each(['2026-09-15T21:59:00Z', '2026-01-01T00:00:00.000Z', '', null, 'not a date'])(
    '%j',
    (iso) => {
      expect(formatDate(iso)).toBe(v2.formatDate(iso));
    },
  );
});
