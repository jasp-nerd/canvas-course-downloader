<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from 'wxt/browser';
  import { AI_TARGETS } from '../../export/study-pack';
  import Icon from '../../ui/Icon.svelte';
  import type { IconName } from '../../ui/icons';
  import { setup } from './setup.svelte';

  type Chip = { text: string; tone: 'red' | 'sun' | 'navy' | 'mint' | 'line'; icon?: IconName };

  /** The summary repeats exactly what was chosen; testers distrusted one that didn't. */
  const chips = $derived.by((): Chip[] => {
    const a = setup.answers;
    const what: Chip[] =
      a.goal === 'copy'
        ? [{ text: 'A copy to keep', tone: 'red', icon: 'folder' }]
        : a.goal === 'study'
          ? [{ text: `Study pack for ${AI_TARGETS[a.aiTarget].label}`, tone: 'sun', icon: 'ai' }]
          : a.goal === 'code'
            ? [{ text: 'Files for coding agents', tone: 'navy', icon: 'code' }]
            : [
                { text: 'Course archive', tone: 'red', icon: 'teacher' },
                a.includeStudentWork
                  ? { text: 'With student work', tone: 'sun', icon: 'users' }
                  : { text: 'No student data', tone: 'mint', icon: 'userX' },
              ];
    return [
      ...what,
      { text: a.zipMode ? 'One ZIP per course' : 'Folders', tone: 'line' },
      {
        text: a.saveTo === 'folder' && setup.folder ? setup.folder.name : 'Downloads',
        tone: 'line',
      },
      // Study packs are always made whole.
      ...(a.goal === 'study'
        ? []
        : [
            a.incrementalMode
              ? ({ text: "Only what's new", tone: 'mint' } as const)
              : ({ text: 'Whole course each time', tone: 'line' } as const),
          ]),
    ];
  });

  let pinned = $state(false);
  onMount(async () => {
    // Chromium only; elsewhere the tip always shows.
    const action = browser.action as typeof browser.action & {
      getUserSettings?: () => Promise<{ isOnToolbar?: boolean }>;
    };
    if (action.getUserSettings) pinned = (await action.getUserSettings()).isOnToolbar ?? false;
  });
</script>

<h1 class="display" tabindex="-1">You're all set</h1>
<p class="lead">
  Open any course in Canvas and press the button with our logo. On your dashboard, pick several
  courses at once.
</p>

<div class="card summary">
  <span class="label" id="your-downloads">Your downloads</span>
  {#if setup.skippedFrom}
    <p class="skipped">We'll ask what you want at your first download.</p>
  {:else}
    <ul class="chips" aria-labelledby="your-downloads">
      {#each chips as chip (chip.text)}
        <li class="chip chip-{chip.tone}">
          {#if chip.icon}<Icon name={chip.icon} size={14} />{/if}{chip.text}
        </li>
      {/each}
    </ul>
  {/if}
  <button type="button" class="link small" onclick={() => browser.runtime.openOptionsPage()}
    >Change any of this in Settings</button
  >
</div>

{#if setup.saveError}
  <div class="notice notice-red" role="alert">
    <Icon name="alert" />
    <span>Your choices couldn't be saved ({setup.saveError}). You can set them in Settings.</span>
  </div>
{/if}

{#if !pinned}
  <div class="pin">
    <span class="row pin-icons">
      <Icon name="puzzle" size={22} />
      <Icon name="arrowRight" size={16} />
      <span class="pin-red"><Icon name="pin" size={22} /></span>
    </span>
    <span>
      <strong>Pin us to your toolbar</strong>
      <span class="small">Click the puzzle piece next to the address bar, then the pin.</span>
    </span>
  </div>
{/if}

<style>
  .summary {
    padding: 16px 18px;
    display: grid;
    gap: 10px;
    justify-items: start;
  }
  .chips {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .skipped {
    margin: 0;
    font-size: 15px;
  }
  .pin {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-radius: var(--r-choice);
    background: var(--mist);
  }
  .pin-icons {
    gap: 4px;
    flex: none;
  }
  .pin-icons > :global(svg:nth-child(2)) {
    color: var(--ink-3);
  }
  .pin-red {
    color: var(--red);
  }
  .pin strong {
    display: block;
    font-size: 15px;
  }
  .pin .small {
    display: block;
  }
</style>
