import { describe, expect, it } from 'vitest';
import { decodeDataUri, loadV2Helpers } from '../../tests/legacy/v2';
import {
  EXPORT_CSS,
  cleanCanvasHtml,
  convertLocalMediaEmbeds,
  renderHtmlDocument,
  rewriteCanvasLinks,
} from './html';
import { htmlToMarkdown, renderMarkdownDocument } from './markdown';
import { sanitizeHtml } from './sanitize';

const v2 = loadV2Helpers();

/** Typical Canvas rich-content HTML. v3 must treat all of it exactly like v2. */
const CANVAS_HTML: Record<string, string> = {
  appleSpace: '<p>Overall<span class="Apple-converted-space"> </span>description</p>',
  emptyParagraphs: '<p></p><p>&nbsp;</p><p>Text</p><p><img src="x.png" alt="a"></p><p><br></p>',
  youtube:
    '<p><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315" allowfullscreen="allowfullscreen"></iframe></p>',
  placeholders:
    '<p><a href="$CANVAS_OBJECT_REFERENCE$/assignments/x">Assignment</a> <img src="$IMS-CC-FILEBASE$/a.png" alt="pic"></p>',
  fileLink:
    '<p><a class="instructure_file_link" title="Slides.pdf" href="https://school.instructure.com/courses/1/files/5?wrap=1" data-api-endpoint="https://school.instructure.com/api/v1/courses/1/files/5" data-api-returntype="File">Slides.pdf</a></p>',
  table:
    '<table><tbody><tr><th>Week</th><th>Topic</th></tr><tr><td>1</td><td>Intro</td></tr></tbody></table>',
  styled:
    '<p style="text-align: center;"><strong>Bold</strong> <em>it</em> <span style="color: #e03e2d;">red</span></p>',
  listsAndLinks:
    '<h2>Plan</h2><ul><li>One</li><li><a href="https://example.com" target="_blank" rel="noopener">Two</a></li></ul><ol><li>A</li></ol>',
  canvasMedia:
    '<p><iframe style="width: 320px; height: 180px;" title="Lecture recording" src="/media_attachments_iframe/123?type=video" data-media-id="m-abc" allow="fullscreen" loading="lazy"></iframe></p>',
  equation:
    '<p><img class="equation_image" title="x^2" src="/equation_images/x%255E2" alt="LaTeX: x^2" data-equation-content="x^2"></p>',
  codeBlock:
    '<pre><code>for (let i = 0; i &lt; 3; i++) {}</code></pre><blockquote><p>Quote</p></blockquote>',
};

describe('cleanCanvasHtml matches v2 on Canvas content', () => {
  it.each(Object.entries(CANVAS_HTML))('%s', (_name, html) => {
    expect(cleanCanvasHtml(html)).toBe(v2.cleanCanvasHtml(html));
  });
});

describe('sanitizeHtml', () => {
  it.each(Object.entries(CANVAS_HTML))('keeps Canvas content %s as v2 did', (_name, html) => {
    expect(sanitizeHtml(html)).toBe(v2.sanitizeHtml(html));
  });

  it.each([
    ['script', '<p>a</p><script>alert(1)</script>'],
    ['event handler', '<img src="x" onerror="alert(1)">'],
    ['javascript: link', '<a href="  javascript:alert(1)">x</a>'],
    ['javascript: iframe', '<iframe src="javascript:alert(1)"></iframe>'],
    ['iframe srcdoc', '<iframe srcdoc="<script>alert(1)</script>"></iframe>'],
    [
      'form action',
      '<form action="https://evil.example"><button formaction="javascript:alert(1)">go</button></form>',
    ],
    ['meta refresh', '<meta http-equiv="refresh" content="0;url=https://evil.example">'],
    ['base href', '<base href="https://evil.example/">'],
    ['svg onload', '<svg onload="alert(1)"><circle r="1"/></svg>'],
    ['mutation XSS', '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>'],
  ])('removes %s, which v2 did not always catch', (_name, html) => {
    const out = sanitizeHtml(html).toLowerCase();
    for (const banned of [
      '<script',
      'onerror',
      'onload',
      'javascript:',
      'srcdoc',
      'formaction',
      '<meta',
      '<base',
      '<form',
    ]) {
      expect(out).not.toContain(banned);
    }
  });
});

describe('links and media', () => {
  const localPaths = new Map([
    ['https://school.instructure.com/courses/1/pages/intro', 'Pages/intro.html'],
    ['https://school.instructure.com/courses/1/files/5', 'Files/Slides.pdf'],
    ['media:m-abc', 'Media/Lecture.mp4'],
  ]);
  const html =
    '<a href="https://school.instructure.com/courses/1/pages/intro">Intro</a>' +
    '<img src="https://school.instructure.com/courses/1/files/5/preview?verifier=x">' +
    '<video src="/courses/1/media_download?entryId=m-abc&type=mp4"></video>' +
    '<a href="https://example.com/elsewhere">Elsewhere</a>';

  it('rewrites Canvas links to local copies like v2', () => {
    expect(rewriteCanvasLinks(html, localPaths, 'Assignments/')).toBe(
      v2.rewriteCanvasLinks(html, localPaths, 'Assignments/'),
    );
  });

  it('turns local media iframes into players like v2', () => {
    const embeds =
      '<iframe src="../Media/Lecture.mp4" title="Lecture"></iframe><iframe src="https://studio.example/x"></iframe><iframe src="audio/a.m4a"></iframe>';
    expect(convertLocalMediaEmbeds(embeds)).toBe(v2.convertLocalMediaEmbeds(embeds));
  });
});

describe('documents', () => {
  it.each([
    ['How to get help', '<p>Office hours are on Tuesdays.</p>', 'Pages/'],
    ['Syllabus', '<h2>Week 1</h2>', ''],
    ['Attempt 2', '<p>x</p>', 'Submissions/Assignment 1/'],
  ])('renders %j like v2', (title, body, folder) => {
    expect(renderHtmlDocument(title, body, folder)).toBe(
      decodeDataUri(v2.toHtmlDataUri(title, body, folder)),
    );
  });

  it('escapes the title, which v2 put into the page raw', () => {
    const doc = renderHtmlDocument('Week 1 <b>&</b> "notes"', '', '');
    expect(doc).toContain('<title>Week 1 &lt;b&gt;&amp;&lt;/b&gt; &quot;notes&quot;</title>');
    expect(doc).not.toContain('<b>');
  });

  it('ships the same stylesheet as v2', () => {
    expect(EXPORT_CSS).toBe(v2.FALLBACK_EXPORT_CSS);
  });
});

describe('Markdown', () => {
  /** v3 aligns table columns (Joplin's GFM plugin); v2 didn't. Everything else must match. */
  const unpadTables = (md: string) =>
    md.replace(/^\|.*\|$/gm, (row) => row.replace(/ {2,}\|/g, ' |'));

  it.each(Object.entries(CANVAS_HTML))('converts %s like v2', (_name, html) => {
    expect(unpadTables(htmlToMarkdown(html))).toBe(v2.htmlToMarkdown(html));
  });

  it('aligns table columns', () => {
    expect(htmlToMarkdown(CANVAS_HTML.table!)).toBe(
      '| Week | Topic |\n| --- | --- |\n| 1   | Intro |',
    );
  });

  it('wraps a body under a title like v2', () => {
    expect(renderMarkdownDocument('Intro', 'Body')).toBe(
      decodeDataUri(v2.toMarkdownDataUri('Intro', 'Body')),
    );
  });
});
