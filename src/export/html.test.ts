// Canvas content is untrusted. That v3 renders it as v2 did is checked by the golden
// exports (tests/parity); these cases are what v2 got wrong.
import { describe, expect, it } from 'vitest';
import { renderHtmlDocument } from './html';
import { htmlToMarkdown } from './markdown';
import { sanitizeHtml } from './sanitize';

describe('sanitizeHtml', () => {
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

it('escapes the title, which v2 put into the page raw', () => {
  const doc = renderHtmlDocument('Week 1 <b>&</b> "notes"', '', '');
  expect(doc).toContain('<title>Week 1 &lt;b&gt;&amp;&lt;/b&gt; &quot;notes&quot;</title>');
  expect(doc).not.toContain('<b>');
});

it('aligns Markdown table columns', () => {
  expect(
    htmlToMarkdown(
      '<table><tbody><tr><th>Week</th><th>Topic</th></tr><tr><td>1</td><td>Intro</td></tr></tbody></table>',
    ),
  ).toBe('| Week | Topic |\n| --- | --- |\n| 1   | Intro |');
});
