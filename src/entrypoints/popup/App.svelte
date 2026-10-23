<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from 'wxt/browser';
  import { WHATS_NEW_3 } from '../../app/onboarding';
  import {
    dayLabel,
    modeLine,
    savedAtLabel,
    savedCourseRows,
    type SavedCourseRow,
  } from '../../app/popup-view';
  import { loadUpdateCheck, newItems, type CourseUpdate } from '../../app/updates';
  import { sendMessage, type CourseInfo, type PageInfo } from '../../messaging';
  import { loadSaveFolder } from '../../storage/folder';
  import { loadInventory, savedCourses, type CourseInventory } from '../../storage/inventory';
  import { loadSettings, type Settings } from '../../storage/settings';
  import { PRODUCT_NAME } from '../../ui/brand';
  import Icon from '../../ui/Icon.svelte';
  import Logo from '../../ui/Logo.svelte';
  import Pip from '../../ui/Pip.svelte';

  type Page =
    | { kind: 'loading' }
    | { kind: 'elsewhere'; canvas: URL | null }
    | {
        kind: 'canvas';
        tabId: number;
        info: PageInfo;
        settings: Settings;
        saveTo: string;
        /** On a course page: what was saved of it before, and what's new since. */
        saved: CourseInventory | null;
        newFiles: number | null;
        moreThanFiles: boolean;
        /** Elsewhere on Canvas: the courses saved before. */
        rows: SavedCourseRow[];
      };

  let page = $state<Page>({ kind: 'loading' });
  /** What the last update check found for this course: new files, posts and pages together. */
  const newHere = (update: CourseUpdate | undefined) => ({
    newFiles: update ? newItems(update) : null,
    moreThanFiles: !!(update?.newAnnouncements || update?.changedDocuments),
  });
  let course = $state<CourseInfo | null>(null);
  let whatsNew = $state(false);

  /** The Canvas the content script saw last (shared contract: storage.local `lastCanvas`). */
  function canvasUrl(origin: unknown): URL | null {
    try {
      const url = new URL(String(origin));
      return url.protocol === 'https:' ? url : null;
    } catch {
      return null; // Missing or not a URL: say where to go instead.
    }
  }

  onMount(async () => {
    const [local, [tab]] = await Promise.all([
      browser.storage.local.get<{ whatsNew?: string; lastCanvas?: { origin?: string } }>([
        'whatsNew',
        'lastCanvas',
      ]),
      browser.tabs.query({ active: true, currentWindow: true }),
    ]);
    whatsNew = local.whatsNew === '3.0';
    let info: PageInfo;
    try {
      // Only our content script on a Canvas page answers; elsewhere this throws.
      if (tab?.id === undefined) throw new Error('No tab');
      info = await sendMessage('pageInfo', undefined, tab.id);
    } catch {
      page = { kind: 'elsewhere', canvas: canvasUrl(local.lastCanvas?.origin) };
      return;
    }
    const tabId = tab.id;
    if (info.courseId) {
      sendMessage('courseInfo', undefined, tabId)
        .then((found) => (course = found))
        .catch(() => (course = null)); // Canvas didn't answer: the card falls back to the saved name.
    }
    const [settings, check, saved, all] = await Promise.all([
      loadSettings(),
      loadUpdateCheck(info.origin),
      info.courseId ? loadInventory(info.origin, info.courseId) : null,
      info.courseId ? [] : savedCourses(info.origin),
    ]);
    const folder = settings.saveTo === 'folder' ? await loadSaveFolder().catch(() => null) : null;
    page = {
      kind: 'canvas',
      tabId,
      info,
      settings,
      saveTo: folder?.name || 'Downloads',
      saved,
      ...newHere(saved ? check?.courses.find((c) => c.courseId === info.courseId) : undefined),
      rows: savedCourseRows(all, check, 4),
    };
  });

  async function startExport(courseIds: string[], onlyNew = false) {
    if (page.kind !== 'canvas') return;
    await sendMessage('startExport', {
      origin: page.info.origin,
      courseIds,
      ...(onlyNew ? { onlyNew } : {}),
    });
    window.close();
  }

  async function pickCourses(tabId: number) {
    await sendMessage('openPicker', undefined, tabId);
    window.close();
  }

  async function openCanvas(url: URL) {
    await browser.tabs.create({ url: url.origin + '/' });
    window.close();
  }

  async function openSettings(view = '') {
    if (view) await browser.tabs.create({ url: browser.runtime.getURL(`/options.html#${view}`) });
    else await browser.runtime.openOptionsPage();
    window.close();
  }

  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
</script>

<main>
  <header>
    <h1 class="brand">
      <Logo size={28} />
      <span class="brand-name">{PRODUCT_NAME}</span>
    </h1>
    <button type="button" class="btn btn-icon" aria-label="Settings" onclick={() => openSettings()}>
      <Icon name="settings" size={20} />
    </button>
  </header>

  {#if whatsNew}
    <div class="notice notice-navy news">
      <Icon name="info" />
      <p>
        {WHATS_NEW_3}
        <button
          type="button"
          class="link"
          onclick={() => {
            whatsNew = false;
            void browser.storage.local.remove('whatsNew');
          }}>Got it</button
        >
      </p>
    </div>
  {/if}

  {#if page.kind === 'loading'}
    <p class="small checking">Checking this page…</p>
  {:else if page.kind === 'canvas' && page.info.courseId}
    {@const courseId = page.info.courseId}
    {@const hasNew = page.saved !== null && (page.newFiles ?? 0) > 0}
    <section class="course" aria-label="This course">
      <h2 class="course-name">{course?.name ?? page.saved?.courseName ?? 'This course'}</h2>
      {#if course && (course.code || course.term)}
        <span class="small">{[course.code, course.term].filter(Boolean).join(' · ')}</span>
      {/if}
      {#if page.saved && hasNew}
        <span class="chip chip-mint num">
          <Icon name="refresh" />{page.newFiles} new since {dayLabel(page.saved.savedAt)}
        </span>
      {:else if page.saved && page.newFiles === 0}
        <span class="small up-to-date"><Icon name="check" size={16} />Up to date</span>
      {/if}
    </section>

    {#if hasNew}
      <button
        type="button"
        class="btn btn-primary btn-block"
        onclick={() => startExport([courseId], true)}
      >
        <Icon name="download" />{page.moreThanFiles ? "Download what's new" : 'Download new files'}
      </button>
      <!-- With "Only add what's new" on, a full download would only add the new files too. -->
      {#if !page.settings.incrementalMode}
        <button
          type="button"
          class="btn btn-light btn-block"
          onclick={() => startExport([courseId])}
        >
          Download everything again
        </button>
      {/if}
    {:else}
      <button
        type="button"
        class="btn btn-primary btn-block"
        onclick={() => startExport([courseId])}
      >
        <Icon name="download" />Download this course
      </button>
    {/if}

    <div class="mode-line">
      <span>{modeLine(page.settings, page.saveTo)}</span>
      <button type="button" class="link strong" onclick={() => openSettings('downloads')}
        >Change</button
      >
    </div>
    <footer>
      <span class="small num"
        >{page.saved ? `Last saved ${savedAtLabel(page.saved.savedAt)}` : 'Not saved yet'}</span
      >
      <button type="button" class="link small" onclick={() => openSettings('help')}>Help</button>
    </footer>
  {:else if page.kind === 'canvas'}
    {@const tabId = page.tabId}
    {@const withNew = page.rows.filter((r) => (r.newFiles ?? 0) > 0)}
    {@const total = withNew.reduce((n, r) => n + (r.newFiles ?? 0), 0)}
    <button type="button" class="btn btn-primary btn-block" onclick={() => pickCourses(tabId)}>
      Pick courses to download
    </button>

    {#if page.rows.length > 0}
      <div class="saved">
        <h2 class="label" id="saved-before">Saved before</h2>
        <ul class="rows" aria-labelledby="saved-before">
          {#each page.rows as row (row.courseId)}
            <li class="row">
              <span class="row-name">{row.courseName}</span>
              {#if row.newFiles}
                <span class="chip chip-mint num">{row.newFiles} new</span>
              {:else if row.newFiles === 0}
                <span class="small up-to-date"><Icon name="check" size={16} />Up to date</span>
              {:else}
                <span class="small num">Saved {dayLabel(row.savedAt)}</span>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if total > 0}
      <button
        type="button"
        class="btn btn-light btn-block"
        onclick={() =>
          startExport(
            withNew.map((r) => r.courseId),
            true,
          )}
      >
        <Icon name="download" />{withNew.some((r) => r.moreThanFiles)
          ? `Download what's new (${total})`
          : `Download all ${plural(total, 'new file')}`}
      </button>
    {/if}

    <footer>
      <span class="small">{modeLine(page.settings)}</span>
      <button type="button" class="link small strong" onclick={() => openSettings('downloads')}
        >Change</button
      >
    </footer>
  {:else if page.kind === 'elsewhere'}
    <section class="elsewhere">
      <Pip pose="sleep" height={120} />
      <h2 class="heading">Open your Canvas to start</h2>
      {#if page.canvas}
        <p class="small">The download button shows up on your courses and dashboard.</p>
      {:else}
        <p class="small">
          Go to your school's Canvas site and the download button shows up on your courses.
        </p>
      {/if}
    </section>
    {#if page.canvas}
      {@const canvas = page.canvas}
      <button type="button" class="btn btn-light btn-block" onclick={() => openCanvas(canvas)}>
        <Icon name="external" />Open {canvas.host}
      </button>
    {/if}
    <p class="small only">We only work on Canvas pages.</p>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    width: 360px;
    background: #fff;
    color: var(--ink);
    font: 15px/1.5 var(--font-ui);
    -webkit-font-smoothing: antialiased;
  }
  main {
    display: grid;
    gap: 14px;
    padding: 16px;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: -2px -4px -2px 0;
  }
  h1 {
    margin: 0;
  }
  h1 .brand-name {
    font-size: 16px;
  }
  .btn-icon {
    width: 38px;
    height: 38px;
  }
  .news {
    font-size: 13px;
    padding: 12px 14px;
  }
  .news p {
    margin: 0;
  }
  .news .link {
    font-weight: 600;
    color: var(--ink);
    margin-left: 4px;
  }
  .checking {
    margin: 4px 0;
  }

  .course {
    display: grid;
    gap: 6px;
    justify-items: start;
    padding: 14px 16px;
    border-radius: 16px;
    background: var(--mist);
  }
  .course-name {
    margin: 0;
    font: 700 17px/1.25 var(--font-display);
    letter-spacing: -0.01em;
  }
  .course .chip {
    margin-top: 4px;
  }
  .up-to-date {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .up-to-date :global(svg) {
    color: var(--mint-ink);
  }

  .mode-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    font-size: 13px;
    color: var(--ink-2);
  }
  .link.strong {
    color: var(--ink);
    font-weight: 600;
  }
  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border-top: 1px solid var(--mist-2);
    padding-top: 12px;
    margin-top: 2px;
  }
  footer .link:not(.strong) {
    color: var(--ink-2);
  }

  .saved {
    display: grid;
  }
  .saved h2 {
    margin: 0 0 2px;
  }
  .saved ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .saved li {
    min-height: 46px;
  }
  .row-name {
    flex: 1;
    min-width: 0;
    font-weight: 600;
    font-size: 15px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .elsewhere {
    display: grid;
    justify-items: center;
    gap: 10px;
    padding: 8px 8px 4px;
    text-align: center;
  }
  .elsewhere p {
    margin: 0;
    max-width: 280px;
  }
  .only {
    margin: 0;
    text-align: center;
  }
</style>
