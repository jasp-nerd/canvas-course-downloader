<script lang="ts">
  import { onMount, tick, type Component } from 'svelte';
  import { browser } from 'wxt/browser';
  import { githubStars } from '../../app/github';
  import { LINKS, reviewUrl, tracked } from '../../app/links';
  import { PRODUCT_NAME } from '../../ui/brand';
  import Icon from '../../ui/Icon.svelte';
  import type { IconName } from '../../ui/icons';
  import GitHubStars from '../../ui/GitHubStars.svelte';
  import Logo from '../../ui/Logo.svelte';
  import AdvancedView from './AdvancedView.svelte';
  import DownloadsView from './DownloadsView.svelte';
  import HelpView from './HelpView.svelte';
  import IncludedView from './IncludedView.svelte';
  import SavingView from './SavingView.svelte';
  import { load, options } from './state.svelte';

  // Each view has its own address (#downloads, ...), so the popup and help links can open one.
  const VIEWS: { id: string; title: string; lead: string; icon: IconName; view: Component }[] = [
    {
      id: 'downloads',
      title: 'Downloads',
      lead: 'These apply to every download.',
      icon: 'download',
      view: DownloadsView,
    },
    {
      id: 'included',
      title: "What's included",
      lead: 'What each download saves from a course.',
      icon: 'listChecks',
      view: IncludedView,
    },
    {
      id: 'saving',
      title: 'Saving',
      lead: 'Where files land, and what happens when a name is taken.',
      icon: 'folder',
      view: SavingView,
    },
    {
      id: 'advanced',
      title: 'Advanced',
      lead: 'Formats, limits and access to files some schools keep elsewhere.',
      icon: 'sliders',
      view: AdvancedView,
    },
    {
      id: 'help',
      title: 'Help & support',
      lead: "How it works, and where to go when it doesn't.",
      icon: 'help',
      view: HelpView,
    },
  ];
  const fromHash = () => VIEWS.find((v) => `#${v.id}` === location.hash) ?? VIEWS[0]!;

  let current = $state(fromHash());
  let ready = $state(false);
  let heading = $state<HTMLHeadingElement>();
  const version = browser.runtime.getManifest().version;
  const review = tracked(reviewUrl(), 'options');

  let stars = $state<number | null>(null);

  onMount(() => {
    void load().then(() => (ready = true));
    void githubStars().then((count) => (stars = count));
    const onHash = () => {
      current = fromHash();
      // Moving to another view moves the reader to its heading.
      void tick().then(() => heading?.focus());
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  });

  $effect(() => {
    document.title = `${current.title} · Settings · ${PRODUCT_NAME}`;
  });
</script>

<div class="page">
  <div class="panel">
    <aside>
      <span class="brand">
        <Logo size={40} />
        <span class="brand-name">Settings<small>{PRODUCT_NAME}</small></span>
      </span>
      <nav aria-label="Settings">
        {#each VIEWS as v (v.id)}
          <a href="#{v.id}" aria-current={v.id === current.id ? 'page' : undefined}>
            <Icon name={v.icon} size={16} />{v.title}
          </a>
        {/each}
      </nav>
      <div class="foot">
        <div class="enjoy">
          <strong><Icon name="star" size={16} />Enjoying it?</strong>
          {#if review}<a href={review} target="_blank" rel="noopener">Leave a review</a>{/if}
          <GitHubStars count={stars} href={tracked(LINKS.github, 'options')} />
        </div>
        <span class="small num">Version {version}</span>
      </div>
    </aside>

    <main>
      <header>
        <h1 class="title" tabindex="-1" bind:this={heading}>{current.title}</h1>
        <p>{current.lead}</p>
      </header>
      {#if ready}
        <current.view />
      {/if}
    </main>
  </div>

  <div class="toast-spot" role="status" aria-live="polite">
    {#if options.saved}<span class="toast"><Icon name="check" />Saved</span>{/if}
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    background: var(--mist);
    color: var(--ink);
    font: 15px/1.5 var(--font-ui);
    -webkit-font-smoothing: antialiased;
  }
  .page {
    padding: 32px 40px;
    min-height: 100vh;
    box-sizing: border-box;
  }
  .panel {
    display: grid;
    grid-template-columns: 272px minmax(0, 1fr);
    min-height: calc(100vh - 64px);
    /* The line between sidebar and content runs the panel's full height, however long the view. */
    background:
      linear-gradient(var(--line), var(--line)) 271px 0 / 1px 100% no-repeat,
      #fff;
    border-radius: 28px;
    box-shadow: inset 0 0 0 1px var(--line);
    /* clip, not hidden: hidden would make the panel the sidebar's scroller and break sticky. */
    overflow: clip;
  }

  aside {
    position: sticky;
    top: 32px;
    height: calc(100vh - 64px);
    box-sizing: border-box;
    padding: 28px 18px 24px;
    display: grid;
    grid-template-rows: auto auto 1fr;
    gap: 26px;
  }
  aside .brand {
    padding: 0 10px;
  }
  aside .brand-name {
    font-size: 19px;
  }
  nav {
    display: grid;
    gap: 2px;
  }
  nav a {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 40px;
    padding: 0 12px;
    border-radius: 12px;
    color: var(--ink-2);
    text-decoration: none;
    font-size: 15px;
    font-weight: 500;
  }
  nav a:hover {
    background: var(--mist);
  }
  nav a[aria-current='page'] {
    background: var(--mist-2);
    color: var(--ink);
    font-weight: 600;
  }
  .foot {
    align-self: end;
    display: grid;
    gap: 14px;
    padding: 0 10px;
  }
  .enjoy {
    display: grid;
    gap: 6px;
    justify-items: start;
    padding: 16px;
    border-radius: 16px;
    background: var(--sun-wash);
  }
  .enjoy strong {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
  }
  .enjoy strong :global(svg) {
    color: var(--sun-ink);
  }
  .enjoy a {
    font-size: 14px;
    color: var(--ink);
    text-underline-offset: 2px;
  }

  main {
    padding: 40px 56px 48px;
    display: grid;
    align-content: start;
    gap: 34px;
    min-width: 0;
  }
  header {
    display: grid;
    gap: 6px;
    /* Room for the "Saved" toast beside the title. */
    padding-right: 120px;
  }
  header h1:focus {
    outline: none;
  }
  header h1:focus-visible {
    outline: 3px solid var(--ink);
    outline-offset: 4px;
    border-radius: 4px;
  }
  header p {
    margin: 0;
    color: var(--ink-2);
  }

  .toast-spot {
    position: fixed;
    top: 76px;
    right: 96px;
    z-index: 10;
  }
  .toast {
    animation: toast-in 0.18s ease-out;
  }
  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
  }

  @media (max-width: 900px) {
    .page {
      padding: 16px;
    }
    .panel {
      grid-template-columns: minmax(0, 1fr);
      min-height: calc(100vh - 32px);
      border-radius: 20px;
      background: #fff;
    }
    aside {
      position: static;
      height: auto;
      padding: 20px 16px 12px;
      grid-template-rows: auto auto;
      gap: 16px;
      box-shadow: inset 0 -1px 0 var(--line);
    }
    nav {
      display: flex;
      overflow-x: auto;
      gap: 4px;
    }
    nav a {
      flex: none;
    }
    .foot {
      display: none;
    }
    main {
      padding: 24px 16px 32px;
      gap: 28px;
    }
    header {
      padding-right: 0;
    }
    .toast-spot {
      top: auto;
      bottom: 24px;
      right: 16px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .toast {
      animation: none;
    }
  }
</style>
