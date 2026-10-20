// Every message between the extension's parts, typed in one place.
import { defineExtensionMessaging } from '@webext-core/messaging';

export interface StartExportRequest {
  /** The Canvas origin the request came from, e.g. "https://canvas.vu.nl". */
  origin: string;
  courseIds: string[];
}

interface ProtocolMap {
  /** Content script → background: open the Export tab for these courses. */
  startExport(data: StartExportRequest): void;
  /** Background → content script: the keyboard shortcut was pressed. */
  downloadCurrent(): void;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
