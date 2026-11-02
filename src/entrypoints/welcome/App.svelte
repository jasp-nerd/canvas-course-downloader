<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { browser } from 'wxt/browser';
  import { canvasToReturnTo, type SetupScreen } from '../../app/onboarding';
  import { MASCOT_NAME, PRODUCT_NAME, type PipPose } from '../../ui/brand';
  import Icon from '../../ui/Icon.svelte';
  import Logo from '../../ui/Logo.svelte';
  import Pip from '../../ui/Pip.svelte';
  import AiTool from './AiTool.svelte';
  import Demo from './Demo.svelte';
  import DownloadsPreview from './DownloadsPreview.svelte';
  import Goal from './Goal.svelte';
  import GoalPreview from './GoalPreview.svelte';
  import Hello from './Hello.svelte';
  import PackPreview from './PackPreview.svelte';
  import Ready from './Ready.svelte';
  import ReceiptPreview from './ReceiptPreview.svelte';
  import Save from './Save.svelte';
  import { back, next, saved, screens, setup, skip } from './setup.svelte';
  import Teacher from './Teacher.svelte';

  /** The colour field beside each question: its colour, Pip's pose, and room kept above Pip. */
  const FIELDS: Record<
    SetupScreen,
    { colour: string; pose: PipPose; height: number; lift: number; clear: number }
  > = {
    hello: { colour: 'field-navy', pose: 'wave', height: 440, lift: -6, clear: 150 },
    goal: { colour: 'field-red-wash', pose: 'think', height: 420, lift: -6, clear: 290 },
    teacher: { colour: 'field-red-wash', pose: 'read', height: 380, lift: 24, clear: 230 },
    ai: { colour: 'field-sun', pose: 'laptop', height: 330, lift: 8, clear: 280 },
    save: { colour: 'field-red-wash', pose: 'run', height: 330, lift: 4, clear: 300 },
    ready: { colour: 'field-navy', pose: 'point', height: 300, lift: -6, clear: 400 },
  };
  const field = $derived(FIELDS[setup.screen]);

  const steps = $derived(screens());
  const step = $derived(setup.skippedFrom ? steps.length - 1 : steps.indexOf(setup.screen));

  let canvas = $state<string | null>(null);
  let question: HTMLElement;

  onMount(async () => {
    const { lastCanvas } = await browser.storage.local.get('lastCanvas');
    canvas = canvasToReturnTo(lastCanvas);
  });

  /** Screen readers and keyboards start at the question. */
  const focusQuestion = () => question.querySelector('h1')?.focus();

  async function go(move: () => void) {
    move();
    await tick();
    focusQuestion();
  }

  /**
   * A button's click handler that moves one screen. The second click of a
   * double-click is ignored: it would land on the next screen's button, which
   * sits in the same place, and skip a question.
   */
  const navigate = (move: () => void) => (event: MouseEvent) => {
    if (event.detail < 2) void go(move);
    else focusQuestion();
  };

  function onkeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.defaultPrevented || event.isComposing) return;
    if (setup.screen === 'ready') return;
    // Buttons and links act on Enter themselves.
    if ((event.target as Element).closest('button, a, select, textarea')) return;
    event.preventDefault();
    void go(next);
  }

  /** Leaves only once the answers are written; a new-tab click keeps this tab, so it needn't wait. */
  async function goToCanvas(event: MouseEvent) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    await saved;
    location.assign(canvas!);
  }

  async function done() {
    await saved;
    const tab = await browser.tabs.getCurrent();
    if (tab?.id !== undefined) await browser.tabs.remove(tab.id);
  }
</script>

<svelte:window {onkeydown} />

<div class="ob">
  <main class="ob-main">
    <header class="ob-top">
      <span class="brand"><Logo size={36} /><span class="brand-name">{PRODUCT_NAME}</span></span>
      <div class="row top-right">
        <div class="steps" role="img" aria-label="Step {step + 1} of {steps.length}">
          {#each steps as screen, i (screen)}
            <i class:is-done={i < step} class:is-now={i === step}></i>
          {/each}
        </div>
        <!-- Nothing to skip at the end, but it keeps its place so the steps don't shift. -->
        <button
          type="button"
          class="btn btn-text btn-sm"
          class:gone={setup.screen === 'ready'}
          onclick={navigate(skip)}>Skip setup</button
        >
      </div>
    </header>

    <div class="ob-q" bind:this={question}>
      {#if setup.screen === 'hello'}
        <Hello />
      {:else if setup.screen === 'goal'}
        <Goal />
      {:else if setup.screen === 'teacher'}
        <Teacher />
      {:else if setup.screen === 'ai'}
        <AiTool />
      {:else if setup.screen === 'save'}
        <Save />
      {:else}
        <Ready />
      {/if}
    </div>

    <div class="ob-actions">
      {#if setup.screen === 'hello'}
        <button type="button" class="btn btn-primary btn-lg" onclick={navigate(next)}
          >Get started<Icon name="arrowRight" /></button
        >
        <span class="small">A few quick questions</span>
      {:else}
        <button type="button" class="btn btn-light back" aria-label="Back" onclick={navigate(back)}
          ><Icon name="arrowLeft" /></button
        >
        {#if setup.screen !== 'ready'}
          <button type="button" class="btn btn-primary btn-lg" onclick={navigate(next)}
            >Continue<Icon name="arrowRight" /></button
          >
        {:else if canvas}
          <a class="btn btn-primary btn-lg" href={canvas} onclick={goToCanvas}
            >Go to {new URL(canvas).host}<Icon name="arrowRight" /></a
          >
          <span class="small">Opens the Canvas you last used</span>
        {:else}
          <button type="button" class="btn btn-primary btn-lg" onclick={done}>Done</button>
          <span class="small"
            >Open any Canvas course; the button with our logo is next to the course name.</span
          >
        {/if}
      {/if}
    </div>
  </main>

  <aside class="ob-field {field.colour}" style:--clear="{field.clear}px">
    {#if setup.screen === 'hello'}
      <p class="greeting">
        Hi, I'm {MASCOT_NAME}.<br /><span>I keep your courses safe.</span>
      </p>
    {:else if setup.screen === 'goal'}
      <GoalPreview />
    {:else if setup.screen === 'teacher'}
      <ReceiptPreview />
    {:else if setup.screen === 'ai'}
      <PackPreview />
    {:else if setup.screen === 'save'}
      <DownloadsPreview />
    {:else}
      <Demo />
    {/if}
    <div
      class="pip-spot"
      class:start={setup.screen === 'ready'}
      style:margin-bottom="{field.lift}px"
    >
      <Pip pose={field.pose} height={field.height} class="field-pip" />
    </div>
    {#if setup.screen === 'ready'}
      <p class="caption">Look for this button next to the course name.</p>
    {/if}
  </aside>
</div>

<style>
  :global(body) {
    margin: 0;
    background: #fff;
    color: var(--ink);
    font: 400 15px/1.5 var(--font-ui);
    -webkit-font-smoothing: antialiased;
  }
  :global(*, *::before, *::after) {
    box-sizing: border-box;
  }

  /* The question on the left, a colour field with Pip on the right. */
  .ob {
    min-height: 100vh;
    min-height: 100dvh;
    display: grid;
    grid-template-columns: minmax(0, 1fr) clamp(420px, 43vw, 760px);
    gap: 24px;
    padding: 24px;
  }
  .ob-main {
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 24px;
    padding: 24px 40px 24px 48px;
    min-width: 0;
  }
  .ob-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    max-width: 572px;
  }
  .top-right {
    gap: 20px;
  }
  .gone {
    visibility: hidden;
  }
  .ob-q {
    display: grid;
    align-content: center;
    gap: 22px;
    max-width: 540px;
  }
  .ob-q :global(h1:focus) {
    outline: none;
  }
  .ob-q :global(.lead) {
    margin-top: -8px;
  }
  /* The theme's .link takes the surrounding font; these small links stay small. */
  .ob-q :global(.link.small) {
    font-size: 13px;
  }
  .ob-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
  }
  .ob-actions .small {
    max-width: 300px;
  }
  .back {
    padding: 0 22px;
  }

  /* Step dots; the current step is the logo's red oval. */
  .steps {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .steps i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--red-pale);
    transition: width 0.2s;
  }
  .steps i.is-done {
    background: var(--red);
  }
  .steps i.is-now {
    width: 26px;
    height: 10px;
    background: var(--red);
  }

  .ob-field {
    border-radius: var(--r-field);
    position: relative;
    overflow: hidden;
    display: grid;
    place-items: end center;
    min-height: 520px;
  }
  .pip-spot.start {
    justify-self: start;
    margin-left: 36px;
  }
  /* Shorter windows shrink Pip rather than let it cover what's above. */
  .ob-field :global(.field-pip) {
    max-height: max(220px, calc(100vh - 48px - var(--clear)));
  }
  .greeting {
    position: absolute;
    top: 40px;
    left: 44px;
    right: 44px;
    margin: 0;
    font: 800 30px/1.1 var(--font-display);
    letter-spacing: -0.02em;
    color: #fff;
  }
  .greeting span {
    color: #9fb0c6;
    font-weight: 600;
    font-size: 20px;
    letter-spacing: 0;
  }
  .caption {
    position: absolute;
    right: 40px;
    bottom: 40px;
    width: 200px;
    margin: 0;
    color: #c3cbd6;
    font-size: 14px;
    line-height: 1.45;
  }

  /* Laptop windows around 650px tall: the questions still fit without scrolling. */
  @media (max-height: 720px) {
    .ob-main {
      padding-top: 8px;
      padding-bottom: 8px;
      gap: 16px;
    }
  }
  @media (max-width: 960px) {
    .ob {
      grid-template-columns: minmax(0, 1fr);
    }
    .ob-field {
      display: none;
    }
    .ob-main {
      padding: 8px 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .steps i {
      transition: none;
    }
  }
</style>
