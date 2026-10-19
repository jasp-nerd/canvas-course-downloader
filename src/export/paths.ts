/**
 * Relative link from a document in `fromFolder` (e.g. "Pages/", or "" for the
 * course root) to `toPath`, given from the course root.
 */
export function relativeHref(fromFolder: string, toPath: string): string {
  const depth = fromFolder.split('/').filter(Boolean).length;
  return '../'.repeat(depth) + toPath;
}
