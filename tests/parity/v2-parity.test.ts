// The v3 engine must export exactly what v2.11.0 did for each golden scenario
// (tests/golden, captured from the real v2 build), apart from the differences
// approved in docs/v3/parity-diffs.md, which are applied below by name.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { goldenTextPath, normalize } from '../../e2e/golden/collect';
import { SCENARIOS } from '../../e2e/golden/scenarios';
import { startMockCanvas, type MockCanvas } from '../../e2e/mock-canvas/server';
import { createCanvasClient } from '../../src/canvas/client';
import { sanitizeFilename } from '../../src/export/filenames';
import { exportOptionsFrom } from '../../src/engine/options';
import { planCourseExport } from '../../src/engine/plan';
import { mockFetch } from '../support/mock-fetch';

const ORIGIN = 'https://school.instructure.com';
const GOLDEN = path.resolve(import.meta.dirname, '../golden');

let mock: MockCanvas;
beforeAll(async () => {
  mock = await startMockCanvas();
});
afterAll(() => mock.close());

interface Golden {
  files: { path: string; size: number; sha256: string }[];
}

const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');

/** Approved difference 8: v2 left Canvas file names raw inside ZIPs; v3 sanitizes them. */
const sanitizedPath = (p: string) => {
  const [container, inner] = p.includes('!/') ? p.split('!/') : ['', p];
  const safe = inner!
    .split('/')
    .map((part, i, all) => sanitizeFilename(part, i === all.length - 1 ? 'file' : 'folder'))
    .join('/');
  return container ? `${container}!/${safe}` : safe;
};

/** Approved difference 12: v3 aligns Markdown table columns. */
const unpadTables = (md: string) =>
  md.replace(/^\|.*\|$/gm, (row) => row.replace(/ {2,}\|/g, ' |'));

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
    const root =
      sanitizeFilename(plan.courseName, zip ? 'file' : 'folder') + (zip ? '.zip!/' : '/');
    const actual = new Map<string, { sha256: string; text?: string }>();
    for (const file of plan.files) {
      let bytes =
        file.source.kind === 'text'
          ? Buffer.from(file.source.content, 'utf8')
          : Buffer.from(await (await fetch(file.source.url)).arrayBuffer());
      if (file.path.endsWith('.md')) bytes = Buffer.from(unpadTables(bytes.toString('utf8')));
      const normalized = normalize(file.path, bytes);
      actual.set(root + file.path, {
        sha256: sha(normalized),
        text: /\.(html|md|csv|json|css)$/.test(file.path) ? normalized.toString('utf8') : undefined,
      });
    }

    expect(mock.unexpected, 'Canvas API calls the mock has no handler for').toEqual([]);

    const golden = JSON.parse(
      readFileSync(path.join(GOLDEN, scenario.name, 'index.json'), 'utf8'),
    ) as Golden;
    const expected = new Map(golden.files.map((f) => [sanitizedPath(f.path), f]));
    expect([...actual.keys()].sort()).toEqual([...expected.keys()].sort());
    for (const [p, file] of expected) {
      const got = actual.get(p)!;
      if (got.sha256 === file.sha256) continue;
      const goldenText = readFileSync(
        path.join(
          GOLDEN,
          scenario.name,
          'text',
          goldenTextPath(golden.files.find((g) => sanitizedPath(g.path) === p)!.path),
        ),
        'utf8',
      );
      expect(got.text, p).toBe(goldenText);
    }
  });
});
