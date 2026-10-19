// The one place Canvas HTML is made safe to save and render. Exports are opened
// from disk (file://), so anything executable in course content must go.
import DOMPurify, { type Config } from 'dompurify';

const CANVAS_CONTENT: Config = {
  // Canvas content embeds video players and slides in iframes; DOMPurify drops them by default.
  ADD_TAGS: ['iframe'],
  ADD_ATTR: ['target', 'allow', 'allowfullscreen', 'frameborder', 'loading'],
  FORBID_TAGS: ['form', 'base', 'meta', 'link', 'noscript'],
  FORBID_ATTR: ['srcdoc', 'formaction', 'action', 'ping'],
};

/** Returns `html` without scripts, event handlers, javascript: URLs or other active content. */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, CANVAS_CONTENT);
}

/** Parses `html` into a sanitized fragment of the current document, for DOM rewriting. */
export function sanitizeToFragment(html: string | null | undefined): DocumentFragment {
  return DOMPurify.sanitize(html ?? '', { ...CANVAS_CONTENT, RETURN_DOM_FRAGMENT: true });
}

/** Serializes a fragment back to HTML. */
export function serializeFragment(fragment: DocumentFragment): string {
  const tpl = document.createElement('template');
  tpl.content.append(fragment);
  return tpl.innerHTML;
}
