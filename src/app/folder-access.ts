// Whether "A folder you choose" can work in this browser, and why not when it can't.

export type FolderAccess = 'yes' | 'firefox' | 'brave' | 'no';

/** Chromium has the folder picker. Firefox has none; Brave switches it off unless a flag is set. */
export function folderAccessFor(browser: {
  picker: boolean;
  firefox: boolean;
  brave: boolean;
}): FolderAccess {
  if (browser.picker) return 'yes';
  if (browser.firefox) return 'firefox';
  return browser.brave ? 'brave' : 'no';
}

export const NO_FOLDER_ACCESS: Record<Exclude<FolderAccess, 'yes'>, string> = {
  firefox: "Firefox can't save into a folder you choose. Files go to your Downloads folder.",
  brave:
    'Brave turns this off. To use it, open brave://flags/#file-system-access-api, choose Enabled and restart Brave.',
  no: "Your browser doesn't let extensions save to a folder you pick.",
};
