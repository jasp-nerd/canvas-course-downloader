// Export scenarios shared by golden capture (v2) and parity (v3). Each runs one
// course export against the mock Canvas with the given v2-style settings.
import type { FaultRule } from '../mock-canvas/server.ts';

export interface Scenario {
  name: string;
  description: string;
  courseId: number;
  /** v2 storage.sync settings; anything not set uses v2's defaults. */
  settings: Record<string, unknown>;
  faults?: FaultRule[];
}

const ALL_TYPES = [
  'files',
  'pages',
  'assignments',
  'submissions',
  'discussions',
  'announcements',
  'modules',
  'syllabus',
  'grades',
  'quizzes',
  'linkedFiles',
] as const;
const only = (...types: (typeof ALL_TYPES)[number][]) =>
  Object.fromEntries(ALL_TYPES.map((t) => [t, types.includes(t)]));

export const SCENARIOS: Scenario[] = [
  {
    name: 'student-zip-default',
    description: 'Student, default settings: everything, HTML, one ZIP.',
    courseId: 101,
    settings: {},
  },
  {
    name: 'student-folders',
    description: 'Student, ZIP off: individual downloads into course folders.',
    courseId: 102,
    settings: { zipMode: false, throttleMs: 50 },
  },
  {
    name: 'student-markdown',
    description: 'Student, Markdown export format, one ZIP.',
    courseId: 103,
    settings: { exportFormat: 'markdown' },
  },
  {
    name: 'student-files-only',
    description: 'Student, the Files Only preset.',
    courseId: 104,
    settings: { preset: 'files-only', contentTypes: only('files') },
  },
];
