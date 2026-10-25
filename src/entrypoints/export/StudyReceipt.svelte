<script lang="ts">
  // The receipt for a study pack: three steps from the files to a first
  // question in the AI tool, what's in the pack and what was left out.
  import type { CourseState } from '../../app/export-job';
  import { AI_TARGETS } from '../../export/study-pack';
  import Icon from '../../ui/Icon.svelte';
  import Pip from '../../ui/Pip.svelte';
  import CopyButton from '../../ui/CopyButton.svelte';
  import { sizeOf } from './lines';
  import Notices from './Notices.svelte';
  import ShowInFolder from './ShowInFolder.svelte';
  import SupportCard from './SupportCard.svelte';

  let { course, showSupport }: { course: CourseState; showSupport: boolean } = $props();

  const target = $derived(AI_TARGETS[course.studyPack ?? course.how.aiTarget]);
  const parts = $derived(course.packParts ?? 1);
  const unit = $derived(target.unit);
  const done = (id: string) => course.kinds.find((k) => k.id === id)?.done ?? 0;
  const sources = $derived(done('guide') + done('notes') + done('packFiles'));
  const fits = $derived(
    parts > 1
      ? `, split into ${parts} ${unit}s`
      : Number.isFinite(target.maxFiles)
        ? `, all in one ${unit}`
        : '',
  );
  const zip = $derived(course.how.zip);
  const size = $derived(sizeOf(course));
  const modules = $derived(course.pack?.modules ?? []);
  const leftOut = $derived(course.pack?.leftOut ?? []);
  const prompt = $derived(
    `Quiz me on ${modules[0] ?? 'this course'}. Ask one question at a time and tell me what I got wrong.`,
  );
  const ideas = $derived([
    `Make flashcards for ${modules[1] ?? modules[0] ?? 'this course'}`,
    "What's due next?",
    'Summarise the course on one page',
  ]);
  let copiedNote = $state('');
  const copied = (ok: boolean) =>
    (copiedNote = ok
      ? `Copied. Paste it into ${target.url ? target.tool : 'your AI tool'}.`
      : "Couldn't copy. Select the text and copy it instead.");
</script>

<section class="band field-sun">
  <div class="band-text">
    <h1 class="display">Your study pack is ready</h1>
    <p class="lede num">{sources} sources from {course.name}{fits}</p>
    <p class="where num"><span>{course.savedAs}</span>{size ? ` (${size})` : ''}</p>
  </div>
  <Pip pose="laptop" height={200} class="band-pip" />
</section>

<main class="receipt-grid study-grid">
  <section class="card steps-card" aria-labelledby="steps-title">
    <h2 class="sr-only" id="steps-title">Three steps to start studying</h2>
    <ol class="steps" aria-labelledby="steps-title">
      <li>
        <div class="step">
          {#if target.url}
            <span class="step-title">Open {target.tool}</span>
            <span class="step-text"
              >{parts > 1
                ? `Make a new ${unit} for each of the ${parts} folders.`
                : `Make a new ${unit} and call it ${course.name}.`}</span
            >
            <a class="btn btn-primary" href={target.url} target="_blank" rel="noopener"
              >Open {target.tool}<Icon name="external" /></a
            >
          {:else}
            <span class="step-title">Open your AI tool</span>
            <span class="step-text"
              >Any AI tool or notes app that reads Markdown works, such as NotebookLM, ChatGPT or
              Claude.</span
            >
          {/if}
        </div>
      </li>
      <li>
        <div class="step">
          <span class="step-title"
            >{parts > 1
              ? `Add each folder to its own ${unit}`
              : `Add the ${sources} files${unit === 'notebook' && target.url ? ' as sources' : ''}`}</span
          >
          <div class="row step-row">
            <ShowInFolder {course} />
            <span class="step-text"
              >{zip ? 'Unzip it first, then drag' : 'Drag'}
              {parts > 1 ? "each folder's files" : 'them all'} in at once.</span
            >
          </div>
        </div>
      </li>
      <li>
        <div class="step">
          <span class="step-title">Ask your first question</span>
          <div class="prompt-row">
            <p class="prompt">{prompt}</p>
            <CopyButton text={prompt} onCopied={copied} />
          </div>
          <div class="row ideas">
            <span class="small">Or try</span>
            {#each ideas as idea (idea)}
              <button
                type="button"
                class="chip chip-line idea"
                onclick={async () => {
                  try {
                    await navigator.clipboard.writeText(idea);
                    copied(true);
                  } catch {
                    copied(false);
                  }
                }}>{idea}</button
              >
            {/each}
          </div>
          <p class="small copied" role="status">{copiedNote}</p>
        </div>
      </li>
    </ol>
  </section>

  <div class="aside">
    <Notices {course} />
    <section class="card side-card pack" aria-labelledby="pack-title">
      <div class="card-head">
        <h2 class="heading" id="pack-title">In the pack</h2>
        <span class="small num">{sources} sources</span>
      </div>
      <ul class="pack-rows">
        {#if done('guide')}
          <li>
            <Icon name="fileText" size={18} /><span
              >Course guide <span class="small hint">deadlines, grading, what's where</span></span
            ><span class="n num">{done('guide')}</span>
          </li>
        {/if}
        {#if done('notes')}
          <li>
            <Icon name="fileText" size={18} /><span
              >Notes per module <span class="small hint">pages, assignments</span></span
            ><span class="n num">{done('notes')}</span>
          </li>
        {/if}
        {#if done('packFiles')}
          <li>
            <Icon name="file" size={18} /><span>Slides and documents</span><span class="n num"
              >{done('packFiles')}</span
            >
          </li>
        {/if}
      </ul>
    </section>
    <section class="card side-card" aria-labelledby="left-out-title">
      <h2 class="heading" id="left-out-title">Left out</h2>
      {#if leftOut.length}
        <p>
          {leftOut.length}
          {leftOut.length === 1 ? 'file' : 'files'}
          {target.accepts.length
            ? `${target.tool} doesn't take (other file types, or too large)`
            : 'that are not text'}, listed in <strong>_extras/skipped files.txt</strong>.
        </p>
      {:else}
        <p>Nothing. Every file fits.</p>
      {/if}
    </section>
    <div class="notice notice-navy">
      <Icon name="info" />
      <span
        >Also want it for Claude Code or Cursor? Download the course again as Files for code.</span
      >
    </div>
    {#if showSupport}<SupportCard />{/if}
  </div>
</main>

<style>
  .band {
    padding-top: 28px;
    grid-template-columns: minmax(0, 1fr) 260px;
  }
  .band-text {
    gap: 10px;
    padding-bottom: 28px;
  }
  .band-text h1 {
    font-size: 50px;
  }
  .lede {
    font-size: 17px;
  }
  .where {
    font-size: 15px;
    color: #4d3500;
    overflow-wrap: anywhere;
  }
  .study-grid {
    grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  }
  .steps-card {
    border-radius: 24px;
    padding: 6px 30px;
  }
  .steps {
    list-style: none;
    margin: 0;
    padding: 0;
    counter-reset: step;
    display: grid;
  }
  .steps > li {
    counter-increment: step;
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 18px;
    padding: 24px 0;
  }
  .steps > li + li {
    border-top: 1px solid var(--mist-2);
  }
  .steps > li::before {
    content: counter(step);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--sun);
    color: var(--ink);
    display: grid;
    place-items: center;
    font: 800 18px/1 var(--font-display);
  }
  .step {
    display: grid;
    gap: 12px;
    justify-items: start;
    min-width: 0;
  }
  .step-title {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 20px;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }
  .step-text {
    font-size: 14px;
    color: var(--ink-2);
  }
  .step-row {
    gap: 14px;
    flex-wrap: wrap;
  }
  .prompt-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: start;
    width: 100%;
  }
  .prompt {
    border-radius: 14px;
    background: var(--mist);
    padding: 14px 16px;
    font-size: 15px;
    line-height: 1.5;
  }
  .ideas {
    gap: 8px;
    flex-wrap: wrap;
  }
  .ideas .small {
    margin-right: 2px;
  }
  .idea {
    border: 0;
    cursor: pointer;
    font-family: inherit;
  }
  .idea:hover {
    color: var(--ink);
    box-shadow: inset 0 0 0 1.5px var(--control);
  }
  .copied:empty {
    display: none;
  }
  .pack {
    padding: 20px 24px 10px;
    gap: 0;
  }
  .pack-rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .pack-rows li {
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    min-height: 42px;
    font-size: 14px;
  }
  .pack-rows li + li {
    border-top: 1px solid var(--mist-2);
  }
  .pack-rows :global(svg) {
    color: var(--sun-ink);
  }
  .n {
    font-weight: 600;
    text-align: right;
  }
  strong {
    color: var(--ink);
    overflow-wrap: anywhere;
  }
  @media (max-width: 1040px) {
    .study-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 640px) {
    .steps-card {
      padding: 6px 18px;
    }
    .steps > li {
      grid-template-columns: 40px minmax(0, 1fr);
      gap: 12px;
    }
    .prompt-row {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
