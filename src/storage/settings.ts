// User settings in storage.sync, under the same top-level keys v2 used, so an
// update keeps everything users chose.
import { browser } from 'wxt/browser';
import type { StoredSettings } from '../engine/options';

export interface Settings extends Required<Omit<StoredSettings, 'contentTypes'>> {
  contentTypes: NonNullable<StoredSettings['contentTypes']>;
  zipMode: boolean;
  /** Folder inside Downloads (or the chosen folder) to save into, "" for none. */
  folderPrefix: string;
  /** Downloads, or a folder the user chose (Chromium; the handle is in IndexedDB). */
  saveTo: 'downloads' | 'folder';
  conflictAction: 'uniquify' | 'overwrite';
  incrementalMode: boolean;
  /** When Canvas is opened, download new files from courses saved before, without asking. */
  autoDownloadNew: boolean;
  /** Which preset the options page highlights. */
  preset: string;
}

export const DEFAULT_SETTINGS: Settings = {
  contentTypes: {},
  exportFormat: 'html',
  excludeVideos: false,
  maxFileSizeMB: 0,
  zipMode: true,
  folderPrefix: '',
  saveTo: 'downloads',
  conflictAction: 'uniquify',
  incrementalMode: false,
  autoDownloadNew: false,
  preset: 'full-archive',
};

export async function loadSettings(): Promise<Settings> {
  const keys = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[];
  const stored = await browser.storage.sync.get<Record<string, unknown>>(keys);
  const settings: Settings = { ...DEFAULT_SETTINGS };
  for (const [key, value] of Object.entries(stored)) {
    if (value !== undefined) Object.assign(settings, { [key]: value });
  }
  // Before v2.5.3 users could choose "skip", which the downloads API rejects.
  if (settings.conflictAction !== 'overwrite') settings.conflictAction = 'uniquify';
  return settings;
}

export async function saveSettings(changes: Partial<Settings>): Promise<void> {
  await browser.storage.sync.set(changes);
}
