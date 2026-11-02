import { makeZip } from 'client-zip';
import type { FileSink } from './types';

interface ZipInput {
  name: string;
  input: ReadableStream<Uint8Array> | Uint8Array;
  lastModified?: Date;
}

/**
 * A streaming ZIP written to `destination` (a file on disk, or a collector for a
 * Blob). Nothing is buffered between the runner and client-zip, so a write
 * resolves only when the archive takes the entry: the runner can't run ahead
 * of the disk.
 */
export function zipSink(destination: WritableStream<Uint8Array>): FileSink {
  const entries = new TransformStream<ZipInput, ZipInput>(
    undefined,
    { highWaterMark: 0 },
    { highWaterMark: 0 },
  );
  const writer = entries.writable.getWriter();
  const done = makeZip(entries.readable, { buffersAreUTF8: true }).pipeTo(destination);

  return {
    ordered: true,
    write: (name, input, info) => writer.write({ name, input, lastModified: info.lastModified }),
    async close() {
      await writer.close();
      await done;
    },
    async abort(reason) {
      await writer.abort(reason).catch(() => {});
      await done.catch(() => {});
    },
  };
}

/** A WritableStream that keeps everything in memory and hands back one Blob. */
export function blobCollector(type = 'application/zip'): {
  stream: WritableStream<Uint8Array>;
  blob: Promise<Blob>;
} {
  const chunks: Uint8Array[] = [];
  let resolveBlob!: (b: Blob) => void;
  const blob = new Promise<Blob>((r) => (resolveBlob = r));
  const stream = new WritableStream<Uint8Array>({
    write: (chunk) => void chunks.push(chunk),
    close: () => resolveBlob(new Blob(chunks as BlobPart[], { type })),
  });
  return { stream, blob };
}
