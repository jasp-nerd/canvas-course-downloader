<script lang="ts">
  // Canvas's own course package (.imscc) on a teacher's receipt: Canvas builds it
  // on its servers, so this row follows it after the copy itself is saved.
  import { browser } from 'wxt/browser';
  import type { CoursePackageState } from '../../app/export-job';
  import Icon from '../../ui/Icon.svelte';
  import Logo from '../../ui/Logo.svelte';

  let { pkg }: { pkg: CoursePackageState } = $props();

  const WHERE = 'Settings › Export Course Content in Canvas';
  const text = $derived(
    {
      building: `Canvas is building it${pkg.percent ? ` (${Math.round(pkg.percent)}%)` : ''}. Leave this tab open; it can take a few minutes.`,
      saved: pkg.savedAs ?? 'Saved in your Downloads folder.',
      'not-allowed':
        "Canvas didn't let you create a course package for this course. Only teachers, TAs and designers can. Your readable copy is complete.",
      slow: `Canvas is still building it. Download it later from ${WHERE}.`,
      failed: `Canvas couldn't build it this time. Your readable copy is complete; you can export the package yourself from ${WHERE}.`,
      session: 'You were signed out of Canvas. Sign in, then download the course again.',
    }[pkg.state],
  );
</script>

<section
  class="package"
  class:done={pkg.state === 'saved'}
  aria-labelledby="package-title"
  aria-live="polite"
>
  <span class="badge">
    {#if pkg.state === 'building'}
      <Logo size={26} looping />
    {:else if pkg.state === 'saved'}
      <Icon name="check" size={22} />
    {:else}
      <Icon name="alert" size={22} />
    {/if}
  </span>
  <span>
    <strong id="package-title"
      >Canvas course package (.imscc){pkg.state === 'saved' ? ' saved' : ''}</strong
    >
    <span class="why">{text}</span>
  </span>
  {#if pkg.state === 'saved' && pkg.downloadId !== undefined}
    {@const id = pkg.downloadId}
    <button
      type="button"
      class="btn btn-light btn-sm"
      onclick={() => void browser.downloads.show(id)}
    >
      <Icon name="folder" size={18} />Show in folder
    </button>
  {/if}
</section>

<style>
  .package {
    margin: 12px 40px 0;
    border-radius: 20px;
    background: var(--mist);
    padding: 16px 24px;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) auto;
    gap: 16px;
    align-items: center;
  }
  .package.done {
    background: var(--mint-wash);
    color: #0f4c32;
  }
  .badge {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: #fff;
    display: grid;
    place-items: center;
    color: var(--ink-2);
  }
  .done .badge {
    color: var(--mint-ink);
  }
  strong {
    display: block;
    font-size: 15px;
  }
  .why {
    display: block;
    font-size: 14px;
    line-height: 1.45;
    color: var(--ink-2);
  }
  .done .why {
    color: #0f4c32;
  }
  @media (max-width: 640px) {
    .package {
      margin: 12px 16px 0;
      grid-template-columns: 40px minmax(0, 1fr);
    }
    .package .btn {
      grid-column: 2;
      justify-self: start;
    }
  }
</style>
