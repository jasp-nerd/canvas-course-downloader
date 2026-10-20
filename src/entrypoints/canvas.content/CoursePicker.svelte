<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { describeExport } from '../../app/summary';
  import { CanvasError, createCanvasClient } from '../../canvas/client';
  import {
    groupByTerm,
    listCourses,
    matchesSearch,
    type CourseSummary,
  } from '../../canvas/courses';
  import { loadSettings } from '../../storage/settings';
  import { canvasButtonColors } from '../../ui/contrast';

  let {
    origin,
    onclose,
    ondownload,
    onsettings,
  }: {
    origin: string;
    onclose: () => void;
    ondownload: (courseIds: string[]) => void;
    onsettings: () => void;
  } = $props();

  type Tab = 'active' | 'completed';
  type List =
    | { status: 'loading' }
    | { status: 'ready'; courses: CourseSummary[] }
    | { status: 'error'; signedOut: boolean };

  let tab = $state<Tab>('active');
  let lists = $state<Record<Tab, List>>({
    active: { status: 'loading' },
    completed: { status: 'loading' },
  });
  let query = $state('');
  let summary = $state('');
  let dialog: HTMLDivElement | undefined = $state();
  let search: HTMLInputElement | undefined = $state();
  // Selection is kept across tabs and searches.
  const selected = new SvelteSet<string>();
  const colors = canvasButtonColors();
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

  onMount(() => {
    void load('active');
    void load('completed');
    void loadSettings().then((s) => (summary = describeExport(s)));
    search?.focus();
  });

  const current = $derived(lists[tab]);
  const visible = $derived(
    current.status === 'ready' ? current.courses.filter((c) => matchesSearch(c, query)) : [],
  );
  const groups = $derived(groupByTerm(visible));
  const isSelected = (c: CourseSummary) => selected.has(String(c.id));

  function setAll(courses: CourseSummary[], on: boolean) {
    for (const c of courses) {
      if (on) selected.add(String(c.id));
      else selected.delete(String(c.id));
    }
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onclose();
      return;
    }
    if (event.key !== 'Tab' || !dialog) return;
    // Keep keyboard focus inside the dialog while it's open.
    const focusable = [
      ...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input, [tabindex="0"]'),
    ];
    const first = focusable[0];
    const last = focusable.at(-1);
    const active = (dialog.getRootNode() as ShadowRoot).activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first?.focus();
    }
  }
</script>

<div class="backdrop" onclick={onclose} aria-hidden="true"></div>
<div
  class="dialog"
  role="dialog"
  aria-modal="true"
  aria-labelledby="ccd-picker-title"
  bind:this={dialog}
  {onkeydown}
  tabindex="-1"
>
  <header>
    <h2 id="ccd-picker-title">Download courses</h2>
    <button type="button" class="close" aria-label="Close" onclick={onclose}>×</button>
  </header>

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

  <input
    bind:this={search}
    bind:value={query}
    type="search"
    placeholder="Search by name, code or term"
    aria-label="Search courses"
  />

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
          <button type="button" class="secondary" onclick={() => load(tab)}>Try again</button>
        {/if}
      </div>
    {:else if visible.length === 0}
      <p class="state">
        {#if query}No courses match "{query}".{:else if tab === 'active'}No current courses. Try
          Past.{:else}No past courses.{/if}
      </p>
    {:else}
      <label class="all">
        <input
          type="checkbox"
          checked={visible.every(isSelected)}
          indeterminate={!visible.every(isSelected) && visible.some(isSelected)}
          onchange={(e) => setAll(visible, e.currentTarget.checked)}
        />
        Select all{query ? ' matching' : ''}
      </label>
      {#each groups as group (group.term)}
        <fieldset>
          <legend>
            <label>
              <input
                type="checkbox"
                checked={group.courses.every(isSelected)}
                indeterminate={!group.courses.every(isSelected) && group.courses.some(isSelected)}
                onchange={(e) => setAll(group.courses, e.currentTarget.checked)}
              />
              {group.term}
              <span class="count">{group.courses.length}</span>
            </label>
          </legend>
          {#each group.courses as course (course.id)}
            <label class="course">
              <input
                type="checkbox"
                checked={isSelected(course)}
                onchange={(e) => setAll([course], e.currentTarget.checked)}
              />
              <span class="name">{course.name}</span>
              {#if course.course_code}<span class="code">{course.course_code}</span>{/if}
            </label>
          {/each}
        </fieldset>
      {/each}
    {/if}
  </div>

  <footer>
    <p class="summary">
      {summary}
      <button type="button" class="link" onclick={onsettings}>Change</button>
    </p>
    <button
      type="button"
      class="primary"
      disabled={selected.size === 0}
      style:--bg={colors.background}
      style:--fg={colors.text}
      onclick={() => ondownload([...selected])}
    >
      {selected.size === 0
        ? 'Choose courses'
        : `Download ${selected.size} ${selected.size === 1 ? 'course' : 'courses'}`}
    </button>
  </footer>
</div>

<style>
  /* px throughout: rem would follow the Canvas page's root font size. */
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(16, 24, 32, 0.45);
  }
  .dialog {
    position: fixed;
    inset: 0;
    margin: auto;
    width: min(560px, calc(100vw - 32px));
    height: min(640px, calc(100vh - 48px));
    display: flex;
    flex-direction: column;
    background: #ffffff;
    color: #1d2733;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    font:
      14px/1.45 system-ui,
      -apple-system,
      'Segoe UI',
      Roboto,
      sans-serif;
    overflow: hidden;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px 8px;
  }
  h2 {
    margin: 0;
    font-size: 18px;
  }
  .close {
    border: 0;
    background: none;
    font-size: 24px;
    line-height: 1;
    padding: 4px 8px;
    border-radius: 6px;
    cursor: pointer;
    color: #556270;
  }
  .tabs {
    display: flex;
    gap: 4px;
    padding: 0 20px;
    border-bottom: 1px solid #d9dee4;
  }
  [role='tab'] {
    border: 0;
    background: none;
    font: inherit;
    padding: 8px 12px;
    cursor: pointer;
    color: #556270;
    border-bottom: 2px solid transparent;
  }
  [role='tab'][aria-selected='true'] {
    color: #1d2733;
    font-weight: 600;
    border-bottom-color: #1d2733;
  }
  input[type='search'] {
    margin: 12px 20px 4px;
    padding: 8px 10px;
    border: 1px solid #b8c1cb;
    border-radius: 8px;
    font: inherit;
  }
  .list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 20px;
  }
  .state {
    color: #556270;
    padding: 24px 0;
    text-align: center;
  }
  label {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }
  .all {
    padding: 6px 0;
    font-weight: 600;
  }
  fieldset {
    border: 0;
    margin: 8px 0 0;
    padding: 0;
  }
  legend {
    font-weight: 600;
    padding: 6px 0;
  }
  .count {
    color: #556270;
    font-weight: 400;
  }
  .course {
    padding: 6px 0 6px 24px;
  }
  .name {
    flex: 1;
  }
  .code {
    color: #556270;
    font-size: 13px;
  }
  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 20px;
    border-top: 1px solid #d9dee4;
  }
  .summary {
    margin: 0;
    color: #556270;
    font-size: 13px;
  }
  .link {
    border: 0;
    background: none;
    padding: 0;
    font: inherit;
    color: #0b5cad;
    text-decoration: underline;
    cursor: pointer;
  }
  .primary,
  .secondary {
    font:
      600 14px/1.2 system-ui,
      -apple-system,
      'Segoe UI',
      Roboto,
      sans-serif;
    padding: 10px 16px;
    border-radius: 8px;
    cursor: pointer;
    white-space: nowrap;
  }
  .primary {
    border: 0;
    background: var(--bg);
    color: var(--fg);
  }
  .primary:disabled {
    background: #d9dee4;
    color: #556270;
    cursor: default;
  }
  .secondary {
    border: 1px solid #b8c1cb;
    background: #ffffff;
    color: #1d2733;
  }
  button:focus-visible,
  input:focus-visible {
    outline: 3px solid #0b5cad;
    outline-offset: 2px;
  }
</style>
