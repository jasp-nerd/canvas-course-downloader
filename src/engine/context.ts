// State shared by the parts of one course export.
import { CanvasError, type CanvasClient } from '../canvas/client';
import type {
  DocumentEntry,
  Entry,
  ExportCounts,
  ExportOptions,
  NotCaptured,
  RemoteEntry,
} from './types';

export interface Student {
  id: string;
  name?: string;
  sortable_name?: string;
  login_id?: string;
  sis_user_id?: string;
  email?: string;
}

/** A module as Canvas shows it, for overviews: items in order, each pointing at its Canvas URL. */
export interface ModuleOutline {
  name: string;
  items: {
    title: string;
    /** Canvas item type: Page, Assignment, File, Discussion, Quiz, ExternalUrl, SubHeader, ... */
    type: string;
    /** The Canvas URL of what the item shows; matches the local link targets. */
    url?: string;
  }[];
}

export interface CourseExport {
  origin: string;
  courseId: string;
  courseName: string;
  isTeacher: boolean;
  options: ExportOptions;
  canvas: CanvasClient;
  entries: Entry[];
  notCaptured: NotCaptured[];
  /** Canvas file ids already queued, so a file linked in five places is saved once. */
  seenFileIds: Set<string>;
  inaccessibleFileIds: Set<string>;
  /** Extra Canvas URLs (e.g. module items) and the resource URL they stand for. */
  aliases: Map<string, string>;
  counts: ExportCounts;
  students: Student[];
  sectionByUserId: Map<string, string>;
  nameByUserId: Map<string, string>;
  /** Media already queued, by Canvas media id, and by every ref that resolved (or failed). */
  mediaById: Map<string, RemoteEntry>;
  mediaByRef: Map<string, RemoteEntry | null>;
  /** Modules in Canvas order, when modules were exported. */
  outline: ModuleOutline[];
}

export function newCourseExport(init: {
  origin: string;
  courseId: string;
  courseName: string;
  isTeacher: boolean;
  options: ExportOptions;
  canvas: CanvasClient;
}): CourseExport {
  return {
    ...init,
    entries: [],
    notCaptured: [],
    seenFileIds: new Set(),
    inaccessibleFileIds: new Set(),
    aliases: new Map(),
    counts: {
      discussionReplies: 0,
      studentSubmissions: 0,
      gradebookStudents: 0,
      quizzes: 0,
      pages: 0,
    },
    students: [],
    sectionByUserId: new Map(),
    nameByUserId: new Map(),
    mediaById: new Map(),
    mediaByRef: new Map(),
    outline: [],
  };
}

/** `https://school.instructure.com/courses/101/<path>` */
export const courseUrl = (ctx: CourseExport, path: string) =>
  `${ctx.origin}/courses/${ctx.courseId}/${path}`;

export function addDocument(
  ctx: CourseExport,
  doc: { title: string; bodyHtml: string; stem: string; folder: string; canvasUrls?: string[] },
): void {
  const entry: DocumentEntry = {
    kind: 'document',
    title: doc.title,
    bodyHtml: doc.bodyHtml,
    folder: doc.folder,
    name: `${doc.stem}.${ctx.options.format === 'markdown' ? 'md' : 'html'}`,
    canvasUrls: doc.canvasUrls ?? [],
  };
  ctx.entries.push(entry);
}

export function addText(ctx: CourseExport, folder: string, name: string, content: string): void {
  ctx.entries.push({ kind: 'text', folder, name, content });
}

export interface CanvasFile {
  id: string | number;
  url?: string;
  display_name?: string;
  filename?: string;
  size?: number;
  'content-type'?: string;
  updated_at?: string;
  modified_at?: string;
  locked_for_user?: boolean;
  folder_id?: string | number;
}

/** Queues a Canvas file once per file id. Returns false if it was already queued. */
export function addCanvasFile(
  ctx: CourseExport,
  file: CanvasFile,
  folder: string,
  name: string,
  extra: Partial<RemoteEntry> = {},
): boolean {
  const id = String(file.id);
  if (!file.url || ctx.seenFileIds.has(id)) return false;
  ctx.seenFileIds.add(id);
  ctx.entries.push({
    kind: 'remote',
    url: file.url,
    folder,
    name,
    size: file.size ?? 0,
    contentType: file['content-type'] ?? '',
    // modified_at moves only when the content changes; updated_at also on renames and publishing.
    modifiedAt: file.modified_at ?? file.updated_at ?? '',
    canvasUpdatedAt: file.updated_at ?? '',
    canvasId: id,
    ...extra,
  });
  return true;
}

export function noteNotCaptured(ctx: CourseExport, item: NotCaptured): void {
  ctx.notCaptured.push({ ...item, text: item.text.trim() });
}

/** The status we report for a failed request: the HTTP status, or "error". */
export const failureStatus = (error: unknown) =>
  error instanceof CanvasError && error.status ? String(error.status) : 'error';

/**
 * Runs one part of the export. If Canvas refuses it (a hidden tab, a 404), the
 * part is reported as not captured and the export goes on. A lost session or a
 * cancel stops the whole export.
 */
export async function attempt(
  ctx: CourseExport,
  source: string,
  url: string,
  run: () => Promise<void>,
): Promise<void> {
  try {
    await run();
  } catch (error) {
    if (error instanceof CanvasError && (error.kind === 'session' || error.kind === 'aborted'))
      throw error;
    noteNotCaptured(ctx, { source, text: source, url, status: failureStatus(error) });
  }
}
