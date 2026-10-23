<script lang="ts">
  // What a receipt needs to say besides the counts: files that couldn't be
  // downloaded, a folder that couldn't be used, and how updates work.
  import type { CourseState } from '../../app/export-job';
  import Icon from '../../ui/Icon.svelte';

  let { course }: { course: CourseState } = $props();

  const failed = $derived(course.failures.length);
  const skipped = $derived(course.skipped);
  const asked = $derived(course.failures.some((f) => f.reason === 'USER_CANCELED'));
  const held = $derived(course.failures.filter((f) => f.reason === 'HELD_BY_BROWSER').length);
</script>

{#if asked && !course.how.zip}
  <div class="notice notice-sun">
    <Icon name="info" />
    <span
      >Your browser asked where to save a file and the window was closed, so the rest weren't saved.
      If it asks for every file, turn off "Ask where to save each file" in its download settings, or
      choose "One ZIP per course" in Settings, which asks at most once.</span
    >
  </div>
{/if}
{#if held}
  <div class="notice notice-sun">
    <Icon name="info" />
    <span
      >Your browser is holding {held === 1 ? '1 file' : `${held} files`} it thinks could be harmful, such
      as code files. Open its downloads list (Ctrl+J, or Cmd+Shift+J on a Mac) and choose Keep, or save
      the course as one ZIP.</span
    >
  </div>
{/if}

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
