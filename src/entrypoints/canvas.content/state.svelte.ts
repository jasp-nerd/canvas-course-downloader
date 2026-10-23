/** Page state shared by the injected UI; updates when the "what's new" check finishes. */
export const pageState = $state({
  newFiles: 0,
  /** When this course was last saved (ms), for "3 new since Tue"; 0 when unknown. */
  savedAt: 0,
});
