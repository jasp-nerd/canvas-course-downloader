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
}

export interface PageInfo {
  origin: string;
  /** Set on course pages. */
  courseId: string | null;
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
  /** Popup → content script: open the course picker. */
  openPicker(): void;
  /** Content script → background: the number on the toolbar icon for this tab ("" clears it). */
  setBadge(text: string): void;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
