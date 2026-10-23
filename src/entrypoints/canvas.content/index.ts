import { createShadowRootUi, defineContentScript, type ContentScriptContext } from '#imports';
import { mount, unmount } from 'svelte';
import { browser } from 'wxt/browser';
import { answerProfile, shouldAskProfile, type ProfileAnswer } from '../../app/onboarding';
import {
  newItems,
  checkForUpdates,
  pendingUpdates,
  saveUpdateCheck,
  type UpdateCheck,
} from '../../app/updates';
import { createCanvasClient } from '../../canvas/client';
import { teaches, type CourseSummary } from '../../canvas/courses';
import { courseIdFromPath, isCanvasPage } from '../../canvas/detect';
import { onMessage, sendMessage } from '../../messaging';
import { loadInventory } from '../../storage/inventory';
import { loadSettings } from '../../storage/settings';
// With cssInjectionMode 'ui', WXT puts these (and the components' styles) in
// each of our shadow roots, never in the Canvas page itself.
import '../../ui/theme.css';
import './base.css';
import CoursePicker from './CoursePicker.svelte';
import { loadCanvasFonts } from './fonts';
import PageButton from './PageButton.svelte';
import ProfileQuestion from './ProfileQuestion.svelte';
import { pageState } from './state.svelte';
import UpdatesNote from './UpdatesNote.svelte';

type StartExport = (
  courseIds: string[],
  options?: { onlyNew?: boolean; quiet?: boolean },
  /** How many of the courses the user teaches, when the caller knows. */
  taught?: number,
) => void;

export default defineContentScript({
  // Canvas runs on schools' own domains (canvas.vu.nl, ...), so this matches every
  // https page and returns at once on pages that aren't Canvas.
  matches: ['https://*/*'],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',
  async main(ctx) {
    if (!isCanvasPage(document, location.hostname)) return;
    // Our own pages offer "Go to <school>" from this. One write per page load:
    // Canvas's in-page navigation doesn't run the script again.
    void browser.storage.local.set({ lastCanvas: { origin: location.origin, at: Date.now() } });

    const startExport: StartExport = (courseIds, options = {}, taught) =>
      void (async () => {
        // A new user chooses what downloads should be, once, before the first one.
        // Downloads of only what's new add to a copy, so they don't ask.
        if (!options.quiet && !options.onlyNew && (await shouldAskProfile())) {
          const choice = await askProfile(ctx, {
            courses: courseIds.length,
            taught: taught ?? (await teachesCourse(courseIds[0]!)),
          });
          if (!choice) return;
          await answerProfile(choice);
        }
        await sendMessage('startExport', { origin: location.origin, courseIds, ...options });
      })();
    const openPicker = () => void showPicker(ctx, startExport);
    const courseId = courseIdFromPath(location.pathname);
    const onDashboard = !courseId && location.pathname === '/';

    onMessage('downloadCurrent', () => (courseId ? startExport([courseId]) : openPicker()));
    onMessage('pageInfo', () => ({ origin: location.origin, courseId }));
    onMessage('courseInfo', async () => {
      if (!courseId) return null;
      const course = await createCanvasClient({ origin: location.origin }).get<CourseSummary>(
        `/courses/${courseId}`,
        { 'include[]': 'term' },
      );
      const term = course.term?.name ?? '';
      return {
        name: course.name,
        code: course.course_code ?? '',
        term: /^default term$/i.test(term) ? '' : term,
      };
    });
    onMessage('openPicker', openPicker);

    const button = await createShadowRootUi(ctx, {
      name: 'ccd-page-button',
      position: 'inline',
      // Course pages: next to the breadcrumbs. Dashboard: in its header actions.
      anchor: onDashboard ? '.ic-Dashboard-header__actions' : '.ic-app-nav-toggle-and-crumbs',
      append: 'last',
      onMount: (container) => {
        void loadCanvasFonts();
        return mount(PageButton, {
          target: container,
          props: courseId
            ? {
                label: 'Download course',
                hint: 'Course Downloader: save this course to your computer',
                onclick: () => startExport([courseId]),
                showNew: true,
              }
            : {
                label: 'Download courses',
                hint: 'Course Downloader: save courses to your computer',
                onclick: openPicker,
              },
        });
      },
      onRemove: (app) => {
        if (app) void unmount(app);
      },
    });
    // Canvas renders parts of the page late (the dashboard is React); mount when the anchor appears.
    button.autoMount();

    await showUpdates(ctx, { courseId, onDashboard, startExport });
  },
});

/** The "what's new" check for courses saved before: badge, "N new" chip, dashboard note, auto-download. */
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
  pageState.newByCourse = Object.fromEntries(
    (check?.courses ?? []).map((c) => [c.courseId, newItems(c)]),
  );
  const pending = pendingUpdates(check);
  const total = pending.reduce((n, c) => n + newItems(c), 0);
  void sendMessage('setBadge', total ? String(total) : '');
  const here = pending.find((c) => c.courseId === page.courseId);
  if (here) {
    pageState.savedAt = (await loadInventory(location.origin, here.courseId))?.savedAt ?? 0;
    pageState.newFiles = newItems(here);
  }
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
    onMount: (container) => {
      void loadCanvasFonts();
      return mount(UpdatesNote, {
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
      });
    },
    onRemove: (app) => {
      if (app) void unmount(app);
    },
  });
  note.autoMount({ once: true });
}

async function showPicker(ctx: ContentScriptContext, startExport: StartExport) {
  const picker = await createShadowRootUi(ctx, {
    name: 'ccd-course-picker',
    // The picker is a modal <dialog>, which the browser puts above the whole page.
    // (WXT's 'modal' position loses to Canvas's stacking: the isolated host's
    // `all: initial !important` resets the z-index WXT sets on it.)
    position: 'inline',
    anchor: 'body',
    // Keep Canvas's keyboard shortcuts from firing while typing in the search box.
    isolateEvents: true,
    onMount: (container) => {
      void loadCanvasFonts();
      return mount(CoursePicker, {
        target: container,
        props: {
          origin: location.origin,
          onclose: () => picker.remove(),
          ondownload: (courseIds: string[], taught: number) => {
            picker.remove();
            startExport(courseIds, {}, taught);
          },
          onsettings: () => void sendMessage('openOptions'),
        },
      });
    },
    onRemove: (app) => {
      if (app) void unmount(app);
    },
  });
  picker.mount();
}

/** 1 when the user teaches this course, else 0. One request, the same check the export makes. */
async function teachesCourse(courseId: string): Promise<number> {
  try {
    const canvas = createCanvasClient({ origin: location.origin });
    const course = await canvas.get<CourseSummary>(`/courses/${courseId}`, {
      'include[]': 'enrollments',
    });
    return teaches(course) ? 1 : 0;
  } catch {
    // Canvas is busy or the user signed out: ask without the teacher's part.
    // The export itself checks again, and Settings has the switch too.
    return 0;
  }
}

/** The first-download question, over the Canvas page. Resolves null when it's closed. */
async function askProfile(
  ctx: ContentScriptContext,
  download: { courses: number; taught: number },
): Promise<ProfileAnswer | null> {
  let answer!: (choice: ProfileAnswer | null) => void;
  const answered = new Promise<ProfileAnswer | null>((resolve) => (answer = resolve));
  const { includeStudentWork } = await loadSettings();
  const ui = await createShadowRootUi(ctx, {
    name: 'ccd-profile-question',
    position: 'inline',
    anchor: 'body',
    isolateEvents: true,
    onMount: (container) => {
      void loadCanvasFonts();
      return mount(ProfileQuestion, {
        target: container,
        props: {
          ...download,
          includeStudentWork,
          onchoose: (choice: ProfileAnswer) => {
            ui.remove();
            answer(choice);
          },
          oncancel: () => {
            ui.remove();
            answer(null);
          },
        },
      });
    },
    onRemove: (app) => {
      if (app) void unmount(app);
    },
  });
  ui.mount();
  return answered;
}
