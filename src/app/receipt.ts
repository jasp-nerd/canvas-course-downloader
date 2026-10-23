// What the Download tab says about a course while it saves and after: its
// files grouped by kind, and sizes, times and paths in plain words. The kind
// of a file is its top-level folder in the export (or, in a study pack, what
// the file is), so the numbers are counts of real planned files.

export type KindId =
  | 'files'
  | 'pages'
  | 'assignments'
  | 'quizzes'
  | 'discussions'
  | 'announcements'
  | 'submissions'
  | 'media'
  | 'course'
  | 'guide'
  | 'notes'
  | 'packFiles'
  | 'extras';

export interface KindCount {
  id: KindId;
  label: string;
  total: number;
  done: number;
  failed: number;
}

/** Display order, label, and what one page of that kind is called. */
const KINDS: [id: KindId, label: string, one?: string][] = [
  ['files', 'Files'],
  ['pages', 'Pages', 'page'],
  ['assignments', 'Assignments', 'assignment'],
  ['quizzes', 'Quizzes', 'quiz'],
  ['discussions', 'Discussions', 'discussion'],
  ['announcements', 'Announcements', 'announcement'],
  ['submissions', 'Submissions', 'submission'],
  ['media', 'Videos and audio'],
  ['course', 'Overview and course info'],
  ['guide', 'Course guide'],
  ['notes', 'Notes per module'],
  ['packFiles', 'Slides and documents'],
  ['extras', 'Extras'],
];

const FOLDERS: Record<string, KindId> = {
  Files: 'files',
  Modules: 'files',
  Extracted_Files: 'files',
  Pages: 'pages',
  Assignments: 'assignments',
  Quizzes: 'quizzes',
  Discussions: 'discussions',
  Announcements: 'announcements',
  Submissions: 'submissions',
  Media: 'media',
};

/** "Notebook 2 of 3/" or "Project 1 of 2/": a study pack split for its tool. */
const PACK_PART = /^(?:Notebook|Project) \d+ of \d+\//;

export function kindOf(path: string, pack: boolean): KindId {
  if (pack) {
    const name = path.replace(PACK_PART, '');
    if (name.startsWith('_extras/')) return 'extras';
    if (name === '00 Course guide.md') return 'guide';
    if (/^\d{2} .*\.md$/.test(name)) return 'notes';
    return 'packFiles';
  }
  const top = path.slice(0, path.indexOf('/'));
  return FOLDERS[top] ?? 'course';
}

/** Planned files per kind, in display order; kinds with no files are left out. */
export function countKinds(paths: string[], pack: boolean): KindCount[] {
  const totals = new Map<KindId, number>();
  for (const path of paths) {
    const id = kindOf(path, pack);
    totals.set(id, (totals.get(id) ?? 0) + 1);
  }
  return KINDS.filter(([id]) => totals.has(id)).map(([id, label]) => ({
    id,
    label,
    total: totals.get(id)!,
    done: 0,
    failed: 0,
  }));
}

/** After a run: every planned file was written, except the ones that failed. */
export function settleKinds(kinds: KindCount[], failed: string[], pack: boolean): KindCount[] {
  return kinds.map((k) => {
    const n = failed.filter((path) => kindOf(path, pack) === k.id).length;
    return { ...k, done: k.total - n, failed: n };
  });
}

/** A file as the page lists it: "Week 4 / Lecture 7.pdf", or "Problem set 3" with "assignment". */
export function describeFile(path: string, pack: boolean): { name: string; kind?: string } {
  const id = kindOf(path, pack);
  if (pack || id === 'course') return { name: path.split('/').join(' / ') };
  const rest = path.slice(path.indexOf('/') + 1);
  const one = KINDS.find(([k]) => k === id)?.[2];
  if (one && /\.(html|md)$/.test(rest)) {
    return {
      name: rest
        .replace(/\.(html|md)$/, '')
        .split('/')
        .join(' / '),
      kind: one,
    };
  }
  return { name: rest.split('/').join(' / ') };
}

/** Sizes the way Windows shows them: 1024 bytes to a KB. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${Math.round(bytes)} bytes`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const shown = unit > 0 && value < 10 ? value.toFixed(1) : String(Math.round(value));
  return `${shown} ${units[unit]}`;
}

/** "2 min 10 s", "45 s", "1 h 5 min". */
export function formatDuration(ms: number): string {
  const seconds = Math.max(1, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds} s`;
  if (seconds < 3600) {
    const s = seconds % 60;
    return `${Math.floor(seconds / 60)} min${s ? ` ${s} s` : ''}`;
  }
  const min = Math.round((seconds % 3600) / 60);
  return `${Math.floor(seconds / 3600)} h${min ? ` ${min} min` : ''}`;
}

/**
 * The end of a full path: the folder it was saved in plus `depth` folders and
 * the name, e.g. "Downloads/Canvas/Linear Algebra.zip".
 */
export function shortPath(full: string, depth: number): string {
  const separator = full.includes('\\') ? '\\' : '/';
  const parts = full.split(/[/\\]/).filter(Boolean);
  return parts.slice(-(depth + 2)).join(separator);
}

/** "Saved today at 14:05", in the user's own way of writing times. */
export function savedWhen(at: Date, now: Date, locale?: string): string {
  const time = at.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  if (at.toDateString() === now.toDateString()) return `Saved today at ${time}`;
  const day = at.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  return `Saved on ${day} at ${time}`;
}

/** The folder a file was saved under, from its full path and its path inside that folder. */
export function folderOf(full: string, relative: string): string {
  const separator = full.includes('\\') ? '\\' : '/';
  const parts = full.split(/[/\\]/);
  return parts.slice(0, parts.length - relative.split('/').length).join(separator);
}
