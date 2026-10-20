<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from 'wxt/browser';
  import { sendMessage, type PageInfo } from '../../messaging';

  type Page =
    { kind: 'loading' } | { kind: 'canvas'; tabId: number; info: PageInfo } | { kind: 'other' };
  let page = $state<Page>({ kind: 'loading' });
  const version = browser.runtime.getManifest().version;

  onMount(async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    try {
      // Only our content script on a Canvas page answers; elsewhere this throws.
      if (tab?.id !== undefined)
        page = {
          kind: 'canvas',
          tabId: tab.id,
          info: await sendMessage('pageInfo', undefined, tab.id),
        };
      else page = { kind: 'other' };
    } catch {
      page = { kind: 'other' };
    }
  });

  async function downloadCourse(info: PageInfo) {
    await sendMessage('startExport', { origin: info.origin, courseIds: [info.courseId!] });
    window.close();
  }

  async function choose(tabId: number) {
    await sendMessage('openPicker', undefined, tabId);
    window.close();
  }
</script>

<main>
  <h1>Canvas Course Downloader</h1>

  {#if page.kind === 'loading'}
    <p class="muted">Checking this page…</p>
  {:else if page.kind === 'canvas'}
    {#if page.info.courseId}
      <button
        type="button"
        class="primary"
        onclick={() => page.kind === 'canvas' && downloadCourse(page.info)}
      >
        Download this course
      </button>
    {/if}
    <button
      type="button"
      class={page.info.courseId ? 'secondary' : 'primary'}
      onclick={() => page.kind === 'canvas' && choose(page.tabId)}
    >
      Choose courses…
    </button>
  {:else}
    <p>Open your school's Canvas in this tab, then click here again to download your courses.</p>
  {/if}

  <footer>
    <button type="button" class="link" onclick={() => browser.runtime.openOptionsPage()}
      >Settings</button
    >
    <span class="muted">v{version}</span>
  </footer>
</main>

<style>
  :global(:root) {
    --bg: #ffffff;
    --text: #1d2733;
    --muted: #556270;
    --border: #d9dee4;
    --accent: #0b6bcb;
    --accent-text: #ffffff;
    color-scheme: light dark;
  }
  @media (prefers-color-scheme: dark) {
    :global(:root) {
      --bg: #1b2128;
      --text: #e6eaef;
      --muted: #a3adb8;
      --border: #303943;
      --accent: #5aa7f0;
      --accent-text: #0d1a26;
    }
  }
  :global(body) {
    margin: 0;
    width: 300px;
    background: var(--bg);
    color: var(--text);
    font:
      14px/1.45 system-ui,
      -apple-system,
      'Segoe UI',
      Roboto,
      sans-serif;
  }
  main {
    display: grid;
    gap: 10px;
    padding: 16px;
  }
  h1 {
    font-size: 15px;
    margin: 0 0 4px;
  }
  p {
    margin: 0;
  }
  .muted {
    color: var(--muted);
  }
  .primary,
  .secondary {
    font: 600 14px/1.2 inherit;
    font-family: inherit;
    padding: 10px 14px;
    border-radius: 8px;
    cursor: pointer;
  }
  .primary {
    border: 0;
    background: var(--accent);
    color: var(--accent-text);
  }
  .secondary {
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text);
  }
  footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--border);
    padding-top: 10px;
    margin-top: 4px;
    font-size: 13px;
  }
  .link {
    border: 0;
    background: none;
    padding: 0;
    font: inherit;
    color: var(--accent);
    text-decoration: underline;
    cursor: pointer;
  }
  button:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }
</style>
