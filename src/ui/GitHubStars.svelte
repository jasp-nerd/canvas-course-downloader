<script lang="ts">
  // "Star on GitHub" with the live count: seeing the number invites the click.
  import { starLabel } from '../app/github';

  let { count, href }: { count: number | null; href: string } = $props();
</script>

<a
  class="gh"
  {href}
  target="_blank"
  rel="noopener noreferrer"
  aria-label={count === null
    ? 'Star Course Downloader on GitHub'
    : `Star Course Downloader on GitHub, ${count} ${count === 1 ? 'star' : 'stars'}`}
>
  <span class="gh-star">
    <!-- GitHub's mark, from Octicons (MIT). -->
    <svg class="mark" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"
      />
    </svg>
    Star
  </span>
  {#if count !== null}
    <span class="gh-count num">
      <svg class="star" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path
          d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
        />
      </svg>
      {starLabel(count)}
    </span>
  {/if}
</a>

<style>
  .gh {
    display: inline-flex;
    align-items: stretch;
    height: 32px;
    box-sizing: border-box;
    border-radius: 999px;
    /* White with its own outline, so it reads as one button on white, mist or sun. */
    border: 1.5px solid var(--control, #c6ced8);
    background: #fff;
    color: var(--ink, #14202f);
    font: 600 13px/1 var(--font-ui, system-ui, sans-serif);
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    transition:
      border-color 0.12s,
      transform 0.12s;
  }
  .gh:hover {
    border-color: var(--control-strong, #8b95a5);
    transform: translateY(-1px);
  }
  .gh:focus-visible {
    outline: 3px solid var(--ink, #14202f);
    outline-offset: 2px;
  }
  .gh-star,
  .gh-count {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 12px;
  }
  .gh-count {
    padding: 0 12px 0 10px;
    border-left: 1.5px solid var(--control, #c6ced8);
  }
  .gh:hover .gh-count {
    border-left-color: var(--control-strong, #8b95a5);
  }
  .star {
    fill: var(--sun, #ffc43d);
    stroke: var(--sun-ink, #7a5200);
    stroke-width: 1.5;
    stroke-linejoin: round;
    transition: transform 0.2s;
  }
  .gh:hover .star {
    transform: scale(1.2) rotate(-12deg);
  }
  @media (prefers-reduced-motion: reduce) {
    .gh,
    .star {
      transition: none;
    }
    .gh:hover,
    .gh:hover .star {
      transform: none;
    }
  }
</style>
