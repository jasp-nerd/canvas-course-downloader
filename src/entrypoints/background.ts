import { defineBackground } from '#imports';
import { browser, type Browser } from 'wxt/browser';
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
    if (data.onlyNew) url.searchParams.set('new', '1');
    if (data.quiet) url.searchParams.set('quiet', '1');
    await browser.tabs.create({ url: url.toString(), active: !data.quiet });
  });

  onMessage('openOptions', () => browser.runtime.openOptionsPage());
  onMessage('setBadge', async (message) => {
    // @webext-core/messaging types `sender` with @types/chrome, which WXT doesn't install.
    const tabId = (message.sender as Browser.runtime.MessageSender).tab?.id;
    if (tabId === undefined) return;
    await browser.action.setBadgeText({ text: message.data, tabId });
    await browser.action.setBadgeBackgroundColor({ color: '#0b5cad', tabId });
  });

  browser.commands.onCommand.addListener((command) => {
    if (command !== 'download-current') return;
    void browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      // Pages without our content script (non-Canvas sites) have nobody listening.
      if (tab?.id) sendMessage('downloadCurrent', undefined, tab.id).catch(() => {});
    });
  });
});
