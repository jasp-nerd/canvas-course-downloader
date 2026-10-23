<script lang="ts">
  // While courses save: the logo filling with the percentage, the file being
  // saved and the last ones saved, counts per kind, the queue and where it goes.
  import type { CourseState } from '../../app/export-job';
  import { describeFile, formatBytes } from '../../app/receipt';
  import { timeLeftText } from '../../app/time-left';
  import Icon from '../../ui/Icon.svelte';
  import Logo from '../../ui/Logo.svelte';
  import Pip from '../../ui/Pip.svelte';
  import { openSettings } from './actions';

  let {
    courses,
    active,
    secondsLeft,
    stopping,
    onStop,
  }: {
    courses: CourseState[];
    /** The course being looked at or saved; none while getting ready. */
    active: CourseState | undefined;
    secondsLeft: number | null;
    stopping: boolean;
    onStop: () => void;
  } = $props();

  const fraction = (c: CourseState) => (c.total ? (c.done + c.failed) / c.total : 0);
  const saving = $derived(active?.phase === 'saving');
  const percent = $derived(active ? Math.floor(fraction(active) * 100) : 0);
  const pack = $derived(active?.how.profile === 'study');
  const position = $derived(active ? courses.indexOf(active) + 1 : 0);
  const name = $derived(active?.named ? active.name : 'the course');
  const current = $derived(active?.current ? describeFile(active.current.path, pack) : undefined);
  const count = $derived(
    active
      ? [
          `${active.done + active.failed} of ${active.total} files`,
          secondsLeft === null ? '' : timeLeftText(secondsLeft),
        ]
          .filter(Boolean)
          .join(' · ')
      : '',
  );
  const how = $derived(
    active
      ? [
          active.how.zip ? 'One ZIP per course' : 'Folders',
          active.how.updates ? 'only new files next time' : '',
        ]
          .filter(Boolean)
          .join(' · ')
      : '',
  );

  function queueStatus(c: CourseState): string {
    if (c.phase === 'planning' || c.phase === 'saving') return 'Saving';
    if (c.phase === 'waiting') return 'Waiting';
    if (c.outcome === 'success') return 'Saved';
    if (c.outcome === 'partial') return 'Saved, some missing';
    if (c.outcome === 'cancelled') return 'Stopped';
    return 'Not saved';
  }
</script>

<main class="progress">
  <section class="card hero">
    <div class="top">
      {#if saving && active}
        <Logo size={220} progress={fraction(active)} label={`Progress: ${percent}%`} />
      {:else}
        <Logo size={220} looping label="Getting ready" />
      {/if}
      <div class="figures">
        {#if saving && active}
          <p class="percent num" aria-hidden="true">{percent}%</p>
          <h1 class="title">Saving {active.name}</h1>
          <p class="num count">{count}</p>
          <div
            class="bar"
            role="progressbar"
            aria-label={`Saving ${active.name}`}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={percent}
          >
            <i style:width="{percent}%"></i>
          </div>
        {:else if active}
          <h1 class="title">Looking at {name}</h1>
          <p class="count">{active.message}</p>
        {:else}
          <h1 class="title">Getting ready</h1>
        {/if}
      </div>
    </div>

    {#if saving && current && active?.current}
      <div class="current">
        <Icon name="file" size={18} />
        <span class="ellipsis">{current.name}</span>
        {#if active.current.size}<span class="small num">{formatBytes(active.current.size)}</span
          >{/if}
      </div>
    {:else if saving && active}
      <div class="current">
        <Icon name="archive" size={18} />
        <span class="ellipsis">{active.message}</span>
      </div>
    {/if}

    <div class="recent">
      {#if saving && active?.recent.length}
        <h2 class="label">Just saved</h2>
        <ul>
          {#each active.recent as file (file.path)}
            {@const shown = describeFile(file.path, pack)}
            <li>
              <span class="ok"><Icon name="check" /></span>
              <span class="ellipsis"
                >{shown.name}{#if shown.kind}<span class="small"> · {shown.kind}</span>{/if}</span
              >
              {#if file.size}<span class="small num">{formatBytes(file.size)}</span>{/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <div class="foot">
      <div class="foot-text">
        <div class="notice notice-navy">
          <Icon name="info" />
          <span
            >You can keep using Canvas. Leave this tab open; the logo on its tab fills as it saves.</span
          >
        </div>
        <div>
          <button type="button" class="btn btn-light" disabled={stopping} onclick={onStop}
            >{stopping ? 'Stopping…' : 'Stop all'}</button
          >
        </div>
      </div>
      <Pip pose="run" height={200} class="pip" />
    </div>
  </section>

  <div class="side">
    {#if active}
      <section class="card panel" aria-labelledby="kinds-title">
        <div class="panel-head">
          <h2 class="heading" id="kinds-title">In {active.name}</h2>
          {#if saving}<span class="small num">{active.done + active.failed} of {active.total}</span
            >{/if}
        </div>
        {#if saving}
          <ul class="kinds">
            {#each active.kinds as kind (kind.id)}
              {@const finished = kind.done + kind.failed}
              {@const going =
                finished > 0 ||
                kind.id === active.kinds.find((k) => k.done + k.failed < k.total)?.id}
              <li>
                {#if finished === kind.total}
                  <span class="ok"><Icon name="check" label="Done" /></span>
                {:else if going}
                  <span class="going"><Icon name="refresh" label="Saving" /></span>
                {:else}
                  <span class="waiting"><Icon name="waiting" label="Waiting" /></span>
                {/if}
                <span>{kind.label}</span>
                <span class="n num">{finished} <span class="of">of {kind.total}</span></span>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="small">{active.message}</p>
        {/if}
      </section>
    {/if}

    {#if courses.length > 1}
      <section class="card panel" aria-labelledby="queue-title">
        <div class="panel-head">
          <h2 class="heading" id="queue-title">{courses.length} courses</h2>
          <span class="small num">{position} of {courses.length}</span>
        </div>
        <ul class="queue">
          {#each courses as c (c.id)}
            {@const status = queueStatus(c)}
            <li>
              <span class="dot" data-status={status}></span>
              <span class="q-name">
                <strong>{c.name}</strong>
                {#if c === active && c.phase === 'saving'}
                  <span class="bar small-bar"
                    ><i style:width="{Math.floor(fraction(c) * 100)}%"></i></span
                  >
                {/if}
              </span>
              <span class="small num" class:saving={status === 'Saving'}>{status}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if active?.destination}
      <section class="saving-to" aria-labelledby="to-title">
        <h2 class="heading" id="to-title">Saving to</h2>
        <div class="to">
          <Icon name={active.how.zip ? 'archive' : 'folder'} />
          <span class="path">{active.destination}</span>
        </div>
        <div class="row to-foot">
          <span class="small">{how}</span>
          <button type="button" class="link change" onclick={openSettings}>Change</button>
        </div>
      </section>
    {/if}
  </div>
</main>

<style>
  .progress {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
    gap: 20px;
    padding: 8px 40px 40px;
  }
  .hero {
    border-radius: 28px;
    padding: 36px 44px 0;
    display: grid;
    gap: 22px;
    overflow: hidden;
    grid-template-rows: auto auto auto 1fr;
  }
  .top {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 36px;
    align-items: center;
  }
  .figures {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .percent {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 80px;
    line-height: 0.95;
    letter-spacing: -0.03em;
    color: var(--red);
  }
  .title {
    overflow-wrap: anywhere;
  }
  .count {
    margin: 0;
    font-size: 16px;
    color: var(--ink-2);
  }
  .bar {
    margin-top: 6px;
  }
  .current {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 14px;
    background: var(--mist);
    font-size: 14px;
    color: var(--ink-2);
    min-width: 0;
  }
  .current > :global(svg) {
    color: var(--ink-3);
  }
  .current .small {
    margin-left: auto;
    white-space: nowrap;
  }
  .ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }
  .recent {
    display: grid;
    gap: 4px;
    align-content: start;
  }
  .recent h2 {
    margin: 0 0 4px;
  }
  .recent ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .recent li {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    min-height: 38px;
    font-size: 14px;
  }
  .recent li + li {
    border-top: 1px solid var(--mist-2);
  }
  .ok {
    color: var(--mint-ink);
  }
  .foot {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 200px;
    gap: 20px;
    align-items: end;
  }
  .foot-text {
    display: grid;
    gap: 18px;
    padding-bottom: 36px;
    justify-items: start;
  }
  .foot :global(.pip) {
    justify-self: end;
    margin: 0 -10px -6px 0;
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .panel {
    border-radius: 24px;
    padding: 22px 26px 12px;
  }
  .panel-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 6px;
  }
  .panel-head h2 {
    overflow-wrap: anywhere;
  }
  .panel > p {
    margin: 0 0 12px;
  }
  .kinds,
  .queue {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .kinds li + li,
  .queue li + li {
    border-top: 1px solid var(--mist-2);
  }
  .kinds li {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    min-height: 48px;
  }
  .going {
    color: var(--red);
  }
  .waiting {
    color: var(--control-strong);
  }
  .n {
    font-weight: 600;
    text-align: right;
  }
  .of {
    color: var(--ink-3);
    font-weight: 500;
  }
  .queue li {
    display: grid;
    grid-template-columns: 10px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    min-height: 52px;
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--control);
  }
  .dot[data-status='Saving'] {
    background: var(--red);
  }
  .dot[data-status='Saved'] {
    background: var(--mint-ink);
  }
  .dot[data-status='Saved, some missing'] {
    background: var(--sun-ink);
  }
  .q-name {
    display: grid;
    gap: 6px;
    min-width: 0;
  }
  .q-name strong {
    font-size: 15px;
    overflow-wrap: anywhere;
  }
  .small-bar {
    height: 6px;
    max-width: 180px;
  }
  .saving {
    color: var(--red-ink);
    font-weight: 600;
  }
  .saving-to {
    flex: 1;
    border-radius: 24px;
    padding: 22px 26px;
    background: var(--red-wash);
    display: grid;
    align-content: space-between;
    gap: 14px;
  }
  .to {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 15px;
    font-weight: 600;
    background: #fff;
    border-radius: 14px;
    padding: 16px 18px;
    min-width: 0;
  }
  .to > :global(svg) {
    color: var(--red-ink);
  }
  .path {
    overflow-wrap: anywhere;
  }
  .to-foot {
    justify-content: space-between;
    flex-wrap: wrap;
  }
  .to-foot .small {
    color: var(--ink-2);
  }
  .change {
    font-size: 13px;
    font-weight: 600;
    color: var(--red-ink);
  }
  @media (max-width: 1040px) {
    .progress {
      grid-template-columns: minmax(0, 1fr);
      padding: 8px 16px 32px;
    }
    .hero {
      padding: 28px 24px 0;
    }
  }
  @media (max-width: 640px) {
    .top {
      grid-template-columns: minmax(0, 1fr);
      gap: 16px;
    }
    .top > :global(svg) {
      width: 140px;
      height: 140px;
    }
    .percent {
      font-size: 56px;
    }
    .foot {
      grid-template-columns: minmax(0, 1fr);
    }
    .foot :global(.pip) {
      display: none;
    }
    .foot-text {
      padding-bottom: 24px;
    }
  }
</style>
