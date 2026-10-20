// The v3 engine must export exactly what v2.11.0 did for each golden scenario
// (tests/golden, captured from the real v2 build), apart from the differences
// approved in docs/v3/parity-diffs.md.
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { normalize } from '../../e2e/golden/collect';
import { diffAgainstGolden, type ComparableFile } from '../../e2e/golden/compare';
import { SCENARIOS } from '../../e2e/golden/scenarios';
import { startMockCanvas, type MockCanvas } from '../../e2e/mock-canvas/server';
import { createCanvasClient } from '../../src/canvas/client';
import { exportOptionsFrom } from '../../src/engine/options';
import { planCourseExport } from '../../src/engine/plan';
import { sanitizeFilename } from '../../src/export/filenames';
import { mockFetch } from '../support/mock-fetch';

const ORIGIN = 'https://school.instructure.com';

let mock: MockCanvas;
beforeAll(async () => {
  mock = await startMockCanvas();
});
afterAll(() => mock.close());

describe.each(SCENARIOS)('$name matches v2.11.0', (scenario) => {
  it('produces the same files with the same content', async () => {
    mock.reset();
    for (const fault of scenario.faults ?? []) mock.addFault(fault);
    const fetch = mockFetch(mock);
    const canvas = createCanvasClient({ origin: ORIGIN, fetch, sleep: () => Promise.resolve() });
    const plan = await planCourseExport({
      canvas,
      origin: ORIGIN,
      courseId: String(scenario.courseId),
      options: exportOptionsFrom(scenario.settings, 'test'),
    });

    const zip = scenario.settings.zipMode !== false;
    const root = zip
      ? `${sanitizeFilename(`${plan.courseName}.zip`)}!/`
      : `${sanitizeFilename(plan.courseName, 'folder')}/`;
    const files: ComparableFile[] = [];
    for (const file of plan.files) {
      const bytes =
        file.source.kind === 'text'
          ? Buffer.from(file.source.content, 'utf8')
          : Buffer.from(await (await fetch(file.source.url)).arrayBuffer());
      const normalized = normalize(file.path, bytes);
      files.push({
        path: root + file.path,
        sha256: createHash('sha256').update(normalized).digest('hex'),
        ...(/\.(html|md|csv|json|css)$/.test(file.path)
          ? { text: normalized.toString('utf8') }
          : {}),
      });
    }

    expect(mock.unexpected, 'Canvas API calls the mock has no handler for').toEqual([]);
    expect(diffAgainstGolden(scenario.name, files)).toEqual([]);
  });
});
