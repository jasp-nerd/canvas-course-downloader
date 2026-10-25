// Records what v2.11.0 exports for each scenario into tests/golden/.
// Run with `pnpm golden:capture`. This regenerates the reference that v3 is
// compared against, so only run it when jasp has approved the change.
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CANVAS, V2_BUILD, expect, resetExtensionStorage, test } from '../fixtures.ts';
import { collectExport, goldenTextPath, waitForDownloads } from './collect.ts';
import { SCENARIOS } from './scenarios.ts';

const GOLDEN = path.resolve('tests/golden');

test.use({ extensionPath: V2_BUILD });

for (const scenario of SCENARIOS) {
  test(`capture ${scenario.name}`, async ({ page, serviceWorker, downloadsDir, mock }) => {
    for (const entry of readdirSync(downloadsDir))
      rmSync(path.join(downloadsDir, entry), { recursive: true });
    await resetExtensionStorage(serviceWorker, scenario.settings);
    for (const fault of scenario.faults ?? []) mock.addFault(fault);

    await page.goto(`${CANVAS}/courses/${scenario.courseId}`);
    await page.click('#canvas-downloader-btn');
    await expect(page.locator('#cd-panel-title')).toHaveText(/complete|error/i, {
      timeout: 120_000,
    });
    await waitForDownloads(downloadsDir);

    const files = collectExport(downloadsDir);
    expect(files.length).toBeGreaterThan(0);

    const dir = path.join(GOLDEN, scenario.name);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const index = files.map(({ path: p, size, sha256 }) => ({ path: p, size, sha256 }));
    writeFileSync(
      path.join(dir, 'index.json'),
      JSON.stringify(
        { scenario: scenario.name, description: scenario.description, files: index },
        null,
        2,
      ) + '\n',
    );
    for (const file of files) {
      if (file.text === undefined) continue;
      const target = path.join(dir, 'text', goldenTextPath(file.path));
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, file.text);
    }
  });
}
