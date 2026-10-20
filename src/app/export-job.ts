// Runs the exports the user asked for, one course after another, and reports
// state for the Export tab to show.
import { browser } from 'wxt/browser';
import { CanvasError, createCanvasClient } from '../canvas/client';
import { exportOptionsFrom } from '../engine/options';
import { planCourseExport } from '../engine/plan';
import { runExport, type RunResult } from '../engine/run';
import { sanitizeFilename } from '../export/filenames';
import { downloadBlob, downloadsSink } from '../sinks/downloads';
import type { SinkFailure } from '../sinks/types';
import { blobCollector, zipSink } from '../sinks/zip';
import { loadSettings } from '../storage/settings';

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

export async function exportCourses(input: {
  origin: string;
  courseIds: string[];
  signal: AbortSignal;
  onChange: (courses: CourseState[]) => void;
}): Promise<CourseState[]> {
  const settings = await loadSettings();
  const options = exportOptionsFrom(settings, browser.runtime.getManifest().version);
  const prefix = folderPath(settings.folderPrefix);
  const courses: CourseState[] = input.courseIds.map((id) => ({
    id,
    name: `Course ${id}`,
    phase: 'waiting',
    message: 'Waiting…',
    total: 0,
    done: 0,
    failed: 0,
    failures: [],
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
      const plan = await planCourseExport({
        canvas,
        origin: input.origin,
        courseId: course.id,
        options,
        onProgress: (message) => update(course, { message }),
      });
      update(course, {
        name: plan.courseName,
        phase: 'saving',
        total: plan.files.length,
        message: 'Saving files…',
      });

      const onProgress = (p: { done: number; failed: number; current: string }) =>
        update(course, { done: p.done, failed: p.failed, message: p.current });
      let result: RunResult;
      if (settings.zipMode) {
        const collector = blobCollector();
        result = await runExport(plan, {
          canvas,
          sink: zipSink(collector.stream),
          signal: input.signal,
          onProgress,
        });
        if (result.outcome !== 'cancelled' && result.written > 0) {
          const savedAs = `${prefix}${sanitizeFilename(`${plan.courseName}.zip`)}`;
          update(course, { message: 'Saving the ZIP…' });
          const saved = await downloadBlob(
            browser.downloads,
            await collector.blob,
            savedAs,
            settings.conflictAction,
          );
          if (!saved.ok) throw new Error(`Your browser couldn't save the ZIP (${saved.reason}).`);
          update(course, { savedAs });
        }
      } else {
        const folder = `${prefix}${sanitizeFilename(plan.courseName, 'folder')}/`;
        const sink = downloadsSink({
          folder,
          conflictAction: settings.conflictAction,
          downloads: browser.downloads,
        });
        result = await runExport(plan, { canvas, sink, signal: input.signal, onProgress });
        update(course, { savedAs: folder });
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
