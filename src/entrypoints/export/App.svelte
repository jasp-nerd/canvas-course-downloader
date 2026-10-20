<script lang="ts">
  import { onMount } from 'svelte';
  import { exportCourses, type CourseState } from '../../app/export-job';
  import { supportCardAfterExport } from '../../app/support';
  import SupportCard from './SupportCard.svelte';

  let {
    origin,
    courseIds,
    onlyNew = false,
  }: { origin: string; courseIds: string[]; onlyNew?: boolean } = $props();

  let courses = $state<CourseState[]>([]);
  let running = $state(true);
  let showSupport = $state(false);
  const controller = new AbortController();

  const percent = (c: CourseState) =>
    c.total ? Math.round(((c.done + c.failed) / c.total) * 100) : 0;

  onMount(() => {
    // Closing this tab stops the export, so ask first while it runs.
    const warn = (event: BeforeUnloadEvent) => {
      if (running) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    void exportCourses({
      origin,
      courseIds,
      onlyNew,
      signal: controller.signal,
      onChange: (next) => (courses = next),
    })
      .then(async (finished) => {
        // Only after an export where every file was saved.
        if (finished.length && finished.every((c) => c.outcome === 'success'))
          showSupport = await supportCardAfterExport();
      })
      .finally(() => {
        running = false;
      });
    return () => window.removeEventListener('beforeunload', warn);
  });

  $effect(() => {
    document.title = running
      ? 'Exporting… · Canvas Course Downloader'
      : 'Export finished · Canvas Course Downloader';
  });
</script>

<main>
  <header>
    <h1>{running ? 'Exporting from Canvas' : 'Export finished'}</h1>
    {#if running}
      <p class="note">
        This tab is doing the work. Keep it open until it finishes; you can use Canvas and other
        tabs normally.
      </p>
    {/if}
  </header>

  <ul class="courses">
    {#each courses as course (course.id)}
      <li class="course" data-outcome={course.outcome ?? 'running'}>
        <h2>{course.name}</h2>

        {#if course.phase !== 'finished'}
          <div
            class="bar"
            role="progressbar"
            aria-label={`Progress for ${course.name}`}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={percent(course)}
          >
            <span style:width={`${percent(course)}%`}></span>
          </div>
          <p class="status">
            {#if course.phase === 'saving'}
              {course.done + course.failed} of {course.total} files ·
            {/if}
            <span class="current">{course.message}</span>
          </p>
        {:else if course.outcome === 'success'}
          <p class="result">
            Saved {course.done} files to Downloads/{course.savedAs}{#if course.skipped}. {course.skipped}
              files you already had were skipped{/if}
          </p>
        {:else if course.outcome === 'partial'}
          <p class="result">
            Saved {course.done} of {course.done + course.failed} files to Downloads/{course.savedAs}.
            {course.failed}
            {course.failed === 1 ? "file couldn't" : "files couldn't"} be downloaded; they're listed in
            _download_errors.csv.
          </p>
          <details>
            <summary>Show which files</summary>
            <ul>
              {#each course.failures as failure (failure.path)}
                <li><code>{failure.path}</code>: {failure.reason}</li>
              {/each}
            </ul>
          </details>
        {:else if course.outcome === 'cancelled'}
          <p class="result">Cancelled.</p>
        {:else}
          <p class="result">{course.error ?? 'Nothing could be saved.'}</p>
        {/if}
      </li>
    {/each}
  </ul>

  {#if showSupport && !running}
    <SupportCard />
  {/if}

  {#if running}
    <button type="button" class="secondary" onclick={() => controller.abort()}>Cancel</button>
  {/if}
</main>

<style>
  :global(:root) {
    --bg: #f6f7f9;
    --surface: #ffffff;
    --text: #1d2733;
    --muted: #556270;
    --border: #d9dee4;
    --accent: #0b6bcb;
    --ok: #1d7a43;
    --warn: #9a5b00;
    --bad: #b42318;
    color-scheme: light dark;
  }
  @media (prefers-color-scheme: dark) {
    :global(:root) {
      --bg: #12161b;
      --surface: #1b2128;
      --text: #e6eaef;
      --muted: #a3adb8;
      --border: #303943;
      --accent: #5aa7f0;
      --ok: #5cc68a;
      --warn: #e6a64a;
      --bad: #f2867c;
    }
  }
  :global(body) {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font:
      15px/1.5 system-ui,
      -apple-system,
      'Segoe UI',
      Roboto,
      sans-serif;
  }
  main {
    max-width: 640px;
    margin: 48px auto;
    padding: 0 16px;
  }
  h1 {
    font-size: 24px;
    margin: 0 0 8px;
  }
  .note {
    margin: 0;
    color: var(--muted);
  }
  .courses {
    list-style: none;
    padding: 0;
    margin: 24px 0;
    display: grid;
    gap: 12px;
  }
  .course {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px 18px;
  }
  .course h2 {
    font-size: 16px;
    margin: 0 0 10px;
  }
  .bar {
    height: 8px;
    border-radius: 4px;
    background: var(--border);
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    background: var(--accent);
    transition: width 0.2s;
  }
  .status {
    margin: 8px 0 0;
    color: var(--muted);
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .result {
    margin: 0;
  }
  [data-outcome='success'] .result {
    color: var(--ok);
  }
  [data-outcome='partial'] .result {
    color: var(--warn);
  }
  [data-outcome='failed'] .result {
    color: var(--bad);
  }
  details {
    margin-top: 8px;
    font-size: 13px;
  }
  button.secondary {
    font: inherit;
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
  }
  button:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }
</style>
