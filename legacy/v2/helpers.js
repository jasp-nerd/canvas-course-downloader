/**
 * Canvas Course Downloader — Pure Utility Helpers
 *
 * Stateless utility functions used across the extension.
 * These have no DOM or Chrome API dependencies (except getCanvasBrandColor/darkenColor
 * which read computed styles).
 */

// ---------------------------------------------------------------------------
// Canvas Theme Detection
// ---------------------------------------------------------------------------

const FALLBACK_COLOR = "#e82429";

/** Reads the institution's Canvas brand color from CSS custom properties. */
function getCanvasBrandColor() {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  return (
    style.getPropertyValue("--ic-brand-primary").trim() ||
    style.getPropertyValue("--ic-brand-button--primary-bgd").trim() ||
    style.getPropertyValue("--ic-brand-global-nav-bgd").trim() ||
    FALLBACK_COLOR
  );
}

/** Returns a darker shade of a hex color for hover states. */
function darkenColor(hex, amount = 0.15) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xFF) - Math.round(255 * amount)));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) - Math.round(255 * amount)));
  const b = Math.max(0, Math.min(255, (num & 0xFF) - Math.round(255 * amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// ---------------------------------------------------------------------------
// String & Path Sanitization
// ---------------------------------------------------------------------------

/** Replaces characters that are invalid or problematic in file paths. */
function sanitizeFilename(name) {
  if (!name) return "untitled";
  const cleaned = name
    .replace(/[\u0000-\u001F\u007F]/g, "")                          // control chars
    .replace(/[\u200B-\u200D\uFEFF]/g, "")                          // zero-width chars
    .replace(/\u00A0/g, " ")                                          // non-breaking space
    .replace(/[/\\?%*:|"<>]/g, "-")                                   // OS-reserved chars
    .replace(/^\.+/, "")                                              // leading dots
    .replace(/[. ]+$/, "")                                            // trailing dots/spaces
    .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i, "_$1$2") // Windows reserved names
    .trim();
  return cleaned || "untitled";
}

/**
 * Strips potentially-dangerous markup before saving HTML to disk. Walks the
 * parsed DOM (via `<template>`, which parses inertly — no script execution,
 * no resource loading) rather than using a regex, because nested / oddly-formed
 * markup is the rule with WYSIWYG-edited content, not the exception.
 *
 * Removes: <script>, <noscript>, every `on*` event-handler attribute, and any
 * `href`/`src` whose value uses the `javascript:` pseudo-protocol.
 */
function sanitizeHtml(html) {
  if (!html) return "";
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  for (const el of [...tpl.content.querySelectorAll("script, noscript")]) {
    el.remove();
  }
  for (const el of [...tpl.content.querySelectorAll("*")]) {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on")) {
        el.removeAttribute(attr.name);
        continue;
      }
      if ((name === "href" || name === "src") && /^\s*javascript:/i.test(attr.value)) {
        el.removeAttribute(attr.name);
      }
    }
  }
  return tpl.innerHTML;
}

/**
 * Removes empty-tag litter that Canvas's WYSIWYG editor leaves behind, while
 * preserving any whitespace those tags were holding.
 *
 * Walks the parsed DOM (via `<template>`) rather than regex — earlier regex
 * versions of this function silently ate load-bearing whitespace inside
 * `<span class="Apple-converted-space"> </span>` tags that Apple's pasteboard
 * inserts between words, mashing them together ("Overall description" →
 * "Overalldescription"). The DOM walker handles nesting and attributes
 * robustly and survives every variation we hit in real Canvas content.
 *
 * - Empty paragraphs are removed (their job is vertical spacing, which the
 *   surrounding paragraph layout already provides). Paragraphs containing
 *   inline media (img/br/hr/svg/video/iframe) are kept even with no text.
 * - Whitespace-only spans are unwrapped — the inner whitespace is preserved
 *   as a text node so the surrounding words stay separated.
 */
function cleanCanvasHtml(html) {
  if (!html) return "";
  const tpl = document.createElement("template");
  tpl.innerHTML = html;

  for (const p of [...tpl.content.querySelectorAll("p")]) {
    if (!p.textContent.trim() && !p.querySelector("img, br, hr, svg, video, iframe")) {
      p.remove();
    }
  }

  for (const span of [...tpl.content.querySelectorAll("span")]) {
    if (!span.querySelector("*") && !span.textContent.trim()) {
      span.replaceWith(document.createTextNode(span.textContent));
    }
  }

  rewriteYouTubeEmbeds(tpl.content);
  neutralizeCanvasPlaceholders(tpl.content);

  return tpl.innerHTML;
}

/**
 * YouTube iframes throw error 153 when opened from a file:// origin (the player
 * rejects null origins), so an offline export shows a dead box. Replace each
 * embed with a clickable thumbnail that opens the video on YouTube. Idea from
 * dlxmax's canvas-teacher-export; adapted to DOM ops (no cross-origin title
 * fetch, which a content script can't make without YouTube host permission).
 */
function rewriteYouTubeEmbeds(root) {
  const iframes = root.querySelectorAll(
    'iframe[src*="youtube.com/embed/"], iframe[src*="youtube-nocookie.com/embed/"]'
  );
  for (const iframe of iframes) {
    const m = (iframe.getAttribute("src") || "").match(/\/embed\/([A-Za-z0-9_-]+)/);
    if (!m) continue;
    const vid = m[1];
    const wrap = document.createElement("div");
    wrap.className = "yt-embed";
    wrap.setAttribute("data-youtube-id", vid);
    const a = document.createElement("a");
    a.href = `https://www.youtube.com/watch?v=${vid}`;
    a.target = "_blank";
    a.rel = "noopener";
    a.title = "Play on YouTube";
    const img = document.createElement("img");
    img.src = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
    img.alt = `YouTube video ${vid}`;
    img.loading = "lazy";
    a.appendChild(img);
    wrap.appendChild(a);
    iframe.replaceWith(wrap);
  }
}

// ---------------------------------------------------------------------------
// Canvas-native media (Rich Content Editor uploads / recordings)
// ---------------------------------------------------------------------------

/**
 * Finds every Canvas-native media embed in a chunk of Canvas HTML.
 *
 * Media uploaded or recorded through the Rich Content Editor is *not* a
 * course file: it is a MediaObject served through the media player, so it
 * never shows up as a `/files/<id>` link. Canvas has embedded it three ways
 * over the years, and old course copies carry all of them:
 *
 *   <iframe src="/media_attachments_iframe/123?type=video" data-media-id="m-x">   (2023+)
 *   <iframe src="https://host/media_objects_iframe/m-x?type=video">              (older RCE)
 *   <a href="/media_objects/m-x" class="instructure_inline_media_comment">        (legacy)
 *   <video data-media_comment_id="m-x" src=".../media_download?entryId=m-x">     (legacy, API-rewritten)
 *
 * Returns [{ kind: "attachment"|"media", id, ref, params: {verifier, location},
 * title }]. `kind` picks the info endpoint (`/media_attachments/:id/info` vs
 * `/media_objects/:media_id/info`). Duplicate ids within one chunk are
 * collapsed; the same video reachable both by attachment id and media id is
 * deduplicated later by the resolver on the `media_id` the info call returns.
 */
function extractMediaRefs(html) {
  if (!html) return [];
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const out = [];
  const seen = new Set();
  const MEDIA_ID = "(m-[A-Za-z0-9_-]+|\\d+_[A-Za-z0-9]+)";
  const reAttachment = new RegExp("/media_attachments(?:_iframe)?/(\\d+)(?:[/?#]|$)");
  const reMediaObject = new RegExp(`/media_objects(?:_iframe)?/${MEDIA_ID}(?:[/?#]|$)`);
  const reEntryId = new RegExp(`[?&]entryId=${MEDIA_ID}(?:[&#]|$)`);

  const push = (kind, id, ref, title) => {
    const key = `${kind}:${id}`;
    if (seen.has(key)) return;
    seen.add(key);
    const params = {};
    try {
      const parsed = new URL(ref, "https://canvas.invalid/");
      for (const k of ["verifier", "location"]) {
        const v = parsed.searchParams.get(k);
        if (v) params[k] = v;
      }
    } catch {
      // Malformed ref — no params.
    }
    out.push({ kind, id, ref, params, title: (title || "").trim() });
  };

  const candidates = tpl.content.querySelectorAll(
    "iframe[src], video[src], audio[src], source[src], a[href], [data-media-id], [data-media_comment_id]"
  );
  for (const el of candidates) {
    const ref = el.getAttribute("src") || el.getAttribute("href") || "";
    const title = el.getAttribute("title") || el.getAttribute("data-title") || el.textContent || "";
    let m;
    if ((m = ref.match(reAttachment))) {
      push("attachment", m[1], ref, title);
    } else if ((m = ref.match(reMediaObject))) {
      push("media", m[1], ref, title);
    } else if ((m = ref.match(reEntryId))) {
      push("media", m[1], ref, title);
    } else {
      // Bare data attributes with no recognisable URL (e.g. a <span> the RCE
      // left behind, or an iframe pointing at a plain player page).
      const dataId = el.getAttribute("data-media-id") || el.getAttribute("data-media_comment_id");
      if (dataId && new RegExp(`^${MEDIA_ID}$`).test(dataId)) push("media", dataId, ref, title);
    }
  }
  return out;
}

/**
 * Picks the source to download from a MediaObject's `media_sources` array:
 * the highest-bitrate mp4/webm (or audio) flavor, preferring the original
 * upload only as a tie-break. Returns null when there is nothing usable
 * (media still transcoding, or a restricted entry Canvas returns empty).
 */
function pickMediaSource(sources) {
  if (!Array.isArray(sources) || sources.length === 0) return null;
  const usable = sources.filter((s) => s && (s.url || s.src));
  if (usable.length === 0) return null;
  const score = (s) => {
    const type = String(s.content_type || "").toLowerCase();
    let n = parseInt(s.bitrate, 10) || 0;
    // HLS/DASH manifests can't be saved as a single file; push them last.
    if (/mpegurl|dash|m3u8/.test(type) || /\.(m3u8|mpd)(\?|$)/.test(s.url || s.src || "")) n -= 1e9;
    if (s.isOriginal === true || s.isOriginal === "1") n += 1;
    return n;
  };
  return usable.slice().sort((a, b) => score(b) - score(a))[0];
}

/**
 * Builds a filename for a resolved media object: the user-facing title plus
 * the flavor's extension (falling back to the MIME subtype, then mp4/m4a).
 */
function mediaFilename(info, source, fallbackStem = "media") {
  const rawTitle = info?.user_entered_title || info?.title || fallbackStem;
  let stem = sanitizeFilename(rawTitle).substring(0, 120) || fallbackStem;
  let ext = String(source?.fileExt || "").replace(/^\./, "").toLowerCase();
  if (!ext) {
    const type = String(source?.content_type || "").toLowerCase();
    const sub = type.split("/")[1] || "";
    if (sub === "mp4" && type.startsWith("audio/")) ext = "m4a";
    else if (/^(mp4|webm|ogg|mp3|m4a|mov|flv|wav|aac|m4v)$/.test(sub)) ext = sub;
    else if (type.startsWith("audio/")) ext = "m4a";
    else ext = "mp4";
  }
  const stemExt = stem.match(/\.([a-z0-9]{2,4})$/i)?.[1]?.toLowerCase();
  if (stemExt && /^(mp4|webm|ogg|mp3|m4a|mov|flv|wav|aac|m4v|avi|mkv|wmv)$/.test(stemExt)) {
    stem = stem.slice(0, -(stemExt.length + 1));
  }
  return `${stem}.${ext}`;
}

/**
 * After link rewriting, Canvas media iframes point at a *local* mp4 (a
 * relative path). An iframe on a video file only shows the browser's default
 * player inside a scrollable box, and Markdown export drops iframes entirely,
 * so swap them for a real <video>/<audio> element with controls. Iframes
 * whose src is still remote (Studio, Panopto, YouTube leftovers) are untouched.
 */
function convertLocalMediaEmbeds(html) {
  if (!html || !/<iframe/i.test(html)) return html;
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const AUDIO = /\.(mp3|m4a|wav|aac|ogg|oga)$/i;
  const VIDEO = /\.(mp4|webm|m4v|mov|ogv)$/i;
  for (const iframe of [...tpl.content.querySelectorAll("iframe[src]")]) {
    const src = iframe.getAttribute("src") || "";
    const isLocal = !/^[a-z][a-z0-9+.-]*:/i.test(src) && !src.startsWith("/") && !src.startsWith("//");
    if (!isLocal) continue;
    const path = src.split("?")[0].split("#")[0];
    const isAudio = AUDIO.test(path);
    if (!isAudio && !VIDEO.test(path)) continue;
    const el = document.createElement(isAudio ? "audio" : "video");
    el.setAttribute("controls", "");
    el.setAttribute("preload", "metadata");
    el.setAttribute("src", src);
    if (!isAudio) el.setAttribute("style", "max-width:100%;height:auto;");
    const title = iframe.getAttribute("title");
    if (title) el.setAttribute("title", title);
    const link = document.createElement("a");
    link.setAttribute("href", src);
    link.textContent = title || (isAudio ? "Download audio" : "Download video");
    el.appendChild(link);
    iframe.replaceWith(el);
  }
  return tpl.innerHTML;
}

/**
 * Canvas sometimes leaves literal import placeholders like
 * `$CANVAS_OBJECT_REFERENCE$` in copied/imported content. They point nowhere and
 * become dead canvas.instructure.com links once the account is gone. Turn
 * placeholder anchors into inert labelled text and defuse any other href/src
 * carrying a placeholder. Idea from dlxmax's canvas-teacher-export.
 */
function neutralizeCanvasPlaceholders(root) {
  const placeholder = /\$[A-Z][A-Z0-9_-]*\$/;
  for (const el of [...root.querySelectorAll("[href], [src]")]) {
    const href = el.getAttribute("href");
    const src = el.getAttribute("src");
    const hit = (href && placeholder.test(href)) || (src && placeholder.test(src));
    if (!hit) continue;
    if (el.tagName === "A") {
      const span = document.createElement("span");
      span.className = "canvas-archive-broken";
      span.title = "Canvas import placeholder, no archived target";
      span.textContent = el.textContent;
      el.replaceWith(span);
    } else {
      if (href && placeholder.test(href)) {
        el.setAttribute("data-broken-href", href);
        el.removeAttribute("href");
      }
      if (src && placeholder.test(src)) {
        el.setAttribute("data-broken-src", src);
        el.removeAttribute("src");
      }
    }
  }
}

/**
 * Formats an ISO date string as `YYYY-MM-DD HH:MM` in the user's local timezone.
 * Returns "" for falsy or invalid input.
 */
function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Minimal fallback stylesheet used when Canvas's own CSS can't be fetched.
 * Kept readable rather than Canvas-branded.
 */
const FALLBACK_EXPORT_CSS = `
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

/**
 * Computes the relative path from a file at `filePath` to a sibling at the course root.
 * Examples: "" → ".", "Pages/" → "..", "deep/nested/" → "../..".
 */
function relativePathToCourseRoot(filePath) {
  const depth = filePath.split("/").filter(Boolean).length;
  return depth === 0 ? "." : Array(depth).fill("..").join("/");
}

/** Wraps content in an HTML page that links to `styles.css` at the course root. */
function toHtmlDataUri(title, body, filePath = "") {
  const safeBody = sanitizeHtml(body);
  const cssHref = `${relativePathToCourseRoot(filePath)}/styles.css`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><link rel="stylesheet" href="${cssHref}"></head><body><h1>${title}</h1>${safeBody}</body></html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

/** Wraps a Markdown body in a `# Title` heading and returns a data-URI. */
function toMarkdownDataUri(title, mdBody) {
  const md = `# ${title}\n\n${mdBody}`;
  return `data:text/markdown;charset=utf-8,${encodeURIComponent(md)}`;
}

/**
 * Computes the relative URL needed to navigate from a file at `fromPath`
 * (a "Subfolder/" or "" string identifying the *folder* the file lives in)
 * to a target file whose full path-from-course-root is `toPath`.
 *
 * Examples:
 *   relativeUrlFromTo("Pages/", "Assignments/bar.html") → "../Assignments/bar.html"
 *   relativeUrlFromTo("Pages/", "Pages/foo.html") → "../Pages/foo.html"
 *   relativeUrlFromTo("", "Pages/foo.html") → "Pages/foo.html"
 */
function relativeUrlFromTo(fromPath, toPath) {
  const depth = fromPath.split("/").filter(Boolean).length;
  const upDirs = depth === 0 ? "" : Array(depth).fill("..").join("/") + "/";
  return upDirs + toPath;
}

/**
 * Scans `href`/`src` attributes in `html` and rewrites any that match a
 * Canvas URL in `urlMap` to a relative local path. Anything not in the map
 * is left alone (could be an external link or a resource we didn't export).
 *
 * `urlMap` maps full Canvas URLs to their target path-from-course-root
 * (e.g. "Pages/foo.html"). `fromPath` is the folder of the file currently
 * being rewritten.
 */
function rewriteCanvasLinks(html, urlMap, fromPath) {
  if (!html || !urlMap || urlMap.size === 0) return html;
  return html.replace(/(href|src)="([^"]+)"/gi, (match, attr, url) => {
    let target = urlMap.get(url);
    if (!target) {
      const normalized = url.split("?")[0].split("#")[0].replace(/\/$/, "");
      target = urlMap.get(normalized);
      // Canvas embeds files with a trailing action, e.g. /files/<id>/preview or
      // /files/<id>/download. Fall back to the bare /files/<id> map entry so
      // embedded images and download links resolve to the local copy.
      if (!target) {
        const fileMatch = normalized.match(/^(.*\/files\/\d+)(?:\/.*)?$/);
        if (fileMatch) target = urlMap.get(fileMatch[1]);
      }
      // Legacy media comments load through `media_download?entryId=m-x`; the
      // media id is the only stable key, so the map stores it as "media:m-x".
      if (!target) {
        const entry = url.match(/[?&]entryId=([^&#]+)/);
        if (entry) target = urlMap.get(`media:${decodeURIComponent(entry[1])}`);
      }
    }
    if (!target) return match;
    return `${attr}="${relativeUrlFromTo(fromPath, target)}"`;
  });
}

let _turndownService = null;

/**
 * Lazily-built Turndown converter with the GFM plugin for tables/strikethrough.
 * If Turndown isn't loaded (e.g. in the test page), returns the input untouched
 * so callers don't need to special-case.
 */
function htmlToMarkdown(html) {
  if (typeof TurndownService === "undefined") return html;
  if (!_turndownService) {
    _turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
    });
    if (typeof turndownPluginGfm !== "undefined") {
      _turndownService.use(turndownPluginGfm.gfm);
    }
    // Turndown's default for unknown elements is "replace with children",
    // which deletes <iframe>/<video>/<audio> outright — the Markdown export
    // lost even the *link* to every embedded video. Emit a link instead: a
    // local one for media we downloaded, the original URL for remote embeds.
    _turndownService.addRule("mediaEmbed", {
      filter: (node) =>
        ["IFRAME", "VIDEO", "AUDIO"].includes(node.nodeName) && !!node.getAttribute("src"),
      replacement: (content, node) => {
        const src = node.getAttribute("src");
        const kind = node.nodeName === "IFRAME" ? "Embedded content" : node.nodeName === "VIDEO" ? "Video" : "Audio";
        const label = (node.getAttribute("title") || "").trim() || kind;
        return `\n\n[${label}](${src})\n\n`;
      },
    });
  }
  return _turndownService.turndown(sanitizeHtml(html));
}

// ---------------------------------------------------------------------------
// Pagination Parsing
// ---------------------------------------------------------------------------

/**
 * Parses a Link header and returns the URL for the "next" page, or null.
 * Canvas API uses RFC 5988 Link headers for pagination.
 *
 * @param {string|null} linkHeader - The raw Link header value
 * @returns {string|null} The next page URL, or null if there is none
 */
function parsePaginationLink(linkHeader) {
  if (!linkHeader) return null;
  const nextLink = linkHeader.split(",").find((s) => s.includes('rel="next"'));
  return nextLink ? nextLink.match(/<([^>]+)>/)?.[1] ?? null : null;
}

// ---------------------------------------------------------------------------
// Incremental Download Records
// ---------------------------------------------------------------------------

/**
 * Decides whether a file must be re-downloaded in incremental mode because it
 * changed on Canvas since its inventory entry was recorded.
 *
 * Entries are `{ t, m, s }` (recorded-at timestamp, Canvas updated_at, byte
 * size). Records written before v2.10.1 stored a bare timestamp; those carry
 * no metadata to compare against, so the file counts as unchanged (the old
 * name-only behavior). A comparison only fires when both sides have a value —
 * Canvas omits size/updated_at on some attachment endpoints.
 *
 * @param {object|number} entry - Stored inventory entry for this path+name
 * @param {{updatedAt?: string, size?: number}} file - Current download entry
 * @returns {boolean} True when the file changed and must be re-downloaded
 */
function incrementalFileChanged(entry, file) {
  if (typeof entry !== "object" || entry === null) return false;
  if (entry.m && file.updatedAt && entry.m !== file.updatedAt) return true;
  if (entry.s && file.size && entry.s !== file.size) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Path Length Safety
// ---------------------------------------------------------------------------

/**
 * Truncates a filename to fit within maxPath characters when combined with
 * the course name and file path. Preserves the file extension.
 *
 * @param {string} filename - The original filename
 * @param {string} courseName - Sanitized course name
 * @param {string} filePath - The file's subdirectory path
 * @param {number} maxPath - Maximum total path length (default 250)
 * @returns {string} The possibly-truncated filename
 */
function truncateFilename(filename, courseName, filePath, maxPath = 250) {
  const fullLen = courseName.length + 1 + filePath.length + filename.length;
  if (fullLen <= maxPath) return filename;

  const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
  const maxName = maxPath - courseName.length - 1 - filePath.length - ext.length;
  if (maxName > 10) {
    return filename.slice(0, maxName) + ext;
  }
  return filename;
}
