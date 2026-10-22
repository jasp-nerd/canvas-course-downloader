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
import { planStudyPack, type AiTarget } from '../export/study-pack';
import {
  documentFrontMatter,
  renderAgentsMd,
  renderCourseJson,
  renderLlmsTxt,
  type AgentPackInput,
} from '../export/agent-pack';
import { fileChanged } from '../storage/inventory';
import type {
  ContentType,
  Entry,
  ExportOptions,
  ExportPlan,
  PlannedFile,
  PreviousExport,
} from './types';

const TEACHER_ROLES = new Set(['teacher', 'ta', 'designer']);
/** Course text that linked files are found in. */
const LINK_SOURCES: ContentType[] = [
  'pages',
  'assignments',
  'announcements',
  'discussions',
  'modules',
  'syllabus',
  'quizzes',
];
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
  /** Make a study pack for this AI tool instead of a copy of the course. */
  studyPack?: AiTarget;
  /** A copy in Markdown with AGENTS.md, llms.txt and course.json, for coding agents and scripts. */
  agents?: boolean;
  onProgress?: (message: string) => void;
}

export async function planCourseExport(input: PlanInput): Promise<ExportPlan> {
  const { canvas, origin, courseId, studyPack } = input;
  const options: ExportOptions = input.agents
    ? { ...input.options, format: 'markdown' }
    : input.options;
  const progress = input.onProgress ?? (() => {});

  // One call for the name, the user's role and the syllabus. A course Canvas
  // won't show fails the export here instead of producing an empty archive.
  const course = await canvas.get<Course>(`/courses/${courseId}`, {
    'include[]': ['enrollments', 'syllabus_body'],
  });
  const isTeacher = (course.enrollments ?? []).some((e) => TEACHER_ROLES.has(e.type));
  // Other students' grades and work never go into a study pack, so they aren't fetched;
  // a teacher's copy holds them only when the teacher asks for it.
  const studentWork = !studyPack && (!isTeacher || options.includeStudentWork);
  const types = { ...options.contentTypes };
  if (isTeacher && !studentWork) types.submissions = false;
  const ctx = newCourseExport({
    origin,
    courseId,
    courseName: course.name,
    isTeacher,
    studentWork,
    options,
    canvas,
  });
  const listed = { files: 0, assignments: 0, announcements: 0, discussions: 0, modules: 0 };

  if (options.format === 'html' && !studyPack) addText(ctx, '', 'styles.css', EXPORT_CSS);

  if (
    isTeacher &&
    studentWork &&
    (types.grades || types.quizzes || types.assignments || types.discussions)
  ) {
    progress('Fetching roster…');
    await attempt(ctx, 'Roster', courseUrl(ctx, 'users'), () => loadRoster(ctx));
  }

  // "Linked files" are the files linked inside course text, also when that text
  // isn't saved: then it's read for its links only, and nothing else is kept.
  const readForLinks = new Set(types.linkedFiles ? LINK_SOURCES.filter((t) => !types[t]) : []);
  const read = (t: ContentType) => types[t] || readForLinks.has(t);
  const linksOnly = async (run: () => Promise<void>) => {
    const from = ctx.entries.length;
    const before = { counts: { ...ctx.counts }, listed: { ...listed }, outline: ctx.outline };
    await run();
    for (const e of ctx.entries.splice(from)) {
      if (e.folder === 'Extracted_Files/' || e.folder === 'Media/') ctx.entries.push(e);
      // Pages read later may link this file: let them save it.
      else if (e.kind === 'remote' && e.canvasId) ctx.seenFileIds.delete(e.canvasId);
    }
    Object.assign(ctx.counts, before.counts);
    Object.assign(listed, before.listed);
    ctx.outline = before.outline;
  };
  const section = (t: ContentType, run: () => Promise<void>) =>
    readForLinks.has(t) ? linksOnly(run) : run();

  if (types.files) {
    progress('Fetching files…');
    await attempt(ctx, 'Files', courseUrl(ctx, 'files'), async () => {
      listed.files = await exportFiles(ctx);
    });
  }

  const pageSlugs = new Set<string>();
  /** Pages read for their links only. */
  const linkPageSlugs = new Set<string>();
  if (read('pages')) {
    await attempt(ctx, 'Pages', courseUrl(ctx, 'pages'), () =>
      listPageSlugs(ctx, types.pages ? pageSlugs : linkPageSlugs),
    );
  }

  let assignments: Assignment[] = [];
  if (read('assignments') || types.submissions || (isTeacher && types.grades)) {
    progress('Fetching assignments…');
    await attempt(ctx, 'Assignments', courseUrl(ctx, 'assignments'), async () => {
      assignments = await canvas.list<Assignment>(`/courses/${courseId}/assignments`);
      listed.assignments = assignments.length;
    });
  }
  if (read('assignments'))
    await section('assignments', () => exportAssignmentDocs(ctx, assignments));
  if (types.submissions) {
    progress('Fetching submissions…');
    await attempt(ctx, 'Submissions', courseUrl(ctx, 'assignments'), () =>
      isTeacher ? exportAllSubmissions(ctx, assignments) : exportOwnSubmissions(ctx, assignments),
    );
  }

  if (read('announcements')) {
    progress('Fetching announcements…');
    await section('announcements', () =>
      attempt(ctx, 'Announcements', courseUrl(ctx, 'announcements'), async () => {
        listed.announcements = await exportAnnouncements(ctx);
      }),
    );
  }
  if (read('discussions')) {
    progress('Fetching discussions…');
    await section('discussions', () =>
      attempt(ctx, 'Discussions', courseUrl(ctx, 'discussion_topics'), async () => {
        listed.discussions = await exportDiscussions(ctx);
      }),
    );
  }
  if (read('modules')) {
    progress('Fetching modules…');
    await section('modules', () =>
      attempt(ctx, 'Modules', courseUrl(ctx, 'modules'), async () => {
        listed.modules = await exportModules(ctx, types.modules ? pageSlugs : linkPageSlugs);
      }),
    );
  }
  if (pageSlugs.size) {
    progress(`Fetching ${pageSlugs.size} page${pageSlugs.size === 1 ? '' : 's'}…`);
    await exportPages(ctx, pageSlugs);
  }
  const linkPages = new Set([...linkPageSlugs].filter((slug) => !pageSlugs.has(slug)));
  if (linkPages.size) {
    progress(`Reading ${linkPages.size} page${linkPages.size === 1 ? '' : 's'} for linked files…`);
    await linksOnly(() => exportPages(ctx, linkPages));
  }
  if (read('syllabus')) await section('syllabus', () => exportSyllabus(ctx, course.syllabus_body));

  if (types.grades) {
    progress('Fetching grades…');
    // A study pack only uses the grading weights, and a teacher's copy without students has no gradebook.
    if (studentWork) {
      await attempt(ctx, 'Grades', courseUrl(ctx, 'grades'), () =>
        isTeacher ? exportGradebook(ctx, assignments) : exportOwnGrades(ctx),
      );
    }
    await attempt(ctx, 'Grading weights', courseUrl(ctx, 'assignments'), () =>
      exportGradingWeights(ctx),
    );
  }
  if (read('quizzes')) {
    progress('Fetching quizzes…');
    await section('quizzes', () =>
      attempt(ctx, 'Quizzes', courseUrl(ctx, 'quizzes'), () => exportQuizzes(ctx)),
    );
  }

  return finalize(ctx, listed, input.onlyNew, studyPack, input.agents);
}

/** Applies filters, writes the report and manifest, names every file and renders documents. */
function finalize(
  ctx: CourseExport,
  listed: Record<'files' | 'assignments' | 'announcements' | 'discussions' | 'modules', number>,
  onlyNew?: PreviousExport,
  studyPack?: AiTarget,
  agents?: boolean,
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

  if (studyPack) {
    return {
      courseId: ctx.courseId,
      courseName: ctx.courseName,
      files: planStudyPack({
        courseName: ctx.courseName,
        sourceUrl: courseUrl(ctx, '').slice(0, -1),
        savedAt: new Date(),
        version: options.extensionVersion,
        isTeacher: ctx.isTeacher,
        outline: ctx.outline,
        entries,
        fileUrl: (id) => courseUrl(ctx, `files/${id}`),
        notCaptured: ctx.notCaptured,
        gradingWeights: ctx.gradingWeights,
        target: studyPack,
      }),
      notCaptured: ctx.notCaptured,
      filteredOut,
      skippedUnchanged: 0,
      studentWork: studentWorkOf(ctx),
    };
  }

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
  const agentPack = agents ? agentPackInput(ctx, entries, paths, localPaths) : undefined;
  const agentDocs = new Map(agentPack?.documents.map((d) => [d.path, d]));

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
    const agentDoc = agentDocs.get(path);
    if (agentPack && agentDoc) {
      return {
        path,
        source: { kind: 'text', content: documentFrontMatter(agentPack, agentDoc) + content },
      };
    }
    return { path, source: { kind: 'text', content } };
  });

  if (agentPack) {
    files.push(
      { path: 'AGENTS.md', source: { kind: 'text', content: renderAgentsMd(agentPack) } },
      { path: 'llms.txt', source: { kind: 'text', content: renderLlmsTxt(agentPack) } },
      {
        path: 'course.json',
        source: {
          kind: 'text',
          content: '',
          render: (failed) => renderCourseJson(agentPack, failed),
        },
      },
    );
  } else {
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
  }

  return {
    courseId: ctx.courseId,
    courseName: ctx.courseName,
    files,
    notCaptured: ctx.notCaptured,
    filteredOut,
    skippedUnchanged,
    studentWork: studentWorkOf(ctx),
  };
}

const studentWorkOf = (ctx: CourseExport): ExportPlan['studentWork'] => ({
  teacher: ctx.isTeacher,
  included: !ctx.isTeacher || ctx.studentWork,
});

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

/** What AGENTS.md, llms.txt, course.json and the front matter are made from. */
function agentPackInput(
  ctx: CourseExport,
  entries: Entry[],
  paths: string[],
  localPaths: Map<string, string>,
): AgentPackInput {
  // Each saved item belongs to the first module that lists it.
  const moduleOf = new Map<string, { position: number; name: string }>();
  ctx.outline.forEach((mod, i) => {
    for (const item of mod.items) {
      const path = item.url ? localPaths.get(item.url) : undefined;
      if (path && !moduleOf.has(path)) moduleOf.set(path, { position: i + 1, name: mod.name });
    }
  });
  return {
    courseName: ctx.courseName,
    courseId: ctx.courseId,
    sourceUrl: courseUrl(ctx, '').slice(0, -1),
    savedAt: new Date(),
    version: ctx.options.extensionVersion,
    isTeacher: ctx.isTeacher,
    // The roster is loaded when a teacher's export includes grades, scores or submissions.
    studentData: ctx.isTeacher && ctx.students.length > 0,
    outline: ctx.outline,
    localPaths,
    documents: entries.flatMap((e, i) => {
      if (e.kind !== 'document') return [];
      const module = moduleOf.get(paths[i]!);
      return [{ path: paths[i]!, doc: e, ...(module ? { module } : {}) }];
    }),
    files: entries.flatMap((e, i) =>
      e.kind === 'remote'
        ? [
            {
              path: paths[i]!,
              name: e.name,
              size: e.size,
              contentType: e.contentType,
              ...(e.canvasId ? { canvasId: e.canvasId } : {}),
            },
          ]
        : [],
    ),
    gradingWeights: ctx.gradingWeights,
    notCaptured: ctx.notCaptured,
  };
}
