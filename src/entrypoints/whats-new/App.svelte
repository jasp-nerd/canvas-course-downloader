<script lang="ts">
  // Opened from the popup's one-time note for people who updated from 2.x,
  // never by itself: an update shouldn't open tabs nobody asked for.
  import { onMount } from 'svelte';
  import { githubStars } from '../../app/github';
  import { LINKS, tracked } from '../../app/links';
  import { PRODUCT_NAME } from '../../ui/brand';
  import Icon from '../../ui/Icon.svelte';
  import type { IconName } from '../../ui/icons';
  import Logo from '../../ui/Logo.svelte';
  import Pip from '../../ui/Pip.svelte';
  import SupportBlock from '../../ui/SupportBlock.svelte';

  const CHANGES: { title: string; text: string; icon: IconName; tile: string }[] = [
    {
      title: 'Exports run in their own tab',
      text: 'Keep using Canvas, or close it, while a course downloads. Several files download at once, so it is faster too.',
      icon: 'download',
      tile: 'tile-red',
    },
    {
      title: 'Nothing goes missing quietly',
      text: "Files that couldn't be saved are listed with the reason, on the receipt and inside every download.",
      icon: 'listChecks',
      tile: 'tile-navy',
    },
    {
      title: 'New files on your dashboard',
      text: 'Courses you saved before show what changed since, with a button that gets only the new things.',
      icon: 'refresh',
      tile: 'tile-mint',
    },
    {
      title: 'Study packs for AI',
      text: 'A download can be a pack for NotebookLM, ChatGPT or Claude: a course guide, one file per module, and the slides and PDFs.',
      icon: 'ai',
      tile: 'tile-sun',
    },
    {
      title: 'Deadlines in your calendar',
      text: 'Every copy has a Deadlines.ics file with the due dates. Import it again later and the events update instead of doubling.',
      icon: 'calendar',
      tile: 'tile-red',
    },
    {
      title: 'Copies for teachers',
      text: "A teacher's copy leaves students' work out unless you include it, and can bring Canvas's own course package along.",
      icon: 'teacher',
      tile: 'tile-navy',
    },
  ];

  let stars = $state<number | null>(null);
  onMount(() => void githubStars().then((count) => (stars = count)));
</script>

<main>
  <header class="hero field-navy">
    <div>
      <span class="brand"><Logo size={32} />{PRODUCT_NAME}</span>
      <h1 class="display">What's new in 3.0</h1>
      <p>
        A rewrite of the whole extension. Your settings and the files you already downloaded carry
        over, so there's nothing to set up again.
      </p>
    </div>
    <Pip pose="cheer" height={220} />
  </header>

  <ul class="changes">
    {#each CHANGES as change (change.title)}
      <li>
        <span class="tile {change.tile}"><Icon name={change.icon} /></span>
        <h2>{change.title}</h2>
        <p>{change.text}</p>
      </li>
    {/each}
  </ul>

  <SupportBlock place="whats-new" {stars} />

  <footer>
    <a href={tracked(LINKS.changelog, 'whats-new')} target="_blank" rel="noopener">
      Every change in 3.0<Icon name="external" size={16} />
    </a>
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    background: var(--mist);
    color: var(--ink);
    font: 15px/1.5 var(--font-ui);
    -webkit-font-smoothing: antialiased;
  }
  main {
    max-width: 1024px;
    margin: 0 auto;
    padding: 40px 40px 56px;
    display: grid;
    gap: 24px;
  }
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 32px;
    align-items: end;
    padding: 40px 48px 0;
    border-radius: var(--r-field);
    overflow: hidden;
  }
  .hero > div {
    padding-bottom: 44px;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font: 700 16px/1 var(--font-display);
  }
  h1 {
    margin: 20px 0 12px;
    font-size: 52px;
  }
  .hero p {
    margin: 0;
    max-width: 520px;
    font-size: 18px;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.86);
  }
  .changes {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }
  .changes li {
    display: grid;
    align-content: start;
    gap: 8px;
    padding: 24px;
    border-radius: var(--r-card);
    background: #fff;
  }
  .changes .tile {
    margin-bottom: 6px;
  }
  h2 {
    margin: 0;
    font: 700 18px/1.25 var(--font-display);
  }
  .changes p {
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
    color: var(--ink-2);
  }
  /* As wide as the rest of the page; in Settings it keeps to the text column. */
  main > :global(.support) {
    max-width: none;
  }
  footer a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--ink);
    font-weight: 600;
    text-underline-offset: 3px;
  }
  @media (max-width: 900px) {
    .changes {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 640px) {
    main {
      padding: 16px 16px 40px;
    }
    .hero {
      grid-template-columns: minmax(0, 1fr);
      padding: 28px 24px 0;
      gap: 0;
    }
    .hero > div {
      padding-bottom: 8px;
    }
    .hero :global(.pip) {
      justify-self: end;
      /* Pip's height is an inline style; a phone gets a smaller Pip under the text. */
      height: 150px !important;
    }
    h1 {
      font-size: 40px;
    }
    .changes {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
