<script lang="ts">
  // One course that wasn't saved: what went wrong in a plain sentence, or that
  // the user stopped it, and a way to start again.
  import type { CourseState } from '../../app/export-job';
  import { MASCOT_NAME } from '../../ui/brand';
  import Icon from '../../ui/Icon.svelte';
  import Pip from '../../ui/Pip.svelte';
  import { tryAgain } from './actions';

  let { course }: { course: CourseState } = $props();

  const stopped = $derived(course.outcome === 'cancelled');
  const name = $derived(course.named ? course.name : 'The course');
</script>

<section class="band" class:field-red-wash={!stopped} class:field-mist={stopped}>
  <div class="band-text">
    {#if stopped}
      <span class="chip chip-line band-chip"><Icon name="x" />Stopped</span>
      <h1 class="display">You stopped the download</h1>
      <p class="band-meta">
        {course.how.zip
          ? 'A ZIP is only saved at the end, so nothing was saved.'
          : `Files saved before you stopped are in ${course.destination ?? 'the course folder'}.`}
      </p>
    {:else}
      <span class="chip chip-red band-chip"><Icon name="error" />Not saved</span>
      <h1 class="display">{name} wasn't saved</h1>
      <div class="notice notice-red">
        <Icon name="error" />
        <span>{course.error ?? 'Nothing could be saved.'}</span>
      </div>
    {/if}
    <div class="row band-actions">
      <button type="button" class="btn btn-primary" onclick={() => tryAgain([course.id])}
        >Try again</button
      >
    </div>
  </div>
  {#if stopped}
    <Pip pose="sleep" height={200} class="band-pip" />
  {:else}
    <Pip pose="worried" height={220} alt={`${MASCOT_NAME}, worried`} class="band-pip" />
  {/if}
</section>

<style>
  /* White, so it stands out from the band of the same colour. */
  .notice {
    max-width: 640px;
    background: #fff;
  }
</style>
