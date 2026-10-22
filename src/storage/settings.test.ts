import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { exportOptionsFrom } from '../engine/options';
import { loadSettings, saveSettings } from './settings';

beforeEach(() => fakeBrowser.reset());

describe('settings from earlier versions', () => {
  it('reads what v2 stored, under the same keys', async () => {
    await fakeBrowser.storage.sync.set({
      zipMode: false,
      folderPrefix: 'Canvas',
      exportFormat: 'markdown',
      contentTypes: { files: false },
    });
    const s = await loadSettings();
    expect(s).toMatchObject({ zipMode: false, folderPrefix: 'Canvas', exportFormat: 'markdown' });
    expect(exportOptionsFrom(s, '3.0.0').contentTypes.files).toBe(false);
  });

  it('uses defaults for a fresh install', async () => {
    const s = await loadSettings();
    expect(s.zipMode).toBe(true);
    expect(exportOptionsFrom(s, '3.0.0').contentTypes).toMatchObject({
      files: true,
      quizzes: true,
      submissions: true,
    });
  });

  it('turns the removed "skip" conflict option into "uniquify" (before v2.5.3)', async () => {
    await fakeBrowser.storage.sync.set({ conflictAction: 'skip' });
    expect((await loadSettings()).conflictAction).toBe('uniquify');
  });

  it('keeps quizzes on for settings saved before v2.7.0, which had no quizzes key', async () => {
    await fakeBrowser.storage.sync.set({
      contentTypes: { files: true, pages: true, assignments: true },
    });
    expect(exportOptionsFrom(await loadSettings(), '3.0.0').contentTypes.quizzes).toBe(true);
  });

  it('lets submissions follow assignments for settings saved before v2.9.1', async () => {
    await fakeBrowser.storage.sync.set({ contentTypes: { assignments: false } });
    expect(exportOptionsFrom(await loadSettings(), '3.0.0').contentTypes.submissions).toBe(false);
  });

  it('saves changes under the v2 keys', async () => {
    await saveSettings({ zipMode: false });
    expect(await fakeBrowser.storage.sync.get('zipMode')).toEqual({ zipMode: false });
  });
});

describe('settings added in 3.0', () => {
  it("leave student work out of teachers' copies and treat people as students, by default", async () => {
    const s = await loadSettings();
    expect(s.includeStudentWork).toBe(false);
    expect(s.role).toBe('student');
  });

  it('reads back a teacher who includes student work', async () => {
    await saveSettings({ role: 'teacher', includeStudentWork: true });
    expect(await loadSettings()).toMatchObject({ role: 'teacher', includeStudentWork: true });
  });

  it('falls back to student for a role it does not know', async () => {
    await fakeBrowser.storage.sync.set({ role: 'admin' });
    expect((await loadSettings()).role).toBe('student');
  });
});
