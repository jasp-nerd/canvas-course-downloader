import type { CanvasClient } from './client';

export interface CourseSummary {
  id: string | number;
  name: string;
  course_code?: string;
  term?: { name?: string; start_at?: string | null };
}

export interface TermGroup {
  term: string;
  courses: CourseSummary[];
}

export async function listCourses(
  canvas: CanvasClient,
  state: 'active' | 'completed',
): Promise<CourseSummary[]> {
  const courses = await canvas.list<CourseSummary>('/courses', {
    enrollment_state: state,
    'include[]': 'term',
  });
  return courses.filter((c) => c.name).sort((a, b) => a.name.localeCompare(b.name));
}

/** Roughly when a term named "Fall 2026" etc. starts, as a month index. */
const SEASON_MONTH: Record<string, number> = {
  winter: 0,
  spring: 1,
  summer: 5,
  fall: 8,
  autumn: 8,
};

/**
 * Courses by term, newest first. Many schools leave term dates empty (canvas.vu.nl
 * has none), so a term without one is placed by the year and season in its name
 * ("2026 - P 1", "Fall 2025").
 * Terms with neither ("Default term", "Other") go last.
 */
export function groupByTerm(courses: CourseSummary[]): TermGroup[] {
  const terms = new Map<string, { startAt: string | null; courses: CourseSummary[] }>();
  for (const course of courses) {
    const name = course.term?.name || 'Other';
    if (!terms.has(name)) terms.set(name, { startAt: course.term?.start_at ?? null, courses: [] });
    terms.get(name)!.courses.push(course);
  }
  const when = (name: string, startAt: string | null): number | null => {
    if (name === 'Other' || name.toLowerCase().includes('default')) return null;
    if (startAt) return Date.parse(startAt);
    const year = /\b(20\d\d)\b/.exec(name)?.[1];
    if (!year) return null;
    const season = /\b(winter|spring|summer|fall|autumn)\b/i.exec(name)?.[1]?.toLowerCase();
    return Date.UTC(Number(year), season ? SEASON_MONTH[season]! : 0, 1);
  };
  return [...terms.entries()]
    .map(([term, group]) => ({ term, at: when(term, group.startAt), courses: group.courses }))
    .sort((a, b) => {
      if (a.at === null || b.at === null) {
        return a.at === b.at ? a.term.localeCompare(b.term) : a.at === null ? 1 : -1;
      }
      // Same year without dates: "2026 - P 2" before "2026 - P 1".
      return b.at - a.at || b.term.localeCompare(a.term);
    })
    .map(({ term, courses: list }) => ({ term, courses: list }));
}

/** Search across course name, code and term, as the picker's search box does. */
export function matchesSearch(course: CourseSummary, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [course.name, course.course_code, course.term?.name].some((field) =>
    field?.toLowerCase().includes(q),
  );
}
