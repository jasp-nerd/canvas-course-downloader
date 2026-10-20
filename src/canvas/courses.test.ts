import { describe, expect, it } from 'vitest';
import { groupByTerm, matchesSearch, type CourseSummary } from './courses';

const course = (id: number, name: string, term?: string, start?: string): CourseSummary => ({
  id,
  name,
  course_code: `C${id}`,
  ...(term ? { term: { name: term, start_at: start ?? null } } : {}),
});

describe('groupByTerm', () => {
  it('puts the newest term first and undated or default terms last', () => {
    const groups = groupByTerm([
      course(1, 'A', 'Spring 2026', '2026-02-01T00:00:00Z'),
      course(2, 'B', 'Default Term', '2020-01-01T00:00:00Z'),
      course(3, 'C', 'Fall 2026', '2026-09-01T00:00:00Z'),
      course(4, 'D'),
      course(5, 'E', 'Fall 2026', '2026-09-01T00:00:00Z'),
    ]);
    expect(groups.map((g) => g.term)).toEqual([
      'Fall 2026',
      'Spring 2026',
      'Default Term',
      'Other',
    ]);
    expect(groups[0]!.courses.map((c) => c.id)).toEqual([3, 5]);
  });
});

describe('matchesSearch', () => {
  it.each([
    ['linear', true],
    ['C7', true],
    ['spring', true],
    ['  ', true],
    ['biology', false],
  ])('%j', (query, expected) => {
    expect(matchesSearch(course(7, 'Linear Algebra', 'Spring 2026'), query)).toBe(expected);
  });
});
