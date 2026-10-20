import { defineBackground } from '#imports';
import { browser } from 'wxt/browser';
import { onMessage, sendMessage } from '../messaging';

export default defineBackground(() => {
  // Exports run in their own tab, so they survive closing or navigating the Canvas tab.
  onMessage('startExport', async ({ data }) => {
    const url = new URL(browser.runtime.getURL('/export.html'));
    url.searchParams.set('origin', data.origin);
    url.searchParams.set('courses', data.courseIds.join(','));
    await browser.tabs.create({ url: url.toString() });
  });

  browser.commands.onCommand.addListener((command) => {
    if (command !== 'download-current') return;
    void browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      // Pages without our content script (non-Canvas sites) have nobody listening.
      if (tab?.id) sendMessage('downloadCurrent', undefined, tab.id).catch(() => {});
    });
  });
});
