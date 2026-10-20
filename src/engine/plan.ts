// Builds the full plan for one course export: what to fetch, what to render,
// where everything goes, and what couldn't be captured.
import type { CanvasClient } from '../canvas/client';
import { renderCourseIndex } from '../export/course-index';
import { sanitizeFilename } from '../export/filenames';
import {
  EXPORT_CSS,
  convertLocalMediaEmbeds,
  renderHtmlDocument,
  rewriteCanvasLinks,
} from '../export/html';
import { htmlToMarkdown, renderMarkdownDocument } from '../export/markdown';
import { addText, attempt, courseUrl, newCourseExport, type CourseExport } from './context';
import { csvRow } from './render';
import {
  exportAnnouncements,
  exportAssignmentDocs,
  exportDiscussions,
  exportFiles,
  exportModules,
  exportPages,
  exportSyllabus,
  listPageSlugs,
  type Assignment,
} from './sections/content';
import {
  exportGradebook,
  exportGradingWeights,
  exportOwnGrades,
  loadRoster,
} from './sections/grades';
import { exportQuizzes } from './sections/quizzes';
import { exportAllSubmissions, exportOwnSubmissions } from './sections/submissions';
import { fileChanged } from '../storage/inventory';
import type { Entry, ExportOptions, ExportPlan, PlannedFile, PreviousExport } from './types';

const TEACHER_ROLES = new Set(['teacher', 'ta', 'designer']);
const VIDEO_FILE = /\.(mp4|mov|avi|mkv|webm|wmv|flv|m4v)$/i;

interface Course {
  id: string | number;
  name: string;
  enrollments?: { type: string }[];
  syllabus_body?: string;
}

export interface PlanInput {
  canvas: CanvasClient;
  origin: string;
  courseId: string;
  options: ExportOptions;
  /** Leave out files saved before that haven't changed. */
  onlyNew?: PreviousExport;
  onProgress?: (message: string) => void;
}

export async function planCourseExport(input: PlanInput): Promise<ExportPlan> {
  const { canvas, origin, courseId, options } = input;
  const types = options.contentTypes;
  const progress = input.onProgress ?? (() => {});

  // One call for the name, the user's role and the syllabus. A course Canvas
  // won't show fails the export here instead of producing an empty archive.
  const course = await canvas.get<Course>(`/courses/${courseId}`, {
    'include[]': ['enrollments', 'syllabus_body'],
  });
  const isTeacher = (course.enrollments ?? []).some((e) => TEACHER_ROLES.has(e.type));
  const ctx = newCourseExport({
    origin,
    courseId,
    courseName: course.name,
    isTeacher,
    options,
    canvas,
  });
  const listed = { files: 0, assignments: 0, announcements: 0, discussions: 0, modules: 0 };

  if (options.format === 'html') addText(ctx, '', 'styles.css', EXPORT_CSS);

  if (isTeacher && (types.grades || types.quizzes || types.assignments || types.discussions)) {
    progress('Fetching roster…');
    await attempt(ctx, 'Roster', courseUrl(ctx, 'users'), () => loadRoster(ctx));
  }

  if (types.files) {
    progress('Fetching files…');
    await attempt(ctx, 'Files', courseUrl(ctx, 'files'), async () => {
      listed.files = await exportFiles(ctx);
    });
  }

  const pageSlugs = new Set<string>();
  if (types.pages)
    await attempt(ctx, 'Pages', courseUrl(ctx, 'pages'), () => listPageSlugs(ctx, pageSlugs));

  let assignments: Assignment[] = [];
  if (types.assignments || types.submissions || (isTeacher && types.grades)) {
    progress('Fetching assignments…');
    await attempt(ctx, 'Assignments', courseUrl(ctx, 'assignments'), async () => {
      assignments = await canvas.list<Assignment>(`/courses/${courseId}/assignments`);
      listed.assignments = assignments.length;
    });
  }
  if (types.assignments) await exportAssignmentDocs(ctx, assignments);
  if (types.submissions) {
    progress('Fetching submissions…');
    await attempt(ctx, 'Submissions', courseUrl(ctx, 'assignments'), () =>
      isTeacher ? exportAllSubmissions(ctx, assignments) : exportOwnSubmissions(ctx, assignments),
    );
  }

  if (types.announcements) {
    progress('Fetching announcements…');
    await attempt(ctx, 'Announcements', courseUrl(ctx, 'announcements'), async () => {
      listed.announcements = await exportAnnouncements(ctx);
    });
  }
  if (types.discussions) {
    progress('Fetching discussions…');
    await attempt(ctx, 'Discussions', courseUrl(ctx, 'discussion_topics'), async () => {
      listed.discussions = await exportDiscussions(ctx);
    });
  }
  if (types.modules) {
    progress('Fetching modules…');
    await attempt(ctx, 'Modules', courseUrl(ctx, 'modules'), async () => {
      listed.modules = await exportModules(ctx, pageSlugs);
    });
  }
  if (pageSlugs.size) {
    progress(`Fetching ${pageSlugs.size} page${pageSlugs.size === 1 ? '' : 's'}…`);
    await exportPages(ctx, pageSlugs);
  }
  if (types.syllabus) await exportSyllabus(ctx, course.syllabus_body);

  if (types.grades) {
    progress('Fetching grades…');
    await attempt(ctx, 'Grades', courseUrl(ctx, 'grades'), () =>
      isTeacher ? exportGradebook(ctx, assignments) : exportOwnGrades(ctx),
    );
    await attempt(ctx, 'Grading weights', courseUrl(ctx, 'assignments'), () =>
      exportGradingWeights(ctx),
    );
  }
  if (types.quizzes) {
    progress('Fetching quizzes…');
    await attempt(ctx, 'Quizzes', courseUrl(ctx, 'quizzes'), () => exportQuizzes(ctx));
  }

  return finalize(ctx, listed, input.onlyNew);
}

/** Applies filters, writes the report and manifest, names every file and renders documents. */
function finalize(
  ctx: CourseExport,
  listed: Record<'files' | 'assignments' | 'announcements' | 'discussions' | 'modules', number>,
  onlyNew?: PreviousExport,
): ExportPlan {
  const { options } = ctx;
  const maxBytes = options.maxFileSizeMB > 0 ? options.maxFileSizeMB * 1024 * 1024 : Infinity;
  const entries = ctx.entries.filter((e) => {
    if (e.kind !== 'remote') return true;
    if (options.excludeVideos && (VIDEO_FILE.test(e.name) || e.contentType.startsWith('video/')))
      return false;
    return e.size <= maxBytes;
  });
  const filteredOut = ctx.entries.length - entries.length;

  // Exporting only what's new: drop files saved before that haven't changed, and
  // flag changed ones. Generated documents are always written again.
  const changed = new Set<Entry>();
  let skippedUnchanged = 0;
  if (onlyNew) {
    for (let i = entries.length - 1; i >= 0; i--) {
      const e = entries[i]!;
      if (e.kind !== 'remote') continue;
      const fromV3 = e.canvasId ? onlyNew.files[e.canvasId] : undefined;
      const legacy = onlyNew.legacy[e.folder + e.name];
      // v2 recorded Canvas's updated_at, so its records are compared against that field.
      const saved =
        fromV3 ??
        (typeof legacy === 'object'
          ? { size: legacy.s ?? 0, modifiedAt: legacy.m ?? '' }
          : legacy !== undefined
            ? {}
            : undefined);
      const current = fromV3 ? e : { size: e.size, modifiedAt: e.canvasUpdatedAt || e.modifiedAt };
      if (!saved) continue;
      if (fileChanged(saved, current)) {
        changed.add(e);
      } else {
        entries.splice(i, 1);
        skippedUnchanged++;
      }
    }
  }

  if (ctx.notCaptured.length) {
    const rows = ['source,link_text,url,status,linked_course_id'];
    for (const n of ctx.notCaptured)
      rows.push(csvRow([n.source, n.text, n.url, n.status, n.sourceCourseId ?? '']));
    entries.push({
      kind: 'text',
      folder: '',
      name: '_inaccessible_links.csv',
      content: rows.join('\n'),
    });
  }

  const manifest = {
    course: ctx.courseName,
    courseId: ctx.courseId,
    sourceUrl: `${ctx.origin}/courses/${ctx.courseId}`,
    exportDate: new Date().toISOString(),
    extensionVersion: options.extensionVersion,
    counts: {
      files: listed.files,
      pages: ctx.counts.pages,
      assignments: listed.assignments,
      announcements: listed.announcements,
      discussions: listed.discussions,
      discussionReplies: ctx.counts.discussionReplies,
      studentSubmissions: ctx.counts.studentSubmissions,
      gradebookStudents: ctx.counts.gradebookStudents,
      quizzes: ctx.counts.quizzes,
      modules: listed.modules,
      extractedFiles: entries.filter((e) => e.folder === 'Extracted_Files/').length,
      inaccessibleLinkedFiles: ctx.notCaptured.length,
      skippedIncremental: skippedUnchanged,
      skippedFilters: filteredOut,
      total: entries.length,
    },
  };
  entries.push({
    kind: 'text',
    folder: '',
    name: 'manifest.json',
    content: JSON.stringify(manifest, null, 2),
  });

  const paths = assignPaths(entries);
  const localPaths = linkTargets(ctx, entries, paths);

  const files: PlannedFile[] = entries.map((entry, i) => {
    const path = paths[i]!;
    if (entry.kind === 'remote') {
      return {
        path,
        source: {
          kind: 'remote',
          url: entry.url,
          size: entry.size,
          contentType: entry.contentType,
          modifiedAt: entry.modifiedAt,
          ...(changed.has(entry) ? { changed: true } : {}),
          ...(entry.canvasId ? { canvasId: entry.canvasId } : {}),
        },
      };
    }
    if (entry.kind === 'text') return { path, source: { kind: 'text', content: entry.content } };
    const folder = path.slice(0, path.lastIndexOf('/') + 1);
    const body = convertLocalMediaEmbeds(rewriteCanvasLinks(entry.bodyHtml, localPaths, folder));
    const content =
      options.format === 'markdown'
        ? renderMarkdownDocument(entry.title, htmlToMarkdown(body))
        : renderHtmlDocument(entry.title, body, folder);
    return { path, source: { kind: 'text', content } };
  });

  // The overview page, twice: index.html for tools, "Open me" so people know what to double-click.
  const plannedPaths = files.map((f) => f.path);
  const titles = new Map(
    entries.flatMap((e, i) =>
      e.kind === 'document' ? [[paths[i]!, e.title] as [string, string]] : [],
    ),
  );
  const render = (failed: { path: string; reason: string }[]) =>
    renderCourseIndex({
      courseName: ctx.courseName,
      sourceUrl: `${ctx.origin}/courses/${ctx.courseId}`,
      savedAt: new Date(),
      version: options.extensionVersion,
      outline: ctx.outline,
      localPaths,
      paths: plannedPaths,
      notCaptured: ctx.notCaptured,
      failed,
      titles,
    });
  for (const name of ['index.html', sanitizeFilename(`Open me - ${ctx.courseName}.html`)]) {
    files.push({ path: name, source: { kind: 'text', content: '', render } });
  }

  return {
    courseId: ctx.courseId,
    courseName: ctx.courseName,
    files,
    notCaptured: ctx.notCaptured,
    filteredOut,
    skippedUnchanged,
  };
}

/**
 * Safe, unique paths in entry order. Names that collide (case-insensitively, as
 * on Windows and macOS) get " (2)", " (3)", ... so nothing overwrites anything.
 */
function assignPaths(entries: Entry[]): string[] {
  const used = new Set<string>();
  return entries.map((entry) => {
    const folder = entry.folder
      .split('/')
      .filter(Boolean)
      .map((part) => `${sanitizeFilename(part, 'folder')}/`)
      .join('');
    const name = sanitizeFilename(entry.name, 'file');
    const dot = name.lastIndexOf('.');
    const [stem, ext] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ''];
    let candidate = name;
    for (let n = 2; used.has((folder + candidate).toLowerCase()); n++)
      candidate = `${stem} (${n})${ext}`;
    used.add((folder + candidate).toLowerCase());
    return folder + candidate;
  });
}

/** Canvas URL → local path, for every exported item other documents may link to. */
function linkTargets(ctx: CourseExport, entries: Entry[], paths: string[]): Map<string, string> {
  const map = new Map<string, string>();
  entries.forEach((entry, i) => {
    const target = paths[i]!;
    if (entry.kind === 'document') for (const url of entry.canvasUrls) map.set(url, target);
    if (entry.kind !== 'remote') return;
    if (entry.canvasId) {
      map.set(courseUrl(ctx, `files/${entry.canvasId}`), target);
      map.set(`${ctx.origin}/files/${entry.canvasId}`, target);
      if (entry.sourceCourseId)
        map.set(`${ctx.origin}/courses/${entry.sourceCourseId}/files/${entry.canvasId}`, target);
    }
    for (const key of entry.mediaKeys ?? []) map.set(key, target);
  });
  for (const [alias, url] of ctx.aliases) {
    const target = map.get(url);
    if (target) map.set(alias, target);
  }
  return map;
}
