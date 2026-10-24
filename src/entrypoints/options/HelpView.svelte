<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from 'wxt/browser';
  import { githubStars } from '../../app/github';
  import { LINKS, feedbackUrl, tracked } from '../../app/links';
  import Icon from '../../ui/Icon.svelte';
  import type { IconName } from '../../ui/icons';
  import SupportBlock from '../../ui/SupportBlock.svelte';
  import Setting from './Setting.svelte';
  import { folderAccess, options } from './state.svelte';

  const version = browser.runtime.getManifest().version;
  let shortcut = $state<string | null>(null);
  let stars = $state<number | null>(null);

  onMount(async () => {
    void githubStars().then((count) => (stars = count));
    const commands = await browser.commands.getAll();
    shortcut = commands.find((c) => c.name === 'download-current')?.shortcut ?? '';
  });

  const settings = $derived(options.settings);
  const destination = $derived.by(() => {
    const folder =
      folderAccess === 'yes' && settings.saveTo === 'folder' && options.folderName
        ? `the folder you chose, ${options.folderName}`
        : 'your Downloads folder';
    return settings.folderPrefix ? `${folder}, inside "${settings.folderPrefix}"` : folder;
  });

  const links = (
    [
      {
        label: 'Report a problem',
        href: feedbackUrl(version, import.meta.env.BROWSER),
        icon: 'alert',
      },
      { label: 'Sponsor on GitHub', href: tracked(LINKS.sponsors, 'options'), icon: 'heart' },
      { label: 'Privacy', href: LINKS.privacy, icon: 'shield' },
    ] satisfies { label: string; href: string; icon: IconName }[]
  ).filter((link) => link.href);
</script>

<SupportBlock place="options" {stars} />

<Setting id="h-start" title="Start a download">
  <p>
    Open a course in Canvas and press <strong>Download course</strong> next to its name. On your
    dashboard, <strong>Download courses</strong> lets you pick several at once.
  </p>
</Setting>

<Setting id="h-where" title="Where files go">
  <p>Into {destination}. Each course gets its own ZIP file or folder.</p>
</Setting>

<Setting id="h-zip" title="Open a ZIP">
  <ul class="steps">
    <li><strong>Windows:</strong> right-click it and choose Extract All.</li>
    <li><strong>Mac:</strong> double-click it.</li>
  </ul>
</Setting>

<Setting id="h-key" title="Keyboard shortcut">
  {#if shortcut}
    <p>
      <kbd>{shortcut}</kbd> downloads the course you're on, or opens the course picker on other Canvas
      pages.
    </p>
  {:else if shortcut === ''}
    <p>No shortcut is set. You can choose one in your browser's extension shortcuts.</p>
  {/if}
</Setting>

<Setting id="h-links" title="Get in touch">
  <ul class="links">
    {#each links as link (link.label)}
      <li>
        <a href={link.href} target="_blank" rel="noopener">
          <Icon name={link.icon} size={18} />{link.label}
        </a>
      </li>
    {/each}
  </ul>
</Setting>

<style>
  p {
    margin: 0;
    max-width: 620px;
  }
  .steps {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 4px;
  }
  kbd {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 8px;
    background: var(--mist);
    box-shadow: inset 0 -1.5px 0 var(--control);
    font: 600 14px/1.5 var(--font-ui);
    font-variant-numeric: tabular-nums;
  }
  .links {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .links a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    padding: 0 16px 0 14px;
    border-radius: var(--r-pill);
    box-shadow: inset 0 0 0 1.5px var(--control);
    color: var(--ink);
    font-weight: 600;
    font-size: 14px;
    text-decoration: none;
  }
  .links a:hover {
    box-shadow: inset 0 0 0 1.5px var(--ink-3);
  }
  .links :global(svg) {
    color: var(--ink-3);
  }
</style>
