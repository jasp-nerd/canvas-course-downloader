<script lang="ts">
  // The Dashboard note: what's new in courses saved before, by name, in one slim
  // row under Canvas's header. Reads pageState, so it changes in place as results
  // come in. Hiding it is remembered for what it lists, and the row then says so
  // for a few seconds with the way out, "Don't show these again" (the pattern of
  // Gmail's "Undo" bar): the choice comes when someone has just shown they don't
  // want the note, and no sooner.
  import { tick } from 'svelte';
  import { noteDetails, notePreview, noteTitle } from '../../app/updates';
  import { PRODUCT_NAME } from '../../ui/brand';
  import Icon from '../../ui/Icon.svelte';
  import Logo from '../../ui/Logo.svelte';
  import { pageState } from './state.svelte';

  let {
    ondownload,
    ondismiss,
    onturnoff,
    onundo,
    onclose,
  }: {
    ondownload: () => void;
    ondismiss: () => void;
    onturnoff: () => void;
    onundo: () => void;
    onclose: () => void;
  } = $props();

  const title = $derived(noteTitle(pageState.pending));
  const preview = $derived(notePreview(pageState.pending));
  const details = $derived(noteDetails(pageState.pending));

  // The row's first button after each step gets focus, so keyboard users keep their place.
  let first = $state<HTMLButtonElement>();
  async function then(step: () => void) {
    step();
    await tick();
    first?.focus();
  }

  // "Hidden" and "Won't show again" go away by themselves, but not while someone points at them or tabs through.
  let paused = $state(false);
  $effect(() => {
    if (pageState.note === 'news' || paused) return;
    const timer = setTimeout(onclose, 8000);
    return () => clearTimeout(timer);
  });
  const pause = () => (paused = true);
  const resume = () => (paused = false);
</script>

<div
  class="cd note"
  role="status"
  onmouseenter={pause}
  onmouseleave={resume}
  onfocusin={pause}
  onfocusout={resume}
>
  <Logo size={22} />
  {#if pageState.note === 'hidden'}
    <p class="what">
      <strong>Hidden</strong>
      <span class="names">until something new comes in.</span>
    </p>
    <div class="actions">
      <button
        type="button"
        class="btn btn-text btn-sm"
        bind:this={first}
        onclick={() => then(onturnoff)}>Don't show these again</button
      >
      <button type="button" class="icon-btn" aria-label="Close" onclick={onclose}>
        <Icon name="x" />
      </button>
    </div>
  {:else if pageState.note === 'off'}
    <p class="what">
      <strong>Won't show again.</strong>
      <span class="names">Turn it back on in {PRODUCT_NAME}'s settings, under Updates.</span>
    </p>
    <div class="actions">
      <button
        type="button"
        class="btn btn-text btn-sm"
        bind:this={first}
        onclick={() => then(onundo)}>Undo</button
      >
      <button type="button" class="icon-btn" aria-label="Close" onclick={onclose}>
        <Icon name="x" />
      </button>
    </div>
  {:else}
    <p class="what" id="ccd-note-what" title={details}>
      <strong>{title}</strong>
      <span class="names">{preview}</span>
    </p>
    <div class="actions">
      <button
        type="button"
        class="btn btn-light btn-sm"
        aria-describedby="ccd-note-what"
        onclick={ondownload}
      >
        <Icon name="download" size={16} />Download
      </button>
      <button
        type="button"
        class="icon-btn"
        aria-label="Dismiss"
        title="Hide until something new comes in"
        onclick={() => then(ondismiss)}
      >
        <Icon name="x" />
      </button>
    </div>
  {/if}
</div>

<style>
  /* Canvas's dashboard header and its rule sit above; px, as rem follows Canvas's root size. */
  .note {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 16px 0 20px;
    padding: 6px 6px 6px 14px;
    min-height: 48px;
    border-radius: 14px;
    background: var(--mint-wash);
    color: #0f4c32;
    font-size: 14px;
    line-height: 1.4;
  }
  .note > :global(svg) {
    flex: none;
  }
  .what {
    flex: 1;
    min-width: 0;
    /* Long names wrap once, then end in "…"; every name is in the tooltip. */
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    overflow-wrap: anywhere;
  }
  strong {
    font-weight: 700;
    margin-right: 6px;
  }
  .names {
    color: #2c6a4c;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: none;
  }
  /* White with an outline dark enough to read as a button on the mint. */
  .btn-light {
    height: 36px;
    box-shadow: inset 0 0 0 1.5px var(--mint-ink);
  }
  .btn-light:hover {
    box-shadow: inset 0 0 0 1.5px #0f4c32;
  }
  .btn-text {
    color: #0f4c32;
  }
  .icon-btn {
    width: 36px;
    height: 36px;
    color: #0f4c32;
  }
  .icon-btn:hover {
    background: rgba(255, 255, 255, 0.6);
    color: #0f4c32;
  }
</style>
