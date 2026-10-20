import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { files as mockFiles, findCourse } from '../../e2e/mock-canvas/data';
import { startMockCanvas, type MockCanvas } from '../../e2e/mock-canvas/server';
import { mockFetch } from '../../tests/support/mock-fetch';
import { createCanvasClient } from '../canvas/client';
import { exportOptionsFrom } from './options';
import { planCourseExport } from './plan';
import type { ExportPlan, PreviousExport } from './types';

const ORIGIN = 'https://school.instructure.com';
let mock: MockCanvas;
beforeAll(async () => {
  mock = await startMockCanvas();
});
afterAll(() => mock.close());

const plan = (onlyNew?: PreviousExport) =>
  planCourseExport({
    canvas: createCanvasClient({
      origin: ORIGIN,
      fetch: mockFetch(mock),
      sleep: () => Promise.resolve(),
    }),
    origin: ORIGIN,
    courseId: '101',
    options: exportOptionsFrom({}, 'test'),
    onlyNew,
  });

/** What an inventory would hold after saving every file in `p`. */
const savedFrom = (p: ExportPlan): PreviousExport['files'] =>
  Object.fromEntries(
    p.files.flatMap((f) =>
      f.source.kind === 'remote' && f.source.canvasId
        ? [[f.source.canvasId, { size: f.source.size, modifiedAt: f.source.modifiedAt }]]
        : [],
    ),
  );

const remote = (p: ExportPlan) => p.files.filter((f) => f.source.kind === 'remote');

describe('exporting only what is new', () => {
  it('skips every file saved before, but writes the documents again', async () => {
    const full = await plan();
    const again = await plan({ files: savedFrom(full), legacy: {} });
    expect(remote(full).length).toBe(24);
    expect(remote(again)).toEqual([]);
    expect(again.skippedUnchanged).toBe(24);
    expect(again.files.map((f) => f.path)).toContain('Pages/course-schedule.html');
    const manifest = JSON.parse(
      (again.files.find((f) => f.path === 'manifest.json')!.source as { content: string }).content,
    ) as {
      counts: { skippedIncremental: number };
    };
    expect(manifest.counts.skippedIncremental).toBe(24);
  });

  it('keeps a file that changed on Canvas and flags it', async () => {
    const full = await plan();
    const saved = savedFrom(full);
    saved['101002'] = { ...saved['101002']!, size: 1 };
    const again = await plan({ files: saved, legacy: {} });
    expect(
      remote(again).map((f) => [f.path, f.source.kind === 'remote' && f.source.changed]),
    ).toEqual([['Files/Lectures/Lecture 01 - What is psychology-.pdf', true]]);
  });

  it("recognises files v2 recorded by path, so updating to v3 doesn't download everything again", async () => {
    const full = await plan();
    const lecture = remote(full).find(
      (f) => f.path === 'Files/Lectures/Lecture 01 - What is psychology-.pdf',
    )!;
    // v2 stored Canvas's updated_at, which is later than modified_at on real Canvas.
    const canvasFile = mockFiles(findCourse(101)!, ORIGIN).find(
      (f) => f.display_name === 'Lecture 01 - What is psychology?.pdf',
    )!;
    const again = await plan({
      files: {},
      legacy: {
        // v2's key: the folder plus Canvas's display name, before any sanitizing.
        'Files/Lectures/Lecture 01 - What is psychology?.pdf': {
          m: String(canvasFile.updated_at),
          s: canvasFile.size,
        },
        'Files/Syllabus.pdf': 1_700_000_000_000,
      },
    });
    expect(remote(again).map((f) => f.path)).not.toContain(lecture.path);
    expect(remote(again).map((f) => f.path)).not.toContain('Files/Syllabus.pdf');
    expect(again.skippedUnchanged).toBe(2);
  });
});
