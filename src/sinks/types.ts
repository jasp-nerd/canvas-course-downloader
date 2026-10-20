export interface SinkFailure {
  path: string;
  reason: string;
}

/** Where an export's files end up: a ZIP, a folder on disk, or the downloads manager. */
export interface FileSink {
  /** A ZIP writes entries one after another, so it needs files in plan order. */
  readonly ordered: boolean;
  write(
    path: string,
    body: ReadableStream<Uint8Array> | Uint8Array,
    info: { lastModified?: Date },
  ): Promise<void>;
  /**
   * Hands over a file by URL instead of its bytes, when the sink can fetch it
   * itself (the browser's download manager can, and can resume it).
   */
  writeUrl?(path: string, url: string): Promise<void>;
  /** Finishes the output once everything is on disk, reporting files that failed late. */
  close(): Promise<SinkFailure[] | void>;
  abort(reason?: unknown): Promise<void>;
}
