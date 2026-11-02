// Invented sample data for the mock Canvas ("Sample University"). Every course,
// person and file here is made up; never add real course or student data.

export interface Term {
  id: number;
  name: string;
  start_at: string;
}

export interface Course {
  id: number;
  name: string;
  course_code: string;
  term: Term;
  color: string;
  state: 'active' | 'completed';
  /** Sam teaches this one; every other course Sam takes as a student. */
  teaching?: boolean;
}

type Json = Record<string, unknown>;

const ACTIVE_TERM: Term = { id: 1, name: 'Fall 2026', start_at: '2026-09-01T00:00:00Z' };
const PAST_TERM: Term = { id: 2, name: 'Spring 2026', start_at: '2026-02-01T00:00:00Z' };

export const COURSES: Course[] = [
  {
    id: 101,
    name: 'Introduction to Psychology',
    course_code: 'PSY 101',
    term: ACTIVE_TERM,
    color: '#0b6e99',
    state: 'active',
  },
  {
    id: 102,
    name: 'Data Structures and Algorithms',
    course_code: 'CS 210',
    term: ACTIVE_TERM,
    color: '#7a3fb0',
    state: 'active',
  },
  {
    id: 103,
    name: 'Linear Algebra',
    course_code: 'MATH 221',
    term: ACTIVE_TERM,
    color: '#c2410c',
    state: 'active',
  },
  {
    id: 104,
    name: 'Academic Writing',
    course_code: 'ENG 105',
    term: ACTIVE_TERM,
    color: '#15803d',
    state: 'active',
  },
  {
    id: 105,
    name: 'Machine Learning',
    course_code: 'CS 340',
    term: ACTIVE_TERM,
    color: '#be185d',
    state: 'active',
  },
  {
    id: 106,
    name: 'Principles of Microeconomics',
    course_code: 'ECON 101',
    term: ACTIVE_TERM,
    color: '#0f766e',
    state: 'active',
  },
  {
    id: 107,
    name: 'Teaching Practicum',
    course_code: 'EDU 310',
    term: ACTIVE_TERM,
    color: '#a16207',
    state: 'active',
    teaching: true,
  },
  {
    id: 201,
    name: 'Calculus I',
    course_code: 'MATH 120',
    term: PAST_TERM,
    color: '#4338ca',
    state: 'completed',
  },
  {
    id: 202,
    name: 'Introduction to Programming',
    course_code: 'CS 110',
    term: PAST_TERM,
    color: '#b45309',
    state: 'completed',
  },
  {
    id: 203,
    name: 'Statistics for Social Sciences',
    course_code: 'STAT 150',
    term: PAST_TERM,
    color: '#0369a1',
    state: 'completed',
  },
  {
    id: 204,
    name: 'World History',
    course_code: 'HIST 101',
    term: PAST_TERM,
    color: '#9f1239',
    state: 'completed',
  },
];

const TOPICS: Record<number, string[]> = {
  101: [
    'What is psychology?',
    'Research methods',
    'The brain and behaviour',
    'Sensation and perception',
    'Learning',
    'Memory',
    'Thinking and language',
    'Development',
    'Personality',
    'Social psychology',
    'Stress and health',
    'Psychological disorders',
  ],
  102: [
    'Complexity and Big-O',
    'Arrays and linked lists',
    'Stacks and queues',
    'Recursion',
    'Sorting',
    'Hash tables',
    'Trees',
    'Balanced trees',
    'Heaps',
    'Graphs',
    'Shortest paths',
    'Dynamic programming',
  ],
  103: [
    'Vectors',
    'Systems of equations',
    'Matrix operations',
    'Inverses',
    'Determinants',
    'Vector spaces',
    'Basis and dimension',
    'Linear maps',
    'Eigenvalues',
    'Diagonalisation',
    'Orthogonality',
    'Least squares',
  ],
};

export const findCourse = (id: number | string): Course | undefined =>
  COURSES.find((c) => c.id === Number(id));

const topicsFor = (c: Course): string[] =>
  TOPICS[c.id] ?? Array.from({ length: 12 }, (_, i) => `${c.name} week ${i + 1}`);
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (day: number) => new Date(Date.UTC(2026, 8, 1 + day, 21, 59)).toISOString();
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export function folders(c: Course): Json[] {
  const base = c.id * 100;
  return [
    { id: base + 1, name: 'course files', full_name: 'course files', parent_folder_id: null },
    {
      id: base + 2,
      name: 'Lectures',
      full_name: 'course files/Lectures',
      parent_folder_id: base + 1,
    },
    {
      id: base + 3,
      name: 'Readings',
      full_name: 'course files/Readings',
      parent_folder_id: base + 1,
    },
    {
      id: base + 4,
      name: 'Assignments',
      full_name: 'course files/Assignments',
      parent_folder_id: base + 1,
    },
    {
      id: base + 5,
      name: 'Exam prep',
      full_name: 'course files/Exam prep',
      parent_folder_id: base + 1,
    },
  ];
}

export interface MockFile extends Json {
  id: number;
  folder_id: number;
  display_name: string;
  filename: string;
  size: number;
  url: string;
}

/** `withNewFile` adds a file uploaded after the first export, for "what's new" tests. */
export function files(c: Course, origin: string, withNewFile = false): MockFile[] {
  const base = c.id * 1000;
  const [root, lectures, readings, assignmentsFolder, exam] = folders(c).map((f) => f.id as number);
  const list: MockFile[] = [];
  const add = (folderId: number | undefined, name: string, size: number) => {
    const id = base + list.length + 1;
    list.push({
      id,
      folder_id: folderId ?? 0,
      display_name: name,
      filename: name.replace(/ /g, '+'),
      'content-type': 'application/pdf',
      size,
      url: `${origin}/files/${id}/download?download_frd=1`,
      // Later than modified_at, as on real Canvas: updated_at also moves on renames and publishing.
      updated_at: iso(list.length + 1),
      modified_at: iso(list.length),
      created_at: iso(list.length),
      locked_for_user: false,
    });
  };
  add(root, 'Syllabus.pdf', 182_000);
  topicsFor(c).forEach((t, i) =>
    add(lectures, `Lecture ${pad(i + 1)} - ${t}.pdf`, 1_400_000 + i * 97_000),
  );
  ['Core reading', 'Background article', 'Case study', 'Further reading'].forEach((t, i) =>
    add(readings, `Week ${i * 3 + 1} - ${t}.pdf`, 640_000 + i * 51_000),
  );
  ['Assignment 1 brief', 'Assignment 2 brief', 'Project guidelines', 'Rubric'].forEach((t, i) =>
    add(assignmentsFolder, `${t}.pdf`, 210_000 + i * 33_000),
  );
  ['Practice exam', 'Practice exam - solutions', 'Formula sheet'].forEach((t, i) =>
    add(exam, `${t}.pdf`, 380_000 + i * 41_000),
  );
  if (withNewFile) add(lectures, 'Lecture 13 - Review session.pdf', 1_250_000);
  return list;
}

export function findFile(
  id: number,
  origin: string,
  withNewFile = false,
): { course: Course; file: MockFile } | undefined {
  const course = findCourse(Math.floor(id / 1000));
  const file = course && files(course, origin, withNewFile).find((f) => f.id === id);
  return course && file ? { course, file } : undefined;
}

/** Links a file from a page, for linked-file tests. Golden scenarios use 101-104 and don't change. */
export const LINKING_COURSE = 105;

export function pages(c: Course): Json[] {
  const t = topicsFor(c);
  return [
    {
      title: 'Welcome to the course',
      body: `<h2>Welcome to ${c.name}</h2><p>This page explains how the course works, where to find the slides and how you will be assessed.</p>`,
    },
    {
      title: 'Course schedule',
      body: `<table><tr><th>Week</th><th>Topic</th></tr>${t.map((x, i) => `<tr><td>${i + 1}</td><td>${x}</td></tr>`).join('')}</table>`,
    },
    {
      title: 'How to get help',
      body: '<p>Office hours are on Tuesdays and Thursdays. Post questions in the Q&amp;A discussion so everyone benefits from the answer.</p>',
    },
    {
      title: 'Exam information',
      body: `<p>The final exam is closed book. A formula sheet is provided. Practice exams are in the Exam prep folder.${c.id === LINKING_COURSE ? ` Revise from <a href="/courses/${c.id}/files/${c.id * 1000 + 2}">the week 1 slides</a>.` : ''}</p>`,
    },
  ].map((p, i) => ({
    page_id: c.id * 10 + i,
    url: slug(p.title),
    title: p.title,
    body: p.body,
    updated_at: iso(i),
    published: true,
    front_page: i === 0,
  }));
}

export function assignments(c: Course): Json[] {
  return ['Assignment 1', 'Assignment 2', 'Midterm project', 'Assignment 3', 'Final project'].map(
    (name, i) => ({
      id: c.id * 10 + i,
      name,
      description: `<p>Instructions for ${name.toLowerCase()} in ${c.name}. Submit a PDF before the deadline.</p>`,
      due_at: iso(14 + i * 14),
      points_possible: i === 2 || i === 4 ? 30 : 10,
      submission_types: ['online_upload'],
      assignment_group_id: c.id * 10 + (i === 2 || i === 4 ? 2 : 1),
      html_url: `/courses/${c.id}/assignments/${c.id * 10 + i}`,
      has_submitted_submissions: true,
      published: true,
      submission: {
        score: [8.5, 9, 26, 7.5, null][i],
        grade: ['8.5', '9', '26', '7.5', null][i],
        workflow_state: i < 4 ? 'graded' : 'unsubmitted',
        submitted_at: i < 4 ? iso(13 + i * 14) : null,
        late: false,
        missing: false,
      },
    }),
  );
}

export function assignmentGroups(c: Course): Json[] {
  return [
    { id: c.id * 10 + 1, name: 'Assignments', group_weight: 40 },
    { id: c.id * 10 + 2, name: 'Projects', group_weight: 60 },
  ];
}

export function discussions(c: Course, announcements: boolean): Json[] {
  const items = announcements
    ? ['Welcome to the course!', 'Slides for week 2 are online', 'Room change for Thursday']
    : ['Introduce yourself', 'Questions about assignment 1', 'Exam preparation'];
  return items.map((title, i) => ({
    id: c.id * 100 + (announcements ? 50 : 0) + i,
    title,
    message: `<p>${title}. Reply below if anything is unclear.</p>`,
    posted_at: iso(i * 7),
    author: { display_name: announcements ? 'Dr. A. Rivera' : 'Sam Student' },
    discussion_subentry_count: announcements ? 0 : 4,
    is_announcement: announcements,
    published: true,
    html_url: `/courses/${c.id}/discussion_topics/${c.id * 100 + i}`,
  }));
}

export function discussionView(topicId: number): Json {
  const people = ['Sam Student', 'Lee Park', 'Noor Haddad', 'Alex Kim'];
  return {
    participants: people.map((p, i) => ({ id: i + 1, display_name: p })),
    view: people.map((p, i) => ({
      id: topicId * 10 + i,
      user_id: i + 1,
      message: `<p>Reply ${i + 1} from ${p}.</p>`,
      created_at: iso(i),
    })),
    unread_entries: [],
    forced_entries: [],
    new_entries: [],
  };
}

export function modules(c: Course): Json[] {
  const t = topicsFor(c);
  return Array.from({ length: 6 }, (_, i) => ({
    id: c.id * 10 + i,
    name: `Week ${i + 1}: ${t[i * 2]}`,
    position: i + 1,
    items_count: 3,
    published: true,
  }));
}

export function moduleItems(c: Course, moduleId: number, origin: string): Json[] {
  const i = moduleId - c.id * 10;
  const lecture = files(c, origin)[1 + i * 2];
  const assignment = assignments(c)[Math.min(i, 4)];
  return [
    {
      id: moduleId * 10 + 1,
      title: lecture?.display_name,
      type: 'File',
      content_id: lecture?.id,
      position: 1,
      indent: 0,
    },
    {
      id: moduleId * 10 + 2,
      title: 'Course schedule',
      type: 'Page',
      page_url: 'course-schedule',
      position: 2,
      indent: 0,
    },
    {
      id: moduleId * 10 + 3,
      title: assignment?.name,
      type: 'Assignment',
      content_id: assignment?.id,
      position: 3,
      indent: 0,
    },
  ];
}

/** Invented questions with an answer key, as a teacher sees them. */
export function quizQuestions(): Json[] {
  return [
    {
      question_text: '<p>Which of these is a vector space over the reals?</p>',
      points_possible: 1,
      answers: [
        { id: 1, text: 'The real plane with the usual addition', weight: 100 },
        { id: 2, text: 'The integers with the usual addition', weight: 0 },
      ],
    },
    {
      question_text: '<p>What is the determinant of the 2×2 identity matrix?</p>',
      points_possible: 1,
      answers: [
        { id: 3, text: '1', weight: 100 },
        { id: 4, text: '0', weight: 0 },
      ],
    },
  ];
}

export function quizzes(c: Course): Json[] {
  return [
    {
      id: c.id * 10 + 1,
      title: 'Week 3 quiz',
      quiz_type: 'assignment',
      points_possible: 5,
      question_count: 5,
      due_at: iso(21),
      description: '<p>Five multiple-choice questions.</p>',
      html_url: `/courses/${c.id}/quizzes/${c.id * 10 + 1}`,
    },
    {
      id: c.id * 10 + 2,
      title: 'Midterm practice quiz',
      quiz_type: 'practice_quiz',
      points_possible: 10,
      question_count: 10,
      due_at: null,
      description: '<p>Ungraded practice.</p>',
      html_url: `/courses/${c.id}/quizzes/${c.id * 10 + 2}`,
    },
  ];
}

export const syllabus = (c: Course): string =>
  `<h2>${c.name} (${c.course_code})</h2><p>Instructor: Dr. A. Rivera</p><p>This syllabus describes the learning goals, weekly topics and assessment for the course.</p><ul>${topicsFor(
    c,
  )
    .map((t) => `<li>${t}</li>`)
    .join('')}</ul>`;
