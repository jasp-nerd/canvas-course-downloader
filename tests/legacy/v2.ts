// Loads v2.11.0's helper functions (legacy/v2/helpers.js, plus the vendored
// Turndown it used) into the current jsdom test environment, so v3 functions
// can be checked against v2's actual behaviour on the same inputs.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { runInThisContext } from 'node:vm';

const LEGACY = path.resolve(import.meta.dirname, '../../legacy/v2');
const read = (file: string) => readFileSync(path.join(LEGACY, file), 'utf8');

export interface V2Helpers {
  sanitizeFilename(name: string | null | undefined): string;
  sanitizeHtml(html: string): string;
  cleanCanvasHtml(html: string): string;
  convertLocalMediaEmbeds(html: string): string;
  rewriteCanvasLinks(html: string, urlMap: Map<string, string>, fromPath: string): string;
  relativePathToCourseRoot(filePath: string): string;
  relativeUrlFromTo(fromPath: string, toPath: string): string;
  htmlToMarkdown(html: string): string;
  formatDate(iso: string | null | undefined): string;
  parsePaginationLink(header: string | null): string | null;
  toHtmlDataUri(title: string, body: string, filePath?: string): string;
  toMarkdownDataUri(title: string, body: string): string;
  FALLBACK_EXPORT_CSS: string;
  extractMediaRefs(html: string): unknown[];
  pickMediaSource(sources: unknown): unknown;
  mediaFilename(info: unknown, source: unknown, fallbackStem?: string): string;
}

let cached: V2Helpers | undefined;

export function loadV2Helpers(): V2Helpers {
  if (cached) return cached;
  // Each file is wrapped in a function: its top-level declarations stay local, and
  // the wrapper returns what v2 had as globals.
  const load = <T>(source: string, params: string, returns: string, ...args: unknown[]): T =>
    (runInThisContext(`(function (${params}) {\n${source}\nreturn ${returns};\n})`) as (...a: unknown[]) => T)(...args);

  const TurndownService = load<unknown>(read('turndown.min.js'), '', 'TurndownService');
  const turndownPluginGfm = load<unknown>(read('turndown-plugin-gfm.min.js'), '', 'turndownPluginGfm');
  const names: (keyof V2Helpers)[] = [
    'sanitizeFilename', 'sanitizeHtml', 'cleanCanvasHtml', 'convertLocalMediaEmbeds',
    'rewriteCanvasLinks', 'relativePathToCourseRoot', 'relativeUrlFromTo', 'htmlToMarkdown',
    'formatDate', 'parsePaginationLink', 'toHtmlDataUri', 'toMarkdownDataUri', 'FALLBACK_EXPORT_CSS',
    'extractMediaRefs', 'pickMediaSource', 'mediaFilename',
  ];
  cached = load<V2Helpers>(read('helpers.js'), 'TurndownService, turndownPluginGfm', `{ ${names.join(', ')} }`, TurndownService, turndownPluginGfm);
  return cached;
}

/** Decodes the `data:` URIs v2's document builders return. */
export function decodeDataUri(uri: string): string {
  return decodeURIComponent(uri.slice(uri.indexOf(',') + 1));
}
