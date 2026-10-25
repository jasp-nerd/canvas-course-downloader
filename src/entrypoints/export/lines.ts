// Lines of text the receipts share, built as strings: Svelte drops the spaces
// around an {#if} block, which would glue "412 MB·" together.
import type { CourseState } from '../../app/export-job';
import { formatBytes, formatDuration, savedWhen } from '../../app/receipt';

/** "a, b", leaving out empty parts. */
export const joined = (...parts: string[]) => parts.filter(Boolean).join(', ');

/** The size of what was saved, or "" when it isn't known exactly. */
export const sizeOf = (course: CourseState) =>
  course.bytes === undefined ? '' : formatBytes(course.bytes);

/** "Saved today at 14:05, took 2 min 10 s" */
export function whenLine(course: CourseState, now = new Date()) {
  const took =
    course.startedAt && course.finishedAt
      ? `took ${formatDuration(course.finishedAt - course.startedAt)}`
      : '';
  return joined(savedWhen(new Date(course.finishedAt ?? now.getTime()), now), took);
}
