// Turning Canvas page HTML into standalone documents that work offline.
import { relativeHref } from './paths';
import { sanitizeHtml, sanitizeToFragment, serializeFragment } from './sanitize';

/**
 * Removes the empty markup Canvas's editor leaves behind without merging words:
 * whitespace-only spans (e.g. Apple-converted-space) are unwrapped, keeping their
 * whitespace, and empty paragraphs without media are dropped.
 */
export function cleanCanvasHtml(html: string | null | undefined): string {
  if (!html) return '';
  const root = sanitizeToFragment(html);
  for (const p of root.querySelectorAll('p')) {
    if (!p.textContent?.trim() && !p.querySelector('img, br, hr, svg, video, iframe')) p.remove();
  }
  for (const span of root.querySelectorAll('span')) {
    if (!span.querySelector('*') && !span.textContent?.trim()) {
      span.replaceWith(document.createTextNode(span.textContent ?? ''));
    }
  }
  rewriteYouTubeEmbeds(root);
  neutralizeCanvasPlaceholders(root);
  return serializeFragment(root);
}

/** YouTube refuses to play inside file:// pages, so embeds become thumbnail links. */
function rewriteYouTubeEmbeds(root: DocumentFragment) {
  const iframes = root.querySelectorAll(
    'iframe[src*="youtube.com/embed/"], iframe[src*="youtube-nocookie.com/embed/"]',
  );
  for (const iframe of iframes) {
    const id = /\/embed\/([A-Za-z0-9_-]+)/.exec(iframe.getAttribute('src') ?? '')?.[1];
    if (!id) continue;
    const wrap = document.createElement('div');
    wrap.className = 'yt-embed';
    wrap.setAttribute('data-youtube-id', id);
    const link = document.createElement('a');
    link.href = `https://www.youtube.com/watch?v=${id}`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.title = 'Play on YouTube';
    const img = document.createElement('img');
    img.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    img.alt = `YouTube video ${id}`;
    img.loading = 'lazy';
    link.append(img);
    wrap.append(link);
    iframe.replaceWith(wrap);
  }
}

/** Copied courses keep literal `$CANVAS_OBJECT_REFERENCE$` links that lead nowhere. */
function neutralizeCanvasPlaceholders(root: DocumentFragment) {
  const placeholder = /\$[A-Z][A-Z0-9_-]*\$/;
  for (const el of root.querySelectorAll('[href], [src]')) {
    const href = el.getAttribute('href');
    const src = el.getAttribute('src');
    if (!(href && placeholder.test(href)) && !(src && placeholder.test(src))) continue;
    if (el.tagName === 'A') {
      const span = document.createElement('span');
      span.className = 'canvas-archive-broken';
      span.title = 'Canvas import placeholder, no archived target';
      span.textContent = el.textContent;
      el.replaceWith(span);
      continue;
    }
    if (href && placeholder.test(href)) {
      el.setAttribute('data-broken-href', href);
      el.removeAttribute('href');
    }
    if (src && placeholder.test(src)) {
      el.setAttribute('data-broken-src', src);
      el.removeAttribute('src');
    }
  }
}

/**
 * Canvas media iframes rewritten to a downloaded local file become real
 * <video>/<audio> elements; remote embeds (Studio, Panopto) are left alone.
 */
export function convertLocalMediaEmbeds(html: string): string {
  if (!/<iframe/i.test(html)) return html;
  const root = sanitizeToFragment(html);
  for (const iframe of root.querySelectorAll('iframe[src]')) {
    const src = iframe.getAttribute('src') ?? '';
    if (/^[a-z][a-z0-9+.-]*:/i.test(src) || src.startsWith('/')) continue;
    const file = src.split(/[?#]/)[0] ?? '';
    const isAudio = /\.(mp3|m4a|wav|aac|ogg|oga)$/i.test(file);
    if (!isAudio && !/\.(mp4|webm|m4v|mov|ogv)$/i.test(file)) continue;
    const media = document.createElement(isAudio ? 'audio' : 'video');
    media.setAttribute('controls', '');
    media.setAttribute('preload', 'metadata');
    media.setAttribute('src', src);
    if (!isAudio) media.setAttribute('style', 'max-width:100%;height:auto;');
    const title = iframe.getAttribute('title');
    if (title) media.setAttribute('title', title);
    const link = document.createElement('a');
    link.setAttribute('href', src);
    link.textContent = title || (isAudio ? 'Download audio' : 'Download video');
    media.append(link);
    iframe.replaceWith(media);
  }
  return serializeFragment(root);
}

/**
 * Points links to Canvas items that were exported at their local copies.
 * `localPaths` maps Canvas URLs (or `/files/<id>`, or `media:<id>`) to paths
 * from the course root; anything not in it stays a Canvas link.
 */
export function rewriteCanvasLinks(
  html: string,
  localPaths: Map<string, string>,
  fromFolder: string,
): string {
  if (!html || localPaths.size === 0) return html;
  return html.replace(/(href|src)="([^"]+)"/gi, (match, attr: string, url: string) => {
    const bare = url.split(/[?#]/)[0]!.replace(/\/$/, '');
    const fileUrl = /^(.*\/files\/\d+)(?:\/.*)?$/.exec(bare)?.[1];
    const mediaId = /[?&]entryId=([^&#]+)/.exec(url)?.[1];
    const target =
      localPaths.get(url) ??
      localPaths.get(bare) ??
      (fileUrl && localPaths.get(fileUrl)) ??
      (mediaId && localPaths.get(`media:${decodeURIComponent(mediaId)}`));
    return target ? `${attr}="${relativeHref(fromFolder, target)}"` : match;
  });
}

const escapeText = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** A standalone HTML document that links the export's root styles.css. */
export function renderHtmlDocument(title: string, bodyHtml: string, folder = ''): string {
  const css = folder.split('/').some(Boolean) ? relativeHref(folder, 'styles.css') : './styles.css';
  const safeTitle = escapeText(title);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${safeTitle}</title><link rel="stylesheet" href="${css}"></head><body><h1>${safeTitle}</h1>${sanitizeHtml(bodyHtml)}</body></html>`;
}

/** The stylesheet every HTML export links to. */
export const EXPORT_CSS = `
body { font: 15px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif; max-width: 820px; margin: 32px auto; padding: 0 24px; color: #2d3b45; background: #fff; }
h1, h2, h3, h4 { line-height: 1.3; }
h1 { font-size: 1.6em; border-bottom: 1px solid #e8eaec; padding-bottom: 8px; margin-bottom: 16px; }
a { color: #0374b5; }
img { max-width: 100%; height: auto; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #d7dade; padding: 8px 12px; text-align: left; vertical-align: top; }
th { background: #f5f5f5; }
blockquote { border-left: 4px solid #d7dade; padding: 4px 16px; color: #556; margin: 1em 0; }
code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 0.92em; }
pre { background: #f5f5f5; padding: 12px; border-radius: 6px; overflow-x: auto; }
pre code { background: transparent; padding: 0; }
ul, ol { padding-left: 1.5em; }
hr { border: none; border-top: 1px solid #e8eaec; margin: 2em 0; }
`;
