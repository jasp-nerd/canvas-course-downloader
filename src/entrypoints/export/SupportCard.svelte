<script lang="ts">
  import { browser } from 'wxt/browser';
  import { LINKS, feedbackUrl, reviewUrl, tracked } from '../../app/links';
  import { REVIEW_FLOW, finishSupportCard } from '../../app/support';

  let step = $state<'ask' | 'yes' | 'no' | 'thanks' | 'gone'>('ask');
  const review = tracked(reviewUrl(), 'support-card');
  const feedback = feedbackUrl(browser.runtime.getManifest().version, import.meta.env.BROWSER);

  function answer(next: 'yes' | 'no') {
    step = next;
    void finishSupportCard();
  }
</script>

{#if step !== 'gone'}
  <aside class="support" aria-labelledby="support-title">
    {#if step === 'ask'}
      <h2 id="support-title">Did this work well for you?</h2>
      <div class="row">
        <button type="button" onclick={() => answer('yes')}
          ><span aria-hidden="true">👍</span> Yes</button
        >
        <button type="button" onclick={() => answer('no')}
          ><span aria-hidden="true">👎</span> Not really</button
        >
        <button
          type="button"
          class="quiet"
          onclick={() => {
            step = 'gone';
            void finishSupportCard();
          }}>Don't ask again</button
        >
      </div>
    {:else if step === 'yes'}
      <h2 id="support-title">Glad to hear it</h2>
      <p>It's free and made by a student. A short review helps other students find it.</p>
      <div class="row">
        {#if review}
          <a
            class="primary"
            href={review}
            target="_blank"
            rel="noopener"
            onclick={() => (step = 'thanks')}>Write a review</a
          >
        {/if}
        <a
          href={tracked(LINKS.github, 'support-card')}
          target="_blank"
          rel="noopener"
          onclick={() => (step = 'thanks')}>Star on GitHub</a
        >
        {#if LINKS.koFi}
          <a
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
      <div class="row">
        <a
          class="primary"
          href={feedback}
          target="_blank"
          rel="noopener"
          onclick={() => (step = 'thanks')}>Tell me what went wrong</a
        >
        {#if REVIEW_FLOW === 'both' && review}
          <a href={review} target="_blank" rel="noopener" onclick={() => (step = 'thanks')}
            >Write a review</a
          >
        {/if}
      </div>
    {:else}
      <p id="support-title">Thanks!</p>
    {/if}
  </aside>
{/if}

<style>
  .support {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 18px;
    margin: 0 0 16px;
    display: grid;
    gap: 8px;
  }
  h2 {
    font-size: 15px;
    margin: 0;
  }
  p {
    margin: 0;
    color: var(--muted);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
  }
  button {
    font: inherit;
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
  }
  .quiet {
    border: 0;
    background: none;
    color: var(--muted);
    text-decoration: underline;
    padding: 0;
  }
  a {
    color: var(--accent);
  }
  a.primary {
    padding: 7px 14px;
    border-radius: 8px;
    background: var(--accent);
    color: var(--surface);
    text-decoration: none;
    font-weight: 600;
  }
  button:focus-visible,
  a:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }
</style>
