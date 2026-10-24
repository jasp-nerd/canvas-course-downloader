// The four kinds of download, each with the folder tree it really makes. The trees come from
// exports of the sample course "Academic Writing" in the test Canvas (invented data), shortened
// where a folder repeats ("11 more").

export interface Node {
  name: string;
  note?: string;
  children?: Node[];
}

export interface Kind {
  id: 'copy' | 'study' | 'agents' | 'teacher';
  label: string;
  text: string;
  pose: string;
  zip: string;
  tree: Node[];
  foot?: string;
}

const f = (name: string, children?: Node[], note?: string): Node => ({ name, children, note });

export const KINDS: Kind[] = [
  {
    id: 'copy',
    label: 'A copy to keep',
    text: 'The course as it is in Canvas, as pages that open in any browser without internet. Start with the Open me page.',
    pose: 'folder',
    zip: 'Academic Writing.zip',
    tree: [
      f('Open me - Academic Writing.html', undefined, 'start here'),
      f('Files', [
        f('Lectures', [f('Lecture 01 - Academic Writing week 1.pdf'), f('11 more')]),
        f('Readings', [f('4 PDFs')]),
        f('Exam prep', [f('3 PDFs')]),
        f('Syllabus.pdf'),
      ]),
      f('Pages', [f('4 pages')]),
      f('Assignments', [f('5 assignments')]),
      f('Quizzes', [f('2 quizzes')]),
      f('Discussions', [f('3 threads')]),
      f('Announcements', [f('3 announcements')]),
      f('Submissions', [f('Assignment 1', [f('You.html')]), f('3 more')]),
      f('Grades.csv'),
      f('Deadlines.ics', undefined, 'for your calendar'),
    ],
  },
  {
    id: 'study',
    label: 'A study pack for AI',
    text: 'A course guide with deadlines and grading, one file per module, and the slides and PDFs. Sized for NotebookLM, ChatGPT or Claude, and split when a course is too big.',
    pose: 'laptop',
    zip: 'Academic Writing - AI study pack.zip',
    tree: [
      f('00 Course guide.md', undefined, 'deadlines, grading'),
      f('01 Week 1- Academic Writing week 1.md'),
      f('02 Week 2- Academic Writing week 3.md'),
      f('4 more modules'),
      f('M01 Lecture 01 - Academic Writing week 1.pdf'),
      f('M02 Lecture 03 - Academic Writing week 3.pdf'),
      f('22 more slides and PDFs'),
    ],
    foot: '31 sources, all in one notebook',
  },
  {
    id: 'agents',
    label: 'Files for code',
    text: 'The course in Markdown with front matter, plus AGENTS.md, llms.txt and course.json, for Claude Code, Codex or Cursor.',
    pose: 'point',
    zip: 'Academic Writing.zip',
    tree: [
      f('AGENTS.md', undefined, 'how the course is laid out'),
      f('llms.txt'),
      f('course.json', undefined, 'structure and deadlines'),
      f('Modules.md'),
      f('Syllabus.md'),
      f('Pages', [f('4 pages in Markdown')]),
      f('Assignments', [f('5 assignments in Markdown')]),
      f('Files', [f('24 files')]),
      f('Grades.csv'),
      f('Deadlines.ics'),
    ],
  },
  {
    id: 'teacher',
    label: "A teacher's archive",
    text: "The course you teach, without students' work unless you turn it on. Add the course package Canvas makes, to import the course again later.",
    pose: 'read',
    zip: 'Teaching Practicum.zip',
    tree: [
      f('Open me - Teaching Practicum.html', undefined, 'start here'),
      f('Files', [f('Lectures', [f('12 PDFs')]), f('Readings', [f('4 PDFs')]), f('Syllabus.pdf')]),
      f('Pages', [f('4 pages')]),
      f('Assignments', [f('5 assignments')]),
      f('Quizzes', [f('2 quizzes with questions')]),
      f('Discussions', [f('3 threads')]),
      f('Deadlines.ics'),
    ],
    foot: 'Student data: none included',
  },
];
