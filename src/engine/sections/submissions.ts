// Submissions: a student's own work, or every student's work for a teacher.
import { CanvasError } from '../../canvas/client';
import { formatDate } from '../../export/format';
import { cleanCanvasHtml } from '../../export/html';
import type { MediaRef } from '../../export/media';
import {
  addCanvasFile,
  addDocument,
  addText,
  type CanvasFile,
  type CourseExport,
} from '../context';
import { extractLinkedFiles, resolveMedia } from '../linked';
import { csvRow, escapeHtml, renderRubricAssessment } from '../render';
import type { Assignment } from './content';

// Assignments with none of these types are graded on paper or in class; their
// scores are already in the grades CSV.
const ONLINE_TYPES = new Set([
  'online_text_entry',
  'online_upload',
  'online_url',
  'media_recording',
  'student_annotation',
  'discussion_topic',
]);

interface MediaComment {
  media_id?: string | number;
  url?: string;
  display_name?: string;
}

interface Attempt {
  attempt?: number;
  submitted_at?: string;
  score?: number;
  grade?: string;
  late?: boolean;
  body?: string;
  url?: string;
  attachments?: CanvasFile[];
  media_comment?: MediaComment;
}

interface Submission extends Attempt {
  user_id?: string | number;
  user?: { sortable_name?: string; name?: string };
  workflow_state?: string;
  missing?: boolean;
  submission_history?: Attempt[];
  submission_comments?: {
    author_name?: string;
    created_at?: string;
    attempt?: number;
    comment?: string;
    media_comment?: MediaComment;
  }[];
  rubric_assessment?: Record<string, { points?: number; comments?: string }>;
}

const SUBMISSION_INCLUDES = {
  'include[]': ['user', 'submission_comments', 'submission_history', 'rubric_assessment'],
};

const mediaRef = (mc: MediaComment | undefined): MediaRef | null =>
  mc?.media_id
    ? {
        kind: 'media',
        id: String(mc.media_id),
        ref: mc.url ?? '',
        params: {},
        title: mc.display_name ?? '',
      }
    : null;

const fatal = (error: unknown) =>
  error instanceof CanvasError && (error.kind === 'session' || error.kind === 'aborted');

/**
 * Writes one submission into `folder`: every attempt's files (prefixed
 * "Attempt N - " when there are several), media recordings, and a page with each
 * attempt's grade and text, the rubric assessment and the comment thread.
 * Returns false when the student never submitted anything.
 */
async function renderSubmission(
  ctx: CourseExport,
  a: Assignment,
  s: Submission,
  folder: string,
  student: string,
  section: string,
) {
  const history = s.submission_history?.length ? s.submission_history : [s];
  const attempts = history.filter(
    (h) => h.submitted_at || h.attachments?.length || h.body || h.url || h.media_comment,
  );
  if (attempts.length === 0) return false;
  const multi = attempts.length > 1;
  const label = (h: Attempt) => (multi ? `Attempt ${h.attempt ?? '?'} - ` : '');
  const source = `Submission: ${a.name} — ${student}`;

  for (const h of attempts) {
    const ref = mediaRef(h.media_comment);
    if (ref) await resolveMedia(ctx, ref, source, folder, label(h));
    for (const att of h.attachments ?? []) {
      addCanvasFile(
        ctx,
        att,
        folder,
        `${label(h)}${att.display_name || att.filename || `attachment_${att.id}`}`,
      );
    }
  }

  let body = `<p><strong>Student:</strong> ${escapeHtml(student)}${section ? ` · ${escapeHtml(section)}` : ''}</p>`;
  body += `<p><strong>Status:</strong> ${escapeHtml(s.workflow_state || '—')}</p>`;
  for (const h of attempts) {
    if (multi) body += `<h3>Attempt ${escapeHtml(String(h.attempt ?? '?'))}</h3>`;
    if (h.submitted_at) body += `<p><strong>Submitted:</strong> ${formatDate(h.submitted_at)}</p>`;
    if (h.score != null || h.grade != null) {
      body += `<p><strong>Grade:</strong> ${escapeHtml(String(h.grade ?? ''))} (${h.score ?? ''} / ${a.points_possible ?? '—'})${h.late ? ' · <em>late</em>' : ''}</p>`;
    }
    if (h.body) {
      body += `<div>${cleanCanvasHtml(h.body)}</div>`;
      if (ctx.options.contentTypes.linkedFiles) await extractLinkedFiles(ctx, h.body, source);
    }
    if (h.url)
      body += `<p><strong>Submitted URL:</strong> <a href="${escapeHtml(h.url)}">${escapeHtml(h.url)}</a></p>`;
    const names = (h.attachments ?? [])
      .map((att) => att.display_name || att.filename)
      .filter(Boolean);
    if (names.length)
      body += `<p><strong>Files:</strong> ${names.map((n) => escapeHtml(label(h) + n)).join(', ')}</p>`;
    if (h.media_comment) {
      const queued = h.media_comment.media_id
        ? ctx.mediaById.get(String(h.media_comment.media_id))
        : undefined;
      const name = queued
        ? queued.name
        : h.media_comment.display_name || `media ${h.media_comment.media_id ?? ''}`;
      body += `<p><strong>Media submission:</strong> ${queued ? `<a href="${escapeHtml(name)}">${escapeHtml(name)}</a>` : escapeHtml(name)}${queued ? '' : ' <em>(could not be downloaded)</em>'}</p>`;
    }
  }
  body += renderRubricAssessment(a.rubric, s.rubric_assessment);

  const comments = s.submission_comments ?? [];
  if (comments.length) {
    body += '<h3>Comments</h3><ul>';
    for (const c of comments) {
      let text = cleanCanvasHtml(c.comment ?? '');
      // Audio or video feedback is a media comment without text; save it next to the work.
      const ref = mediaRef(c.media_comment);
      if (ref) {
        const author = (c.author_name || 'comment').substring(0, 40);
        const queued = await resolveMedia(
          ctx,
          ref,
          `Submission comment: ${a.name} — ${student}`,
          folder,
          `Comment - ${author} - `,
        );
        const name = queued ? queued.name : c.media_comment?.display_name || 'media comment';
        text += `${text ? ' ' : ''}${queued ? `<a href="${escapeHtml(name)}">${escapeHtml(name)}</a>` : `<em>${escapeHtml(name)} (could not be downloaded)</em>`}`;
      }
      body += `<li><strong>${escapeHtml(c.author_name || 'Unknown')}</strong>${c.created_at ? ` · ${formatDate(c.created_at)}` : ''}${c.attempt ? ` · attempt ${c.attempt}` : ''}: ${text}</li>`;
    }
    body += '</ul>';
  }
  addDocument(ctx, {
    title: `${a.name} — ${student}`,
    bodyHtml: body,
    stem: student || 'submission',
    folder,
  });
  return true;
}

export async function exportOwnSubmissions(
  ctx: CourseExport,
  assignments: Assignment[],
): Promise<void> {
  for (const a of assignments) {
    if (!(a.submission_types ?? []).some((t) => ONLINE_TYPES.has(t))) continue;
    let s: Submission;
    try {
      s = await ctx.canvas.get<Submission>(
        `/courses/${ctx.courseId}/assignments/${a.id}/submissions/self`,
        SUBMISSION_INCLUDES,
      );
    } catch (error) {
      if (fatal(error)) throw error;
      continue;
    }
    const student = s.user?.sortable_name || s.user?.name || 'You';
    if (await renderSubmission(ctx, a, s, `Submissions/${a.name}/`, student, ''))
      ctx.counts.studentSubmissions++;
  }
}

export async function exportAllSubmissions(
  ctx: CourseExport,
  assignments: Assignment[],
): Promise<void> {
  for (const a of assignments) {
    if (!(a.submission_types ?? []).some((t) => ONLINE_TYPES.has(t))) continue;
    const subs = await ctx.canvas.list<Submission>(
      `/courses/${ctx.courseId}/assignments/${a.id}/submissions`,
      SUBMISSION_INCLUDES,
    );
    if (subs.length === 0) continue;
    const rows = [
      csvRow(['Student', 'Section', 'Status', 'Submitted At', 'Score', 'Grade', 'Late', 'Missing']),
    ];
    let anySubmitted = false;
    for (const s of subs) {
      const student = s.user?.sortable_name || s.user?.name || `user_${s.user_id}`;
      const section = ctx.sectionByUserId.get(String(s.user_id)) ?? '';
      rows.push(
        csvRow([
          student,
          section,
          s.workflow_state ?? '',
          s.submitted_at ? formatDate(s.submitted_at) : '',
          s.score ?? '',
          s.grade ?? '',
          s.late ? 'yes' : '',
          s.missing ? 'yes' : '',
        ]),
      );
      if (
        await renderSubmission(ctx, a, s, `Submissions/${a.name}/${student}/`, student, section)
      ) {
        anySubmitted = true;
        ctx.counts.studentSubmissions++;
      }
    }
    if (anySubmitted) addText(ctx, `Submissions/${a.name}/`, '_grades.csv', rows.join('\n'));
  }
}
