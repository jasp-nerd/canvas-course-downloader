<script lang="ts">
  // The receipt for one course saved as a copy, or as files for coding agents.
  import type { CourseState } from '../../app/export-job';
  import Icon from '../../ui/Icon.svelte';
  import Pip from '../../ui/Pip.svelte';
  import CopyButton from './CopyButton.svelte';
  import Inside from './Inside.svelte';
  import { sizeOf, whenLine } from './lines';
  import Notices from './Notices.svelte';
  import OpeningIt from './OpeningIt.svelte';
  import ShowInFolder from './ShowInFolder.svelte';
  import SupportCard from './SupportCard.svelte';

  let {
    course,
    isWindows,
    showSupport,
  }: { course: CourseState; isWindows: boolean; showSupport: boolean } = $props();

  const partial = $derived(course.outcome === 'partial');
  const agents = $derived(course.how.profile === 'agents');
  const zip = $derived(course.how.zip);
  const files = $derived(course.kinds.reduce((n, k) => n + k.done, 0));
  const size = $derived(sizeOf(course));
  // Windows gets the steps for opening a ZIP without asking; elsewhere they're a click away.
  let explainChoice = $state<boolean | undefined>(undefined);
  const explain = $derived(explainChoice ?? isWindows);
  /** Where a coding agent should work: the course folder, or the folder the ZIP unzips to. */
  const agentFolder = $derived(
    course.fullPath && (zip ? course.fullPath.replace(/\.zip$/i, '') : course.fullPath),
  );
</script>

<section class="band" class:field-mint-wash={!partial} class:field-sun-wash={partial}>
  <div class="band-text">
    {#if partial}
      <span class="chip chip-sun band-chip"><Icon name="alert" />Some files missing</span>
    {:else}
      <span class="chip chip-mint band-chip"><Icon name="check" />Saved</span>
    {/if}
    <h1 class="display">{course.name} is saved</h1>
    <p class="band-meta num">
      {size ? `${size}, saved as` : 'Saved as'} <span>{course.savedAs}</span>
    </p>
    <div class="row band-actions">
      <ShowInFolder {course} />
      {#if zip && !agents}
        <button
          type="button"
          class="btn btn-text"
          aria-expanded={explain}
          aria-controls="opening-it"
          onclick={() => (explainChoice = !explain)}>How to open a ZIP</button
        >
      {/if}
    </div>
  </div>
  <Pip pose={partial ? 'think' : 'cheer'} height={240} class="band-pip" />
</section>

<main class="receipt-grid">
  <section class="card inside-card" aria-labelledby="inside-title">
    <div class="card-head">
      <h2 class="heading" id="inside-title">What's inside</h2>
      <span class="small num">{files} {files === 1 ? 'file' : 'files'}</span>
    </div>
    <Inside {course} labelledby="inside-title" />
    <div class="card-foot">
      <span class="small num">{whenLine(course)}</span>
      {#if size}<span class="num size">{size}</span>{/if}
    </div>
  </section>

  <div class="aside">
    <Notices {course} />
    {#if agents}
      <section class="card side-card" aria-labelledby="agent-title">
        <h2 class="heading" id="agent-title">Use it with a coding agent</h2>
        {#if agentFolder}
          <p>
            {zip ? 'Unzip it first. It unzips to this folder:' : 'The course is in this folder:'}
          </p>
          <div class="field">
            <code>{agentFolder}</code>
            <CopyButton text={agentFolder} label="Copy path" />
          </div>
          <p>Then start your agent there, for example Claude Code:</p>
          <div class="field">
            <code>cd "{agentFolder}" && claude</code>
            <CopyButton text={`cd "${agentFolder}" && claude`} />
          </div>
        {:else}
          <p>
            {zip ? 'Unzip it first, then open' : 'Open'} a terminal in “{course.savedAs}” and start
            your agent there, for example with <code>claude</code>.
          </p>
        {/if}
        <p class="small">
          AGENTS.md at the top of the folder tells Claude Code, Codex or Cursor what's where;
          llms.txt and course.json are there too.
        </p>
      </section>
    {:else if zip && explain}
      <OpeningIt {course} {isWindows} />
    {/if}
    {#if showSupport}
      <SupportCard />
    {/if}
  </div>
</main>
