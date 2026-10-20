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

/** Courses by term: newest term first; terms without a start date ("Default Term", "Other") last. */
export function groupByTerm(courses: CourseSummary[]): TermGroup[] {
  const terms = new Map<string, { startAt: string | null; courses: CourseSummary[] }>();
  for (const course of courses) {
    const name = course.term?.name || 'Other';
    if (!terms.has(name)) terms.set(name, { startAt: course.term?.start_at ?? null, courses: [] });
    terms.get(name)!.courses.push(course);
  }
  const undated = (name: string, startAt: string | null) =>
    !startAt || name === 'Other' || name.toLowerCase().includes('default');
  return [...terms.entries()]
    .sort(([nameA, a], [nameB, b]) => {
      const lastA = undated(nameA, a.startAt);
      const lastB = undated(nameB, b.startAt);
      if (lastA !== lastB) return lastA ? 1 : -1;
      if (a.startAt && b.startAt) return Date.parse(b.startAt) - Date.parse(a.startAt);
      return nameA.localeCompare(nameB);
    })
    .map(([term, { courses: list }]) => ({ term, courses: list }));
}

/** Search across course name, code and term, as the picker's search box does. */
export function matchesSearch(course: CourseSummary, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [course.name, course.course_code, course.term?.name].some((field) =>
    field?.toLowerCase().includes(q),
  );
}
