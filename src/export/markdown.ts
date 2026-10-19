import { gfm } from '@joplin/turndown-plugin-gfm';
import TurndownService from 'turndown';
import { sanitizeHtml } from './sanitize';

let service: TurndownService | undefined;

function turndown(): TurndownService {
  if (service) return service;
  service = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  });
  service.use(gfm);
  // Turndown drops elements it has no rule for, which loses every embedded video.
  // Keep a link instead: the local file for downloaded media, else the original URL.
  service.addRule('mediaEmbed', {
    filter: (node) =>
      ['IFRAME', 'VIDEO', 'AUDIO'].includes(node.nodeName) && !!node.getAttribute('src'),
    replacement: (_content, el) => {
      const kind =
        el.nodeName === 'IFRAME' ? 'Embedded content' : el.nodeName === 'VIDEO' ? 'Video' : 'Audio';
      const label = (el.getAttribute('title') ?? '').trim() || kind;
      return `\n\n[${label}](${el.getAttribute('src')})\n\n`;
    },
  });
  return service;
}

export function htmlToMarkdown(html: string): string {
  return turndown().turndown(sanitizeHtml(html));
}

/** A Markdown document: `# Title`, a blank line, then the body. */
export function renderMarkdownDocument(title: string, markdownBody: string): string {
  return `# ${title}\n\n${markdownBody}`;
}
