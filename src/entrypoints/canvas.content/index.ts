import { createShadowRootUi, defineContentScript, type ContentScriptContext } from '#imports';
import { mount, unmount } from 'svelte';
import { courseIdFromPath, isCanvasPage } from '../../canvas/detect';
import { onMessage, sendMessage } from '../../messaging';
import CoursePicker from './CoursePicker.svelte';
import PageButton from './PageButton.svelte';

export default defineContentScript({
  // Canvas runs on schools' own domains (canvas.vu.nl, ...), so this matches every
  // https page and returns at once on pages that aren't Canvas.
  matches: ['https://*/*'],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',
  async main(ctx) {
    if (!isCanvasPage(document, location.hostname)) return;

    const startExport = (courseIds: string[]) =>
      void sendMessage('startExport', { origin: location.origin, courseIds });
    const openPicker = () => void showPicker(ctx, startExport);
    const courseId = courseIdFromPath(location.pathname);

    onMessage('downloadCurrent', () => (courseId ? startExport([courseId]) : openPicker()));
    onMessage('pageInfo', () => ({ origin: location.origin, courseId }));
    onMessage('openPicker', openPicker);

    const button = await createShadowRootUi(ctx, {
      name: 'ccd-page-button',
      position: 'inline',
      // Course pages: next to the breadcrumbs. Dashboard: in its header actions.
      anchor:
        courseId || location.pathname !== '/'
          ? '.ic-app-nav-toggle-and-crumbs'
          : '.ic-Dashboard-header__actions',
      append: 'last',
      onMount: (container) =>
        mount(PageButton, {
          target: container,
          props: courseId
            ? { label: 'Download course', onclick: () => startExport([courseId]) }
            : { label: 'Download courses', onclick: openPicker },
        }),
      onRemove: (app) => {
        if (app) void unmount(app);
      },
    });
    // Canvas renders parts of the page late (the dashboard is React); mount when the anchor appears.
    button.autoMount();
  },
});

async function showPicker(ctx: ContentScriptContext, startExport: (courseIds: string[]) => void) {
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
