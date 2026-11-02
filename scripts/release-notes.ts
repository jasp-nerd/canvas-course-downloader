// Prints the CHANGELOG.md section for one version, for the GitHub release and the AMO notes.
// Usage: node scripts/release-notes.ts 3.0.0 > notes.md (Node 24 runs TypeScript directly)
// Fails when the section is missing or still says "unreleased", so no release ships without notes.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** The text under "## <version> (...)" up to the next "## ", without the heading. */
export function notesFor(changelog: string, version: string): string {
  const lines = changelog.split('\n');
  const start = lines.findIndex((l) => l.startsWith(`## ${version} `) || l === `## ${version}`);
  if (start === -1) throw new Error(`CHANGELOG.md has no "## ${version}" section`);
  if (/unreleased/i.test(lines[start] ?? ''))
    throw new Error(`CHANGELOG.md still calls ${version} unreleased`);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith('## '));
  return (end === -1 ? rest : rest.slice(0, end)).join('\n').trim();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const version = process.argv[2];
  if (!version) throw new Error('Usage: node scripts/release-notes.ts <version>');
  process.stdout.write(`${notesFor(readFileSync('CHANGELOG.md', 'utf8'), version)}\n`);
}
