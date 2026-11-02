import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usableFolder } from './export-job';

const folder = (state: PermissionState) =>
  ({
    name: 'Drive',
    queryPermission: () => Promise.resolve(state),
  }) as unknown as FileSystemDirectoryHandle;
let stored: FileSystemDirectoryHandle | null = null;
vi.mock('../storage/folder', () => ({ loadSaveFolder: () => Promise.resolve(stored) }));

beforeEach(() => {
  stored = null;
});

describe('usableFolder', () => {
  it('uses the chosen folder when writing is still allowed', async () => {
    stored = folder('granted');
    expect(await usableFolder()).toBe(stored);
  });

  it('asks the user again when the browser needs a click, and uses it if they allow', async () => {
    stored = folder('prompt');
    const allow = vi.fn(() => Promise.resolve(true));
    expect(await usableFolder(allow)).toBe(stored);
    expect(allow).toHaveBeenCalledWith(stored);
  });

  it('falls back (null) when the user declines, nobody can be asked, or no folder was chosen', async () => {
    stored = folder('prompt');
    expect(await usableFolder(() => Promise.resolve(false))).toBeNull();
    expect(await usableFolder()).toBeNull();
    stored = null;
    expect(await usableFolder(() => Promise.resolve(true))).toBeNull();
  });
});
