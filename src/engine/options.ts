import { CONTENT_TYPES, type ContentType, type ExportOptions } from './types';

/** Settings as v2 stored them in storage.sync (all keys optional for old installs). */
export interface StoredSettings {
  contentTypes?: Partial<Record<ContentType, boolean>>;
  exportFormat?: string;
  excludeVideos?: boolean;
  maxFileSizeMB?: number;
  /** Added in 3.0: whether teachers' copies include students' work. */
  includeStudentWork?: boolean;
}

/**
 * Export options from stored settings. Content types missing from older
 * installs default to on, except submissions, which before v2.9.1 were part of
 * assignments and so follow that choice. (v2 left quizzes off for installs from
 * before v2.7.0 while its options page showed them on.)
 */
export function exportOptionsFrom(stored: StoredSettings, extensionVersion: string): ExportOptions {
  const saved = stored.contentTypes ?? {};
  const contentTypes = Object.fromEntries(
    CONTENT_TYPES.map((t) => [t, saved[t] ?? true]),
  ) as Record<ContentType, boolean>;
  if (saved.submissions === undefined) contentTypes.submissions = contentTypes.assignments;
  return {
    contentTypes,
    format: stored.exportFormat === 'markdown' ? 'markdown' : 'html',
    excludeVideos: stored.excludeVideos === true,
    maxFileSizeMB: Number(stored.maxFileSizeMB) > 0 ? Number(stored.maxFileSizeMB) : 0,
    includeStudentWork: stored.includeStudentWork === true,
    extensionVersion,
  };
}
