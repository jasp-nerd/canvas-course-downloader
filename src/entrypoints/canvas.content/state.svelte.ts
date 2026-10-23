interface PageState {
  /** New files in this page's course, unless the user dismissed the news. */
  newFiles: number;
  /** When this course was last saved (ms), for "3 new since Tue"; 0 when unknown. */
  savedAt: number;
  /** New files per saved course, by course id, for the picker. */
  newByCourse: Record<string, number>;
}

/** Page state shared by the injected UI; updates when the "what's new" check finishes. */
export const pageState = $state<PageState>({ newFiles: 0, savedAt: 0, newByCourse: {} });
