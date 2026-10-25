import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../storage/settings';
import { describeExport } from './summary';

describe('describeExport', () => {
  it('describes the defaults', () => {
    expect(describeExport(DEFAULT_SETTINGS)).toBe('Everything, as a ZIP per course');
  });

  it('describes a Files Only export into folders', () => {
    const contentTypes = {
      files: true,
      pages: false,
      assignments: false,
      submissions: false,
      discussions: false,
      announcements: false,
      modules: false,
      syllabus: false,
      grades: false,
      quizzes: false,
      linkedFiles: false,
    };
    expect(describeExport({ ...DEFAULT_SETTINGS, contentTypes, zipMode: false })).toBe(
      'Files only, as folders in Downloads',
    );
  });

  it('mentions Markdown', () => {
    expect(
      describeExport({
        ...DEFAULT_SETTINGS,
        exportFormat: 'markdown',
        contentTypes: { grades: false },
      }),
    ).toBe('10 of 11 kinds of content, pages as Markdown, as a ZIP per course');
  });
});
