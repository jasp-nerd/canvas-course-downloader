<script lang="ts">
  import { browser } from 'wxt/browser';
  import { LINKS, feedbackUrl, reviewUrl, tracked } from '../../app/links';
  import { REVIEW_FLOW, finishSupportCard } from '../../app/support';
  import { MASCOT_NAME } from '../../ui/brand';
  import Logo from '../../ui/Logo.svelte';

  let step = $state<'ask' | 'yes' | 'no' | 'thanks' | 'gone'>('ask');
  const review = tracked(reviewUrl(), 'support-card');
  const feedback = feedbackUrl(browser.runtime.getManifest().version, import.meta.env.BROWSER);

  function answer(next: 'yes' | 'no') {
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
        <h2 id="support-title">Did {MASCOT_NAME} get everything?</h2>
        <div class="row actions">
          <button type="button" class="btn btn-light btn-sm" onclick={() => answer('yes')}
            >Yes, all there</button
          >
          <button type="button" class="btn btn-light btn-sm" onclick={() => answer('no')}
            >Something's missing</button
          >
          <button
            type="button"
            class="btn btn-text btn-sm quiet"
            onclick={() => {
              step = 'gone';
              void finishSupportCard();
            }}>Don't ask</button
          >
        </div>
      {:else if step === 'yes'}
        <h2 id="support-title">Glad to hear it</h2>
        <p>It's free and made by a student. A short review helps other students find it.</p>
        <div class="row actions">
          {#if review}
            <a
              class="btn btn-primary btn-sm"
              href={review}
              target="_blank"
              rel="noopener"
              onclick={() => (step = 'thanks')}>Write a review</a
            >
          {/if}
          <a
            class="btn btn-light btn-sm"
            href={tracked(LINKS.github, 'support-card')}
            target="_blank"
            rel="noopener"
            onclick={() => (step = 'thanks')}>Star on GitHub</a
          >
          {#if LINKS.koFi}
            <a
              class="btn btn-light btn-sm"
              href={tracked(LINKS.koFi, 'support-card')}
              target="_blank"
              rel="noopener"
              onclick={() => (step = 'thanks')}>Buy me a coffee</a
            >
          {/if}
        </div>
      {:else if step === 'no'}
        <h2 id="support-title">Sorry about that</h2>
        <p>Tell me what went wrong and I'll look at it. It takes a minute.</p>
        <div class="row actions">
          <a
            class="btn btn-primary btn-sm"
            href={feedback}
            target="_blank"
            rel="noopener"
            onclick={() => (step = 'thanks')}>Tell me what went wrong</a
          >
          {#if REVIEW_FLOW === 'both' && review}
            <a
              class="btn btn-light btn-sm"
              href={review}
              target="_blank"
              rel="noopener"
              onclick={() => (step = 'thanks')}>Write a review</a
            >
          {/if}
        </div>
      {:else}
        <h2 id="support-title">Thanks!</h2>
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
</style>
