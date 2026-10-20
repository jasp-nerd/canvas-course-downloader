// Starts Firefox for extension tests and connects over WebDriver BiDi (the way
// Dark Reader tests in Firefox; Playwright can't load Firefox add-ons).
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import puppeteer, { type Browser } from 'puppeteer-core';

const FIREFOX_MAC = '/Applications/Firefox.app';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function launchFirefox(options: {
  profile: string;
  port: number;
  prefs: Record<string, string | number | boolean>;
}): Promise<{ browser: Browser; close: () => void }> {
  const { profile, port } = options;
  rmSync(profile, { recursive: true, force: true });
  mkdirSync(profile, { recursive: true });
  const prefs = {
    'browser.shell.checkDefaultBrowser': false,
    'browser.startup.homepage_override.mstone': 'ignore',
    'browser.aboutwelcome.enabled': false,
    'datareporting.policy.dataSubmissionEnabled': false,
    'app.update.disabledForTesting': true,
    'remote.prefs.recommended': true,
    ...options.prefs,
  };
  writeFileSync(
    `${profile}/user.js`,
    Object.entries(prefs)
      .map(([k, v]) => `user_pref(${JSON.stringify(k)}, ${JSON.stringify(v)});`)
      .join('\n') + '\n',
  );
  const args = [
    '--headless',
    '--no-remote',
    '--profile',
    profile,
    '--remote-debugging-port',
    String(port),
  ];
  if (process.platform === 'darwin') {
    // Started as a child of this shell, macOS refuses Firefox its profile folder;
    // through LaunchServices it runs as its own app.
    execFileSync('open', [
      '-n',
      '-g',
      '--env',
      'MOZ_HEADLESS=1',
      '-a',
      FIREFOX_MAC,
      '--args',
      ...args,
    ]);
  } else {
    spawn(process.env.FIREFOX_BIN ?? 'firefox', args, { stdio: 'ignore', detached: true }).unref();
  }

  let browser: Browser | undefined;
  for (let i = 0; i < 60 && !browser; i++) {
    await sleep(500);
    browser = await puppeteer
      .connect({
        browserWSEndpoint: `ws://127.0.0.1:${port}/session`,
        protocol: 'webDriverBiDi',
        acceptInsecureCerts: true,
      })
      .catch(() => undefined);
  }
  const close = () => {
    void browser?.disconnect();
    spawnSync('pkill', ['-f', '--', profile]);
  };
  if (!browser) {
    close();
    throw new Error('Could not connect to Firefox');
  }
  return { browser, close };
}
