import type { CourseUpdate } from '../../app/updates';

interface PageState {
  /** New files in this page's course, unless the user dismissed the news. */
  newFiles: number;
  /** When this course was last saved (ms), for "3 new since Tue"; 0 when unknown. */
  savedAt: number;
  /** New files per saved course, by course id, for the picker. */
  newByCourse: Record<string, number>;
  /** What the Dashboard note lists. */
  pending: CourseUpdate[];
  /**
   * What the note shows: what's new; just hidden, with "Don't show these again";
   * or just switched off, with Undo. The last two stay up a few seconds.
   */
  note: 'news' | 'hidden' | 'off';
}

/** Page state shared by the injected UI; updates whenever the "what's new" results change. */
export const pageState = $state<PageState>({
  newFiles: 0,
  savedAt: 0,
  newByCourse: {},
  pending: [],
  note: 'news',
});
