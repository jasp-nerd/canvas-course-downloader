// Small HTML builders for exported documents: rubrics, quizzes and CSV cells.
// The markup matches v2's so exports stay the same.
import { cleanCanvasHtml } from '../export/html';

/** Values that print sensibly in an export; objects never should. */
export type Scalar = string | number | boolean | null | undefined;

export function escapeHtml(value: Scalar): string {
  return String(value ?? '').replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!,
  );
}

/** A points value without a redundant ".0". */
export function fmtPoints(value: Scalar): string {
  if (value == null || value === '') return '';
  const n = Number(value);
  return Number.isNaN(n) ? String(value) : String(n);
}

/** One CSV cell, quoted. */
export const csvCell = (value: Scalar) => `"${String(value ?? '').replace(/"/g, '""')}"`;
export const csvRow = (values: Scalar[]) => values.map(csvCell).join(',');

export interface RubricCriterion {
  id?: string;
  description?: string;
  long_description?: string;
  points?: number;
  criterion_use_range?: boolean;
  ratings?: { points?: number; description?: string; long_description?: string }[];
}

/** "high to >low" for range criteria, where low is the next lower tier (exclusive). */
export function ratingPointsLabel(
  points: number | undefined,
  allPoints: (number | undefined)[],
  useRange: boolean,
): string {
  if (points == null) return '';
  const p = Number(points);
  if (!useRange || Number.isNaN(p)) return fmtPoints(points);
  const lowers = allPoints.filter((x) => x != null && Number(x) < p).map(Number);
  const low = lowers.length ? Math.max(...lowers) : 0;
  return `${fmtPoints(p)} to >${fmtPoints(low)}`;
}

export function renderRubricDefinition(rubric: RubricCriterion[] | undefined): string {
  if (!Array.isArray(rubric) || rubric.length === 0) return '';
  let html =
    '<h3>Rubric</h3><table><thead><tr><th>Criterion</th><th>Points</th><th>Rating tiers</th></tr></thead><tbody>';
  for (const crit of rubric) {
    const useRange = !!crit.criterion_use_range;
    const allPoints = (crit.ratings ?? []).map((r) => r.points);
    const tiers = (crit.ratings ?? [])
      .map(
        (r) =>
          `<div><strong>${escapeHtml(ratingPointsLabel(r.points, allPoints, useRange))}</strong>: ${escapeHtml(r.description ?? '')}${r.long_description ? ` — ${escapeHtml(r.long_description)}` : ''}</div>`,
      )
      .join('');
    html += `<tr><td><strong>${escapeHtml(crit.description ?? '')}</strong>${crit.long_description ? `<div>${escapeHtml(crit.long_description)}</div>` : ''}</td><td>${fmtPoints(crit.points)}</td><td>${tiers}</td></tr>`;
  }
  return html + '</tbody></table>';
}

export function renderRubricAssessment(
  rubric: RubricCriterion[] | undefined,
  assessment: Record<string, { points?: number; comments?: string }> | undefined,
): string {
  if (!assessment || !Array.isArray(rubric) || rubric.length === 0) return '';
  let html =
    '<h3>Rubric assessment</h3><table><thead><tr><th>Criterion</th><th>Points</th><th>Comments</th></tr></thead><tbody>';
  for (const crit of rubric) {
    const a = assessment[crit.id ?? ''] ?? {};
    const pts = a.points != null ? `${fmtPoints(a.points)} / ${fmtPoints(crit.points)}` : '—';
    html += `<tr><td>${escapeHtml(crit.description ?? '')}</td><td>${pts}</td><td>${escapeHtml(a.comments ?? '')}</td></tr>`;
  }
  return html + '</tbody></table>';
}

export interface QuizQuestion {
  question_text?: string;
  points_possible?: number;
  answers?: { id?: unknown; weight?: number; html?: string; text?: string; correct?: boolean }[];
}

/** Teacher view: the question bank with correct answers marked. */
export function renderQuizQuestions(questions: QuizQuestion[]): string {
  if (!Array.isArray(questions) || questions.length === 0) return '';
  let html = '<h3>Questions &amp; answer key</h3>';
  questions.forEach((q, i) => {
    html += `<div class="quiz-question"><p><strong>Q${i + 1}.</strong> (${fmtPoints(q.points_possible)} pts) ${cleanCanvasHtml(q.question_text ?? '')}</p>`;
    const answers = q.answers ?? [];
    if (answers.length) {
      html += '<ul>';
      for (const ans of answers) {
        const correct = Number(ans.weight) > 0;
        const text = ans.html ? cleanCanvasHtml(ans.html) : escapeHtml(ans.text ?? '');
        html += `<li>${correct ? '<strong>✓ </strong>' : ''}${text}${correct ? ' <em>(correct)</em>' : ''}</li>`;
      }
      html += '</ul>';
    }
    html += '</div>';
  });
  return html;
}

/** Student view: their own answers, when the instructor allows it. */
export function renderOwnQuizAnswers(questions: QuizQuestion[]): string {
  if (!Array.isArray(questions) || questions.length === 0) return '';
  let html = '<h3>Your answers</h3>';
  questions.forEach((q, i) => {
    html += `<div class="quiz-question"><p><strong>Q${i + 1}.</strong> ${cleanCanvasHtml(q.question_text ?? '')}</p>`;
    const answers = (q.answers ?? []).filter((a) => a.id != null);
    if (answers.length) {
      html += '<ul>';
      for (const ans of answers) {
        const text = ans.html ? cleanCanvasHtml(ans.html) : escapeHtml(ans.text ?? '');
        const mark =
          ans.correct === true
            ? ' <em>(correct)</em>'
            : ans.correct === false
              ? ' <em>(incorrect)</em>'
              : '';
        html += `<li>${text}${mark}</li>`;
      }
      html += '</ul>';
    }
    html += '</div>';
  });
  return html;
}

/**
 * The quiz review page, scraped. Canvas refuses the quiz-submission API for
 * concluded courses, but the review page still opens for the student.
 */
export function renderQuizReviewPage(pageHtml: string): string | null {
  const doc = new DOMParser().parseFromString(pageHtml, 'text/html');
  const questionsEl = doc.querySelector('#questions');
  if (!questionsEl || questionsEl.querySelectorAll('.question').length === 0) return null;
  let html = '';
  for (const sel of ['.quiz-submission-data', '.submission_details', '.quiz_score']) {
    const text = doc.querySelector(sel)?.textContent?.replace(/\s+/g, ' ').trim();
    if (text) {
      html += `<p>${escapeHtml(text)}</p>`;
      break;
    }
  }
  questionsEl.querySelectorAll('.question').forEach((q, i) => {
    const qTextEl = q.querySelector('.question_text');
    const ptsEl = q.querySelector('.user_points, .points_awarded');
    const pts = ptsEl ? ` · ${escapeHtml(ptsEl.textContent?.trim())}` : '';
    const qText = qTextEl ? cleanCanvasHtml(qTextEl.innerHTML) : '';
    html += `<div class="quiz-question"><p><strong>Q${i + 1}${pts}.</strong> ${qText}</p>`;
    const answers = [...q.querySelectorAll('.answer')];
    if (answers.length) {
      // Without any .correct_answer on the page the instructor hid correctness,
      // so a selected answer must not be shown as wrong.
      const showsCorrectness = answers.some((a) => a.classList.contains('correct_answer'));
      html += '<ul>';
      for (const ans of answers) {
        const selected = ans.classList.contains('selected_answer');
        const correct = ans.classList.contains('correct_answer');
        const htmlEl = ans.querySelector('.answer_html');
        const textEl = ans.querySelector('.answer_text');
        const source = htmlEl?.innerHTML.trim() ? htmlEl.innerHTML : (textEl?.innerHTML ?? null);
        const text = source
          ? cleanCanvasHtml(source)
              .replace(/<\/?p[^>]*>/gi, ' ')
              .trim()
          : escapeHtml(ans.textContent?.trim());
        let prefix = '';
        let style = '';
        if (selected && correct) {
          prefix = '✓ ';
          style = ' style="color:#16a34a;font-weight:600"';
        } else if (selected && showsCorrectness) {
          prefix = '✗ ';
          style = ' style="color:#dc2626;font-weight:600"';
        } else if (selected) {
          prefix = '• ';
          style = ' style="font-weight:600"';
        } else if (correct) {
          prefix = '◇ ';
          style = ' style="color:#16a34a"';
        }
        html += `<li${style}>${prefix}${text}</li>`;
      }
      html += '</ul>';
    } else {
      const response = q.querySelector('.quiz_response_text, .user_content');
      if (response)
        html += `<p><strong>Your answer:</strong> ${cleanCanvasHtml(response.innerHTML)}</p>`;
    }
    html += '</div>';
  });
  return html;
}
