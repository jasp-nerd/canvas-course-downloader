// "Study with AI": the course as a flat folder an AI tool takes in one go.
// AI tools cap the number of files (NotebookLM free: 50 sources), not the
// words, so Canvas text is merged into one Markdown file per module, slides
// and PDFs keep their own files with a module prefix, and a course guide
// holds the structure, deadlines and grading. A course that doesn't fit is
// split into notebooks.
import type { ModuleOutline } from '../engine/context';
import type {
  DocumentEntry,
  NotCaptured,
  PlannedFile,
  RemoteEntry,
  TextEntry,
} from '../engine/types';
import { reasonText } from './course-index';
import { sanitizeFilename } from './filenames';
import { formatDate } from './format';
import { htmlToMarkdown } from './markdown';

export interface AiTarget {
  /** In the settings menu. */
  label: string;
  /** In sentences: "a new notebook in NotebookLM". */
  tool: string;
  /** Where to upload the pack. */
  url?: string;
  /** What the tool calls one upload of sources. */
  unit: 'notebook' | 'project';
  /** Files one notebook or project takes. */
  maxFiles: number;
  /** Largest single file the tool accepts, in bytes. */
  maxBytes: number;
  /** File types the tool accepts besides Markdown; empty means text only. */
  accepts: string[];
}

const DOCUMENTS = ['pdf', 'docx', 'pptx', 'csv', 'txt'];

const TARGETS = {
  notebooklm: {
    label: 'NotebookLM',
    tool: 'NotebookLM',
    url: 'https://notebooklm.google.com/',
    unit: 'notebook',
    maxFiles: 50,
    maxBytes: 200e6,
    accepts: [...DOCUMENTS, 'mp3', 'm4a', 'wav'],
  },
  'notebooklm-plus': {
    label: 'NotebookLM Plus or Pro',
    tool: 'NotebookLM',
    url: 'https://notebooklm.google.com/',
    unit: 'notebook',
    maxFiles: 100,
    maxBytes: 200e6,
    accepts: [...DOCUMENTS, 'mp3', 'm4a', 'wav'],
  },
  chatgpt: {
    label: 'ChatGPT project',
    tool: 'ChatGPT',
    url: 'https://chatgpt.com/',
    unit: 'project',
    maxFiles: 25,
    maxBytes: 512e6,
    accepts: DOCUMENTS,
  },
  claude: {
    label: 'Claude project',
    tool: 'Claude',
    url: 'https://claude.ai/projects',
    unit: 'project',
    maxFiles: 20,
    maxBytes: 30e6,
    accepts: ['pdf', 'docx', 'csv', 'txt'],
  },
  text: {
    label: 'Text only (Markdown)',
    tool: 'any AI tool',
    unit: 'notebook',
    maxFiles: Infinity,
    maxBytes: Infinity,
    accepts: [],
  },
} satisfies Record<string, AiTarget>;

export type AiTargetId = keyof typeof TARGETS;
export const AI_TARGETS: Record<AiTargetId, AiTarget> = TARGETS;

export interface StudyPackInput {
  courseName: string;
  sourceUrl: string;
  savedAt: Date;
  version: string;
  isTeacher: boolean;
  outline: ModuleOutline[];
  entries: (DocumentEntry | RemoteEntry | TextEntry)[];
  /** The Canvas URL module items use for a Canvas file. */
  fileUrl: (canvasId: string) => string;
  notCaptured: NotCaptured[];
  gradingWeights: { name: string; weight: number }[];
  target: AiTarget;
}

// In this order inside each module file: folder, label, and how to count them.
const KINDS: [folder: string, label: string, many: string][] = [
  ['', 'Syllabus', 'syllabus'],
  ['Pages/', 'Page', 'pages'],
  ['Assignments/', 'Assignment', 'assignments'],
  ['Quizzes/', 'Quiz', 'quizzes'],
  ['Discussions/', 'Discussion', 'discussions'],
  ['Announcements/', 'Announcement', 'announcements'],
  ['Submissions/', 'Your submission', 'of your submissions'],
];
const kindIndex = (doc: DocumentEntry) =>
  doc.folder === '' && /^Syllabus\.(html|md)$/.test(doc.name)
    ? 0
    : KINDS.findIndex(([folder], i) => i > 0 && doc.folder.startsWith(folder));
const kindOf = (doc: DocumentEntry) => KINDS[kindIndex(doc)]![1];
const extension = (name: string) => name.slice(name.lastIndexOf('.') + 1).toLowerCase();
const pad = (n: number) => String(n).padStart(2, '0');
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const YOUTUBE =
  /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch|embed)[^"'\s<]*|youtu\.be\/[^"'\s<]+)/g;

interface Part {
  /** Position in the pack, which file names use: M01, M02, ... */
  number: number;
  name: string;
  /** Position of the Canvas module, or null for the course content outside modules. */
  module: number | null;
  docs: DocumentEntry[];
  files: RemoteEntry[];
  transcripts: TextEntry[];
}

/** One notebook's share of a part: its Markdown file and some of its files. */
interface Piece {
  part: Part;
  text: boolean;
  files: RemoteEntry[];
}

/** Where each module file and course file ended up. */
interface Names {
  split: boolean;
  at: Map<Part | RemoteEntry, { path: string; notebook: number }>;
}

const GUIDE = '00 Course guide.md';
const SKIPPED_LIST = '_extras/skipped files.txt';
const hasText = (p: Part) => p.docs.length > 0 || p.transcripts.length > 0;
const textName = (p: Part) => `${pad(p.number)} ${p.name}.md`;
const fileName = (p: Part, f: RemoteEntry) => `M${pad(p.number)} ${f.name}`;

/** The pack's files, from the folder that is uploaded (or "Notebook 1 of 2/", "Project 1 of 2/"). */
export function planStudyPack(input: StudyPackInput): PlannedFile[] {
  const { target } = input;
  // Other students' work never goes to an AI tool.
  const ownWork = (e: { folder: string }) =>
    !(input.isTeacher && e.folder.startsWith('Submissions/'));
  const docs = input.entries.filter(
    (e): e is DocumentEntry => e.kind === 'document' && kindIndex(e) >= 0 && ownWork(e),
  );
  const files = input.entries.filter((e): e is RemoteEntry => e.kind === 'remote' && ownWork(e));
  const transcripts = input.entries.filter(
    (e): e is TextEntry => e.kind === 'text' && e.name.endsWith('.srt'),
  );

  // Each item goes into the first module that lists it; everything else into the last part.
  const docByUrl = new Map(docs.flatMap((d) => d.canvasUrls.map((u) => [u, d] as const)));
  const fileByUrl = new Map(
    files.flatMap((f) => (f.canvasId ? [[input.fileUrl(f.canvasId), f] as const] : [])),
  );
  const placed = new Set<DocumentEntry | RemoteEntry>();
  const parts: Part[] = input.outline.map((mod, i) => {
    const part: Part = {
      number: 0,
      name: mod.name,
      module: i + 1,
      docs: [],
      files: [],
      transcripts: [],
    };
    for (const item of mod.items) {
      const doc = item.url ? docByUrl.get(item.url) : undefined;
      const file = item.url ? fileByUrl.get(item.url) : undefined;
      if (doc && !placed.has(doc)) {
        part.docs.push(doc);
        placed.add(doc);
      }
      if (file && !placed.has(file)) {
        part.files.push(file);
        placed.add(file);
      }
    }
    return part;
  });
  parts.push({
    number: 0,
    name: 'Other course content',
    module: null,
    docs: docs.filter((d) => !placed.has(d)).sort((a, b) => kindIndex(a) - kindIndex(b)),
    files: files.filter((f) => !placed.has(f)),
    transcripts,
  });

  const skipped: string[] = [];
  for (const part of parts) {
    part.files = part.files.filter((f) => {
      const ok =
        target.accepts.includes(extension(f.name)) && (f.size === 0 || f.size <= target.maxBytes);
      if (!ok) skipped.push(`${f.folder}${f.name}`);
      return ok;
    });
  }
  const pack = parts.filter((p) => hasText(p) || p.files.length);
  // Numbered in pack order: modules with nothing in the pack leave no gaps.
  pack.forEach((part, i) => (part.number = i + 1));
  const rest = pack.at(-1);
  if (rest?.module === null && pack.length === 1) rest.name = 'Course content';

  // Split into notebooks when one would hold more files than the tool takes,
  // keeping a module together unless it doesn't fit in a notebook of its own.
  const room = target.maxFiles - 1; // the guide
  const pieces: Piece[] = pack.flatMap((part) => {
    const text = hasText(part);
    const out: Piece[] = [{ part, text, files: [] }];
    for (const f of part.files) {
      const last = out.at(-1)!;
      if (Number(last.text) + last.files.length >= room) out.push({ part, text: false, files: [] });
      out.at(-1)!.files.push(f);
    }
    return out;
  });
  const notebooks: Piece[][] = [[]];
  let used = 0;
  for (const piece of pieces) {
    const size = Number(piece.text) + piece.files.length;
    if (used + size > room && notebooks.at(-1)!.length) {
      notebooks.push([]);
      used = 0;
    }
    notebooks.at(-1)!.push(piece);
    used += size;
  }

  // Name everything first: module files and the guide mention other files by name.
  const split = notebooks.length > 1;
  const unit = target.unit;
  const folderOf = (i: number) =>
    split ? `${unit[0]!.toUpperCase()}${unit.slice(1)} ${i + 1} of ${notebooks.length}/` : '';
  const taken = new Set<string>();
  /** A unique path, as names that differ only in case collide on Windows and macOS. */
  const unique = (folder: string, name: string) => {
    const safe = sanitizeFilename(name);
    const dot = safe.lastIndexOf('.');
    const [stem, ext] = dot > 0 ? [safe.slice(0, dot), safe.slice(dot)] : [safe, ''];
    let candidate = safe;
    for (let n = 2; taken.has((folder + candidate).toLowerCase()); n++)
      candidate = `${stem} (${n})${ext}`;
    taken.add((folder + candidate).toLowerCase());
    return folder + candidate;
  };
  const names: Names = { split, at: new Map() };
  notebooks.forEach((notebook, i) => {
    unique(folderOf(i), GUIDE);
    for (const { part, text } of notebook)
      if (text) names.at.set(part, { path: unique(folderOf(i), textName(part)), notebook: i + 1 });
    for (const { part, files } of notebook)
      for (const f of files)
        names.at.set(f, { path: unique(folderOf(i), fileName(part, f)), notebook: i + 1 });
  });

  const out: PlannedFile[] = [];
  notebooks.forEach((notebook, i) => {
    const fileCount = 1 + notebook.reduce((n, p) => n + Number(p.text) + p.files.length, 0);
    const scope = split ? `${unit} ${i + 1} of ${notebooks.length}` : 'pack';
    out.push({
      path: folderOf(i) + GUIDE,
      source: {
        kind: 'text',
        content: courseGuide(input, { pack, docs, fileCount, scope, skipped, names }),
      },
    });
    for (const { part, text, files } of notebook) {
      if (text) {
        out.push({
          path: names.at.get(part)!.path,
          source: { kind: 'text', content: partMarkdown(input, part, names) },
        });
      }
      for (const f of files) {
        out.push({
          path: names.at.get(f)!.path,
          source: {
            kind: 'remote',
            url: f.url,
            size: f.size,
            contentType: f.contentType,
            modifiedAt: f.modifiedAt,
            ...(f.canvasId ? { canvasId: f.canvasId } : {}),
          },
        });
      }
    }
  });

  const links = [
    ...new Set([
      ...docs.flatMap((d) => d.bodyHtml.match(YOUTUBE) ?? []),
      ...input.outline.flatMap((m) =>
        m.items.flatMap((it) => (it.type === 'ExternalUrl' && it.url ? [it.url] : [])),
      ),
    ]),
  ];
  if (links.length)
    out.push({
      path: '_extras/links.txt',
      source: { kind: 'text', content: `${links.join('\n')}\n` },
    });
  if (skipped.length) {
    const why = target.accepts.length
      ? `${target.tool} doesn't take these file types, or the files are too large.`
      : 'This pack is text only.';
    out.push({
      path: SKIPPED_LIST,
      source: { kind: 'text', content: `Not in this pack. ${why}\n\n${skipped.join('\n')}\n` },
    });
  }
  return out;
}

const baseName = (path: string) => path.slice(path.lastIndexOf('/') + 1);

/**
 * What the Download tab tells the user about a pack, read back from the pack
 * itself: the files the tool doesn't take, and the Canvas modules it holds.
 */
export function packContents(
  files: PlannedFile[],
  courseName: string,
): { leftOut: string[]; modules: string[] } {
  const text = (f: PlannedFile) => (f.source.kind === 'text' ? f.source.content : '');
  const list = files.find((f) => f.path === SKIPPED_LIST);
  // "Not in this pack. <why>" then a blank line and one path per line.
  const leftOut = list ? text(list).split('\n\n')[1]!.split('\n').filter(Boolean) : [];
  const modules = new Set<string>();
  for (const f of files) {
    const name = baseName(f.path);
    if (name === GUIDE || !/^\d{2} .*\.md$/.test(name)) continue;
    // "# 01 Week 1: Vectors — Linear Algebra", a blank line, then "> Canvas module 1 of 6."
    const [title = '', , note = ''] = text(f).split('\n');
    if (note.startsWith('> Canvas module '))
      modules.add(title.replace(/^# \d{2} /, '').replace(` — ${courseName}`, ''));
  }
  return { leftOut, modules: [...modules] };
}

/** Item headings are level 2, so headings inside an item start at level 3. */
const demoteHeadings = (html: string) =>
  html.replace(
    /<(\/?)h([1-6])\b/gi,
    (_, slash: string, level: string) => `<${slash}h${Math.min(6, Number(level) + 2)}`,
  );

function partMarkdown(input: StudyPackInput, part: Part, names: Names): string {
  const total = input.outline.length;
  let md = `# ${pad(part.number)} ${part.name} — ${input.courseName}\n\n`;
  md +=
    part.module !== null
      ? `> Canvas module ${part.module} of ${total}.`
      : `> Course content that isn't in a module.`;
  if (part.files.length) {
    md += `\n> ${part.module !== null ? "This module's files" : "Files that aren't in a module"} are separate in this pack: ${part.files.map((f) => `"${baseName(names.at.get(f)!.path)}"`).join(', ')}.`;
  }
  md += '\n';
  for (const doc of part.docs) {
    const kind = kindOf(doc);
    const meta = [kind];
    if (doc.dueAt) meta.push(`due ${formatDate(doc.dueAt)}`);
    if (doc.points != null) meta.push(plural(doc.points, 'point'));
    if (doc.canvasUrls[0]) meta.push(doc.canvasUrls[0]);
    md += `\n## ${doc.title}\n\n${meta.join(' · ')}\n\n${htmlToMarkdown(demoteHeadings(doc.bodyHtml)).trim()}\n`;
  }
  for (const t of part.transcripts) {
    md += `\n## Video transcript: ${t.name.replace(/\.srt$/, '')}\n\n${t.content.trim()}\n`;
  }
  return md;
}

function courseGuide(
  input: StudyPackInput,
  pack: {
    pack: Part[];
    docs: DocumentEntry[];
    fileCount: number;
    scope: string;
    skipped: string[];
    names: Names;
  },
): string {
  const date = input.savedAt.toISOString().slice(0, 10);
  const cell = (s: string) => s.replace(/\|/g, '\\|');
  const where = (key: Part | RemoteEntry) => {
    const at = pack.names.at.get(key)!;
    return pack.names.split
      ? `${baseName(at.path)} (${input.target.unit} ${at.notebook})`
      : at.path;
  };

  let md = `# ${input.courseName} — course guide\n\n`;
  md += `> Snapshot of the Canvas course at ${input.sourceUrl}, made on ${date} with Canvas Course Downloader ${input.version}. Changes made in Canvas after that date are not included.\n`;
  md += `> This ${pack.scope} has ${plural(pack.fileCount, 'file')}. Files named "M03 …" belong to part 3 below.\n`;

  md += "\n## Contents\n\n| # | Part | What's in it | Files |\n|---|---|---|---|\n";
  for (const part of pack.pack) {
    const counts = new Map<number, number>();
    for (const d of part.docs) counts.set(kindIndex(d), (counts.get(kindIndex(d)) ?? 0) + 1);
    const what = [...counts].map(([kind, n]) => {
      const [, one, many] = KINDS[kind]!;
      return n === 1 ? `1 ${one.toLowerCase()}` : `${n} ${many}`;
    });
    if (part.transcripts.length) what.push(plural(part.transcripts.length, 'video transcript'));
    const names = [...(hasText(part) ? [where(part)] : []), ...part.files.map(where)];
    md += `| ${part.number} | ${cell(part.name)} | ${what.join(', ') || '—'} | ${cell(names.join('; '))} |\n`;
  }

  const dated = pack.docs.filter((d) => d.dueAt).sort((a, b) => a.dueAt!.localeCompare(b.dueAt!));
  if (dated.length) {
    md += '\n## Deadlines\n\n| Due | What | Points |\n|---|---|---|\n';
    for (const d of dated) {
      md += `| ${formatDate(d.dueAt)} | ${cell(d.title)} (${kindOf(d).toLowerCase()}) | ${d.points ?? ''} |\n`;
    }
  }
  if (input.gradingWeights.length) {
    const weights = input.gradingWeights.map((g) => `${g.name} ${g.weight}%`);
    md += `\n## Grading\n\n${weights.join(' · ')}\n`;
  }

  const missing = [
    ...input.notCaptured.map((n) => `- ${n.text || n.url} (${n.source}): ${reasonText(n.status)}`),
    ...(pack.skipped.length
      ? [`- ${plural(pack.skipped.length, 'file')}, listed in _extras/skipped files.txt`]
      : []),
  ];
  if (missing.length) md += `\n## Not in this pack\n\n${missing.join('\n')}\n`;
  return md;
}
