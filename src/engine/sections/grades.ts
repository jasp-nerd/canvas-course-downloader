// Grades: a student's own grades CSV, or a teacher's gradebook and roster, plus
// assignment-group weights for both.
import { formatDate } from '../../export/format';
import { addDocument, addText, type CourseExport, type Student } from '../context';
import { csvRow, escapeHtml, fmtPoints } from '../render';
import type { Assignment } from './content';

/** Teacher: the roster and each student's section, reused by gradebook, submissions and quizzes. */
export async function loadRoster(ctx: CourseExport): Promise<void> {
  ctx.students = await ctx.canvas.list<Student>(`/courses/${ctx.courseId}/users`, {
    'enrollment_type[]': 'student',
  });
  for (const s of ctx.students)
    ctx.nameByUserId.set(String(s.id), s.sortable_name || s.name || `user_${s.id}`);
  try {
    const sections = await ctx.canvas.list<{ name?: string; students?: { id: string | number }[] }>(
      `/courses/${ctx.courseId}/sections`,
      { 'include[]': 'students' },
    );
    for (const sec of sections)
      for (const s of sec.students ?? []) ctx.sectionByUserId.set(String(s.id), sec.name ?? '');
  } catch {
    // Sections are optional: without them the section columns stay empty.
  }
}

export async function exportGradebook(ctx: CourseExport, assignments: Assignment[]): Promise<void> {
  if (assignments.length === 0 || ctx.students.length === 0) return;
  const subs = await ctx.canvas.list<{
    user_id: string | number;
    assignment_id: string | number;
    score?: number;
    grade?: string;
  }>(`/courses/${ctx.courseId}/students/submissions`, { 'student_ids[]': 'all' });
  const scores = new Map(
    subs.map((s) => [`${s.user_id}:${s.assignment_id}`, s.score ?? s.grade ?? '']),
  );
  const rows = [
    csvRow(['Student', 'Login/SIS ID', 'Section', ...assignments.map((a) => a.name)]),
    [csvRow(['Points Possible', '', '']), ...assignments.map((a) => a.points_possible ?? '')].join(
      ',',
    ),
  ];
  for (const s of ctx.students) {
    const cells = [
      csvRow([
        s.sortable_name || s.name || `user_${s.id}`,
        s.login_id || s.sis_user_id || '',
        ctx.sectionByUserId.get(String(s.id)) ?? '',
      ]),
      ...assignments.map((a) => scores.get(`${s.id}:${a.id}`) ?? ''),
    ];
    rows.push(cells.join(','));
    ctx.counts.gradebookStudents++;
  }
  addText(ctx, '', 'Gradebook.csv', rows.join('\n'));

  const roster = [csvRow(['Student', 'Sortable Name', 'Login/SIS ID', 'Email', 'Section'])];
  for (const s of ctx.students) {
    roster.push(
      csvRow([
        s.name ?? '',
        s.sortable_name ?? '',
        s.login_id || s.sis_user_id || '',
        s.email ?? '',
        ctx.sectionByUserId.get(String(s.id)) ?? '',
      ]),
    );
  }
  addText(ctx, '', 'Students.csv', roster.join('\n'));
}

interface GradedAssignment {
  name?: string;
  due_at?: string;
  points_possible?: number;
  submission?: { score?: number; grade?: string };
  score_statistics?: {
    min?: number;
    lower_quartile?: number;
    median?: number;
    mean?: number;
    upper_quartile?: number;
    max?: number;
  };
}

/** Student: own scores with the class statistics Canvas shows on the grades page. */
export async function exportOwnGrades(ctx: CourseExport): Promise<void> {
  const assignments = await ctx.canvas.list<GradedAssignment>(
    `/courses/${ctx.courseId}/assignments`,
    {
      'include[]': ['submission', 'score_statistics'],
    },
  );
  if (assignments.length === 0) return;
  const rows = [
    'Assignment,Due Date,Points Possible,Score,Grade,Low,Lower Quartile,Median,Mean,Upper Quartile,High',
  ];
  for (const a of assignments) {
    const st = a.score_statistics ?? {};
    // v2's column layout: text columns quoted, numbers bare.
    rows.push(
      `"${(a.name ?? '').replace(/"/g, '""')}","${formatDate(a.due_at).slice(0, 10)}",${a.points_possible ?? ''},${a.submission?.score ?? ''},"${a.submission?.grade ?? ''}",${st.min ?? ''},${st.lower_quartile ?? ''},${st.median ?? ''},${st.mean ?? ''},${st.upper_quartile ?? ''},${st.max ?? ''}`,
    );
  }
  addText(ctx, '', 'Grades.csv', rows.join('\n'));
}

export async function exportGradingWeights(ctx: CourseExport): Promise<void> {
  const groups = await ctx.canvas.list<{ name?: string; group_weight?: number }>(
    `/courses/${ctx.courseId}/assignment_groups`,
  );
  if (!groups.some((g) => Number(g.group_weight) > 0)) return;
  ctx.gradingWeights = groups.map((g) => ({
    name: g.name ?? '',
    weight: Number(g.group_weight) || 0,
  }));
  let body = '<table><thead><tr><th>Group</th><th>Weight</th></tr></thead><tbody>';
  let total = 0;
  for (const g of groups) {
    total += Number(g.group_weight) || 0;
    body += `<tr><td>${escapeHtml(g.name ?? '')}</td><td>${fmtPoints(g.group_weight) || 0}%</td></tr>`;
  }
  body += `<tr><th>Total</th><th>${fmtPoints(total)}%</th></tr></tbody></table>`;
  addDocument(ctx, {
    title: `Grading Weights — ${ctx.courseName}`,
    bodyHtml: body,
    stem: 'Grading Weights',
    folder: '',
  });
}
