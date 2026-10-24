<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { LINKS, tracked } from '../../app/links';
  import { describeExport } from '../../app/summary';
  import { CanvasError, createCanvasClient } from '../../canvas/client';
  import {
    groupByTerm,
    listCourses,
    matchesSearch,
    teaches,
    type CourseSummary,
  } from '../../canvas/courses';
  import { AI_TARGETS } from '../../export/study-pack';
  import { savedCourses } from '../../storage/inventory';
  import { sendMessage } from '../../messaging';
  import { loadSettings, type Settings } from '../../storage/settings';
  import GitHubStars from '../../ui/GitHubStars.svelte';
  import Icon from '../../ui/Icon.svelte';
  import type { IconName } from '../../ui/icons';
  import Logo from '../../ui/Logo.svelte';
  import { shortDay } from './day';
  import { pageState } from './state.svelte';

  let {
    origin,
    onclose,
    ondownload,
    onsettings,
  }: {
    origin: string;
    onclose: () => void;
    /** The chosen courses, and how many of them the user teaches. */
    ondownload: (courseIds: string[], taught: number) => void;
    onsettings: () => void;
  } = $props();

  type Tab = 'active' | 'completed';
  type List =
    | { status: 'loading' }
    | { status: 'ready'; courses: CourseSummary[] }
    | { status: 'error'; signedOut: boolean };

  // The footer's chip: one word for what a download makes, in that kind's colour.
  const KINDS: Record<Settings['profile'], { icon: IconName; tone: 'red' | 'sun' | 'navy' }> = {
    copy: { icon: 'folder', tone: 'red' },
    study: { icon: 'ai', tone: 'sun' },
    agents: { icon: 'code', tone: 'navy' },
  };
  // Canvas data: only a plain hex colour goes into a style.
  const HEX = /^#[0-9a-f]{3,8}$/i;

  let tab = $state<Tab>('active');
  let lists = $state<Record<Tab, List>>({
    active: { status: 'loading' },
    completed: { status: 'loading' },
  });
  let query = $state('');
  let settings = $state<Settings>();
  let colors = $state<Record<string, string>>({});
  let stars = $state<number | null>(null);
  let savedAt = $state<Record<string, number>>({});
  let dialog: HTMLDialogElement | undefined = $state();
  let search: HTMLInputElement | undefined = $state();
  // Selection is kept across tabs and searches.
  const selected = new SvelteSet<string>();
  const canvas = $derived(createCanvasClient({ origin }));

  async function load(which: Tab) {
    lists[which] = { status: 'loading' };
    try {
      lists[which] = { status: 'ready', courses: await listCourses(canvas, which) };
    } catch (error) {
      lists[which] = {
        status: 'error',
        signedOut: error instanceof CanvasError && error.kind === 'session',
      };
    }
  }

  async function loadColors() {
    try {
      const reply = await canvas.get<{ custom_colors?: Record<string, string> }>(
        '/users/self/colors',
      );
      colors = reply.custom_colors ?? {};
    } catch {
      // Without the user's Canvas colours every dot stays neutral; nothing else depends on them.
    }
  }

  onMount(() => {
    // A modal dialog sits in the browser's top layer: above anything Canvas
    // stacks (its main column has z-index 10), with the page inert behind it.
    dialog?.showModal();
    search?.focus();
    void load('active');
    void load('completed');
    void loadColors();
    void loadSettings().then((s) => (settings = s));
    void savedCourses(origin).then(
      (saved) => (savedAt = Object.fromEntries(saved.map((c) => [c.courseId, c.savedAt]))),
    );
    // Without a count the button still says "Star"; nothing else depends on it.
    sendMessage('githubStars').then(
      (count) => (stars = count),
      () => {},
    );
  });

  const current = $derived(lists[tab]);
  const visible = $derived(
    current.status === 'ready' ? current.courses.filter((c) => matchesSearch(c, query)) : [],
  );
  const groups = $derived(groupByTerm(visible));
  const isSelected = (c: CourseSummary) => selected.has(String(c.id));
  const mode = $derived(
    settings && {
      ...KINDS[settings.profile],
      label:
        settings.profile === 'study'
          ? AI_TARGETS[settings.aiTarget].label
          : settings.profile === 'agents'
            ? 'For code'
            : settings.zipMode
              ? 'ZIP'
              : 'Folders',
    },
  );

  function setAll(courses: CourseSummary[], on: boolean) {
    for (const c of courses) {
      if (on) selected.add(String(c.id));
      else selected.delete(String(c.id));
    }
  }

  function download() {
    const all = [lists.active, lists.completed].flatMap((l) =>
      l.status === 'ready' ? l.courses : [],
    );
    ondownload([...selected], all.filter((c) => isSelected(c) && teaches(c)).length);
  }

  const dotColor = (c: CourseSummary) => {
    const color = colors[`course_${c.id}`];
    return color && HEX.test(color) ? color : 'var(--control)';
  };
  const meta = (c: CourseSummary) => [c.course_code, c.term?.name].filter(Boolean).join(' · ');
</script>

<!-- Escape fires "cancel"; a click on the backdrop lands on the dialog element itself. -->
<dialog
  class="cd dialog"
  aria-labelledby="ccd-picker-title"
  bind:this={dialog}
  oncancel={(e) => {
    e.preventDefault();
    onclose();
  }}
  onclick={(e) => {
    if (e.target === dialog) onclose();
  }}
>
  <div class="top">
    <div class="dialog-head">
      <span class="brand">
        <Logo size={28} />
        <span class="brand-name">Course Downloader</span>
      </span>
      <h2 class="sr-only" id="ccd-picker-title">Download courses</h2>
      <span class="actions">
        <GitHubStars count={stars} href={tracked(LINKS.github, 'picker')} />
        <button type="button" class="icon-btn" aria-label="Settings" onclick={onsettings}>
          <Icon name="settings" />
        </button>
        <button type="button" class="icon-btn" aria-label="Close" onclick={onclose}>
          <Icon name="x" />
        </button>
      </span>
    </div>

    <div class="filters">
      <div class="tabs" role="tablist" aria-label="Which courses">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'active'}
          onclick={() => (tab = 'active')}>Current</button
        >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'completed'}
          onclick={() => (tab = 'completed')}>Past</button
        >
      </div>
      <label class="search">
        <Icon name="search" size={18} />
        <input
          bind:this={search}
          bind:value={query}
          class="input"
          type="search"
          placeholder="Search by name, code or term"
          aria-label="Search courses"
        />
      </label>
    </div>
  </div>

  <div class="select-bar">
    {#if visible.length}
      <label class="all">
        <input
          type="checkbox"
          class="check"
          checked={visible.every(isSelected)}
          indeterminate={!visible.every(isSelected) && visible.some(isSelected)}
          onchange={(e) => setAll(visible, e.currentTarget.checked)}
        />
        Select all{query ? ' matching' : ''}
      </label>
    {/if}
    {#if selected.size}
      <span class="small num count">{selected.size} selected</span>
    {/if}
  </div>

  <div
    class="list"
    role="tabpanel"
    aria-label={tab === 'active' ? 'Current courses' : 'Past courses'}
  >
    {#if current.status === 'loading'}
      <p class="state">Loading your courses…</p>
    {:else if current.status === 'error'}
      <div class="state">
        {#if current.signedOut}
          <p>You're signed out of Canvas. Sign in again, then reopen this window.</p>
        {:else}
          <p>Canvas didn't answer. Check your connection and try again.</p>
          <button type="button" class="btn btn-light btn-sm" onclick={() => load(tab)}
            >Try again</button
          >
        {/if}
      </div>
    {:else if visible.length === 0}
      <p class="state">
        {#if query}No courses match "{query}".{:else if tab === 'active'}No current courses. Try
          Past.{:else}No past courses.{/if}
      </p>
    {:else}
      {#each groups as group (group.term)}
        <fieldset>
          <legend>
            <label class="group">
              <input
                type="checkbox"
                class="check"
                checked={group.courses.every(isSelected)}
                indeterminate={!group.courses.every(isSelected) && group.courses.some(isSelected)}
                onchange={(e) => setAll(group.courses, e.currentTarget.checked)}
              />
              {group.term}
              <span class="pill num">{group.courses.length}</span>
            </label>
          </legend>
          {#each group.courses as course (course.id)}
            {@const newFiles = pageState.newByCourse[String(course.id)] ?? 0}
            {@const saved = savedAt[String(course.id)]}
            <label class="course">
              <input
                type="checkbox"
                class="check"
                checked={isSelected(course)}
                onchange={(e) => setAll([course], e.currentTarget.checked)}
              />
              <span class="dot" style:background={dotColor(course)}></span>
              <span class="text">
                <strong>{course.name}</strong>
                {#if meta(course)}<small>{meta(course)}</small>{/if}
              </span>
              <span class="chips">
                {#if newFiles}
                  <span class="chip chip-mint num">{newFiles} new</span>
                {:else if saved}
                  <span class="small">Saved {shortDay(saved)}</span>
                {/if}
                {#if teaches(course)}
                  <span class="chip chip-line"><Icon name="teacher" size={14} />You teach</span>
                {/if}
              </span>
            </label>
          {/each}
        </fieldset>
      {/each}
    {/if}
  </div>

  <footer>
    <span class="mode">
      {#if settings && mode}
        <span class="chip chip-{mode.tone}" title={describeExport(settings)}>
          <Icon name={mode.icon} size={14} />{mode.label}
        </span>
      {/if}
      <button type="button" class="link" onclick={onsettings}>Change</button>
    </span>
    <button type="button" class="btn btn-primary" disabled={selected.size === 0} onclick={download}>
      <Icon name="download" size={18} />
      {selected.size === 0
        ? 'Choose courses'
        : `Download ${selected.size} ${selected.size === 1 ? 'course' : 'courses'}`}
    </button>
  </footer>
</dialog>

<style>
  /* px throughout: rem would follow the Canvas page's root font size. */
  dialog {
    width: min(640px, calc(100vw - 32px));
    height: min(640px, calc(100vh - 32px));
    overflow: hidden;
    grid-template-rows: auto auto 1fr auto;
  }
  dialog[open] {
    display: grid;
  }
  .top {
    display: grid;
    gap: 14px;
    padding: 18px 16px 0 20px;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .actions > :global(.gh) {
    margin-right: 6px;
  }
  .filters {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 12px;
    align-items: center;
  }
  /* Current / Past, as the theme's segmented control. */
  .tabs {
    display: inline-flex;
    padding: 4px;
    gap: 4px;
    background: var(--mist-2);
    border-radius: var(--r-pill);
  }
  [role='tab'] {
    height: 34px;
    padding: 0 16px;
    border: 0;
    border-radius: var(--r-pill);
    background: none;
    font: 600 14px/1 var(--font-ui);
    color: var(--ink-2);
    cursor: pointer;
    white-space: nowrap;
  }
  [role='tab'][aria-selected='true'] {
    background: #fff;
    color: var(--ink);
    box-shadow: 0 1px 2px rgba(20, 32, 47, 0.12);
  }
  .search .input {
    height: 42px;
  }
  .select-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 42px;
    padding: 12px 24px 6px 20px;
  }
  .all {
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
  }
  .count {
    margin-left: auto;
    font-weight: 600;
    color: var(--ink-2);
  }
  .list {
    overflow-y: auto;
    padding: 0 8px 8px;
  }
  .state {
    color: var(--ink-3);
    padding: 24px 12px;
    text-align: center;
  }
  .state .btn {
    margin-top: 12px;
  }
  fieldset {
    border: 0;
    margin: 0;
    padding: 0;
    min-width: 0;
  }
  fieldset + fieldset {
    margin-top: 6px;
  }
  legend {
    padding: 0;
    width: 100%;
  }
  .group {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 40px;
    padding: 0 12px;
    font-weight: 700;
    font-size: 14px;
    color: var(--ink-2);
    cursor: pointer;
  }
  .pill {
    display: inline-grid;
    place-items: center;
    min-width: 24px;
    height: 22px;
    padding: 0 7px;
    margin-left: -4px;
    border-radius: var(--r-pill);
    background: var(--mist-2);
    font-size: 12px;
    font-weight: 700;
    color: var(--ink-2);
  }
  .course {
    display: grid;
    grid-template-columns: 20px 10px 1fr auto;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 8px 12px;
    border-radius: 14px;
    cursor: pointer;
  }
  .course:hover {
    background: var(--mist);
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  .text {
    min-width: 0;
  }
  .text strong {
    display: block;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.3;
  }
  .text small {
    display: block;
    font-size: 13px;
    color: var(--ink-3);
  }
  .chips {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 20px 18px;
    border-top: 1px solid var(--mist-2);
  }
  .mode {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .mode .link {
    font-size: 13px;
    font-weight: 600;
  }
  /* A narrow window, or a zoomed-in page: the logo stands in for the name, and rows stack. */
  @media (max-width: 520px) {
    .dialog-head .brand-name {
      display: none;
    }
    .filters {
      grid-template-columns: minmax(0, 1fr);
    }
    .tabs {
      justify-self: start;
    }
    footer {
      flex-wrap: wrap;
    }
    footer .btn {
      flex: 1 1 auto;
    }
  }
</style>
