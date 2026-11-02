<script lang="ts">
  // An update's receipt rows: what it brought, by name. New and changed files,
  // and the pages, assignments and announcements Canvas changed since the last
  // download. Pages written again unchanged aren't news, so they aren't listed.
  import type { CourseState } from '../../app/export-job';
  import { listNews, type KindId } from '../../app/receipt';
  import { tick } from 'svelte';
  import Icon from '../../ui/Icon.svelte';
  import type { IconName } from '../../ui/icons';

  let {
    course,
    labelledby,
    limit = 8,
  }: { course: CourseState; labelledby: string; limit?: number } = $props();

  const ICONS: Partial<Record<KindId, IconName>> = {
    pages: 'fileText',
    assignments: 'listChecks',
    announcements: 'messageSquare',
  };
  const items = $derived(listNews(course.whatsNew ?? []));
  let showAll = $state(false);
  // "Show all 9" for one more row would be silly: then show them all.
  const shown = $derived(showAll || items.length <= limit + 1 ? items : items.slice(0, limit));
  let list = $state<HTMLUListElement>();
  /** Shows the rest, and moves focus to the first row that appeared. */
  async function showRest() {
    showAll = true;
    await tick();
    list?.querySelectorAll<HTMLElement>('li')[limit]?.focus();
  }
</script>

{#if items.length}
  <ul class="news" aria-labelledby={labelledby} bind:this={list}>
    {#each shown as item (item.path)}
      <li class="receipt-row" tabindex="-1">
        <span class="icon"><Icon name={ICONS[item.kind] ?? 'file'} /></span>
        <span class="name"
          >{item.name}{#if item.what}<span class="small hint">{` ${item.what}`}</span>{/if}</span
        >
        <span class="chip" class:chip-mint={item.news === 'new'}
          >{item.news === 'new' ? 'New' : 'Updated'}</span
        >
      </li>
    {/each}
  </ul>
  {#if shown.length < items.length}
    <button type="button" class="btn btn-light btn-sm more" onclick={showRest}
      ><Icon name="chevronDown" />Show all {items.length}</button
    >
  {/if}
{:else}
  <p class="nothing">Nothing changed on Canvas since your last download.</p>
{/if}

<style>
  .news {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
  }
  .news > li + li {
    border-top: 1px solid var(--mist-2);
  }
  .receipt-row {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    min-height: 50px;
  }
  .icon {
    color: var(--ink-2);
  }
  .name {
    overflow-wrap: anywhere;
  }
  .hint {
    color: var(--ink-3);
  }
  li:focus {
    outline: none;
  }
  li:focus-visible {
    outline: 3px solid var(--ink);
    outline-offset: 2px;
    border-radius: 6px;
  }
  /* White with an outline: it sits on a white card, and "New" gets the mint tint. */
  .chip {
    background: #fff;
    box-shadow: inset 0 0 0 1.5px var(--mist-2);
    color: var(--ink-2);
  }
  .chip-mint {
    background: var(--mint-wash);
    box-shadow: none;
    color: var(--mint-ink);
  }
  .more {
    justify-self: start;
    margin-top: 10px;
  }
  .nothing {
    margin: 8px 0 4px;
    color: var(--ink-2);
  }
</style>
