// What the receipt's buttons do. downloads.show and showDefaultFolder need only
// the "downloads" permission; downloads.open would need a new one, so it's never used.
import { browser } from 'wxt/browser';
import type { CourseState } from '../../app/export-job';

/** Opens the file manager at the ZIP, or at a file at the top of the course folder. */
export function showInFolder(course: CourseState) {
  if (course.downloadId === undefined) return browser.downloads.showDefaultFolder();
  // Firefox answers with a promise that fails when the file was moved or deleted since;
  // the Downloads folder is the next best place then.
  Promise.resolve(browser.downloads.show(course.downloadId)).catch(() =>
    browser.downloads.showDefaultFolder(),
  );
}

export const openSettings = () => void browser.runtime.openOptionsPage();

/** Starts the given courses again in this tab. */
export function tryAgain(courseIds: string[]) {
  const url = new URL(location.href);
  url.searchParams.set('courses', courseIds.join(','));
  location.replace(url);
}
