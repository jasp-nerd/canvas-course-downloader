<script lang="ts">
  // "Show in folder" for what the browser downloaded. A folder the user chose
  // can't be opened from here, so the receipt says where it is instead.
  import type { CourseState } from '../../app/export-job';
  import Icon from '../../ui/Icon.svelte';
  import { showInFolder } from './actions';

  let {
    course,
    light = false,
    describedby,
  }: {
    course: CourseState;
    /** The quieter look, for buttons beside other buttons or in a list. */
    light?: boolean;
    /** The course it's for, when several receipts each have one. */
    describedby?: string;
  } = $props();

  const folder = $derived(course.how.folder);
</script>

{#if folder !== undefined}
  <p class="saved-in">
    <Icon name="folder" size={18} />{folder
      ? `Saved in “${folder}”`
      : 'Saved in the folder you chose'}
  </p>
{:else}
  <button
    type="button"
    class="btn {light ? 'btn-light btn-sm' : 'btn-dark'}"
    aria-describedby={describedby}
    onclick={() => showInFolder(course)}
  >
    <Icon name="folder" />Show in folder
  </button>
{/if}

<style>
  .saved-in {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-weight: 600;
    font-size: 15px;
  }
</style>
