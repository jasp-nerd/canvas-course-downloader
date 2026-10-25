// The overview page at the root of every export ("Open me - <Course>.html" and
// index.html): the course by module, everything else by kind, and what
// couldn't be saved and why. Plain HTML that works from a double-click, with
// no scripts at all.
import type { ModuleOutline } from '../engine/context';
import type { NotCaptured } from '../engine/types';

export interface CourseIndexInput {
  courseName: string;
  sourceUrl: string;
  savedAt: Date;
  version: string;
  outline: ModuleOutline[];
  /** Canvas URL → local path from the course root. */
  localPaths: Map<string, string>;
  /** Every path in the export, from the course root. */
  paths: string[];
  notCaptured: NotCaptured[];
  /** Files that were planned but couldn't be downloaded. */
  failed: { path: string; reason: string }[];
  /** Titles of generated pages by path, shown instead of file names. */
  titles?: Map<string, string>;
}

/** Why something wasn't saved, in plain words; the raw code stays in brackets. */
export function reasonText(reason: string): string {
  const words: Record<string, string> = {
    '401': 'No access',
    '403': 'No access',
    '404': 'Not found in Canvas',
    '500': 'Canvas had an error',
    '502': 'Canvas had an error',
    '503': 'Canvas was busy',
    locked: 'Locked for you in Canvas',
    'no-url': 'Canvas offers no download',
    'no-media-sources': 'The video is still processing, or Canvas offers no download',
    transient: 'Connection problem',
    throttled: 'Canvas kept asking us to slow down',
    USER_CANCELED: 'The save window was closed',
    SKIPPED_AFTER_CANCEL: 'Not saved after a save window was closed',
    HELD_BY_BROWSER: 'Held by your browser until you allow it',
  };
  const code = /\d{3}/.exec(reason)?.[0];
  const plain = (code ? words[code] : undefined) ?? words[reason];
  return plain ? `${plain} (${reason})` : reason;
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const href = (path: string) => path.split('/').map(encodeURIComponent).join('/');
const link = (path: string, text: string) => `<a href="${href(path)}">${esc(text)}</a>`;
const fileName = (path: string) => path.slice(path.lastIndexOf('/') + 1);
const stem = (name: string) => name.replace(/\.[^.]+$/, '');
const isPage = (path: string) => /\.(html|md)$/.test(path);
const HIDDEN = new Set(['index.html', 'styles.css', 'manifest.json']);

const SECTIONS: [folder: string, title: string, nested: boolean][] = [
  ['Pages/', 'Pages', false],
  ['Assignments/', 'Assignments', false],
  ['Announcements/', 'Announcements', false],
  ['Discussions/', 'Discussions', true],
  ['Quizzes/', 'Quizzes', true],
  ['Submissions/', 'Submissions', true],
  ['Files/', 'Files', true],
  ['Modules/', 'Files from modules', true],
  ['Extracted_Files/', 'Files linked in pages', true],
  ['Media/', 'Videos and audio', true],
];

export function renderCourseIndex(input: CourseIndexInput): string {
  const titles = input.titles ?? new Map<string, string>();
  const label = (p: string) => titles.get(p) ?? (isPage(p) ? stem(fileName(p)) : fileName(p));
  const items = (paths: string[]) =>
    [...paths]
      .sort()
      .map((p) => `<li>${link(p, label(p))}</li>`)
      .join('');
  const list = (paths: string[]) => `<ul>${items(paths)}</ul>`;

  /** Files under `prefix` as nested lists by folder. */
  const tree = (paths: string[], prefix: string): string => {
    const below = paths.filter((p) => p.startsWith(prefix));
    const here = below.filter((p) => !p.slice(prefix.length).includes('/'));
    const folders = [
      ...new Set(
        below.filter((p) => !here.includes(p)).map((p) => p.slice(prefix.length).split('/')[0]!),
      ),
    ].sort();
    const nested = folders
      .map((f) => `<li class="folder">${esc(f)}${tree(below, `${prefix}${f}/`)}</li>`)
      .join('');
    return `<ul>${nested}${items(here)}</ul>`;
  };

  const failed = new Set(input.failed.map((f) => f.path));
  const saved = input.paths.filter((p) => !failed.has(p));
  const missing = input.notCaptured.length + input.failed.length;
  let body = `<h1>${esc(input.courseName)}</h1>
<p class="meta">Saved from <a href="${esc(input.sourceUrl)}">${esc(input.sourceUrl)}</a> on ${input.savedAt.toISOString().slice(0, 10)} with Canvas Course Downloader ${esc(input.version)}. Changes made in Canvas after that are not included.</p>`;
  if (missing) {
    body += `<p class="warn"><a href="#not-saved">${missing} ${missing === 1 ? 'item' : 'items'} could not be saved</a>. The list at the bottom says why.</p>`;
  }

  if (input.outline.length) {
    body += '<h2>Modules</h2>';
    for (const mod of input.outline) {
      body += `<h3>${esc(mod.name)}</h3><ul>`;
      for (const item of mod.items) {
        const local = item.url ? input.localPaths.get(item.url) : undefined;
        if (item.type === 'SubHeader') body += `<li class="sub">${esc(item.title)}</li>`;
        else if (local && !failed.has(local)) {
          body += `<li>${link(local, item.title)} <span class="kind">${esc(item.type)}</span></li>`;
        } else if (item.url) {
          body += `<li><a href="${esc(item.url)}">${esc(item.title)}</a> <span class="kind">${item.type === 'ExternalUrl' ? 'link' : 'only in Canvas'}</span></li>`;
        } else body += `<li>${esc(item.title)} <span class="kind">${esc(item.type)}</span></li>`;
      }
      body += '</ul>';
    }
  }

  const course = saved.filter(
    (p) => !p.includes('/') && !HIDDEN.has(p) && !p.startsWith('Open me - '),
  );
  if (course.length) body += `<h2>Course</h2>${list(course)}`;
  for (const [folder, title, nested] of SECTIONS) {
    const inSection = saved.filter((p) => p.startsWith(folder));
    if (inSection.length)
      body += `<h2>${title}</h2>${nested ? tree(inSection, folder) : list(inSection)}`;
  }

  if (missing) {
    body +=
      '<h2 id="not-saved">Not saved</h2><table><thead><tr><th>Where</th><th>What</th><th>Why</th></tr></thead><tbody>';
    for (const n of input.notCaptured) {
      body += `<tr><td>${esc(n.source)}</td><td><a href="${esc(n.url)}">${esc(n.text || n.url)}</a></td><td>${esc(reasonText(n.status))}${n.sourceCourseId ? ` (linked from course ${esc(n.sourceCourseId)})` : ''}</td></tr>`;
    }
    for (const f of input.failed) {
      body += `<tr><td>Download</td><td>${esc(f.path)}</td><td>${esc(reasonText(f.reason))}</td></tr>`;
    }
    body += '</tbody></table>';
  }

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(input.courseName)}</title><link rel="stylesheet" href="styles.css">
<style>.meta{color:#556270}.warn{background:#fff4e5;border:1px solid #f0c37a;border-radius:6px;padding:8px 12px}.kind{color:#556270;font-size:.85em}.sub{list-style:none;font-weight:600;margin-top:.6em}.folder{list-style:none;font-weight:600}.folder ul{font-weight:400}</style>
</head><body>${body}</body></html>`;
}
