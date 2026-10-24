<script lang="ts">
  // One course's receipt when several were downloaded together.
  import type { CourseState } from '../../app/export-job';
  import { describeFile } from '../../app/receipt';
  import { reasonText } from '../../export/course-index';
  import { AI_TARGETS } from '../../export/study-pack';
  import Icon from '../../ui/Icon.svelte';
  import { tryAgain } from './actions';
  import { joined, sizeOf } from './lines';
  import ShowInFolder from './ShowInFolder.svelte';

  let { course }: { course: CourseState } = $props();

  const id = $derived(`course-${course.id}`);
  const saved = $derived(course.outcome === 'success' || course.outcome === 'partial');
  const files = $derived(course.kinds.reduce((n, k) => n + k.done, 0));
  const pack = $derived(course.how.profile === 'study');
  const target = $derived(course.studyPack ? AI_TARGETS[course.studyPack] : undefined);
  const heading = $derived(
    saved
      ? `${course.name} is saved`
      : course.outcome === 'cancelled'
        ? `${course.name} was stopped`
        : course.phase === 'waiting'
          ? `${course.name} wasn't started`
          : `${course.named ? course.name : 'A course'} wasn't saved`,
  );
  const state = $derived(
    course.outcome === 'success'
      ? 'ok'
      : course.outcome === 'partial'
        ? 'warn'
        : course.outcome === 'failed'
          ? 'bad'
          : 'off',
  );
</script>

<article class="card compact" aria-labelledby={id}>
  <span class="tile" data-state={state}>
    <Icon
      name={state === 'ok' ? 'check' : state === 'warn' ? 'alert' : state === 'bad' ? 'error' : 'x'}
    />
  </span>
  <div class="body">
    <div class="head">
      <h2 class="heading" {id}>{heading}</h2>
      {#if saved}<ShowInFolder {course} light describedby={id} />{/if}
    </div>
    {#if saved}
      <p class="small num meta">
        {joined(`${files} ${files === 1 ? 'file' : 'files'}`, sizeOf(course))}, saved as
        <span>{course.savedAs}</span>
      </p>
      <ul class="kinds" aria-label="What's inside {course.name}">
        {#each course.kinds as kind (kind.id)}
          <li class:warn={kind.failed > 0}>
            {kind.label}
            <span class="num"
              >{kind.done}{#if kind.failed}<span class="of"> of {kind.total}</span>{/if}</span
            >
          </li>
        {/each}
      </ul>
      {#if course.failures.length}
        <details>
          <summary
            >{course.failures.length === 1
              ? "1 file couldn't be downloaded"
              : `${course.failures.length} files couldn't be downloaded`}</summary
          >
          <ul class="failures">
            {#each course.failures as failure (failure.path)}
              <li>
                <span class="name">{describeFile(failure.path, pack).name}</span>
                <span class="small">{reasonText(failure.reason)}</span>
              </li>
            {/each}
          </ul>
        </details>
      {/if}
      {#if course.update && course.skipped}
        <p class="small">
          {course.skipped === 1
            ? '1 file you already had was skipped.'
            : `${course.skipped} files you already had were skipped.`}
        </p>
      {/if}
      {#if target?.url}
        <p class="small">
          Next: add the files to a new {target.unit} in
          <a class="link" href={target.url} target="_blank" rel="noopener">{target.tool}</a>.
        </p>
      {/if}
    {:else if course.outcome === 'failed'}
      <div class="notice notice-red">
        <Icon name="error" />
        <span>{course.error ?? 'Nothing could be saved.'}</span>
      </div>
      <div>
        <button
          type="button"
          class="btn btn-light btn-sm"
          aria-describedby={id}
          onclick={() => tryAgain([course.id])}>Try again</button
        >
      </div>
    {/if}
  </div>
</article>

<style>
  .compact {
    border-radius: 24px;
    padding: 20px 24px;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }
  .tile {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: var(--mist-2);
    color: var(--ink-2);
  }
  .tile[data-state='ok'] {
    background: var(--mint-wash);
    color: var(--mint-ink);
  }
  .tile[data-state='warn'] {
    background: var(--sun-wash);
    color: var(--sun-ink);
  }
  .tile[data-state='bad'] {
    background: var(--red-wash);
    color: var(--red-ink);
  }
  .body {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    min-height: 40px;
  }
  h2 {
    overflow-wrap: anywhere;
  }
  .meta {
    overflow-wrap: anywhere;
  }
  .kinds {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .kinds li {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    padding: 6px 12px;
    border-radius: var(--r-pill);
    background: var(--mist);
    font-size: 14px;
  }
  .kinds li .num {
    font-weight: 700;
  }
  .kinds li.warn {
    background: var(--sun-wash);
  }
  .of {
    color: var(--ink-3);
    font-weight: 500;
  }
  details summary {
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    color: #4d3500;
  }
  .failures {
    list-style: none;
    margin: 8px 0 0;
    padding: 10px 14px;
    border-radius: 14px;
    background: var(--sun-wash);
    display: grid;
    gap: 6px;
    font-size: 14px;
  }
  .failures li {
    display: grid;
    gap: 2px;
  }
  .name {
    overflow-wrap: anywhere;
  }
</style>
