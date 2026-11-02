// Settings as the page shows them. Every change is saved at once and confirmed
// with a short "Saved".
import { folderAccessFor } from '../../app/folder-access';
import { canChooseFolder, loadSaveFolder, storeSaveFolder } from '../../storage/folder';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type Settings,
} from '../../storage/settings';

const SAVED_FOR_MS = 1500;

export const options = $state({
  settings: { ...DEFAULT_SETTINGS },
  /** Name of the folder the user chose, "" when none. */
  folderName: '',
  folderError: '',
  saved: false,
});

export async function load() {
  options.settings = await loadSettings();
  options.folderName = (await loadSaveFolder().catch(() => null))?.name ?? '';
}

let savedTimer: ReturnType<typeof setTimeout> | undefined;

export async function save(changes: Partial<Settings>) {
  Object.assign(options.settings, changes);
  await saveSettings(changes);
  options.saved = true;
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => (options.saved = false), SAVED_FOR_MS);
}

export const folderAccess = folderAccessFor({
  picker: canChooseFolder(),
  firefox: import.meta.env.FIREFOX,
  brave: 'brave' in navigator,
});

export async function chooseFolder() {
  options.folderError = '';
  try {
    // First in the click handler: the picker needs the user's click.
    const folder = await window.showDirectoryPicker!({
      id: 'ccd-save',
      mode: 'readwrite',
      startIn: 'downloads',
    });
    await storeSaveFolder(folder);
    options.folderName = folder.name;
    await save({ saveTo: 'folder' });
  } catch (error) {
    // AbortError: the picker was closed. Either way the previous choice stays.
    if (!(error instanceof DOMException && error.name === 'AbortError'))
      options.folderError = "That folder couldn't be used. Try another one, or save to Downloads.";
  }
}
