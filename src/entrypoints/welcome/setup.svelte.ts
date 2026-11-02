// Setup's state: one screen at a time, answers kept in memory until the user
// reaches the end. Skipping saves nothing, so the first download still asks.
import {
  finishSetup,
  SETUP_DEFAULTS,
  setupScreens,
  type SetupAnswers,
  type SetupScreen,
} from '../../app/onboarding';
import { storeSaveFolder } from '../../storage/folder';

interface SetupState {
  screen: SetupScreen;
  answers: SetupAnswers;
  /** Picked on the Save screen; stored with the other answers at the end. */
  folder: FileSystemDirectoryHandle | null;
  /** The screen Skip was pressed on, so Back returns there. */
  skippedFrom: SetupScreen | null;
  /** Whether the user picked ZIP or folders, after which a new goal leaves it alone. */
  zipChosen: boolean;
  /** Why saving the answers failed, shown on the last screen. */
  saveError: string;
}

export const setup = $state<SetupState>({
  screen: 'hello',
  answers: { ...SETUP_DEFAULTS },
  folder: null,
  skippedFrom: null,
  zipChosen: false,
  saveError: '',
});

/** Resolves once the answers are saved (or saving failed). */
export let saved: Promise<void> = Promise.resolve();

export const screens = () => setupScreens(setup.answers.goal);

function show(screen: SetupScreen) {
  setup.screen = screen;
  if (screen === 'ready' && !setup.skippedFrom) saved = save({ ...setup.answers }, setup.folder);
}

async function save(answers: SetupAnswers, folder: FileSystemDirectoryHandle | null) {
  setup.saveError = '';
  try {
    if (answers.saveTo === 'folder' && folder) await storeSaveFolder(folder);
    await finishSetup(answers);
  } catch (error) {
    setup.saveError = error instanceof Error ? error.message : String(error);
  }
}

export function next() {
  const list = screens();
  const after = list[list.indexOf(setup.screen) + 1];
  if (after) show(after);
}

export function back() {
  const from = setup.skippedFrom;
  setup.skippedFrom = null;
  if (from) return show(from);
  const list = screens();
  const before = list[list.indexOf(setup.screen) - 1];
  if (before) show(before);
}

export function skip() {
  setup.skippedFrom = setup.screen;
  show('ready');
}

/** Study packs go into AI tools by dragging files, so they start as folders. */
export function chooseGoal() {
  if (!setup.zipChosen) setup.answers.zipMode = setup.answers.goal !== 'study';
}

export async function chooseFolder() {
  try {
    // First in the change handler: the picker needs the user's click.
    const folder = await window.showDirectoryPicker!({
      id: 'ccd-save',
      mode: 'readwrite',
      startIn: 'downloads',
    });
    setup.folder = folder;
    setup.answers.saveTo = 'folder';
  } catch (error) {
    // AbortError: the picker was closed. Keep the previous choice either way.
    setup.answers.saveTo = setup.folder ? 'folder' : 'downloads';
    if ((error as DOMException).name !== 'AbortError') throw error;
  }
}
