import { describe, expect, it } from 'vitest';
import { notesFor } from '../scripts/release-notes.ts';

const CHANGELOG = `# Changelog

## 3.1.0 (2026-11-02)

### Fixed

- A thing.

## 3.0.0 (2026-10-30)

A rewrite.

### New

- Exports run in their own tab.

For versions before 3.0, see the GitHub releases.
`;

describe('release notes from CHANGELOG.md', () => {
  it("returns the version's section without its heading", () => {
    expect(notesFor(CHANGELOG, '3.1.0')).toBe('### Fixed\n\n- A thing.');
    expect(notesFor(CHANGELOG, '3.0.0')).toBe(
      'A rewrite.\n\n### New\n\n- Exports run in their own tab.\n\nFor versions before 3.0, see the GitHub releases.',
    );
  });

  it('refuses a version that is missing or still unreleased', () => {
    expect(() => notesFor(CHANGELOG, '9.9.9')).toThrow(/no "## 9.9.9" section/);
    expect(() => notesFor('## 3.2.0 (unreleased)\n\n- Soon.', '3.2.0')).toThrow(/unreleased/);
  });
});
