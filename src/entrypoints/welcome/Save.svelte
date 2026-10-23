<script lang="ts">
  import { canChooseFolder } from '../../storage/folder';
  import Icon from '../../ui/Icon.svelte';
  import { chooseFolder, setup } from './setup.svelte';

  // Chromium only; Firefox and Brave have no folder picker.
  const folderPicker = canChooseFolder();
  const study = $derived(setup.answers.goal === 'study');
</script>

<h1 class="display" tabindex="-1">How should we save your courses?</h1>
<div class="as">
  <div class="cards" role="radiogroup" aria-label="Save as">
    <label class="big">
      <input
        type="radio"
        name="as"
        value={true}
        bind:group={setup.answers.zipMode}
        onchange={() => (setup.zipChosen = true)}
      />
      <Icon name="archive" size={28} />
      <strong>One ZIP per course</strong>
      <span class="small">One packed file per course, tidy for backups. Unpack it to open.</span>
    </label>
    <label class="big">
      <input
        type="radio"
        name="as"
        value={false}
        bind:group={setup.answers.zipMode}
        onchange={() => (setup.zipChosen = true)}
      />
      <Icon name="folder" size={28} />
      <strong>Folders</strong>
      <span class="small">Files you can open right away, nothing to unpack.</span>
    </label>
  </div>
  {#if study}
    <p class="small hint">Folders are easier to drag into your AI tool.</p>
  {/if}
</div>

<div class="where">
  <span class="label" id="where">Where</span>
  <div class="places">
    <div class="row" role="radiogroup" aria-labelledby="where">
      <label class="place">
        <input type="radio" name="where" value="downloads" bind:group={setup.answers.saveTo} />
        Downloads
      </label>
      <label class="place" class:disabled={!folderPicker}>
        <input
          type="radio"
          name="where"
          value="folder"
          disabled={!folderPicker}
          bind:group={setup.answers.saveTo}
          onchange={chooseFolder}
        />
        A folder I choose
      </label>
    </div>
    {#if !folderPicker}
      <span class="small">This browser can only save to Downloads.</span>
    {:else if setup.answers.saveTo === 'folder' && setup.folder}
      <span class="small"
        >Saving into {setup.folder.name}.
        <button type="button" class="link" onclick={chooseFolder}>Choose another</button></span
      >
    {:else}
      <span class="small">Pick one in Google Drive or OneDrive to back up to the cloud.</span>
    {/if}
  </div>
</div>

{#if !study}
  <label class="new">
    <input
      type="checkbox"
      role="switch"
      class="toggle"
      bind:checked={setup.answers.incrementalMode}
    />
    <span>
      <strong>Next time, only add what's new</strong>
      <span class="small">No duplicates. Changed files get the date in their name.</span>
    </span>
  </label>
{/if}

<style>
  .as {
    display: grid;
    gap: 10px;
  }
  .cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .big {
    position: relative;
    display: grid;
    gap: 8px;
    align-content: start;
    padding: 16px 18px;
    border-radius: var(--r-choice);
    background: #fff;
    box-shadow: inset 0 0 0 2px var(--line);
    cursor: pointer;
    transition:
      box-shadow 0.12s,
      background-color 0.12s;
  }
  .big:hover {
    box-shadow: inset 0 0 0 2px var(--control);
  }
  .big:has(input:checked) {
    background: var(--red-wash);
    box-shadow: inset 0 0 0 2px var(--red);
  }
  .big:has(input:focus-visible) {
    outline: 3px solid var(--ink);
    outline-offset: 2px;
  }
  .big input,
  .place input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .big strong {
    font-size: 16px;
    line-height: 1.3;
  }
  .hint {
    margin: 0;
  }

  .where {
    display: grid;
    gap: 10px;
  }
  .places {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
  }
  .places .row {
    gap: 8px;
  }
  .places .small {
    flex: 1 1 200px;
  }
  .place {
    position: relative;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    height: 40px;
    padding: 0 16px;
    border-radius: var(--r-pill);
    box-shadow: inset 0 0 0 1.5px var(--control);
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
  }
  .place:has(input:checked) {
    box-shadow: inset 0 0 0 2px var(--red);
    background: var(--red-wash);
    color: var(--red-ink);
  }
  .place:has(input:focus-visible) {
    outline: 3px solid var(--ink);
    outline-offset: 2px;
  }
  .place.disabled {
    color: var(--ink-3);
    background: var(--mist);
    box-shadow: none;
    cursor: not-allowed;
  }

  .new {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-radius: var(--r-choice);
    background: var(--mist);
    cursor: pointer;
  }
  .new strong {
    display: block;
    font-size: 15px;
  }
  .new .small {
    display: block;
  }

  @media (prefers-reduced-motion: reduce) {
    .big {
      transition: none;
    }
  }
</style>
