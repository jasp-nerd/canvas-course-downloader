<script lang="ts">
  import Setting from './Setting.svelte';
  import { folderAccess, options, save } from './state.svelte';

  const settings = $derived(options.settings);
  const into = $derived(
    folderAccess === 'yes' && settings.saveTo === 'folder' && options.folderName
      ? options.folderName
      : 'Downloads',
  );
</script>

<Setting
  id="s-folder"
  title="Folder name"
  text="Courses go into this folder, so they stay together. Leave it empty to save straight into {into}."
>
  <label class="field">
    <span class="label">Folder inside {into}</span>
    <input
      class="input"
      type="text"
      placeholder="For example, Canvas"
      value={settings.folderPrefix}
      onchange={(e) => save({ folderPrefix: e.currentTarget.value.trim() })}
    />
  </label>
</Setting>

<Setting
  id="s-conflict"
  title="When a file is already there"
  text="Keep both saves the new file with a number added to its name."
>
  <div class="seg" role="radiogroup" aria-labelledby="s-conflict">
    <label
      ><input
        type="radio"
        name="conflict"
        checked={settings.conflictAction !== 'overwrite'}
        onchange={() => save({ conflictAction: 'uniquify' })}
      />Keep both</label
    >
    <label
      ><input
        type="radio"
        name="conflict"
        checked={settings.conflictAction === 'overwrite'}
        onchange={() => save({ conflictAction: 'overwrite' })}
      />Replace it</label
    >
  </div>
</Setting>

<style>
  .field {
    display: grid;
    gap: 6px;
    width: 100%;
    max-width: 420px;
  }
</style>
