// Runs the exports the user asked for, one course after another, and reports
// state for the Export tab to show.
import { browser } from 'wxt/browser';
import { CanvasError, createCanvasClient } from '../canvas/client';
import { exportOptionsFrom } from '../engine/options';
import { planCourseExport } from '../engine/plan';
import { runExport, type RunProgress, type RunResult } from '../engine/run';
import { sanitizeFilename } from '../export/filenames';
import { AI_TARGETS, packContents, type AiTargetId } from '../export/study-pack';
import { requestCoursePackage } from './course-package';
import { downloadBlob, downloadsSink } from '../sinks/downloads';
import { folderSink, openFile } from '../sinks/folder';
import { loadSaveFolder } from '../storage/folder';
import type { SinkFailure } from '../sinks/types';
import { blobCollector, zipSink } from '../sinks/zip';
import { loadInventory, loadLegacyRecords, saveInventory } from '../storage/inventory';
import { markExported } from './updates';
import { loadSettings, type Settings } from '../storage/settings';
import type { ExportPlan, PlannedFile } from '../engine/types';
import { countKinds, folderOf, kindOf, settleKinds, shortPath, type KindCount } from './receipt';

/** How a run saves its courses, the same for each of them. */
export interface SaveHow {
  /** What a download makes; "only new" downloads always add to a copy. */
  profile: Settings['profile'];
  aiTarget: AiTargetId;
  role: Settings['role'];
  zip: boolean;
  /** The name of the folder the user chose, when saving there; otherwise Downloads. */
  folder?: string;
  /** "Only add what's new" is on, so the next download of a copy adds only new files. */
  updates: boolean;
}

/** A file as the page shows it, with its size when it's known. */
export interface FileInfo {
  path: string;
  size?: number;
}

export interface CourseState {
  id: string;
  name: string;
  phase: 'waiting' | 'planning' | 'saving' | 'finished';
  message: string;
  total: number;
  done: number;
  failed: number;
  outcome?: RunResult['outcome'];
  failures: SinkFailure[];
  /** Where the export went, e.g. "Canvas/Linear Algebra.zip". */
  savedAs?: string;
  /** Files left out because they were saved before and haven't changed. */
  skipped: number;
  /** Set when the export is a study pack for this AI tool. */
  studyPack?: AiTargetId;
  /** How many notebooks or projects the pack was split into. */
  packParts?: number;
  /** Shown with the result, e.g. why it went to Downloads instead of the chosen folder. */
  note?: string;
  error?: string;
  /** False while the name is still "Course 104", before Canvas told us the real one. */
  named: boolean;
  how: SaveHow;
  /** This run adds only what's new to an earlier copy. */
  update: boolean;
  /** Planned files per kind, counted as they're saved. */
  kinds: KindCount[];
  /** The last files saved, newest first. */
  recent: FileInfo[];
  /** The file being saved now: exactly so in a ZIP, otherwise the next one in line. */
  current?: FileInfo;
  /** Where the course is going, while it saves. */
  destination?: string;
  startedAt?: number;
  finishedAt?: number;
  /** The size of what was saved, when it's known exactly. */
  bytes?: number;
  /** The full path on disk (the ZIP, or the course folder), when the browser told us. */
  fullPath?: string;
  /** The download "Show in folder" points at: the ZIP, or a file at the top of the course folder. */
  downloadId?: number;
  /** "Open me - <Course>.html", the overview page of a copy. */
  overview?: string;
  /** Whether the user teaches the course, and whether students' work was saved. */
  studentWork?: ExportPlan['studentWork'];
  /** Linked files Canvas wouldn't give us; the overview lists them. */
  notCaptured: number;
  /** Files the user's settings left out (videos, the size limit). */
  filteredOut: number;
  /** In a study pack: the files the tool doesn't take, and the modules it holds. */
  pack?: { leftOut: string[]; modules: string[] };
  /** Canvas's own course package (.imscc), when a teacher asked for it. */
  coursePackage?: CoursePackageState;
}

export interface CoursePackageState {
  state: 'building' | 'saved' | 'not-allowed' | 'slow' | 'failed' | 'session';
  /** How far Canvas is with building it, 0 to 100. */
  percent?: number;
  savedAs?: string;
  downloadId?: number;
}

const folderPath = (prefix: string) =>
  prefix
    .split(/[/\\]/)
    .filter(Boolean)
    .map((part) => `${sanitizeFilename(part, 'folder')}/`)
    .join('');

function describeError(error: unknown): string {
  if (error instanceof CanvasError) {
    if (error.kind === 'session')
      return 'You were signed out of Canvas. Sign in again in any tab, then try again.';
    if (error.kind === 'throttled')
      return 'Canvas kept asking us to slow down. Try again in a few minutes.';
    if (error.status === 404 || error.status === 401 || error.status === 403) {
      return "Canvas didn't let us open this course. Check that you can still open it in Canvas.";
    }
    return 'Canvas had a problem answering. Try again in a few minutes.';
  }
  return error instanceof Error ? error.message : String(error);
}

/** Today's date as YYYY-MM-DD in the user's timezone, for update file names. */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "Lecture 1.pdf" → "Lecture 1 (updated 2026-10-20).pdf": a changed file never overwrites the saved one. */
function updatedName(path: string, date: string): string {
  const slash = path.lastIndexOf('/') + 1;
  const dot = path.lastIndexOf('.');
  return dot > slash
    ? `${path.slice(0, dot)} (updated ${date})${path.slice(dot)}`
    : `${path} (updated ${date})`;
}

/** A planned file's size: Canvas's number for a file, the bytes of a page we made. */
function sizeOf(file: PlannedFile | undefined): number | undefined {
  if (!file) return undefined;
  if (file.source.kind === 'remote') return file.source.size || undefined;
  // The overview is rendered at the end, so its size isn't known yet.
  return file.source.render ? undefined : new Blob([file.source.content]).size;
}

/** Which file to show in its folder: the overview, else one as near the top as possible. */
const showRank = (path: string) => (/^Open me - [^/]*$/.test(path) ? 0 : path.split('/').length);

/** The chosen folder, if it's still there and we may write to it. */
export async function usableFolder(
  allow?: (folder: FileSystemDirectoryHandle) => Promise<boolean>,
) {
  const folder = await loadSaveFolder().catch(() => null);
  if (!folder) return null;
  if ((await folder.queryPermission({ mode: 'readwrite' })) === 'granted') return folder;
  return allow && (await allow(folder)) ? folder : null;
}

export async function exportCourses(input: {
  origin: string;
  courseIds: string[];
  /** Only files that are new or changed since the last export, whatever the setting says. */
  onlyNew?: boolean;
  /**
   * Asks the user to allow writing to their chosen folder again (browsers
   * require a click for that). Resolves false when they don't, or can't
   * because nobody is looking (automatic exports).
   */
  allowFolder?: (folder: FileSystemDirectoryHandle) => Promise<boolean>;
  /** Canvas's security token from the page, when a teacher turned on the course package. */
  csrfToken?: string;
  signal: AbortSignal;
  onChange: (courses: CourseState[]) => void;
}): Promise<CourseState[]> {
  const settings = await loadSettings();
  const options = exportOptionsFrom(settings, browser.runtime.getManifest().version);
  // Downloading only what's new always adds to a copy of the course.
  const studyPack =
    settings.profile === 'study' && !input.onlyNew ? AI_TARGETS[settings.aiTarget] : undefined;
  const prefix = folderPath(settings.folderPrefix);
  const saveFolder = settings.saveTo === 'folder' ? await usableFolder(input.allowFolder) : null;
  const folderNote =
    settings.saveTo === 'folder' && !saveFolder
      ? "Saved to Downloads instead, because the folder you chose couldn't be opened. Choose it again in Settings."
      : undefined;
  const how: SaveHow = {
    profile: studyPack ? 'study' : settings.profile === 'agents' ? 'agents' : 'copy',
    aiTarget: settings.aiTarget,
    role: settings.role,
    zip: settings.zipMode,
    ...(saveFolder ? { folder: saveFolder.name } : {}),
    updates: settings.incrementalMode && !studyPack,
  };
  /** Folders the prefix adds, for showing paths from the folder they're saved in. */
  const depth = prefix.split('/').length - 1;
  const courses: CourseState[] = input.courseIds.map((id) => ({
    id,
    name: `Course ${id}`,
    named: false,
    how,
    update: false,
    kinds: [],
    recent: [],
    notCaptured: 0,
    filteredOut: 0,
    phase: 'waiting',
    message: 'Waiting…',
    total: 0,
    done: 0,
    failed: 0,
    failures: [],
    skipped: 0,
    ...(studyPack ? { studyPack: settings.aiTarget } : {}),
    ...(folderNote ? { note: folderNote } : {}),
  }));
  const update = (course: CourseState, changes: Partial<CourseState>) => {
    Object.assign(course, changes);
    input.onChange(courses.map((c) => ({ ...c })));
  };

  /** Asks Canvas to build its course package, then saves it next to the copy. */
  async function savePackage(course: CourseState, courseName: string, csrfToken: string) {
    const set = (coursePackage: CoursePackageState) => update(course, { coursePackage });
    set({ state: 'building', percent: 0 });
    try {
      const result = await requestCoursePackage({
        origin: input.origin,
        courseId: course.id,
        csrfToken,
        onProgress: (percent) => set({ state: 'building', percent }),
      });
      if (result.kind !== 'ready') {
        // An expired token can't be refreshed from this tab: the next download reads a new one.
        const state = result.kind === 'token' ? 'failed' : result.kind;
        set({ state });
        return;
      }
      const name = sanitizeFilename(`${courseName} - Canvas course package.imscc`);
      const downloadId = await browser.downloads.download({
        url: result.url,
        filename: `${prefix}${name}`,
        conflictAction: settings.conflictAction,
        saveAs: false,
      });
      set({ state: 'saved', downloadId, savedAs: `Downloads/${prefix}${name}` });
    } catch {
      // Network trouble while Canvas built it: the package may still appear under the course's settings.
      set({ state: 'failed' });
    }
  }

  for (const course of courses) {
    if (input.signal.aborted) break;
    const canvas = createCanvasClient({
      origin: input.origin,
      signal: input.signal,
      onThrottle: () =>
        update(course, {
          message: 'Canvas asked us to slow down. Continuing more slowly; nothing is lost.',
        }),
    });
    try {
      update(course, {
        phase: 'planning',
        message: 'Looking at the course…',
        startedAt: Date.now(),
      });
      const inventory = await loadInventory(input.origin, course.id);
      const legacy = inventory ? {} : await loadLegacyRecords(course.id);
      const hasHistory = inventory !== null || Object.keys(legacy).length > 0;
      const onlyNew = !studyPack && (settings.incrementalMode || input.onlyNew) && hasHistory;
      const date = today();
      let plan: ExportPlan = await planCourseExport({
        canvas,
        origin: input.origin,
        courseId: course.id,
        options,
        ...(onlyNew ? { onlyNew: { files: inventory?.files ?? {}, legacy } } : {}),
        ...(studyPack ? { studyPack } : {}),
        ...(settings.profile === 'agents' ? { agents: true } : {}),
        onProgress: (message) => update(course, { message }),
      });
      if (!settings.zipMode) {
        plan = {
          ...plan,
          files: plan.files.map((f) =>
            f.source.kind === 'remote' && f.source.changed
              ? { ...f, path: updatedName(f.path, date) }
              : f,
          ),
        };
      }
      const pack = Boolean(studyPack);
      const byPath = new Map(plan.files.map((f) => [f.path, f]));
      const fileInfo = (path: string): FileInfo => {
        const size = sizeOf(byPath.get(path));
        return size === undefined ? { path } : { path, size };
      };
      // Files are written in plan order; pages like the overview come last.
      const inLine = plan.files
        .filter((f) => !(f.source.kind === 'text' && f.source.render))
        .map((f) => f.path);
      const overview = plan.files.find((f) => /^Open me - [^/]*$/.test(f.path))?.path;
      update(course, {
        name: plan.courseName,
        named: true,
        phase: 'saving',
        total: plan.files.length,
        skipped: plan.skippedUnchanged,
        update: onlyNew,
        kinds: countKinds(
          plan.files.map((f) => f.path),
          pack,
        ),
        ...(inLine[0] ? { current: fileInfo(inLine[0]) } : {}),
        ...(overview ? { overview } : {}),
        studentWork: plan.studentWork,
        notCaptured: plan.notCaptured.length,
        filteredOut: plan.filteredOut,
        ...(studyPack
          ? {
              packParts: plan.files.filter((f) => f.path.endsWith('00 Course guide.md')).length,
              pack: packContents(plan.files, plan.courseName),
            }
          : {}),
        message: 'Saving files…',
      });

      let bytes = 0;
      const onProgress = (p: RunProgress) => {
        const kind = kindOf(p.current, pack);
        const saved = p.done - course.done;
        const failed = p.failed - course.failed;
        const next = inLine[p.done + p.failed];
        bytes = p.bytes;
        update(course, {
          done: p.done,
          failed: p.failed,
          message: p.current,
          kinds: course.kinds.map((k) =>
            k.id === kind
              ? { ...k, done: k.done + Math.max(0, saved), failed: k.failed + Math.max(0, failed) }
              : k,
          ),
          ...(saved > 0 ? { recent: [fileInfo(p.current), ...course.recent].slice(0, 3) } : {}),
          current: next ? fileInfo(next) : undefined,
        });
      };
      let result: RunResult;
      const exportName = studyPack
        ? `${plan.courseName} - AI study pack`
        : `${plan.courseName}${onlyNew ? ` (update ${date})` : ''}`;
      const zipName = sanitizeFilename(`${exportName}.zip`);
      // Updating folders: pages and the overview are written again and replace their old
      // versions. New files can't collide, and changed ones get an "(updated ...)" name.
      const folderConflicts = onlyNew ? 'overwrite' : settings.conflictAction;
      const courseFolder = `${prefix}${sanitizeFilename(studyPack ? exportName : plan.courseName, 'folder')}/`;
      const target = settings.zipMode ? `${prefix}${zipName}` : courseFolder;
      update(course, { destination: `${saveFolder ? saveFolder.name : 'Downloads'}/${target}` });
      if (saveFolder && settings.zipMode) {
        // Streams the archive to disk as it's built: no size limit from memory.
        const { stream, name } = await openFile(
          saveFolder,
          `${prefix}${zipName}`,
          settings.conflictAction,
        );
        result = await runExport(plan, {
          canvas,
          sink: zipSink(stream),
          signal: input.signal,
          onProgress,
        });
        update(course, { savedAs: `${saveFolder.name}/${prefix}${name}` });
      } else if (saveFolder) {
        const sink = folderSink(saveFolder, folderConflicts, courseFolder);
        result = await runExport(plan, { canvas, sink, signal: input.signal, onProgress });
        update(course, { savedAs: `${saveFolder.name}/${courseFolder}` });
      } else if (settings.zipMode) {
        const collector = blobCollector();
        result = await runExport(plan, {
          canvas,
          sink: zipSink(collector.stream),
          signal: input.signal,
          onProgress,
        });
        if (result.outcome !== 'cancelled' && result.written > 0) {
          update(course, { message: 'Saving the ZIP…' });
          const blob = await collector.blob;
          const saved = await downloadBlob(
            browser.downloads,
            blob,
            `${prefix}${zipName}`,
            settings.conflictAction,
          );
          if (!saved.ok) {
            throw new Error(
              saved.reason === 'USER_CANCELED'
                ? "You closed the save window, so the ZIP wasn't saved."
                : `Your browser couldn't save the ZIP (${saved.reason}).`,
            );
          }
          // A save window lets the user pick another folder: show where it really went.
          update(course, {
            savedAs: saved.filename
              ? shortPath(saved.filename, depth)
              : `Downloads/${prefix}${saved.savedName}`,
            ...(saved.filename ? { fullPath: saved.filename } : {}),
            downloadId: saved.id,
            bytes: blob.size,
          });
        }
      } else {
        let shown: { path: string; id: number } | undefined;
        const sink = downloadsSink({
          folder: courseFolder,
          conflictAction: folderConflicts,
          downloads: browser.downloads,
          onStarted: (path, id) => {
            if (!shown || showRank(path) < showRank(shown.path)) shown = { path, id };
          },
        });
        result = await runExport(plan, { canvas, sink, signal: input.signal, onProgress });
        const [item] = shown ? await browser.downloads.search({ id: shown.id }) : [];
        const fullPath = shown && item?.filename ? folderOf(item.filename, shown.path) : undefined;
        update(course, {
          savedAs: fullPath ? `${shortPath(fullPath, depth)}/` : `Downloads/${courseFolder}`,
          ...(fullPath ? { fullPath } : {}),
          ...(shown ? { downloadId: shown.id } : {}),
        });
      }
      // The size is exact when Canvas gave one for every file and nothing failed.
      const sized = plan.files.every((f) => f.source.kind === 'text' || f.source.size > 0);
      if (course.bytes === undefined && sized && result.failed.length === 0)
        update(course, { bytes });
      // Remember what was saved, so the next export can skip it. Files that failed aren't
      // recorded, and neither are study packs, which aren't a copy of the course.
      if (result.outcome !== 'cancelled' && !studyPack) {
        const failed = new Set(result.failed.map((f) => f.path));
        const files = { ...(inventory?.files ?? {}) };
        for (const f of plan.files) {
          if (f.source.kind !== 'remote' || !f.source.canvasId || failed.has(f.path)) continue;
          files[f.source.canvasId] = {
            path: f.path,
            size: f.source.size,
            modifiedAt: f.source.modifiedAt,
          };
        }
        await saveInventory(input.origin, course.id, {
          courseName: plan.courseName,
          savedAt: Date.now(),
          files,
        });
        await markExported(input.origin, course.id);
      }
      update(course, {
        phase: 'finished',
        outcome: result.outcome,
        failures: result.failed,
        done: result.written,
        failed: result.failed.length,
        kinds: settleKinds(
          course.kinds,
          result.failed.map((f) => f.path),
          Boolean(studyPack),
        ),
        current: undefined,
        finishedAt: Date.now(),
      });
      // Canvas's own package for re-importing: only for teachers who asked, on full copies
      // that worked. It builds on Canvas's servers, so the receipt shows while it does.
      if (
        settings.coursePackage &&
        input.csrfToken &&
        plan.studentWork.teacher &&
        !studyPack &&
        !onlyNew &&
        (result.outcome === 'success' || result.outcome === 'partial')
      ) {
        void savePackage(course, plan.courseName, input.csrfToken);
      }
    } catch (error) {
      const cancelled = error instanceof CanvasError && error.kind === 'aborted';
      update(course, {
        phase: 'finished',
        outcome: cancelled ? 'cancelled' : 'failed',
        error: cancelled ? undefined : describeError(error),
        current: undefined,
        finishedAt: Date.now(),
      });
    }
  }
  return courses;
}
