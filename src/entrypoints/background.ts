import { defineBackground } from '#imports';
import { browser } from 'wxt/browser';
import { onboardingFor } from '../app/onboarding';
import { onMessage, sendMessage } from '../messaging';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(({ reason, previousVersion }) => {
    void (async () => {
      const [self, synced] = await Promise.all([
        browser.management.getSelf(),
        browser.storage.sync.get(null),
      ]);
      const onboarding = onboardingFor({
        reason,
        previousVersion,
        installType: self.installType,
        syncHadSettings: Object.keys(synced).length > 0,
      });
      if (onboarding === 'welcome')
        await browser.tabs.create({ url: browser.runtime.getURL('/welcome.html') });
      if (onboarding === 'whats-new') await browser.storage.local.set({ whatsNew: '3.0' });
    })();
  });

  // Exports run in their own tab, so they survive closing or navigating the Canvas tab.
  onMessage('startExport', async ({ data }) => {
    const url = new URL(browser.runtime.getURL('/export.html'));
    url.searchParams.set('origin', data.origin);
    url.searchParams.set('courses', data.courseIds.join(','));
    await browser.tabs.create({ url: url.toString() });
  });

  onMessage('openOptions', () => browser.runtime.openOptionsPage());

  browser.commands.onCommand.addListener((command) => {
    if (command !== 'download-current') return;
    void browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      // Pages without our content script (non-Canvas sites) have nobody listening.
      if (tab?.id) sendMessage('downloadCurrent', undefined, tab.id).catch(() => {});
    });
  });
});
