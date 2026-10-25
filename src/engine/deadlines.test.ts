import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startMockCanvas, type MockCanvas } from '../../e2e/mock-canvas/server';
import { mockFetch } from '../../tests/support/mock-fetch';
import { createCanvasClient } from '../canvas/client';
import { AI_TARGETS } from '../export/study-pack';
import { exportOptionsFrom } from './options';
import { planCourseExport } from './plan';

const ORIGIN = 'https://school.instructure.com';
let mock: MockCanvas;
beforeAll(async () => {
  mock = await startMockCanvas();
});
afterAll(() => mock.close());

const plan = (extra: { studyPack?: boolean; agents?: boolean } = {}) =>
  planCourseExport({
    canvas: createCanvasClient({ origin: ORIGIN, fetch: mockFetch(mock), sleep: async () => {} }),
    origin: ORIGIN,
    courseId: '101',
    options: exportOptionsFrom({}, 'test'),
    ...(extra.studyPack ? { studyPack: AI_TARGETS.notebooklm } : {}),
    ...(extra.agents ? { agents: true } : {}),
  });

const ics = (p: Awaited<ReturnType<typeof plan>>) => {
  const file = p.files.find((f) => f.path === 'Deadlines.ics');
  return file?.source.kind === 'text' ? file.source.content : undefined;
};

describe('Deadlines.ics', () => {
  it('holds every due date in a copy of the course, linked back to Canvas', async () => {
    const p = await plan();
    const content = ics(p);
    expect(content).toBeDefined();
    expect(content).toContain('X-WR-CALNAME:');
    const events = content!.match(/BEGIN:VEVENT/g) ?? [];
    expect(events.length).toBeGreaterThan(0);
    expect(content).toMatch(/UID:courses-101-assignments-\d+@school\.instructure\.com/);
    expect(content).toMatch(
      /URL:https:\/\/school\.instructure\.com\/courses\/101\/assignments\/\d+/,
    );
  });

  it('is in the files for agents too, but not in a study pack', async () => {
    expect(ics(await plan({ agents: true }))).toBeDefined();
    expect(ics(await plan({ studyPack: true }))).toBeUndefined();
  });
});
