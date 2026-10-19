import { describe, expect, it } from 'vitest';
import { loadV2Helpers } from '../../tests/legacy/v2';
import { sanitizeFilename, type NameKind } from './filenames';

// Ports of the browsers' own checks. A name that fails either one makes
// downloads.download throw, so every output must pass both.

/** Chrome's IsSafePortablePathComponent plus the extension and reserved-name checks. */
function chromeAccepts(name: string): boolean {
  if (!name || name === '.' || name === '..') return false;
  if (/["*/:<>?\\|\p{Cc}\p{Cf}\p{Noncharacter_Code_Point}]/u.test(name)) return false;
  if (/^[\p{White_Space}.~]|[\p{White_Space}.~]$/u.test(name)) return false;
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : '';
  if (/^(local|lnk|scf|url|\{.*\})$/i.test(ext)) return false;
  const firstStem = name.split('.')[0]!.toLowerCase();
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9]|clock\$)$/.test(firstStem)) return false;
  if (['desktop.ini', 'thumbs.db', 'conin$', 'conout$'].includes(name.toLowerCase())) return false;
  return !(name.length <= 12 && name.includes('~'));
}

/** Firefox accepts a component only if its sanitizer would leave it unchanged. */
function firefoxAccepts(name: string, kind: NameKind): boolean {
  if (/[/\\:*?"<>|%\p{Cc}\p{Zl}\p{Zp}\p{Cf}]/u.test(name)) return false;
  if (/[\p{Zs}]/u.test(name.replace(/ /g, ''))) return false;
  if (name.startsWith('.') || /[ .\u180e]$/.test(name)) return false;
  if (kind === 'file') {
    const dot = name.lastIndexOf('.');
    if (dot >= 0 && /\s/.test(name.slice(dot + 1))) return false;
    if (/\.(lnk|local|url|scf|desktop)$/i.test(name)) return false;
  }
  return true;
}

const expectSafe = (out: string, kind: NameKind = 'file') => {
  expect(chromeAccepts(out), `Chrome rejects ${JSON.stringify(out)}`).toBe(true);
  expect(firefoxAccepts(out, kind), `Firefox rejects ${JSON.stringify(out)}`).toBe(true);
};

describe('sanitizeFilename', () => {
  it.each([
    ['Collegé 1 – Inleiding.pdf', 'Collegé 1 – Inleiding.pdf'],
    ['第一讲 导论.pdf', '第一讲 导论.pdf'],
    ['\u200fمحاضرة\u200f 1.pdf', 'محاضرة 1.pdf'],
    ['می\u200cخواهم.pdf', 'میخواهم.pdf'],
    ['Team 👩\u200d💻 notes.pdf', 'Team 👩💻 notes.pdf'],
    ['CON.pdf', '_CON.pdf'],
    ['aux.notes.txt', '_aux.notes.txt'],
    ['clock$', '_clock$'],
    ['desktop.ini', '_desktop.ini'],
    ['~$Report.docx', '$Report.docx'],
    ['Week 1.', 'Week 1'],
    ['Lecture 1. Intro', 'Lecture 1_ Intro'],
    ['link.url', 'link.url.txt'],
    ['name\u202fwith narrow nbsp.pdf', 'name with narrow nbsp.pdf'],
    ['Week~1.pdf', 'Week-1.pdf'],
    ['Lecture 01 - What is psychology?.pdf', 'Lecture 01 - What is psychology-.pdf'],
    ['soft\u00adhyphen', 'softhyphen'],
    ['  .hidden draft.  ', 'hidden draft'],
    ['', 'untitled'],
    [null, 'untitled'],
  ])('%j becomes %j', (input, expected) => {
    const out = sanitizeFilename(input);
    expect(out).toBe(expected);
    expectSafe(out);
  });

  it('composes NFD names so "Café" from macOS and from Windows collide as one name', () => {
    expect(sanitizeFilename('Café.pdf')).toBe(sanitizeFilename('Café.pdf'));
  });

  it('turns a shell extension on a folder into part of the name', () => {
    expect(sanitizeFilename('Links.url', 'folder')).toBe('Links_url');
  });

  it('cuts long names at grapheme boundaries, keeps the extension and adds a stable tag', () => {
    const title = `${'Very long lecture title '.repeat(12)}👩\u200d💻 end`;
    const out = sanitizeFilename(`${title}.pdf`);
    expect(out.length).toBeLessThanOrEqual(100);
    expect(out).toMatch(/_[a-z2-7]{4}\.pdf$/);
    expect(sanitizeFilename(`${title}.pdf`)).toBe(out);
    expect(sanitizeFilename(`${title} (2).pdf`)).not.toBe(out);
    expectSafe(out);
  });

  it('caps folder names at 60 units', () => {
    const out = sanitizeFilename(
      'Advanced Seminar in Computational Neuroscience and Cognitive Modelling: Theory',
      'folder',
    );
    expect(out.length).toBeLessThanOrEqual(60);
    expectSafe(out, 'folder');
  });

  it('never splits a surrogate pair when cutting by bytes', () => {
    const out = sanitizeFilename('😀'.repeat(80) + '.pdf');
    expect(out).toBe(out.toWellFormed());
    expect(new TextEncoder().encode(out).length).toBeLessThanOrEqual(200);
  });

  it('produces names both browsers accept for arbitrary hostile input', () => {
    const alphabet = [
      'a',
      'Z',
      '1',
      ' ',
      '.',
      '~',
      '%',
      '?',
      '*',
      ':',
      '/',
      '\\',
      '|',
      '"',
      '<',
      '>',
      '\t',
      '\n',
      '\u0000',
      '\u0085',
      '\u00a0',
      '\u00ad',
      '\u061c',
      '\u180e',
      '\u200b',
      '\u200d',
      '\u200e',
      '\u2028',
      '\u202e',
      '\u2066',
      '\u3000',
      '\ufeff',
      '￾',
      '\ud800',
      'é',
      'é',
      '👩\u200d💻',
      'CON',
      'lnk',
      '$',
      '{x}',
    ];
    let seed = 42;
    const random = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let i = 0; i < 3000; i++) {
      const length = 1 + Math.floor(random() * 40);
      let input = '';
      for (let j = 0; j < length; j++) input += alphabet[Math.floor(random() * alphabet.length)];
      const kind: NameKind = random() < 0.3 ? 'folder' : 'file';
      expectSafe(sanitizeFilename(input, kind), kind);
    }
  });
});

describe('sanitizeFilename keeps v2.11.0 names for ordinary input', () => {
  const v2 = loadV2Helpers();
  it.each([
    'Lecture 01 - What is psychology?.pdf',
    'Week 4 - Background article.pdf',
    'Introduction to Psychology',
    'Assignment 2: part B',
    'Q&A session (week 3)',
    'Room change for Thursday',
    'Welcome to the course!',
    'Café notes – week 1.docx',
    'report.final.v2.pdf',
    'CON',
    'nul.txt',
    '...dots at start',
    'trailing dots...',
    'Course "quoted" <name>',
    '50% done | review*',
  ])('%j', (input) => {
    expect(sanitizeFilename(input)).toBe(v2.sanitizeFilename(input));
  });
});
