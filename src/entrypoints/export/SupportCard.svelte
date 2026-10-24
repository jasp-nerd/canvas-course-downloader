<script lang="ts">
  // The one ask for a store review, the same for everyone, with "tell me what's
  // missing" beside it. A coffee is offered only after someone chose to help.
  import { browser } from 'wxt/browser';
  import { LINKS, feedbackUrl, reviewUrl, tracked } from '../../app/links';
  import { finishSupportCard } from '../../app/support';
  import Icon from '../../ui/Icon.svelte';
  import Logo from '../../ui/Logo.svelte';

  const review = tracked(reviewUrl(), 'support-card');
  const feedback = feedbackUrl(browser.runtime.getManifest().version, import.meta.env.BROWSER);
  // Without a store page to review on (Edge, for now) there's nothing to ask.
  let step = $state<'ask' | 'thanks' | 'told' | 'gone'>(review ? 'ask' : 'gone');

  function finish(next: typeof step) {
    step = next;
    void finishSupportCard();
  }
</script>

{#if step !== 'gone'}
  <!-- The logo, not the mascot: every receipt already has the mascot on it. -->
  <aside class="card support" aria-labelledby="support-title">
    <Logo size={56} />
    <div class="body">
      {#if step === 'ask'}
        <h2 id="support-title">Could you leave a short review?</h2>
        <p>It's free and made by a student. Reviews help other students find it.</p>
        <div class="row actions">
          <a
            class="btn btn-primary btn-sm"
            href={review}
            target="_blank"
            rel="noopener"
            onclick={() => finish('thanks')}><Icon name="star" size={16} />Write a review</a
          >
          <a
            class="btn btn-text btn-sm"
            href={feedback}
            target="_blank"
            rel="noopener"
            onclick={() => finish('told')}>Something missing? Tell me</a
          >
          <button type="button" class="btn btn-text btn-sm quiet" onclick={() => finish('gone')}
            >Don't ask again</button
          >
        </div>
      {:else if step === 'thanks'}
        <h2 id="support-title">Thank you!</h2>
        {#if LINKS.koFi}
          <p>
            If it saved you an afternoon, you can
            <a
              class="coffee"
              href={tracked(LINKS.koFi, 'support-card')}
              target="_blank"
              rel="noopener"><Icon name="coffee" size={16} />buy me a coffee</a
            >.
          </p>
        {/if}
      {:else}
        <h2 id="support-title">Thanks for telling me</h2>
        <p>I read every report and fix what I can.</p>
      {/if}
    </div>
  </aside>
{/if}

<style>
  .support {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 14px;
    align-items: center;
    padding: 16px 20px;
    border-radius: 24px;
  }
  .support > :global(svg) {
    justify-self: center;
  }
  .body {
    display: grid;
    gap: 10px;
  }
  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.3;
  }
  p {
    margin: 0;
    font-size: 14px;
    color: var(--ink-2);
  }
  .actions {
    gap: 8px;
    flex-wrap: wrap;
  }
  .quiet {
    font-size: 13px;
  }
  .coffee {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--red-ink);
    font-weight: 600;
  }
</style>
