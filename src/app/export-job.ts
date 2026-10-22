// Runs the exports the user asked for, one course after another, and reports
// state for the Export tab to show.
import { browser } from 'wxt/browser';
import { CanvasError, createCanvasClient } from '../canvas/client';
import { exportOptionsFrom } from '../engine/options';
import { planCourseExport } from '../engine/plan';
import { runExport, type RunResult } from '../engine/run';
import { sanitizeFilename } from '../export/filenames';
import { AI_TARGETS, type AiTargetId } from '../export/study-pack';
import { downloadBlob, downloadsSink } from '../sinks/downloads';
import { folderSink, openFile } from '../sinks/folder';
import { loadSaveFolder } from '../storage/folder';
import type { SinkFailure } from '../sinks/types';
import { blobCollector, zipSink } from '../sinks/zip';
import { loadInventory, loadLegacyRecords, saveInventory } from '../storage/inventory';
import { markExported } from './updates';
import { loadSettings } from '../storage/settings';
import type { ExportPlan } from '../engine/types';

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
  const courses: CourseState[] = input.courseIds.map((id) => ({
    id,
    name: `Course ${id}`,
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
      update(course, { phase: 'planning', message: 'Looking at the course…' });
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
      update(course, {
        name: plan.courseName,
        phase: 'saving',
        total: plan.files.length,
        skipped: plan.skippedUnchanged,
        ...(studyPack
          ? { packParts: plan.files.filter((f) => f.path.endsWith('00 Course guide.md')).length }
          : {}),
        message: 'Saving files…',
      });

      const onProgress = (p: { done: number; failed: number; current: string }) =>
        update(course, { done: p.done, failed: p.failed, message: p.current });
      let result: RunResult;
      const exportName = studyPack
        ? `${plan.courseName} - AI study pack`
        : `${plan.courseName}${onlyNew ? ` (update ${date})` : ''}`;
      const zipName = sanitizeFilename(`${exportName}.zip`);
      const courseFolder = `${prefix}${sanitizeFilename(studyPack ? exportName : plan.courseName, 'folder')}/`;
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
        const sink = folderSink(saveFolder, settings.conflictAction, courseFolder);
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
          const saved = await downloadBlob(
            browser.downloads,
            await collector.blob,
            `${prefix}${zipName}`,
            settings.conflictAction,
          );
          if (!saved.ok) throw new Error(`Your browser couldn't save the ZIP (${saved.reason}).`);
          update(course, { savedAs: `Downloads/${prefix}${saved.savedName}` });
        }
      } else {
        const sink = downloadsSink({
          folder: courseFolder,
          conflictAction: settings.conflictAction,
          downloads: browser.downloads,
        });
        result = await runExport(plan, { canvas, sink, signal: input.signal, onProgress });
        update(course, { savedAs: `Downloads/${courseFolder}` });
      }
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
      });
    } catch (error) {
      const cancelled = error instanceof CanvasError && error.kind === 'aborted';
      update(course, {
        phase: 'finished',
        outcome: cancelled ? 'cancelled' : 'failed',
        error: cancelled ? undefined : describeError(error),
      });
    }
  }
  return courses;
}
