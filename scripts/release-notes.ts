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

const REPO = 'https://github.com/jasp-nerd/canvas-course-downloader';

/** The top of a GitHub release: where to install it, and which file is which. */
export function installFor(version: string): string {
  const file = (browser: string) =>
    `[canvas-course-downloader-${browser}.zip](${REPO}/releases/download/v${version}/canvas-course-downloader-${browser}.zip)`;
  return [
    '**Install from a store** to get updates by themselves:',
    '[Chrome Web Store](https://chromewebstore.google.com/detail/mmnmcnffbkcnhcjiidmdnaclpfeekiol) (also Brave and other Chromium browsers),',
    '[Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/emhdfhcmiabgphmeohfplkbeloeamjak),',
    '[Firefox Add-ons](https://addons.mozilla.org/firefox/addon/canvas-course-downloader/). A store can take a few days to show a new version.',
    '',
    '| File | For |',
    '| --- | --- |',
    `| ${file('chrome')} | Chrome, Brave and other Chromium browsers |`,
    `| ${file('edge')} | Edge |`,
    `| ${file('firefox')} | Firefox 140 or later |`,
    `| ${file('sources')} | The source code, as the stores' reviewers build it |`,
    '| SHA256SUMS.txt | Checksums of the zips |',
    '',
    "To load a zip by hand: unzip it, then use Load unpacked on chrome://extensions or edge://extensions (turn on Developer mode first). A copy loaded by hand doesn't update itself, and its settings and download history don't carry over to the store version. Firefox only loads an unsigned zip until it restarts (about:debugging), so use Firefox Add-ons there.",
  ].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const version = process.argv[2];
  if (!version) throw new Error('Usage: node scripts/release-notes.ts <version>');
  const notes = notesFor(readFileSync('CHANGELOG.md', 'utf8'), version);
  process.stdout.write(`${installFor(version)}\n\n## What's new\n\n${notes}\n`);
}
