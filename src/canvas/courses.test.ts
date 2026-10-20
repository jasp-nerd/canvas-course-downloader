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

  it('orders terms without start dates by the year in their name, as on canvas.vu.nl', () => {
    const groups = groupByTerm([
      course(1, 'A', '2024 - P 1'),
      course(2, 'B', 'Default term'),
      course(3, 'C', '2026 - P 1'),
      course(4, 'D', '2025 - P 2'),
      course(5, 'E', '2026 - P 2'),
      course(6, 'F', 'Spring 2026', '2026-02-01T00:00:00Z'),
    ]);
    expect(groups.map((g) => g.term)).toEqual([
      'Spring 2026',
      '2026 - P 2',
      '2026 - P 1',
      '2025 - P 2',
      '2024 - P 1',
      'Default term',
    ]);
  });

  it('orders undated terms named by season within a year', () => {
    const groups = groupByTerm(
      ['Spring 2026', 'Fall 2025', 'Fall 2026', 'Summer 2026', 'Winter 2026', 'Autumn 2024'].map(
        (term, i) => course(i, term, term),
      ),
    );
    expect(groups.map((g) => g.term)).toEqual([
      'Fall 2026',
      'Summer 2026',
      'Spring 2026',
      'Winter 2026',
      'Fall 2025',
      'Autumn 2024',
    ]);
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
