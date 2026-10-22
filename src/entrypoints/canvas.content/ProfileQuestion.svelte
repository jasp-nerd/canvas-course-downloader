<script lang="ts">
  import { onMount } from 'svelte';
  import { PROFILES } from '../../app/profiles';
  import { AI_TARGETS, type AiTargetId } from '../../export/study-pack';
  import type { Settings } from '../../storage/settings';
  import { canvasButtonColors } from '../../ui/contrast';

  let {
    onchoose,
    oncancel,
  }: {
    onchoose: (choice: Pick<Settings, 'profile' | 'aiTarget'>) => void;
    oncancel: () => void;
  } = $props();

  let profile = $state<Settings['profile']>('copy');
  let aiTarget = $state<AiTargetId>('notebooklm');
  let dialog: HTMLDialogElement | undefined = $state();
  const colors = canvasButtonColors();

  // A modal dialog sits above anything Canvas stacks, with the page inert behind it.
  onMount(() => dialog?.showModal());
</script>

<!-- Escape fires "cancel"; a click on the backdrop lands on the dialog element itself. -->
<dialog
  aria-labelledby="ccd-question-title"
  bind:this={dialog}
  oncancel={(e) => {
    e.preventDefault();
    oncancel();
  }}
  onclick={(e) => {
    if (e.target === dialog) oncancel();
  }}
>
  <form
    onsubmit={(e) => {
      e.preventDefault();
      onchoose({ profile, aiTarget });
    }}
  >
    <header>
      <h2 id="ccd-question-title">What should your downloads be?</h2>
      <button type="button" class="close" aria-label="Close" onclick={oncancel}>×</button>
    </header>
    <fieldset>
      <legend class="visually-hidden">What should your downloads be?</legend>
      {#each PROFILES as choice (choice.profile)}
        <label class="card" class:chosen={profile === choice.profile}>
          <input type="radio" name="profile" value={choice.profile} bind:group={profile} />
          <span>
            <strong>{choice.title}</strong>
            <small>{choice.text}</small>
          </span>
        </label>
      {/each}
    </fieldset>
    {#if profile === 'study'}
      <label class="field">
        <span>For</span>
        <select bind:value={aiTarget}>
          {#each Object.entries(AI_TARGETS) as [id, target] (id)}
            <option value={id}>{target.label}</option>
          {/each}
        </select>
      </label>
    {/if}
    <div class="actions">
      <button type="submit" class="primary" style:--bg={colors.background} style:--fg={colors.text}
        >Start download</button
      >
      <span class="hint">You can change this anytime in Settings.</span>
    </div>
  </form>
</dialog>

<style>
  /* px throughout: rem would follow the Canvas page's root font size. */
  dialog::backdrop {
    background: rgba(16, 24, 32, 0.45);
  }
  dialog {
    padding: 0;
    border: 0;
    width: min(520px, calc(100vw - 32px));
    max-height: calc(100vh - 48px);
    overflow: auto;
    background: #ffffff;
    color: #1d2733;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    font:
      14px/1.45 system-ui,
      -apple-system,
      'Segoe UI',
      Roboto,
      sans-serif;
  }
  form {
    display: grid;
    gap: 12px;
    padding: 16px 20px 20px;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font-size: 18px;
  }
  .close {
    border: 0;
    background: none;
    font-size: 24px;
    line-height: 1;
    padding: 4px 8px;
    border-radius: 6px;
    cursor: pointer;
    color: #556270;
  }
  fieldset {
    border: 0;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .card {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 10px 12px;
    border: 1px solid #d9dee4;
    border-radius: 8px;
    cursor: pointer;
  }
  .card.chosen {
    border-color: #0b5cad;
    box-shadow: 0 0 0 1px #0b5cad;
  }
  .card input {
    margin-top: 4px;
  }
  small {
    display: block;
    color: #556270;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  select {
    font: inherit;
    padding: 7px 9px;
    border: 1px solid #b8c1cb;
    border-radius: 8px;
    background: #ffffff;
    color: #1d2733;
    max-width: 320px;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }
  .hint {
    color: #556270;
    font-size: 13px;
  }
  .primary {
    font:
      600 14px/1.2 system-ui,
      -apple-system,
      'Segoe UI',
      Roboto,
      sans-serif;
    padding: 10px 16px;
    border-radius: 8px;
    border: 0;
    cursor: pointer;
    background: var(--bg);
    color: var(--fg);
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  button:focus-visible,
  input:focus-visible,
  select:focus-visible {
    outline: 3px solid #0b5cad;
    outline-offset: 2px;
  }
</style>
