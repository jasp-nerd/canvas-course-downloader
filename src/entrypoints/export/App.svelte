<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from 'wxt/browser';
  import { exportCourses, type CourseState } from '../../app/export-job';
  import { AI_TARGETS } from '../../export/study-pack';
  import { answerProfile, shouldAskProfile } from '../../app/onboarding';
  import { supportCardAfterExport } from '../../app/support';
  import type { Settings } from '../../storage/settings';
  import ProfileQuestion from './ProfileQuestion.svelte';
  import SupportCard from './SupportCard.svelte';

  let {
    origin,
    courseIds,
    onlyNew = false,
    quiet = false,
  }: { origin: string; courseIds: string[]; onlyNew?: boolean; quiet?: boolean } = $props();

  let courses = $state<CourseState[]>([]);
  let running = $state(true);
  let showSupport = $state(false);
  let folderPrompt = $state<{ name: string; allow: () => void; skip: () => void } | null>(null);
  /** Set while a new user chooses what their first download should be. */
  let question = $state<((choice: Pick<Settings, 'profile' | 'aiTarget'>) => void) | null>(null);

  /** Browsers need a click before writing to a chosen folder again; automatic exports can't ask. */
  const allowFolder = (folder: FileSystemDirectoryHandle) =>
    new Promise<boolean>((resolve) => {
      if (quiet) return resolve(false);
      folderPrompt = {
        name: folder.name,
        allow: () => {
          // First in the click handler: the browser only shows its prompt for a user gesture.
          void folder.requestPermission({ mode: 'readwrite' }).then((state) => {
            folderPrompt = null;
            resolve(state === 'granted');
          });
        },
        skip: () => {
          folderPrompt = null;
          resolve(false);
        },
      };
    });
  const controller = new AbortController();

  const percent = (c: CourseState) =>
    c.total ? Math.round(((c.done + c.failed) / c.total) * 100) : 0;

  /** Automatic exports run in a background tab: tell the user how it went, and get out of the way if it worked. */
  async function reportQuietly(finished: CourseState[], allSaved: boolean) {
    const names = finished.map((c) => c.name).join(', ');
    const saved = finished.reduce((n, c) => n + c.done, 0);
    const self = await browser.tabs.getCurrent();
    try {
      await browser.notifications.create({
        type: 'basic',
        iconUrl: browser.runtime.getURL('/icons/icon-128.png'),
        title: allSaved ? 'New Canvas files saved' : "Some new Canvas files couldn't be saved",
        message: allSaved
          ? `Saved ${saved} files from ${names}.`
          : `Open the export tab to see what happened in ${names}.`,
      });
    } catch {
      // Notifications can be turned off for the browser; the downloads are what matter.
    }
    const tabId = self?.id;
    if (tabId === undefined) return;
    // window.close() isn't reliable for a tab the extension opened; remove it through the tabs API.
    if (allSaved) await browser.tabs.remove(tabId);
    else
      browser.notifications.onClicked.addListener(
        () => void browser.tabs.update(tabId, { active: true }),
      );
  }

  onMount(() => {
    // Closing this tab stops the export, so ask first while it runs.
    const warn = (event: BeforeUnloadEvent) => {
      if (running && !question) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    void (async () => {
      // Downloads of only what's new add to a copy, so they don't ask.
      if (!quiet && !onlyNew && (await shouldAskProfile())) {
        const choice = await new Promise<Pick<Settings, 'profile' | 'aiTarget'>>(
          (resolve) => (question = resolve),
        );
        question = null;
        await answerProfile(choice);
      }
      return exportCourses({
        origin,
        courseIds,
        onlyNew,
        allowFolder,
        signal: controller.signal,
        onChange: (next) => (courses = next),
      });
    })()
      .then(async (finished) => {
        const allSaved = finished.length > 0 && finished.every((c) => c.outcome === 'success');
        if (quiet) {
          await reportQuietly(finished, allSaved);
          return;
        }
        // Only after an export where every file was saved.
        if (allSaved) showSupport = await supportCardAfterExport();
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
    <h1>
      {question ? 'Your first download' : running ? 'Exporting from Canvas' : 'Export finished'}
    </h1>
    {#if running && !question}
      <p class="lead">
        This tab is doing the work. Keep it open until it finishes; you can use Canvas and other
        tabs normally.
      </p>
    {/if}
  </header>

  {#if question}
    <ProfileQuestion onchoose={question} />
  {/if}

  {#if folderPrompt}
    <div class="prompt" role="alert">
      <p>Your browser needs your OK to save into “{folderPrompt.name}”.</p>
      <button type="button" class="primary" onclick={folderPrompt.allow}>Allow access</button>
      <button type="button" class="secondary" onclick={folderPrompt.skip}
        >Save to Downloads instead</button
      >
    </div>
  {/if}

  <ul class="courses">
    {#each courses as course (course.id)}
      <li class="course" data-outcome={course.outcome ?? 'running'}>
        <h2>{course.name}</h2>

        {#if course.note}<p class="note">{course.note}</p>{/if}
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
            Saved {course.done} files to {course.savedAs}{#if course.skipped}. {course.skipped}
              files you already had were skipped{/if}
          </p>
        {:else if course.outcome === 'partial'}
          <p class="result">
            Saved {course.done} of {course.done + course.failed} files to {course.savedAs}.
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
        {#if course.studyPack && course.done > 0 && (course.outcome === 'success' || course.outcome === 'partial')}
          {@const target = AI_TARGETS[course.studyPack]}
          {@const unzip = course.savedAs?.endsWith('.zip') ? 'Unzip it, then add' : 'Add'}
          <p class="next">
            {#if !target.url}
              {unzip} the Markdown files to any AI tool or notes app.
            {:else if (course.packParts ?? 1) > 1}
              {unzip} each of its {course.packParts} folders to its own {target.unit} in
              <a href={target.url} target="_blank" rel="noreferrer">{target.tool}</a>.
            {:else}
              {unzip} its files to a new {target.unit} in
              <a href={target.url} target="_blank" rel="noreferrer">{target.tool}</a>.
            {/if}
          </p>
        {/if}
      </li>
    {/each}
  </ul>

  {#if showSupport && !running}
    <SupportCard />
  {/if}

  {#if running && !question}
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
  .lead {
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
  .next {
    margin: 8px 0 0;
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
  .prompt {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    background: var(--surface);
    border: 1px solid var(--accent);
    border-radius: 10px;
    padding: 14px 18px;
    margin: 16px 0 0;
  }
  .prompt p {
    margin: 0;
    flex-basis: 100%;
  }
  .note {
    margin: 0 0 8px;
    color: var(--warn);
    font-size: 13px;
  }
  button.primary {
    font: inherit;
    padding: 8px 16px;
    border-radius: 8px;
    border: 0;
    background: var(--accent);
    color: var(--surface);
    font-weight: 600;
    cursor: pointer;
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
