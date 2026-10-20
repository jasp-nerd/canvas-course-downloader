import { createShadowRootUi, defineContentScript, type ContentScriptContext } from '#imports';
import { mount, unmount } from 'svelte';
import {
  checkForUpdates,
  pendingUpdates,
  saveUpdateCheck,
  type UpdateCheck,
} from '../../app/updates';
import { createCanvasClient } from '../../canvas/client';
import { courseIdFromPath, isCanvasPage } from '../../canvas/detect';
import { onMessage, sendMessage } from '../../messaging';
import { loadSettings } from '../../storage/settings';
import CoursePicker from './CoursePicker.svelte';
import PageButton from './PageButton.svelte';
import { pageState } from './state.svelte';
import UpdatesNote from './UpdatesNote.svelte';

type StartExport = (courseIds: string[], options?: { onlyNew?: boolean; quiet?: boolean }) => void;

export default defineContentScript({
  // Canvas runs on schools' own domains (canvas.vu.nl, ...), so this matches every
  // https page and returns at once on pages that aren't Canvas.
  matches: ['https://*/*'],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',
  async main(ctx) {
    if (!isCanvasPage(document, location.hostname)) return;

    const startExport: StartExport = (courseIds, options = {}) =>
      void sendMessage('startExport', { origin: location.origin, courseIds, ...options });
    const openPicker = () => void showPicker(ctx, startExport);
    const courseId = courseIdFromPath(location.pathname);
    const onDashboard = !courseId && location.pathname === '/';

    onMessage('downloadCurrent', () => (courseId ? startExport([courseId]) : openPicker()));
    onMessage('pageInfo', () => ({ origin: location.origin, courseId }));
    onMessage('openPicker', openPicker);

    const button = await createShadowRootUi(ctx, {
      name: 'ccd-page-button',
      position: 'inline',
      // Course pages: next to the breadcrumbs. Dashboard: in its header actions.
      anchor: onDashboard ? '.ic-Dashboard-header__actions' : '.ic-app-nav-toggle-and-crumbs',
      append: 'last',
      onMount: (container) =>
        mount(PageButton, {
          target: container,
          props: courseId
            ? { label: 'Download course', onclick: () => startExport([courseId]), showNew: true }
            : { label: 'Download courses', onclick: openPicker },
        }),
      onRemove: (app) => {
        if (app) void unmount(app);
      },
    });
    // Canvas renders parts of the page late (the dashboard is React); mount when the anchor appears.
    button.autoMount();

    await showUpdates(ctx, { courseId, onDashboard, startExport });
  },
});

/** The "what's new" check for courses saved before: badge, button label, dashboard note, auto-download. */
async function showUpdates(
  ctx: ContentScriptContext,
  page: { courseId: string | null; onDashboard: boolean; startExport: StartExport },
) {
  let check: UpdateCheck | null;
  try {
    check = await checkForUpdates(createCanvasClient({ origin: location.origin }), location.origin);
  } catch {
    return; // Signed out, or Canvas is busy; try again on the next page.
  }
  const pending = pendingUpdates(check);
  const total = pending.reduce((n, c) => n + c.newFiles, 0);
  void sendMessage('setBadge', total ? String(total) : '');
  pageState.newFiles = pending.find((c) => c.courseId === page.courseId)?.newFiles ?? 0;
  if (!check || pending.length === 0) return;

  const settings = await loadSettings();
  if (settings.autoDownloadNew) {
    // Once per check: every Canvas page runs this script.
    if (!check.autoStartedAt || check.autoStartedAt < check.checkedAt) {
      await saveUpdateCheck(location.origin, { ...check, autoStartedAt: Date.now() });
      page.startExport(
        pending.map((c) => c.courseId),
        { onlyNew: true, quiet: true },
      );
    }
    return;
  }

  if (!page.onDashboard) return;
  const latest = check;
  const note = await createShadowRootUi(ctx, {
    name: 'ccd-updates-note',
    position: 'inline',
    anchor: '#dashboard_header_container, .ic-Dashboard-header__layout',
    append: 'after',
    onMount: (container) =>
      mount(UpdatesNote, {
        target: container,
        props: {
          updates: pending,
          ondownload: () => {
            note.remove();
            page.startExport(
              pending.map((c) => c.courseId),
              { onlyNew: true },
            );
          },
          ondismiss: () => {
            note.remove();
            void saveUpdateCheck(location.origin, { ...latest, dismissedAt: Date.now() });
          },
        },
      }),
    onRemove: (app) => {
      if (app) void unmount(app);
    },
  });
  note.autoMount({ once: true });
}

async function showPicker(ctx: ContentScriptContext, startExport: StartExport) {
  const picker = await createShadowRootUi(ctx, {
    name: 'ccd-course-picker',
    position: 'modal',
    zIndex: 2147483647,
    // Keep Canvas's keyboard shortcuts from firing while typing in the search box.
    isolateEvents: true,
    onMount: (container) =>
      mount(CoursePicker, {
        target: container,
        props: {
          origin: location.origin,
          onclose: () => picker.remove(),
          ondownload: (courseIds: string[]) => {
            picker.remove();
            startExport(courseIds);
          },
          onsettings: () => void sendMessage('openOptions'),
        },
      }),
    onRemove: (app) => {
      if (app) void unmount(app);
    },
  });
  picker.mount();
}
