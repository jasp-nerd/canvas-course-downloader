<script lang="ts">
  import type { Snippet } from 'svelte';

  // One setting: what it is on the left, its controls on the right.
  let {
    id,
    title,
    text,
    children,
  }: { id: string; title: string; text?: string; children: Snippet } = $props();
</script>

<section class="set" aria-labelledby={id}>
  <div class="set-l">
    <h2 {id}>{title}</h2>
    {#if text}<p>{text}</p>{/if}
  </div>
  <div class="set-r">{@render children()}</div>
</section>

<style>
  .set {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    gap: 40px;
    align-items: start;
  }
  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.5;
  }
  p {
    margin: 4px 0 0;
    font-size: 14px;
    line-height: 1.45;
    color: var(--ink-3);
  }
  .set-r {
    display: grid;
    gap: 12px;
    justify-items: start;
    min-width: 0;
  }
  @media (max-width: 1100px) {
    .set {
      grid-template-columns: minmax(0, 1fr);
      gap: 14px;
    }
  }
</style>
