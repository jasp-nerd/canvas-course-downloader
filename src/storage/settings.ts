// User settings in storage.sync, under the same top-level keys v2 used, so an
// update keeps everything users chose.
import { browser } from 'wxt/browser';
import type { StoredSettings } from '../engine/options';
import { AI_TARGETS, type AiTargetId } from '../export/study-pack';

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
  /** What a download makes: a copy of the course, a study pack for an AI tool, or a copy for agents. */
  profile: 'copy' | 'study' | 'agents';
  aiTarget: AiTargetId;
  /** Who the interface talks to; teachers see the student-work option. */
  role: 'student' | 'teacher';
  /** In courses the user teaches: also save students' submissions, grades and names. */
  includeStudentWork: boolean;
  /**
   * In courses the user teaches: also ask Canvas to build its own course package
   * (.imscc, for re-importing). The extension's only write request, so off by default.
   */
  coursePackage: boolean;
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
  profile: 'copy',
  aiTarget: 'notebooklm',
  role: 'student',
  includeStudentWork: false,
  coursePackage: false,
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
  if (!['copy', 'study', 'agents'].includes(settings.profile)) settings.profile = 'copy';
  if (!(settings.aiTarget in AI_TARGETS)) settings.aiTarget = DEFAULT_SETTINGS.aiTarget;
  if (settings.role !== 'teacher') settings.role = 'student';
  return settings;
}

export async function saveSettings(changes: Partial<Settings>): Promise<void> {
  await browser.storage.sync.set(changes);
}
