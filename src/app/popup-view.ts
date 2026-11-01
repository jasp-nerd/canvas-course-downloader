// What the toolbar popup says about settings and courses saved before, kept
// out of the component so it can be tested.
import type { CourseInventory } from '../storage/inventory';
import type { Settings } from '../storage/settings';
import { AI_TARGETS } from '../export/study-pack';
import type { UpdateCheck } from './updates';
import { shortDay } from './day';
import { newItems } from './updates';

/** "One ZIP per course in Downloads": how a download is saved and where, in plain words. */
export function modeLine(settings: Settings, saveTo?: string): string {
  const makes =
    settings.profile === 'study'
      ? `Study pack for ${AI_TARGETS[settings.aiTarget].tool}`
      : settings.profile === 'agents'
        ? `Files for code as ${settings.zipMode ? 'a ZIP' : 'folders'}`
        : settings.zipMode
          ? 'One ZIP per course'
          : 'Folders';
  return saveTo ? `${makes} in ${saveTo}` : makes;
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
  return `${shortDay(at, now)} ${time}`;
}

export interface SavedCourseRow {
  courseId: string;
  courseName: string;
  savedAt: number;
  /** New files, announcements and updated pages from the last update check; null when it hasn't looked. */
  newFiles: number | null;
  /** Something besides files changed, so "new files" would undersell it. */
  moreThanFiles: boolean;
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
    .map(({ courseId, courseName, savedAt }) => {
      const update = check?.courses.find((c) => c.courseId === courseId);
      return {
        courseId,
        courseName,
        savedAt,
        newFiles: update ? newItems(update) : null,
        moreThanFiles: !!(update?.newAnnouncements || update?.changedDocuments),
      };
    });
}
