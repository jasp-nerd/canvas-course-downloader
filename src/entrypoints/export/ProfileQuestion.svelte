<script lang="ts">
  import { PROFILES } from '../../app/profiles';
  import { AI_TARGETS, type AiTargetId } from '../../export/study-pack';
  import type { Settings } from '../../storage/settings';

  let { onchoose }: { onchoose: (choice: Pick<Settings, 'profile' | 'aiTarget'>) => void } =
    $props();

  let profile = $state<Settings['profile']>('copy');
  let aiTarget = $state<AiTargetId>('notebooklm');
</script>

<form
  class="question"
  aria-labelledby="question-title"
  onsubmit={(e) => {
    e.preventDefault();
    onchoose({ profile, aiTarget });
  }}
>
  <h2 id="question-title">What should your downloads be?</h2>
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
    <button type="submit" class="primary">Start download</button>
    <span class="hint">You can change this anytime in Settings.</span>
  </div>
</form>

<style>
  .question {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px 18px;
    margin: 24px 0 0;
    display: grid;
    gap: 12px;
  }
  h2 {
    font-size: 17px;
    margin: 0;
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
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
  }
  .card.chosen {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }
  .card input {
    margin-top: 4px;
  }
  small {
    display: block;
    color: var(--muted);
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  select {
    font: inherit;
    padding: 7px 9px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    max-width: 320px;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }
  .hint {
    color: var(--muted);
    font-size: 13px;
  }
  .primary {
    font: inherit;
    padding: 8px 16px;
    border-radius: 8px;
    border: 0;
    background: var(--accent);
    color: var(--surface);
    font-weight: 600;
    cursor: pointer;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .primary:focus-visible,
  input:focus-visible,
  select:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
