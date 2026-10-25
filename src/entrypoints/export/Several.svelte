<script lang="ts">
  // Receipts for several courses downloaded together: how it went overall,
  // then one compact receipt per course.
  import type { CourseState } from '../../app/export-job';
  import { MASCOT_NAME } from '../../ui/brand';
  import Icon from '../../ui/Icon.svelte';
  import Pip from '../../ui/Pip.svelte';
  import { tryAgain } from './actions';
  import CompactReceipt from './CompactReceipt.svelte';
  import type { SupportCardMode } from '../../app/support';
  import SupportCard from './SupportCard.svelte';

  let { courses, showSupport }: { courses: CourseState[]; showSupport: SupportCardMode } = $props();

  const saved = $derived(courses.filter((c) => c.outcome === 'success' || c.outcome === 'partial'));
  const stopped = $derived(courses.some((c) => c.outcome === 'cancelled'));
  const notSaved = $derived(courses.filter((c) => !saved.includes(c)));
  const heading = $derived(
    stopped
      ? 'You stopped the download'
      : saved.length === courses.length
        ? `${courses.length} courses are saved`
        : saved.length
          ? `${saved.length} of ${courses.length} courses are saved`
          : 'No course was saved',
  );
  const tone = $derived(
    stopped
      ? 'field-mist'
      : saved.length === 0
        ? 'field-red-wash'
        : saved.length < courses.length || saved.some((c) => c.outcome === 'partial')
          ? 'field-sun-wash'
          : 'field-mint-wash',
  );
</script>

<section class="band {tone}">
  <div class="band-text">
    <h1 class="display">{heading}</h1>
    <p class="band-meta">Each course has its own receipt below.</p>
    {#if notSaved.length}
      <div class="row band-actions">
        <button
          type="button"
          class="btn btn-primary"
          onclick={() => tryAgain(notSaved.map((c) => c.id))}
          >{notSaved.length === 1 ? 'Try again' : `Try the ${notSaved.length} again`}</button
        >
      </div>
    {/if}
  </div>
  {#if saved.length === 0 && !stopped}
    <Pip pose="worried" height={220} alt={`${MASCOT_NAME}, worried`} class="band-pip" />
  {:else}
    <Pip pose="cheer" height={220} class="band-pip" />
  {/if}
</section>

<main class="stack">
  {#each courses as course (course.id)}
    <CompactReceipt {course} />
  {/each}
  {#if saved.length && courses[0]?.how.updates}
    <div class="notice notice-mint">
      <Icon name="refresh" />
      <span>Next time only new files are added to each course.</span>
    </div>
  {/if}
  {#if showSupport}<SupportCard mode={showSupport} />{/if}
</main>

<style>
  .stack {
    display: grid;
    gap: 16px;
    padding: 20px 40px 40px;
    max-width: 1200px;
  }
  @media (max-width: 1040px) {
    .stack {
      padding: 16px 16px 32px;
    }
  }
</style>
