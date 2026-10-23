<script lang="ts">
  // What a receipt needs to say besides the counts: files that couldn't be
  // downloaded, a folder that couldn't be used, and how updates work.
  import type { CourseState } from '../../app/export-job';
  import Icon from '../../ui/Icon.svelte';

  let { course }: { course: CourseState } = $props();

  const failed = $derived(course.failures.length);
  const skipped = $derived(course.skipped);
</script>

{#if failed}
  <div class="notice notice-sun">
    <Icon name="alert" />
    <span
      >{failed === 1 ? "1 file couldn't be downloaded." : `${failed} files couldn't be downloaded.`}
      {failed === 1 ? "It's" : "They're"} marked in the list and named in _download_errors.csv.</span
    >
  </div>
{/if}
{#if course.note}
  <div class="notice notice-sun">
    <Icon name="alert" />
    <span>{course.note}</span>
  </div>
{/if}
{#if course.update}
  <div class="notice notice-mint">
    <Icon name="refresh" />
    <span
      >This update has only new and changed files{#if skipped}: {skipped === 1
          ? '1 file you already had was skipped'
          : `${skipped} files you already had were skipped`}{/if}.</span
    >
  </div>
{:else if course.how.updates}
  <div class="notice notice-mint">
    <Icon name="refresh" />
    <span
      >{course.how.zip
        ? 'Next time only new files are added, as a separate ZIP with the date in its name.'
        : 'Next time only new files are added. Changed files get the date in their name.'}</span
    >
  </div>
{/if}
