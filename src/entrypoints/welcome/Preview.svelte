<script lang="ts">
  import Icon from '../../ui/Icon.svelte';
  import type { PreviewRow } from './examples';

  let {
    label,
    rows,
    foot,
    tone = 'ink',
  }: {
    label: string;
    rows: PreviewRow[];
    foot?: string;
    /** Colour of the top-level icons. */
    tone?: 'ink' | 'sun' | 'mint';
  } = $props();
</script>

<div class="card preview tone-{tone}">
  <span class="label">{label}</span>
  <ul class="rows">
    {#each rows as row (row.name)}
      <li class="row" class:nested={row.nested} class:strong={row.strong}>
        <Icon name={row.icon} size={row.nested ? 16 : 18} />
        <span class="name">{row.name}</span>
        {#if row.chip}
          <span class="chip chip-mint">{row.chip}</span>
        {:else if row.note}
          <span class="small">{row.note}</span>
        {/if}
      </li>
    {/each}
  </ul>
  {#if foot}<span class="small">{foot}</span>{/if}
</div>

<style>
  .preview {
    position: absolute;
    top: 40px;
    left: 40px;
    right: 40px;
    padding: 18px 20px;
    display: grid;
    gap: 8px;
    color: var(--ink);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
  }
  li {
    min-height: 34px;
    font-size: 14px;
  }
  li.strong {
    font-weight: 600;
  }
  li.nested {
    padding-left: 26px;
    border-top: 0;
  }
  li :global(svg) {
    color: var(--ink-3);
  }
  .tone-sun li:not(.nested) :global(svg) {
    color: var(--sun-ink);
  }
  .tone-mint li:not(.nested) :global(svg) {
    color: var(--mint-ink);
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .small {
    font-weight: 400;
    white-space: nowrap;
  }
  .chip {
    font-variant-numeric: tabular-nums;
  }
</style>
