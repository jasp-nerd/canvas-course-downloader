// The course model an export builds before anything is written: every file to
// fetch, every document to render, and everything that couldn't be captured.

export const CONTENT_TYPES = [
  'files',
  'pages',
  'assignments',
  'submissions',
  'discussions',
  'announcements',
  'modules',
  'syllabus',
  'grades',
  'quizzes',
  'linkedFiles',
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export interface ExportOptions {
  contentTypes: Record<ContentType, boolean>;
  format: 'html' | 'markdown';
  excludeVideos: boolean;
  /** 0 means no limit. */
  maxFileSizeMB: number;
  extensionVersion: string;
}

interface EntryBase {
  /** Folder from the course root, "" or ending in "/", e.g. "Files/Lectures/". */
  folder: string;
  /** File name; documents get their extension when the export is finalized. */
  name: string;
}

/** A file body fetched from Canvas or its CDN. */
export interface RemoteEntry extends EntryBase {
  kind: 'remote';
  url: string;
  /** Bytes as reported by Canvas, 0 when unknown. */
  size: number;
  contentType: string;
  updatedAt: string;
  canvasId?: string;
  /** Set when the file was linked from another course. */
  sourceCourseId?: string;
  /** Every Canvas URL spelling of a media embed that should link to this file. */
  mediaKeys?: string[];
}

/** A page we generate from Canvas content (HTML or Markdown at the end). */
export interface DocumentEntry extends EntryBase {
  kind: 'document';
  title: string;
  bodyHtml: string;
  /** Canvas URLs that should link to this document in other documents. */
  canvasUrls: string[];
}

/** Generated text such as CSVs, captions, the stylesheet and manifest.json. */
export interface TextEntry extends EntryBase {
  kind: 'text';
  content: string;
}

export type Entry = RemoteEntry | DocumentEntry | TextEntry;

/** Something we found but couldn't save, reported in _inaccessible_links.csv. */
export interface NotCaptured {
  source: string;
  text: string;
  url: string;
  status: string;
  sourceCourseId?: string;
}

export interface ExportCounts {
  discussionReplies: number;
  studentSubmissions: number;
  gradebookStudents: number;
  quizzes: number;
  pages: number;
}

/** A finished plan: every output path with where its bytes come from. */
export interface PlannedFile {
  /** Path from the course root, e.g. "Files/Lectures/Week 1.pdf". */
  path: string;
  source:
    | {
        kind: 'remote';
        url: string;
        size: number;
        contentType: string;
        canvasId?: string;
        updatedAt: string;
      }
    | { kind: 'text'; content: string };
}

export interface ExportPlan {
  courseId: string;
  courseName: string;
  files: PlannedFile[];
  notCaptured: NotCaptured[];
  filteredOut: number;
}
