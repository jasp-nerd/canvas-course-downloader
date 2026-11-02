// The folder the user chose to save into (Chromium only). Directory handles
// can't go in extension storage, so they live in IndexedDB.

const DB = 'canvas-course-downloader';
const STORE = 'handles';
const KEY = 'saveFolder';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB unavailable'));
  });
}

async function run<T>(
  mode: IDBTransactionMode,
  act: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = act(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
    });
  } finally {
    db.close();
  }
}

export const canChooseFolder = () =>
  typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';

export async function loadSaveFolder(): Promise<FileSystemDirectoryHandle | null> {
  return (
    ((await run('readonly', (s) => s.get(KEY))) as FileSystemDirectoryHandle | undefined) ?? null
  );
}

export async function storeSaveFolder(handle: FileSystemDirectoryHandle): Promise<void> {
  await run('readwrite', (s) => s.put(handle, KEY));
}

export async function forgetSaveFolder(): Promise<void> {
  await run('readwrite', (s) => s.delete(KEY));
}
