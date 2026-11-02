// The three kinds of download, each with the folder tree it really makes. The trees come from
// exports of the sample course "Academic Writing" in the test Canvas (invented data), shortened
// to fit beside the text: a folder's contents become a count ("11 more", "4 pages").

export interface Node {
  name: string;
  note?: string;
  children?: Node[];
}

export interface Kind {
  id: 'copy' | 'study' | 'teacher';
  label: string;
  text: string;
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
    zip: 'Academic Writing.zip',
    tree: [
      f('Open me - Academic Writing.html', undefined, 'start here'),
      f('Files', [
        f('Lectures', [f('Lecture 01 - Academic Writing week 1.pdf'), f('11 more')]),
        f('3 more folders and the syllabus'),
      ]),
      f('Pages', [], '4 pages'),
      f('Assignments', [], '5, with their rubrics'),
      f('Quizzes and discussions', [], '2 and 3'),
      f('Submissions', [], 'your own work and feedback'),
      f('Grades.csv'),
      f('Deadlines.ics', undefined, 'for your calendar'),
    ],
  },
  {
    id: 'study',
    label: 'A study pack for AI',
    text: 'A course guide with deadlines and grading, one file per module, and the slides and PDFs. Sized for NotebookLM, ChatGPT or Claude, and split when a course is too big.',
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
    id: 'teacher',
    label: "A teacher's archive",
    text: "The course you teach, quizzes with their questions included. Add students' submissions and grades when you need them, and the course package Canvas makes to import the course again.",
    zip: 'Teaching Practicum.zip',
    tree: [
      f('Open me - Teaching Practicum.html', undefined, 'start here'),
      f('Files', [f('Lectures', [], '12 PDFs'), f('Readings', [], '4 PDFs'), f('Syllabus.pdf')]),
      f('Pages', [], '4 pages'),
      f('Assignments', [], '5, with their rubrics'),
      f('Quizzes', [], '2, with their questions'),
      f('Discussions', [], '3 prompts'),
      f('Deadlines.ics'),
      f('Gradebook.csv', undefined, "with students' work"),
    ],
  },
];
