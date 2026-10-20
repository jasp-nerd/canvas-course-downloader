import type { Worker } from '@playwright/test';
import { expect, resetExtensionStorage, test } from './fixtures';

const stored = (sw: Worker) =>
  sw.evaluate(() =>
    (
      globalThis as unknown as {
        chrome: { storage: { sync: { get(k: null): Promise<Record<string, unknown>> } } };
      }
    ).chrome.storage.sync.get(null),
  );

test('shows settings v2 stored, and saves changes under the same keys', async ({
  page,
  extensionId,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, {
    zipMode: false,
    folderPrefix: 'Canvas',
    exportFormat: 'markdown',
    contentTypes: { files: true, pages: false },
  });
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(page.getByLabel('Folders, one file at a time')).toBeChecked();
  await expect(page.getByLabel('Folder inside Downloads')).toHaveValue('Canvas');
  await expect(page.getByLabel(/Markdown/)).toBeChecked();
  await expect(page.getByRole('checkbox', { name: /^Pages/ })).not.toBeChecked();

  await page.getByLabel('One ZIP file per course').check();
  await expect(page.getByRole('status')).toHaveText('Saved');
  expect(await stored(serviceWorker)).toMatchObject({ zipMode: true, folderPrefix: 'Canvas' });
});

test('presets set the content types and survive a reload', async ({
  page,
  extensionId,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(page.getByRole('radio', { name: 'Everything' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.getByRole('radio', { name: 'Files only' }).click();
  await expect(page.getByRole('checkbox', { name: /^Assignments/ })).not.toBeChecked();
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Files only' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  expect(await stored(serviceWorker)).toMatchObject({
    preset: 'files-only',
    contentTypes: { files: true, assignments: false },
  });

  await page.getByRole('checkbox', { name: /^Syllabus/ }).check();
  await expect(page.getByText('Custom')).toBeVisible();
});

test('rejects a size limit that is not a whole number', async ({
  page,
  extensionId,
  serviceWorker,
}) => {
  await resetExtensionStorage(serviceWorker, {});
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  const size = page.getByLabel(/Files larger than/);
  await size.fill('-5');
  await size.blur();
  await expect(page.getByText('Enter a whole number of megabytes')).toBeVisible();
  expect(await stored(serviceWorker)).not.toHaveProperty('maxFileSizeMB');
  await size.fill('50');
  await size.blur();
  await expect(page.getByRole('status')).toHaveText('Saved');
  expect(await stored(serviceWorker)).toMatchObject({ maxFileSizeMB: 50 });
});
