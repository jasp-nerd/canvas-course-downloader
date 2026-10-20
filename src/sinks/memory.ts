import type { FileSink } from './types';

/** Keeps every file in memory; for tests and previews. */
export function memorySink(): FileSink & { files: Map<string, Uint8Array> } {
  const files = new Map<string, Uint8Array>();
  return {
    ordered: false,
    files,
    async write(path, body) {
      files.set(
        path,
        body instanceof Uint8Array ? body : new Uint8Array(await new Response(body).arrayBuffer()),
      );
    },
    close: () => Promise.resolve(),
    abort: () => Promise.resolve(),
  };
}
