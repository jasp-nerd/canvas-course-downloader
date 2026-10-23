// What the toolbar popup says about settings and courses saved before, kept
// out of the component so it can be tested.
import type { CourseInventory } from '../storage/inventory';
import type { Settings } from '../storage/settings';
import { AI_TARGETS } from '../export/study-pack';
import type { UpdateCheck } from './updates';

const DAY = 24 * 60 * 60 * 1000;

/** "A copy to keep · ZIP · Downloads": what a download makes, how it's packed, where it goes. */
export function modeLine(settings: Settings, saveTo?: string): string {
  const makes =
    settings.profile === 'study'
      ? `A study pack for ${AI_TARGETS[settings.aiTarget].tool}`
      : settings.profile === 'agents'
        ? 'Files for code'
        : 'A copy to keep';
  return [makes, settings.zipMode ? 'ZIP' : 'Folders', saveTo].filter(Boolean).join(' · ');
}

const startOfDay = (at: number) => new Date(at).setHours(0, 0, 0, 0);

/** "today", "yesterday", "Tue" within a week, else "Oct 15" (with the year when it isn't this year). */
export function dayLabel(at: number, now = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(at)) / DAY);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return new Date(at).toLocaleDateString('en', { weekday: 'short' });
  const sameYear = new Date(at).getFullYear() === new Date(now).getFullYear();
  return new Date(at).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/** The user's own clock style (14:02 or 2:02 PM), with English words around it. */
const userHourCycle = () =>
  new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hourCycle;

/** "Tue 14:02". */
export function savedAtLabel(
  at: number,
  now = Date.now(),
  hourCycle: Intl.DateTimeFormatOptions['hourCycle'] = userHourCycle(),
): string {
  const time = new Date(at).toLocaleTimeString('en', {
    hour: 'numeric',
    minute: '2-digit',
    hourCycle,
  });
  return `${dayLabel(at, now)} ${time}`;
}

export interface SavedCourseRow {
  courseId: string;
  courseName: string;
  savedAt: number;
  /** From the last update check; null when it hasn't looked at this course. */
  newFiles: number | null;
}

/** Courses saved before, most recent first, with what the last update check found. */
export function savedCourseRows(
  saved: (CourseInventory & { courseId: string })[],
  check: UpdateCheck | null,
  limit = Infinity,
): SavedCourseRow[] {
  return [...saved]
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(0, limit)
    .map(({ courseId, courseName, savedAt }) => ({
      courseId,
      courseName,
      savedAt,
      newFiles: check?.courses.find((c) => c.courseId === courseId)?.newFiles ?? null,
    }));
}
