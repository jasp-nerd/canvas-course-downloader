<script lang="ts">
  // The donation ask on pages people open themselves (Settings › Help, What's new),
  // never in a pop-up. A few suggested amounts make giving easier than an empty
  // field. Ko-fi has no link that fills in an amount, so the note says you choose there; the
  // labels match the monthly tiers on the Ko-fi page.
  import { LINKS, reviewUrl, tracked } from '../app/links';
  import CopyButton from './CopyButton.svelte';
  import GitHubStars from './GitHubStars.svelte';
  import Icon from './Icon.svelte';
  import Pip from './Pip.svelte';

  let { place, stars }: { place: string; stars: number | null } = $props();

  const TIERS = [
    { amount: 'Any', label: 'Choose your own amount' },
    { amount: '€5', label: 'Keeps the servers on' },
    { amount: '€10', label: 'Keeps it getting better' },
  ];
  const review = $derived(tracked(reviewUrl(), place));
</script>

<section class="support" aria-labelledby="support-title">
  <div class="story">
    <Pip pose="wave" height={112} />
    <div>
      <h2 id="support-title">Help keep it free</h2>
      <p>
        I'm a student and build Course Downloader in my free time. It has no ads and no tracking,
        and it stays free. If it saved you an afternoon, you can buy me a coffee.
      </p>
    </div>
  </div>

  {#if LINKS.koFi}
    <ul class="tiers">
      {#each TIERS as tier (tier.amount)}
        <li>
          <a href={tracked(LINKS.koFi, place)} target="_blank" rel="noopener">
            <span class="amount num">{tier.amount}</span>
            <span class="label">{tier.label}</span>
            <Icon name="coffee" size={20} />
          </a>
        </li>
      {/each}
    </ul>
    <p class="small">These open Ko-fi, where you can give once or monthly.</p>
  {/if}

  <div class="other">
    <span
      >No money needed: a review, a star or the link sent to a classmate helps others find it.</span
    >
    <span class="other-links">
      {#if review}
        <a class="btn btn-light btn-sm" href={review} target="_blank" rel="noopener">
          <Icon name="star" size={16} />Write a review
        </a>
      {/if}
      <GitHubStars count={stars} href={tracked(LINKS.github, place)} />
      <!-- The website, not a store page: it works on any browser and on a phone. -->
      <CopyButton text={LINKS.website} label="Copy the link" />
    </span>
  </div>
</section>

<style>
  .support {
    display: grid;
    gap: 20px;
    max-width: 960px;
    padding: 28px 32px;
    border-radius: var(--r-field);
    background: var(--sun-wash);
  }
  .story {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 24px;
    align-items: center;
  }
  h2 {
    margin: 0 0 6px;
    font: 700 24px/1.2 var(--font-display);
  }
  .story p {
    margin: 0;
    max-width: 600px;
    text-wrap: pretty;
    font-size: 16px;
    line-height: 1.5;
    color: var(--ink);
  }
  .tiers {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  .tiers a {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'amount icon'
      'label label';
    gap: 2px 8px;
    padding: 16px 18px;
    border-radius: var(--r-card);
    background: #fff;
    box-shadow: inset 0 0 0 1.5px transparent;
    color: var(--ink);
    text-decoration: none;
    transition:
      box-shadow 0.12s,
      transform 0.12s;
  }
  .tiers a:hover {
    box-shadow: inset 0 0 0 1.5px var(--sun-ink);
    transform: translateY(-2px);
  }
  .tiers a:focus-visible {
    outline: 3px solid var(--ink);
    outline-offset: 2px;
  }
  .amount {
    grid-area: amount;
    font: 700 28px/1.1 var(--font-display);
  }
  .label {
    grid-area: label;
    font-size: 14px;
    font-weight: 600;
    color: var(--ink-2);
  }
  .tiers :global(svg) {
    grid-area: icon;
    align-self: center;
    color: var(--sun-ink);
  }
  .small {
    margin: -8px 0 0;
    color: var(--ink-2);
  }
  .other {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px 20px;
    padding-top: 18px;
    border-top: 1.5px solid rgba(122, 82, 0, 0.16);
    font-size: 14px;
    color: var(--ink-2);
  }
  .other-links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .other-links .btn {
    height: 32px;
    background: #fff;
  }
  @media (max-width: 640px) {
    .support {
      padding: 24px 20px;
    }
    .story {
      grid-template-columns: minmax(0, 1fr);
      gap: 12px;
    }
    .tiers {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .tiers a {
      transition: none;
    }
    .tiers a:hover {
      transform: none;
    }
  }
</style>
