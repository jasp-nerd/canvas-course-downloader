<script lang="ts">
  // Shown beside the receipt after a good export, when someone just saved their time. A coffee
  // and a rating sit side by side for everyone; using one keeps the card, with a thank-you, and
  // only "Don't show again" stops it. Compact (one row, no pitch) when it showed shortly before.
  import { browser } from 'wxt/browser';
  import { LINKS, feedbackUrl, reviewLabel, reviewUrl, tracked } from '../../app/links';
  import { hideSupportCard, type SupportCardMode } from '../../app/support';
  import Icon from '../../ui/Icon.svelte';
  import KofiCup from '../../ui/KofiCup.svelte';
  import Logo from '../../ui/Logo.svelte';

  let { mode }: { mode: SupportCardMode } = $props();

  const coffee = tracked(LINKS.koFi, 'support-card');
  const review = tracked(reviewUrl(), 'support-card');
  const rate = reviewLabel();
  const feedback = feedbackUrl(browser.runtime.getManifest().version, import.meta.env.BROWSER);
  let clicked = $state<'coffee' | 'review' | null>(null);
  let hidden = $state(false);

  const heading = $derived(
    clicked === 'coffee'
      ? 'Thank you!'
      : clicked === 'review'
        ? 'Thanks for rating it!'
        : 'Did it save you some time?',
  );
  const pitch = $derived(
    clicked === 'coffee'
      ? "That means a lot. It's what keeps it free for everyone."
      : clicked === 'review'
        ? "If you'd like to do more, a coffee helps too."
        : "I'm Jasper, a student, and I build this in my spare time. It's free and stays free. A coffee keeps me going, and a rating helps other students find it.",
  );

  function hide() {
    hidden = true;
    void hideSupportCard();
  }
</script>

{#if mode && !hidden && (coffee || review)}
  <!-- The logo, not the mascot: every receipt already has the mascot on it. -->
  <aside class="card support" class:compact={mode === 'compact'} aria-labelledby="support-title">
    {#if mode === 'full'}<Logo size={40} />{/if}
    <div class="body">
      <h2 class="heading" id="support-title">{heading}</h2>
      {#if mode === 'full' || clicked}<p>{pitch}</p>{/if}
      <div class="row actions">
        {#if coffee}
          <!-- Ko-fi's blue and cup, which people know, in the app's button shape. -->
          <a
            class="btn kofi"
            href={coffee}
            target="_blank"
            rel="noopener"
            onclick={() => (clicked = 'coffee')}
            ><KofiCup size={24} />Buy me a coffee<span class="sr-only"> on Ko-fi</span></a
          >
        {/if}
        {#if review && rate}
          <a
            class="btn btn-light"
            href={review}
            target="_blank"
            rel="noopener"
            onclick={() => (clicked = 'review')}><Icon name="star" size={16} />{rate}</a
          >
        {/if}
      </div>
      <div class="row quiet">
        {#if mode === 'full'}
          <a href={feedback} target="_blank" rel="noopener">Something missing? Tell me</a>
        {/if}
        <button type="button" class="link" onclick={hide}>Don't show again</button>
      </div>
    </div>
  </aside>
{/if}

<style>
  .support {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 16px;
    align-items: start;
    padding: 22px 28px;
    border-radius: 24px;
  }
  .support > :global(svg) {
    margin-top: 2px;
  }
  .compact {
    grid-template-columns: minmax(0, 1fr);
    padding: 18px 28px;
  }
  .body {
    display: grid;
  }
  h2 {
    margin: 0;
    font-size: 17px;
    line-height: 1.3;
  }
  p {
    margin: 6px 0 0;
    font-size: 14px;
    color: var(--ink-2);
    text-wrap: pretty;
  }
  .actions {
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 16px;
  }
  .compact .actions {
    margin-top: 12px;
  }
  .quiet {
    gap: 0 20px;
    flex-wrap: wrap;
    margin-top: 6px;
    font-size: 13px;
  }
  .quiet a,
  .quiet .link {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    color: var(--ink-2);
    text-underline-offset: 3px;
  }
  .quiet a:hover {
    color: var(--ink);
  }
  .kofi {
    padding: 0 20px 0 14px;
    background: #72a4f2;
    color: #14171f;
    font-weight: 700;
    box-shadow: 0 3px 0 #4a7fd0;
  }
  .kofi:hover {
    background: #6598ea;
  }
  .kofi:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 #4a7fd0;
  }
  @media (max-width: 520px) {
    .support {
      grid-template-columns: minmax(0, 1fr);
    }
    .support > :global(svg) {
      display: none;
    }
    .actions > * {
      flex: 1 1 100%;
    }
  }
</style>
