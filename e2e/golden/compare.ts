// Compares an export with the golden output v2.11.0 produced for the same
// scenario, applying only the differences approved in docs/v3/parity-diffs.md.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { sanitizeFilename } from '../../src/export/filenames';
import { goldenTextPath } from './collect';

const GOLDEN = path.resolve(import.meta.dirname, '../../tests/golden');

export interface ComparableFile {
  /** e.g. "Course.zip!/Pages/a.html" or "Course/Pages/a.html" */
  path: string;
  sha256: string;
  text?: string;
}

/** Approved difference 8: v2 left Canvas file names raw inside ZIPs; v3 sanitizes them. */
export function sanitizedPath(p: string): string {
  const [container, inner] = p.includes('!/') ? p.split('!/') : ['', p];
  const safe = inner!
    .split('/')
    .map((part, i, all) => sanitizeFilename(part, i === all.length - 1 ? 'file' : 'folder'))
    .join('/');
  return container ? `${container}!/${safe}` : safe;
}

/** Approved difference 12: v3 aligns Markdown table columns. */
export const unpadTables = (md: string) =>
  md.replace(/^\|.*\|$/gm, (row) => row.replace(/ {2,}\|/g, ' |'));

/**
 * Approved difference 13: v3 adds an overview page at the course root, as index.html and
 * "Open me - <Course>.html". Approved difference 19: and Deadlines.ics, the course's due dates.
 */
function addedInV3(p: string): boolean {
  const inner = p.includes('!/') ? p.split('!/')[1]! : p.slice(p.indexOf('/') + 1);
  return (
    inner === 'index.html' ||
    inner === 'Deadlines.ics' ||
    (inner.startsWith('Open me - ') && inner.endsWith('.html'))
  );
}

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

/** Every difference between `actual` and the golden scenario, as readable lines; [] means identical. */
export function diffAgainstGolden(scenario: string, actual: ComparableFile[]): string[] {
  const golden = JSON.parse(readFileSync(path.join(GOLDEN, scenario, 'index.json'), 'utf8')) as {
    files: { path: string; sha256: string }[];
  };
  const expected = new Map(golden.files.map((f) => [sanitizedPath(f.path), f]));
  const got = new Map(actual.filter((f) => !addedInV3(f.path)).map((f) => [f.path, f]));
  const problems: string[] = [];
  for (const p of expected.keys()) if (!got.has(p)) problems.push(`missing: ${p}`);
  for (const p of got.keys()) if (!expected.has(p)) problems.push(`unexpected: ${p}`);
  for (const [p, want] of expected) {
    const file = got.get(p);
    if (!file) continue;
    const text = file.text !== undefined && p.endsWith('.md') ? unpadTables(file.text) : file.text;
    const hash = text !== undefined ? sha(text) : file.sha256;
    if (hash === want.sha256) continue;
    const goldenText =
      text !== undefined
        ? readFileSync(path.join(GOLDEN, scenario, 'text', goldenTextPath(want.path)), 'utf8')
        : '';
    problems.push(
      `changed: ${p}${text !== undefined ? `\n--- v2\n${goldenText}\n--- v3\n${text}` : ''}`,
    );
  }
  return problems;
}
