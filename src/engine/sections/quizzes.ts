// Classic quizzes: details for everyone; teachers also get the answer key and
// every student's score, students their own result and, when allowed, answers.
import { CanvasError } from '../../canvas/client';
import { formatDate } from '../../export/format';
import { cleanCanvasHtml } from '../../export/html';
import { addDocument, addText, courseUrl, type CourseExport } from '../context';
import { extractLinkedFiles } from '../linked';
import {
  csvRow,
  escapeHtml,
  fmtPoints,
  renderOwnQuizAnswers,
  renderQuizQuestions,
  renderQuizReviewPage,
  type QuizQuestion,
} from '../render';

interface Quiz {
  id: string | number;
  title: string;
  html_url?: string;
  quiz_type?: string;
  points_possible?: number;
  question_count?: number;
  due_at?: string;
  time_limit?: number;
  description?: string;
}

interface QuizSubmission {
  id?: string | number;
  user_id?: string | number;
  kept_score?: number;
  score?: number;
  attempt?: number;
  finished_at?: string;
  workflow_state?: string;
}

const fatal = (error: unknown) =>
  error instanceof CanvasError && (error.kind === 'session' || error.kind === 'aborted');

async function teacherSections(ctx: CourseExport, quiz: Quiz, folder: string): Promise<string> {
  let body = '';
  try {
    body += renderQuizQuestions(
      await ctx.canvas.list<QuizQuestion>(`/courses/${ctx.courseId}/quizzes/${quiz.id}/questions`),
    );
  } catch (error) {
    if (fatal(error)) throw error;
  }
  try {
    // A wrapped object ({ quiz_submissions, users }), not a bare list.
    const data = await ctx.canvas.get<{
      quiz_submissions?: QuizSubmission[];
      users?: { id: string | number; sortable_name?: string; name?: string }[];
    }>(`/courses/${ctx.courseId}/quizzes/${quiz.id}/submissions`, {
      per_page: '100',
      'include[]': 'user',
    });
    const subs = data.quiz_submissions ?? [];
    if (!subs.length) return body;
    const fromPayload = new Map(
      (data.users ?? []).map((u) => [String(u.id), u.sortable_name || u.name || '']),
    );
    const nameOf = (id: unknown) =>
      ctx.nameByUserId.get(String(id)) || fromPayload.get(String(id)) || `user_${String(id)}`;
    const sectionOf = (id: unknown) => ctx.sectionByUserId.get(String(id)) ?? '';
    subs.sort(
      (x, y) =>
        sectionOf(x.user_id).localeCompare(sectionOf(y.user_id)) ||
        nameOf(x.user_id).localeCompare(nameOf(y.user_id)),
    );
    let table =
      '<h3>Student scores</h3><table><thead><tr><th>Student</th><th>Section</th><th>Score</th><th>Attempt</th><th>Finished</th></tr></thead><tbody>';
    const csv = [
      csvRow([
        'Student',
        'Section',
        'Score',
        'Points Possible',
        'Attempt',
        'Finished At',
        'Workflow State',
      ]),
    ];
    for (const qs of subs) {
      const score = qs.kept_score ?? qs.score ?? '';
      const finished = qs.finished_at ? formatDate(qs.finished_at) : '';
      table += `<tr><td>${escapeHtml(nameOf(qs.user_id))}</td><td>${escapeHtml(sectionOf(qs.user_id))}</td><td>${score} / ${fmtPoints(quiz.points_possible)}</td><td>${qs.attempt ?? ''}</td><td>${finished}</td></tr>`;
      csv.push(
        csvRow([
          nameOf(qs.user_id),
          sectionOf(qs.user_id),
          score,
          quiz.points_possible ?? '',
          qs.attempt ?? '',
          finished,
          qs.workflow_state ?? '',
        ]),
      );
    }
    addText(ctx, folder, '_grades.csv', csv.join('\n'));
    body += table + '</tbody></table>';
  } catch (error) {
    if (fatal(error)) throw error;
  }
  return body;
}

async function studentResult(ctx: CourseExport, quiz: Quiz): Promise<string> {
  let data: { quiz_submissions?: QuizSubmission[] };
  try {
    data = await ctx.canvas.get(`/courses/${ctx.courseId}/quizzes/${quiz.id}/submissions`, {
      per_page: '100',
    });
  } catch (error) {
    if (fatal(error)) throw error;
    // Concluded courses refuse the API, but the review page still opens.
    if (error instanceof CanvasError && error.status === 403 && quiz.html_url) {
      try {
        return (
          renderQuizReviewPage(
            await ctx.canvas.getHtml(`${quiz.html_url.replace(/\?.*$/, '')}/history`),
          ) ?? ''
        );
      } catch (pageError) {
        if (fatal(pageError)) throw pageError;
      }
    }
    return '';
  }
  const qs = data.quiz_submissions?.[0];
  if (!qs) return '';
  let body = `<h3>Your result</h3><p><strong>Score:</strong> ${qs.kept_score ?? qs.score ?? '—'} / ${fmtPoints(quiz.points_possible)}${qs.attempt ? ` · attempt ${qs.attempt}` : ''}${qs.finished_at ? ` · finished ${formatDate(qs.finished_at)}` : ''}</p>`;
  try {
    const answers = await ctx.canvas.get<{ quiz_submission_questions?: QuizQuestion[] }>(
      `/quiz_submissions/${qs.id}/questions`,
    );
    body += renderOwnQuizAnswers(answers.quiz_submission_questions ?? []);
  } catch (error) {
    if (fatal(error)) throw error;
  }
  return body;
}

export async function exportQuizzes(ctx: CourseExport): Promise<void> {
  const quizzes = await ctx.canvas.list<Quiz>(`/courses/${ctx.courseId}/quizzes`);
  for (const quiz of quizzes) {
    const folder = `Quizzes/${quiz.title}/`;
    const meta: string[] = [];
    if (quiz.quiz_type) meta.push(`<strong>Type:</strong> ${escapeHtml(quiz.quiz_type)}`);
    if (quiz.points_possible != null)
      meta.push(`<strong>Points:</strong> ${fmtPoints(quiz.points_possible)}`);
    if (quiz.question_count != null)
      meta.push(`<strong>Questions:</strong> ${quiz.question_count}`);
    if (quiz.due_at) meta.push(`<strong>Due:</strong> ${formatDate(quiz.due_at)}`);
    if (quiz.time_limit) meta.push(`<strong>Time limit:</strong> ${quiz.time_limit} min`);
    let body = meta.length ? `<p>${meta.join(' · ')}</p>` : '';
    if (quiz.description) {
      body += `<div>${cleanCanvasHtml(quiz.description)}</div>`;
      if (ctx.options.contentTypes.linkedFiles)
        await extractLinkedFiles(ctx, quiz.description, `Quiz: ${quiz.title}`);
    }
    body += ctx.isTeacher
      ? await teacherSections(ctx, quiz, folder)
      : await studentResult(ctx, quiz);
    addDocument(ctx, {
      title: quiz.title,
      bodyHtml: body,
      stem: quiz.title,
      folder,
      canvasUrls: [courseUrl(ctx, `quizzes/${quiz.id}`)],
    });
    ctx.counts.quizzes++;
  }
}
