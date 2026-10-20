import { createShadowRootUi, defineContentScript } from '#imports';
import { mount, unmount } from 'svelte';
import { courseIdFromPath, isCanvasPage } from '../../canvas/detect';
import { onMessage, sendMessage } from '../../messaging';
import CourseButton from './CourseButton.svelte';

export default defineContentScript({
  // Canvas runs on schools' own domains (canvas.vu.nl, ...), so this matches every
  // https page and returns at once on pages that aren't Canvas.
  matches: ['https://*/*'],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',
  async main(ctx) {
    if (!isCanvasPage(document, location.hostname)) return;

    const exportCurrentCourse = () => {
      const courseId = courseIdFromPath(location.pathname);
      if (courseId)
        void sendMessage('startExport', { origin: location.origin, courseIds: [courseId] });
    };
    onMessage('downloadCurrent', exportCurrentCourse);

    const button = await createShadowRootUi(ctx, {
      name: 'ccd-course-button',
      position: 'inline',
      anchor: '.ic-app-nav-toggle-and-crumbs',
      append: 'last',
      onMount: (container) =>
        mount(CourseButton, { target: container, props: { onclick: exportCurrentCourse } }),
      onRemove: (app) => {
        if (app) void unmount(app);
      },
    });
    if (courseIdFromPath(location.pathname)) button.autoMount();
  },
});
