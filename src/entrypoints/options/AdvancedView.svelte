<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from 'wxt/browser';
  import Icon from '../../ui/Icon.svelte';
  import Setting from './Setting.svelte';
  import { options, save } from './state.svelte';
  import SwitchRow from './SwitchRow.svelte';

  const CDN = { origins: ['*://*.canvas-user-content.com/*'] };

  const settings = $derived(options.settings);
  let maxSizeText = $state(
    options.settings.maxFileSizeMB ? String(options.settings.maxFileSizeMB) : '',
  );
  let cdnGranted = $state<boolean | null>(null);

  onMount(async () => {
    cdnGranted = await browser.permissions.contains(CDN);
  });

  const maxSizeError = $derived(
    maxSizeText.trim() !== '' && !/^\d+$/.test(maxSizeText.trim())
      ? 'Enter a whole number of megabytes, or leave it empty.'
      : '',
  );

  function commitMaxSize() {
    if (maxSizeError) return;
    void save({ maxFileSizeMB: Number(maxSizeText.trim() || 0) });
  }

  async function allowCdn() {
    // Must be the first thing in the click handler, or Firefox refuses the prompt.
    cdnGranted = await browser.permissions.request(CDN);
  }
</script>

<Setting
  id="s-format"
  title="Pages and assignments"
  text="How pages, assignments and discussions are saved in a copy to keep."
>
  {#if settings.profile === 'copy'}
    <div class="opts wide" role="radiogroup" aria-labelledby="s-format">
      <div class="opt">
        <label>
          <input
            type="radio"
            class="radio"
            name="format"
            checked={settings.exportFormat !== 'markdown'}
            onchange={() => save({ exportFormat: 'html' })}
          />
          <span><strong>Web pages</strong><span class="small">Open in any browser</span></span>
        </label>
      </div>
      <div class="opt">
        <label>
          <input
            type="radio"
            class="radio"
            name="format"
            checked={settings.exportFormat === 'markdown'}
            onchange={() => save({ exportFormat: 'markdown' })}
          />
          <span
            ><strong>Markdown</strong><span class="small">For notes apps and AI tools</span></span
          >
        </label>
      </div>
    </div>
  {:else}
    <p class="note">Study packs and files for code are always Markdown.</p>
  {/if}
</Setting>

<Setting id="s-videos" title="Videos" text="Videos are often the biggest part of a course.">
  <div class="wide">
    <SwitchRow
      title="Skip videos"
      text="Video files are left out of every download."
      checked={settings.excludeVideos}
      onchange={(on: boolean) => save({ excludeVideos: on })}
    />
  </div>
</Setting>

<Setting
  id="s-size"
  title="Size limit"
  text="Bigger files are skipped. Leave it empty for no limit."
>
  <label class="field">
    <span class="label">Files larger than (MB)</span>
    <input
      class="input num"
      type="text"
      inputmode="numeric"
      bind:value={maxSizeText}
      onchange={commitMaxSize}
      aria-invalid={maxSizeError !== ''}
      aria-describedby="max-size-error"
    />
    <span id="max-size-error" class="error">{maxSizeError}</span>
  </label>
</Setting>

<Setting
  id="s-cdn"
  title="Submitted files"
  text="Some schools serve submitted files and discussion attachments from canvas-user-content.com. If those files fail, allow access."
>
  {#if cdnGranted}
    <span class="chip chip-mint"><Icon name="check" />Access allowed</span>
  {:else if cdnGranted === false}
    <button type="button" class="btn btn-light btn-sm" onclick={allowCdn}>Allow access</button>
  {/if}
</Setting>

<style>
  .note {
    margin: 0;
    font-size: 15px;
    color: var(--ink-2);
  }
  .field {
    display: grid;
    gap: 6px;
    width: 100%;
    max-width: 240px;
  }
  .error {
    font-size: 14px;
    color: var(--red-ink);
  }
  .error:empty {
    display: none;
  }
</style>
