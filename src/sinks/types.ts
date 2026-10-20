/** Where an export's files end up: a ZIP, a folder on disk, or the downloads manager. */
export interface FileSink {
  /** A ZIP writes entries one after another, so it needs files in plan order. */
  readonly ordered: boolean;
  write(
    path: string,
    body: ReadableStream<Uint8Array> | Uint8Array,
    info: { lastModified?: Date },
  ): Promise<void>;
  /** Finishes the output; resolves once everything is on disk. */
  close(): Promise<void>;
  abort(reason?: unknown): Promise<void>;
}
