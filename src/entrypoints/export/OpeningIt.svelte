<script lang="ts">
  // How to open a saved ZIP: unpack it, then open the overview page. On Windows
  // a double-click only previews a ZIP, and pages opened from the preview lose
  // their links, so Windows gets this without asking.
  import type { CourseState } from '../../app/export-job';
  import Icon from '../../ui/Icon.svelte';

  let { course, isWindows }: { course: CourseState; isWindows: boolean } = $props();

  const zipName = $derived(course.savedAs?.split(/[/\\]/).pop() ?? `${course.name}.zip`);
  const overview = $derived(course.overview ?? `Open me - ${course.name}.html`);
  const folders = $derived(
    course.kinds
      .filter((k) => k.id !== 'course' && k.done > 0)
      .map((k) => k.label)
      .join(', '),
  );
</script>

<section class="card opening" id="opening-it" aria-labelledby="opening-title">
  <h2 class="heading" id="opening-title">Opening it</h2>
  <p class="lede">
    Unpack the ZIP first, then open <strong>{overview}</strong> in your browser. Every page and file is
    linked from there, and it works offline.
  </p>
  <ul class="tree">
    <li class="zip"><Icon name="archive" size={18} />{zipName}</li>
    <li class="indent">
      <Icon name="file" size={16} /><strong>{overview}</strong><span class="small"
        >open this first</span
      >
    </li>
    {#if folders}
      <li class="indent muted"><Icon name="folder" size={16} />{folders}</li>
    {/if}
  </ul>
  {#if isWindows}
    <p class="how">
      Right-click the ZIP and choose Extract All, then open ‘{overview}’. Pages opened inside the
      ZIP without extracting lose their links.
    </p>
  {:else}
    <p class="how">Windows: right-click the ZIP and choose Extract All. Mac: double-click it.</p>
  {/if}
</section>

<style>
  .opening {
    border-radius: 24px;
    padding: 20px 24px;
    display: grid;
    gap: 12px;
    align-content: start;
  }
  h2 {
    font-size: 17px;
  }
  p {
    margin: 0;
    font-size: 14px;
    color: var(--ink-2);
  }
  strong {
    color: var(--ink);
    overflow-wrap: anywhere;
  }
  .tree {
    list-style: none;
    margin: 0;
    padding: 4px 14px;
    border-radius: 14px;
    background: var(--mist);
  }
  .tree li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 34px;
    font-size: 14px;
    min-width: 0;
  }
  .tree li + li {
    border-top: 1px solid var(--mist-2);
  }
  .zip {
    font-weight: 600;
  }
  .zip > :global(svg) {
    color: var(--mint-ink);
  }
  .indent {
    padding-left: 28px;
  }
  .indent > :global(svg) {
    color: var(--red);
  }
  .indent .small {
    margin-left: auto;
    white-space: nowrap;
  }
  .muted {
    color: var(--ink-2);
  }
  .muted > :global(svg) {
    color: var(--ink-3);
  }
  .how {
    color: var(--ink-3);
  }
</style>
