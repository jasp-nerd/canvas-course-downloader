// Turns whatever an export wrote to disk into a stable, comparable record:
// every file (ZIPs unpacked) with size and sha256, and the text of text files.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface ExportedFile {
  /** Relative path; entries inside a ZIP are written as `Course.zip!/Files/x.pdf`. */
  path: string;
  size: number;
  sha256: string;
  /** Normalized content for text files, so differences are readable. */
  text?: string;
}

const TEXT = /\.(html|md|csv|json|css|txt|srt)$/i;

function walk(dir: string, base = dir): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? walk(path.join(dir, e.name), base)
      : [path.relative(base, path.join(dir, e.name))],
  );
}

/**
 * Where a file's text is stored under tests/golden/<scenario>/text/. ZIP entries go in a
 * "<name> (zip)" folder: a folder named "*.zip" would be dropped by the repo's .gitignore.
 */
export function goldenTextPath(filePath: string): string {
  return filePath.replace(/\.zip!\//i, ' (zip)/');
}

/** Masks values that change on every run: the export time and the extension version. */
export function normalize(filePath: string, content: Buffer): Buffer {
  if (path.basename(filePath) !== 'manifest.json') return content;
  const json = JSON.parse(content.toString('utf8')) as Record<string, unknown>;
  if ('exportDate' in json) json.exportDate = '<export-date>';
  if ('extensionVersion' in json) json.extensionVersion = '<extension-version>';
  return Buffer.from(JSON.stringify(json, null, 2));
}

function record(relPath: string, content: Buffer): ExportedFile {
  const normalized = normalize(relPath, content);
  return {
    path: relPath,
    size: normalized.length,
    sha256: createHash('sha256').update(normalized).digest('hex'),
    ...(TEXT.test(relPath) ? { text: normalized.toString('utf8') } : {}),
  };
}

export function collectExport(downloadsDir: string): ExportedFile[] {
  const out: ExportedFile[] = [];
  for (const rel of walk(downloadsDir)) {
    const full = path.join(downloadsDir, rel);
    if (!rel.toLowerCase().endsWith('.zip')) {
      out.push(record(rel, readFileSync(full)));
      continue;
    }
    const tmp = mkdtempSync(path.join(os.tmpdir(), 'ccd-unzip-'));
    try {
      execFileSync('unzip', ['-q', '-o', full, '-d', tmp]);
      for (const entry of walk(tmp)) {
        if (statSync(path.join(tmp, entry)).isFile()) {
          out.push(record(`${rel}!/${entry}`, readFileSync(path.join(tmp, entry))));
        }
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

/** Resolves once no partial downloads remain and the file list has been stable for `quietMs`. */
export async function waitForDownloads(
  dir: string,
  quietMs = 1500,
  timeoutMs = 60_000,
): Promise<void> {
  const started = Date.now();
  let last = '';
  let stableSince = Date.now();
  while (Date.now() - started < timeoutMs) {
    const files = walk(dir);
    const snapshot = files.map((f) => `${f}:${statSync(path.join(dir, f)).size}`).join('|');
    const partial = files.some((f) => f.endsWith('.crdownload'));
    if (snapshot !== last || partial) {
      last = snapshot;
      stableSince = Date.now();
    } else if (Date.now() - stableSince >= quietMs) {
      return;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Downloads in ${dir} did not settle within ${timeoutMs} ms`);
}
