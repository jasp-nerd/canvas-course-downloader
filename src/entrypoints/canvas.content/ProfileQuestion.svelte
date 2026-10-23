<script lang="ts">
  import { onMount } from 'svelte';
  import type { ProfileAnswer } from '../../app/onboarding';
  import { AI_TARGETS, type AiTargetId } from '../../export/study-pack';
  import type { Settings } from '../../storage/settings';
  import Icon from '../../ui/Icon.svelte';
  import type { IconName } from '../../ui/icons';
  import Logo from '../../ui/Logo.svelte';

  let {
    courses,
    taught,
    includeStudentWork: studentWorkSetting,
    onchoose,
    oncancel,
  }: {
    /** How many courses this download is for. */
    courses: number;
    /** How many of them the user teaches. */
    taught: number;
    includeStudentWork: boolean;
    onchoose: (choice: ProfileAnswer) => void;
    oncancel: () => void;
  } = $props();

  // Short versions of the kinds in Settings, for a question asked over Canvas.
  const CHOICES: {
    profile: Settings['profile'];
    title: string;
    text: string;
    icon: IconName;
    tone: 'red' | 'sun' | 'navy';
  }[] = [
    {
      profile: 'copy',
      title: 'A copy to keep',
      text: 'Every file and page, in folders that open offline',
      icon: 'folder',
      tone: 'red',
    },
    {
      profile: 'study',
      title: 'A study pack for AI',
      text: 'A few tidy files for NotebookLM, ChatGPT or Claude',
      icon: 'ai',
      tone: 'sun',
    },
    {
      profile: 'agents',
      title: 'Files for code',
      text: 'Markdown with AGENTS.md for coding agents',
      icon: 'code',
      tone: 'navy',
    },
  ];

  let profile = $state<Settings['profile']>('copy');
  let aiTarget = $state<AiTargetId>('notebooklm');
  // Starts from the setting and is the user's to change from there, so only
  // the initial value is wanted. It's saved with the answer.
  // svelte-ignore state_referenced_locally
  let includeStudentWork = $state(studentWorkSetting);
  let dialog: HTMLDialogElement | undefined = $state();

  const teaching = $derived(
    courses === 1
      ? 'You teach this course'
      : taught === courses
        ? 'You teach these courses'
        : `You teach ${taught} of these courses`,
  );

  // A modal dialog sits above anything Canvas stacks, with the page inert behind it.
  onMount(() => dialog?.showModal());
</script>

<!-- Escape fires "cancel"; a click on the backdrop lands on the dialog element itself. -->
<dialog
  class="cd dialog"
  aria-labelledby="ccd-question-title"
  bind:this={dialog}
  oncancel={(e) => {
    e.preventDefault();
    oncancel();
  }}
  onclick={(e) => {
    if (e.target === dialog) oncancel();
  }}
>
  <form
    onsubmit={(e) => {
      e.preventDefault();
      onchoose({ profile, aiTarget, ...(taught ? { includeStudentWork } : {}) });
    }}
  >
    <div class="dialog-head">
      <span class="brand">
        <Logo size={28} />
        <span class="brand-name">Course Downloader</span>
      </span>
      <button type="button" class="icon-btn" aria-label="Close" onclick={oncancel}>
        <Icon name="x" />
      </button>
    </div>
    <h2 class="title" id="ccd-question-title">What should your downloads be?</h2>
    <fieldset class="choices">
      <legend class="sr-only">What should your downloads be?</legend>
      {#each CHOICES as choice (choice.profile)}
        <label class="choice">
          <input type="radio" name="profile" value={choice.profile} bind:group={profile} />
          <span class="tile tile-{choice.tone}"><Icon name={choice.icon} size={22} /></span>
          <span>
            <strong>{choice.title}</strong>
            <span class="choice-text">{choice.text}</span>
          </span>
          <span class="tick"></span>
        </label>
      {/each}
    </fieldset>
    {#if profile === 'study'}
      <label class="for">
        <span class="label">For</span>
        <select class="select" bind:value={aiTarget}>
          {#each Object.entries(AI_TARGETS) as [id, target] (id)}
            <option value={id}>{target.label}</option>
          {/each}
        </select>
      </label>
    {/if}
    {#if taught}
      <label class="teach">
        <span class="teach-text">
          <span class="chip chip-line"><Icon name="teacher" size={14} />{teaching}</span>
          <strong>Include students' work</strong>
          <span class="small" id="ccd-student-work">
            Off: every page, file, quiz with answers and rubric, no student data. On: adds
            submissions, grades and names.
          </span>
        </span>
        <input
          type="checkbox"
          role="switch"
          class="toggle"
          aria-label="Include students' work"
          aria-describedby="ccd-student-work"
          bind:checked={includeStudentWork}
        />
      </label>
    {/if}
    <div class="actions">
      <button type="submit" class="btn btn-primary"
        ><Icon name="download" size={18} />Start download</button
      >
      <span class="small">Change anytime in Settings</span>
    </div>
  </form>
</dialog>

<style>
  /* px throughout: rem would follow the Canvas page's root font size. */
  dialog {
    width: min(560px, calc(100vw - 32px));
    overflow: auto;
  }
  form {
    display: grid;
    gap: 18px;
    padding: 20px 24px 24px;
  }
  .title {
    font-size: 28px;
  }
  .choice {
    grid-template-columns: 44px 1fr 22px;
    min-height: 68px;
    padding: 10px 16px 10px 12px;
  }
  /* The hidden radio covers its whole row, so a click anywhere on it is a
     click on the radio itself (also for tools that click form controls). */
  .choice input {
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    pointer-events: auto;
    cursor: pointer;
  }
  .choice .tile {
    width: 44px;
    height: 44px;
  }
  .choice:has(input:checked) .tile {
    background: #fff;
  }
  .for {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .for .select {
    width: auto;
    min-width: 220px;
  }
  .teach {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-radius: var(--r-choice);
    background: var(--mist);
    cursor: pointer;
  }
  .teach-text {
    display: grid;
    gap: 6px;
    flex: 1;
  }
  .teach-text .chip {
    justify-self: start;
  }
  .teach-text strong {
    font-size: 15px;
  }
  .teach-text .small {
    margin-top: -4px;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
  }
</style>
