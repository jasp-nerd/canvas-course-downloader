// Every message between the extension's parts, typed in one place.
import { defineExtensionMessaging } from '@webext-core/messaging';

export interface StartExportRequest {
  /** The Canvas origin the request came from, e.g. "https://canvas.vu.nl". */
  origin: string;
  courseIds: string[];
  /** Only what's new or changed since the last export. */
  onlyNew?: boolean;
  /** Started automatically: run in a background tab and close it when everything worked. */
  quiet?: boolean;
  /**
   * Canvas's security token from the page, for the one write request we make:
   * asking Canvas to build its course package. Only sent when that's turned on.
   */
  csrfToken?: string;
}

/** A course as the toolbar popup shows it. */
export interface CourseInfo {
  name: string;
  /** e.g. "MATH 221"; "" when Canvas has none. */
  code: string;
  /** e.g. "Fall 2026"; "" for Canvas's catch-all "Default Term". */
  term: string;
}

export interface PageInfo {
  origin: string;
  /** Set on course pages. */
  courseId: string | null;
}

/** One of our typefaces, for the FontFace API on Canvas pages. */
export interface FontData {
  family: string;
  /** A weight range, e.g. "300 900": the files are variable fonts. */
  weight: string;
  unicodeRange: string;
  /** The woff2 file, base64: Chrome's runtime messages are JSON. */
  data: string;
}

interface ProtocolMap {
  /** Content script → background: open the Export tab for these courses. */
  startExport(data: StartExportRequest): void;
  /** Background → content script: the keyboard shortcut was pressed. */
  downloadCurrent(): void;
  /** Content script → background: open the settings page (content scripts can't). */
  openOptions(): void;
  /** Popup → content script: what Canvas page is this? Only Canvas pages answer. */
  pageInfo(): PageInfo;
  /** Popup → content script: name, code and term of the course this page is in. */
  courseInfo(): CourseInfo | null;
  /** Popup → content script: open the course picker. */
  openPicker(): void;
  /** Content script → background: the number on the toolbar icon for this tab ("" clears it). */
  setBadge(text: string): void;
  /** Content script → background: our typefaces, which Canvas pages can't load from the extension. */
  fontData(): FontData[];
  /** Content script → background: the project's GitHub star count, null when unknown. */
  githubStars(): number | null;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
