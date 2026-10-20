// Course content every role can see: files, pages, assignments, announcements,
// discussions, modules and the syllabus.
import { CanvasError } from '../../canvas/client';
import { formatDate } from '../../export/format';
import { cleanCanvasHtml } from '../../export/html';
import {
  addCanvasFile,
  addDocument,
  addText,
  attempt,
  courseUrl,
  noteNotCaptured,
  type CanvasFile,
  type CourseExport,
  type ModuleOutline,
} from '../context';
import { extractLinkedFiles } from '../linked';
import { csvRow, escapeHtml, renderRubricDefinition, type RubricCriterion } from '../render';

export interface Assignment {
  id: string | number;
  name: string;
  description?: string;
  due_at?: string;
  points_possible?: number;
  submission_types?: string[];
  rubric?: RubricCriterion[];
}

const linked = async (ctx: CourseExport, html: string | undefined, source: string) => {
  if (ctx.options.contentTypes.linkedFiles && html) await extractLinkedFiles(ctx, html, source);
};

/** Returns how many files the Files list had, saved or not. */
export async function exportFiles(ctx: CourseExport): Promise<number> {
  const folders = await ctx.canvas.list<{ id: string | number; full_name?: string; name?: string }>(
    `/courses/${ctx.courseId}/folders`,
  );
  const pathById = new Map(folders.map((f) => [String(f.id), f.full_name || f.name || '']));
  const files = await ctx.canvas.list<CanvasFile>(`/courses/${ctx.courseId}/files`);
  for (const file of files) {
    let folder = pathById.get(String(file.folder_id)) ?? '';
    if (folder.startsWith('course files')) folder = folder.slice('course files'.length);
    folder = folder.replace(/^\//, '');
    if (folder && !folder.endsWith('/')) folder += '/';
    // Locked files are listed without a url; report them instead of saving a Canvas page.
    if (!file.url) {
      ctx.inaccessibleFileIds.add(String(file.id));
      noteNotCaptured(ctx, {
        source: 'Files',
        text: file.display_name ?? '',
        url: courseUrl(ctx, `files/${file.id}`),
        status: file.locked_for_user ? 'locked' : 'no-url',
      });
      continue;
    }
    addCanvasFile(ctx, file, `Files/${folder}`, file.display_name ?? `file_${file.id}`);
  }
  return files.length;
}

/** Slugs from the Pages list. Module-only pages are added while exporting modules. */
export async function listPageSlugs(ctx: CourseExport, slugs: Set<string>): Promise<void> {
  const pages = await ctx.canvas.list<{ url?: string }>(`/courses/${ctx.courseId}/pages`);
  for (const p of pages) if (p.url) slugs.add(p.url);
}

export async function exportAssignmentDocs(
  ctx: CourseExport,
  assignments: Assignment[],
): Promise<void> {
  for (const a of assignments) {
    let body = '';
    if (a.due_at) body += `<p><strong>Due:</strong> ${formatDate(a.due_at)}</p>`;
    if (a.description) {
      body += `<div>${cleanCanvasHtml(a.description)}</div>`;
      await linked(ctx, a.description, `Assignment: ${a.name}`);
    }
    body += renderRubricDefinition(a.rubric);
    addDocument(ctx, {
      title: a.name,
      bodyHtml: body,
      stem: a.name,
      folder: 'Assignments/',
      canvasUrls: [courseUrl(ctx, `assignments/${a.id}`)],
      ...(a.due_at ? { dueAt: a.due_at } : {}),
      ...(a.points_possible != null ? { points: a.points_possible } : {}),
    });
  }
}

interface Topic {
  id: string | number;
  title: string;
  message?: string;
  posted_at?: string;
  user_name?: string;
  is_announcement?: boolean;
  assignment_id?: string | number;
}

export async function exportAnnouncements(ctx: CourseExport): Promise<number> {
  const announcements = await ctx.canvas.list<Topic>(`/courses/${ctx.courseId}/discussion_topics`, {
    only_announcements: 'true',
  });
  for (const a of announcements) {
    let body = '';
    if (a.posted_at) body += `<p><strong>Posted:</strong> ${formatDate(a.posted_at)}</p>`;
    if (a.message) {
      body += `<div>${cleanCanvasHtml(a.message)}</div>`;
      await linked(ctx, a.message, `Announcement: ${a.title}`);
    }
    addDocument(ctx, {
      title: a.title,
      bodyHtml: body,
      stem: a.title,
      folder: 'Announcements/',
      canvasUrls: [
        courseUrl(ctx, `discussion_topics/${a.id}`),
        courseUrl(ctx, `announcements/${a.id}`),
      ],
    });
  }
  return announcements.length;
}

interface ThreadEntry {
  user_id?: string | number;
  created_at?: string;
  message?: string;
  deleted?: boolean;
  attachment?: CanvasFile;
  attachments?: CanvasFile[];
  replies?: ThreadEntry[];
}

export async function exportDiscussions(ctx: CourseExport): Promise<number> {
  const topics = (
    await ctx.canvas.list<Topic>(`/courses/${ctx.courseId}/discussion_topics`)
  ).filter((d) => !d.is_announcement);

  const renderEntries = async (
    entries: ThreadEntry[] | undefined,
    names: Map<string, string>,
    topicTitle: string,
    attachmentFolder: string,
    depth = 0,
  ): Promise<string> => {
    if (!Array.isArray(entries) || entries.length === 0) return '';
    let html = `<ul class="discussion-replies" style="list-style:none;margin:0;padding-left:${depth ? 24 : 0}px;border-left:${depth ? '2px solid #ddd' : 'none'}">`;
    for (const e of entries) {
      const author = names.get(String(e.user_id)) || 'Unknown user';
      const when = e.created_at ? formatDate(e.created_at) : '';
      const message = e.deleted ? '<em>[deleted]</em>' : cleanCanvasHtml(e.message ?? '');
      html += `<li style="margin:12px 0"><p style="margin:0 0 4px"><strong>${author}</strong>${when ? ` · <span style="color:#666">${when}</span>` : ''}</p><div>${message}</div>`;
      await linked(ctx, e.message, `Discussion reply: ${topicTitle}`);
      for (const att of e.attachments ?? (e.attachment ? [e.attachment] : [])) {
        addCanvasFile(
          ctx,
          att,
          attachmentFolder,
          att.display_name || att.filename || `attachment_${att.id}`,
        );
      }
      ctx.counts.discussionReplies++;
      html += await renderEntries(e.replies, names, topicTitle, attachmentFolder, depth + 1);
      html += '</li>';
    }
    return html + '</ul>';
  };

  for (const d of topics) {
    let body = '';
    if (d.user_name) body += `<p><strong>Author:</strong> ${d.user_name}</p>`;
    if (d.posted_at) body += `<p><strong>Posted:</strong> ${formatDate(d.posted_at)}</p>`;
    if (d.message) {
      body += `<div>${cleanCanvasHtml(d.message)}</div>`;
      await linked(ctx, d.message, `Discussion: ${d.title}`);
    }

    // The reply thread fails soft (e.g. "post before seeing replies"): the opening post is still exported.
    try {
      const view = await ctx.canvas.get<{
        participants?: { id: string | number; display_name?: string; name?: string }[];
        view?: ThreadEntry[];
      }>(`/courses/${ctx.courseId}/discussion_topics/${d.id}/view`);
      const names = new Map(
        (view.participants ?? []).map((p) => [String(p.id), p.display_name || p.name || '']),
      );
      const replies = await renderEntries(view.view, names, d.title, `Discussions/${d.title}/`);
      if (replies) body += `<hr><h3>Replies</h3>${replies}`;
    } catch (error) {
      if (error instanceof CanvasError && (error.kind === 'session' || error.kind === 'aborted'))
        throw error;
    }

    if (ctx.isTeacher && ctx.studentWork && d.assignment_id) {
      await attempt(
        ctx,
        `Discussion grades: ${d.title}`,
        courseUrl(ctx, `assignments/${d.assignment_id}`),
        async () => {
          const subs = await ctx.canvas.list<{
            user_id?: string | number;
            user?: { sortable_name?: string; name?: string };
            score?: number;
            grade?: string;
            submitted_at?: string;
            workflow_state?: string;
          }>(`/courses/${ctx.courseId}/assignments/${d.assignment_id}/submissions`, {
            'include[]': 'user',
          });
          const graded = subs.filter(
            (s) => s.score != null || s.grade != null || s.workflow_state === 'graded',
          );
          if (!graded.length) return;
          const rows = [
            csvRow(['Student', 'Section', 'Score', 'Grade', 'Submitted At', 'Workflow State']),
          ];
          for (const s of graded) {
            rows.push(
              csvRow([
                s.user?.sortable_name || s.user?.name || `user_${s.user_id}`,
                ctx.sectionByUserId.get(String(s.user_id)) ?? '',
                s.score ?? '',
                s.grade ?? '',
                s.submitted_at ? formatDate(s.submitted_at) : '',
                s.workflow_state ?? '',
              ]),
            );
          }
          addText(ctx, `Discussions/${d.title}/`, '_grades.csv', rows.join('\n'));
          body += `<p><em>Graded discussion — per-student scores in <code>${escapeHtml(d.title)}/_grades.csv</code>.</em></p>`;
        },
      );
    }

    addDocument(ctx, {
      title: d.title,
      bodyHtml: body,
      stem: d.title,
      folder: 'Discussions/',
      canvasUrls: [
        courseUrl(ctx, `discussion_topics/${d.id}`),
        courseUrl(ctx, `discussions/${d.id}`),
      ],
    });
  }
  return topics.length;
}

interface ModuleItem {
  id?: string | number;
  title: string;
  type: string;
  html_url?: string;
  url?: string;
  page_url?: string;
  content_id?: string | number;
  external_url?: string;
}

/** Modules.html, module-only File items, and the slugs of pages that only appear in modules. */
export async function exportModules(ctx: CourseExport, pageSlugs: Set<string>): Promise<number> {
  const modules = await ctx.canvas.list<{ id: string | number; name: string }>(
    `/courses/${ctx.courseId}/modules`,
  );
  const resourcePath: Record<string, string> = {
    Assignment: 'assignments',
    Discussion: 'discussion_topics',
    File: 'files',
    Quiz: 'quizzes',
  };
  let body = '';
  for (const mod of modules) {
    body += `<h2>${mod.name}</h2><ul>`;
    const items = await ctx.canvas.list<ModuleItem>(
      `/courses/${ctx.courseId}/modules/${mod.id}/items`,
    );
    const outlineItems: ModuleOutline['items'] = [];
    ctx.outline.push({ name: mod.name, items: outlineItems });
    for (const item of items) {
      body += `<li>${item.html_url ? `<a href="${item.html_url}">${item.title}</a>` : item.title} (${item.type})</li>`;
      const target =
        item.type === 'Page' && item.page_url
          ? courseUrl(ctx, `pages/${item.page_url}`)
          : item.type === 'ExternalUrl'
            ? item.external_url
            : item.content_id && resourcePath[item.type]
              ? courseUrl(ctx, `${resourcePath[item.type]}/${item.content_id}`)
              : undefined;
      outlineItems.push({ title: item.title, type: item.type, ...(target ? { url: target } : {}) });

      // A link to the module item should open what the item shows.
      if (item.id) {
        const itemUrl = courseUrl(ctx, `modules/items/${item.id}`);
        if (item.type === 'Page' && item.page_url)
          ctx.aliases.set(itemUrl, courseUrl(ctx, `pages/${item.page_url}`));
        else if (item.content_id && resourcePath[item.type]) {
          ctx.aliases.set(itemUrl, courseUrl(ctx, `${resourcePath[item.type]}/${item.content_id}`));
        }
      }

      if (item.type === 'Page') {
        // Some instances leave page_url out of module items; the slug is in the URLs too.
        const slug =
          item.page_url ||
          [item.url, item.html_url]
            .map((u) => /\/pages\/([^/?#]+)/.exec(u ?? '')?.[1])
            .map((s) => (s ? decodeURIComponent(s) : undefined))
            .find(Boolean);
        if (slug) pageSlugs.add(slug);
      }

      if (item.type === 'File' && item.url) {
        try {
          const data = await ctx.canvas.get<CanvasFile>(item.url);
          if (!data.url) {
            ctx.inaccessibleFileIds.add(String(data.id));
            noteNotCaptured(ctx, {
              source: `Module: ${mod.name}`,
              text: item.title,
              url: item.html_url ?? item.url,
              status: data.locked_for_user ? 'locked' : 'no-url',
            });
            continue;
          }
          addCanvasFile(ctx, data, `Modules/${mod.name}/`, data.display_name || item.title);
        } catch (error) {
          if (
            error instanceof CanvasError &&
            (error.kind === 'session' || error.kind === 'aborted')
          )
            throw error;
        }
      }
    }
    body += '</ul>';
  }
  addDocument(ctx, {
    title: 'Modules',
    bodyHtml: body,
    stem: 'Modules',
    folder: '',
    canvasUrls: [
      courseUrl(ctx, 'modules'),
      ...modules.map((m) => courseUrl(ctx, `modules/${m.id}`)),
    ],
  });
  return modules.length;
}

/**
 * Page bodies for every slug, from the Pages list and from modules. Bodies are
 * fetched even with Pages off, because the slides linked inside module pages
 * are what make an export useful; the page documents need Pages on.
 */
export async function exportPages(ctx: CourseExport, slugs: Set<string>): Promise<void> {
  for (const slug of slugs) {
    let page: { url: string; title: string; body?: string };
    try {
      page = await ctx.canvas.get(`/courses/${ctx.courseId}/pages/${slug}`);
    } catch (error) {
      if (error instanceof CanvasError && (error.kind === 'session' || error.kind === 'aborted'))
        throw error;
      continue;
    }
    if (ctx.options.contentTypes.pages) {
      addDocument(ctx, {
        title: page.title,
        bodyHtml: cleanCanvasHtml(page.body ?? ''),
        stem: page.url,
        folder: 'Pages/',
        canvasUrls: [courseUrl(ctx, `pages/${page.url}`)],
      });
      ctx.counts.pages++;
    }
    await linked(ctx, page.body, `Page: ${page.title}`);
  }
}

export async function exportSyllabus(
  ctx: CourseExport,
  syllabusBody: string | undefined,
): Promise<void> {
  if (!syllabusBody) return;
  await linked(ctx, syllabusBody, 'Syllabus');
  addDocument(ctx, {
    title: `Syllabus — ${ctx.courseName}`,
    bodyHtml: cleanCanvasHtml(syllabusBody),
    stem: 'Syllabus',
    folder: '',
    canvasUrls: [courseUrl(ctx, 'assignments/syllabus')],
  });
}
