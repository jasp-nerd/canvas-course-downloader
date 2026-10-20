// Writes straight into a folder the user chose (File System Access API, Chromium).
import type { FileSink } from './types';

async function directoryFor(
  root: FileSystemDirectoryHandle,
  path: string,
): Promise<[FileSystemDirectoryHandle, string]> {
  const parts = path.split('/');
  const name = parts.pop()!;
  let dir = root;
  for (const part of parts) if (part) dir = await dir.getDirectoryHandle(part, { create: true });
  return [dir, name];
}

async function exists(dir: FileSystemDirectoryHandle, name: string): Promise<boolean> {
  try {
    await dir.getFileHandle(name);
    return true;
  } catch {
    return false;
  }
}

/** A name not taken in `dir`: "a.pdf", else "a (2).pdf", "a (3).pdf", ... (never overwrites). */
async function freeName(dir: FileSystemDirectoryHandle, name: string): Promise<string> {
  if (!(await exists(dir, name))) return name;
  const dot = name.lastIndexOf('.');
  const [stem, ext] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ''];
  for (let n = 2; ; n++) {
    const candidate = `${stem} (${n})${ext}`;
    if (!(await exists(dir, candidate))) return candidate;
  }
}

/** Opens a file for writing at `path` under `root`; returns the stream and the name actually used. */
export async function openFile(
  root: FileSystemDirectoryHandle,
  path: string,
  conflictAction: 'uniquify' | 'overwrite',
): Promise<{ stream: FileSystemWritableFileStream; name: string }> {
  const [dir, wanted] = await directoryFor(root, path);
  const name = conflictAction === 'overwrite' ? wanted : await freeName(dir, wanted);
  const file = await dir.getFileHandle(name, { create: true });
  return { stream: await file.createWritable(), name };
}

/** Every file written as itself under `root` + `prefix` (a folder path ending in "/"). */
export function folderSink(
  root: FileSystemDirectoryHandle,
  conflictAction: 'uniquify' | 'overwrite',
  prefix = '',
): FileSink {
  return {
    ordered: false,
    async write(path, body) {
      const { stream } = await openFile(root, prefix + path, conflictAction);
      if (body instanceof Uint8Array) {
        await stream.write(body as Uint8Array<ArrayBuffer>);
        await stream.close();
      } else {
        await body.pipeTo(stream);
      }
    },
    close: () => Promise.resolve(),
    abort: () => Promise.resolve(),
  };
}
