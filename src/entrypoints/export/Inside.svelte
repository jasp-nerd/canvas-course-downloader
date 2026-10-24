<script lang="ts">
  // The receipt's rows: what was saved, per kind, with a warning row (that opens
  // to name the files) for each kind where something couldn't be downloaded.
  import type { CourseState } from '../../app/export-job';
  import { describeFile, kindOf } from '../../app/receipt';
  import { reasonText } from '../../export/course-index';
  import Icon from '../../ui/Icon.svelte';

  let {
    course,
    labelledby,
    columns = 1,
  }: { course: CourseState; labelledby: string; columns?: 1 | 2 } = $props();

  const pack = $derived(course.how.profile === 'study');
  const failuresOf = (id: string) => course.failures.filter((f) => kindOf(f.path, pack) === id);
</script>

<ul class="inside" class:two={columns === 2} aria-labelledby={labelledby}>
  {#each course.kinds as kind (kind.id)}
    {#if kind.failed === 0}
      <li class="receipt-row">
        <span class="ok"><Icon name="check" /></span>
        <span>{kind.label}</span>
        <span class="n num">{kind.done}</span>
      </li>
    {:else}
      <li>
        <details>
          <summary class="receipt-row">
            <span class="warn"><Icon name="alert" /></span>
            <span
              >{kind.label}
              <span class="small hint">{kind.failed} couldn't be downloaded</span></span
            >
            <span class="n num">{kind.done} <span class="of">of {kind.total}</span></span>
          </summary>
          <ul class="failures">
            {#each failuresOf(kind.id) as failure (failure.path)}
              <li>
                <span class="name">{describeFile(failure.path, pack).name}</span>
                <span class="small">{reasonText(failure.reason)}</span>
              </li>
            {/each}
          </ul>
        </details>
      </li>
    {/if}
  {/each}
  {#if course.notCaptured}
    <li class="receipt-row">
      <span class="warn"><Icon name="alert" /></span>
      <span
        >Linked files Canvas didn't give <span class="small hint">listed in the overview</span
        ></span
      >
      <span class="n num">{course.notCaptured}</span>
    </li>
  {/if}
  {#if course.filteredOut}
    <li class="receipt-row">
      <span class="muted"><Icon name="info" /></span>
      <span>Left out by your settings <span class="small hint">videos or the size limit</span></span
      >
      <span class="n num">{course.filteredOut}</span>
    </li>
  {/if}
</ul>

<style>
  .inside {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
  }
  .inside > li + li {
    border-top: 1px solid var(--mist-2);
  }
  .two {
    grid-template-columns: 1fr 1fr;
    column-gap: 48px;
  }
  /* Two columns: every row has a line under it, as each column ends on its own. */
  .two > li {
    border-bottom: 1px solid var(--mist-2);
  }
  .two > li + li {
    border-top: 0;
  }
  .receipt-row {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    min-height: 54px;
  }
  .n {
    font-weight: 700;
    font-size: 16px;
    text-align: right;
  }
  .of {
    color: var(--ink-3);
    font-weight: 500;
  }
  .ok {
    color: var(--mint-ink);
  }
  .warn {
    color: var(--sun-ink);
  }
  .muted {
    color: var(--ink-3);
  }
  summary {
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary:hover .small {
    text-decoration: underline;
  }
  .failures {
    list-style: none;
    margin: 0 0 12px 34px;
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
  @media (max-width: 720px) {
    .two {
      grid-template-columns: 1fr;
    }
  }
</style>
