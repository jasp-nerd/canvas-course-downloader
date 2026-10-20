<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from 'wxt/browser';
  import { LINKS } from '../../app/links';

  let pinned = $state(true);

  onMount(async () => {
    // Chromium only; elsewhere the tip stays hidden.
    const action = browser.action as typeof browser.action & {
      getUserSettings?: () => Promise<{ isOnToolbar?: boolean }>;
    };
    if (action.getUserSettings) pinned = (await action.getUserSettings()).isOnToolbar ?? true;
  });
</script>

<main>
  <h1>You're set up</h1>
  <p class="lead">
    Canvas Course Downloader saves your Canvas courses to your computer: files, pages, assignments,
    grades and more.
  </p>

  <ol>
    <li>
      <h2>Open a course in Canvas</h2>
      <p>
        A <strong>Download course</strong> button appears next to the course name. If Canvas is already
        open, reload the page once.
      </p>
      <img
        src="/welcome/course-button.png"
        alt="The Download course button next to a course name in Canvas"
        width="744"
        height="62"
      />
    </li>
    <li>
      <h2>Or pick several courses</h2>
      <p>
        On your Canvas dashboard, <strong>Download courses</strong> lets you choose current and past courses
        at once.
      </p>
      <img
        class="narrow"
        src="/welcome/picker.png"
        alt="The course picker with two courses selected"
        width="560"
        height="640"
      />
    </li>
    <li>
      <h2>Find them in Downloads</h2>
      <p>
        Each course is saved as one ZIP file. You can switch to folders, Markdown, or a smaller
        selection in <button
          type="button"
          class="link"
          onclick={() => browser.runtime.openOptionsPage()}>Settings</button
        >.
      </p>
    </li>
  </ol>

  {#if !pinned}
    <p class="tip">
      Tip: pin it with the puzzle-piece icon in your toolbar to reach it from any Canvas page.
    </p>
  {/if}

  <p class="privacy">
    Nothing leaves your browser except requests to your own Canvas. <a
      href={LINKS.privacy}
      target="_blank"
      rel="noopener">Privacy policy</a
    >
  </p>
</main>

<style>
  :global(:root) {
    --bg: #f6f7f9;
    --surface: #ffffff;
    --text: #1d2733;
    --muted: #556270;
    --border: #d9dee4;
    --accent: #0b5cad;
    color-scheme: light dark;
  }
  @media (prefers-color-scheme: dark) {
    :global(:root) {
      --bg: #12161b;
      --surface: #1b2128;
      --text: #e6eaef;
      --muted: #a3adb8;
      --border: #303943;
      --accent: #7cb8f2;
    }
  }
  :global(body) {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font:
      16px/1.55 system-ui,
      -apple-system,
      'Segoe UI',
      Roboto,
      sans-serif;
  }
  main {
    max-width: 720px;
    margin: 48px auto;
    padding: 0 16px;
  }
  h1 {
    font-size: 28px;
    margin: 0 0 8px;
  }
  .lead {
    color: var(--muted);
    margin: 0 0 24px;
  }
  ol {
    list-style: none;
    counter-reset: step;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 16px;
  }
  li {
    counter-increment: step;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 18px 20px;
  }
  h2 {
    font-size: 17px;
    margin: 0 0 6px;
  }
  h2::before {
    content: counter(step) '. ';
    color: var(--muted);
  }
  p {
    margin: 0;
  }
  img {
    display: block;
    max-width: 100%;
    height: auto;
    margin-top: 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  img.narrow {
    max-width: 440px;
  }
  .tip,
  .privacy {
    margin-top: 20px;
    color: var(--muted);
    font-size: 14px;
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
  a {
    color: var(--accent);
  }
</style>
