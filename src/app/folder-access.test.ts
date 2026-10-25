import { describe, expect, it } from 'vitest';
import { folderAccessFor, NO_FOLDER_ACCESS } from './folder-access';

describe('folderAccessFor', () => {
  it('is there wherever the folder picker is', () => {
    expect(folderAccessFor({ picker: true, firefox: false, brave: true })).toBe('yes');
  });

  it('names Firefox, then Brave, as the reason it is missing', () => {
    expect(folderAccessFor({ picker: false, firefox: true, brave: false })).toBe('firefox');
    expect(folderAccessFor({ picker: false, firefox: false, brave: true })).toBe('brave');
    expect(folderAccessFor({ picker: false, firefox: false, brave: false })).toBe('no');
  });

  it('says what to do about it in plain words', () => {
    expect(NO_FOLDER_ACCESS.firefox).toBe(
      "Firefox can't save into a folder you choose. Files go to your Downloads folder.",
    );
    expect(NO_FOLDER_ACCESS.brave).toContain('brave://flags/#file-system-access-api');
  });
});
