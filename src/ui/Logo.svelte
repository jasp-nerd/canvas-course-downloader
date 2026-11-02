<script lang="ts">
  import { dotsFor } from './logo';
  import { LOGO_ARROW, LOGO_DOTS, LOGO_TRANSFORM, LOGO_VIEWBOX } from './logo-paths';

  let {
    size = 32,
    progress,
    color = 'var(--red, #d82828)',
    pale = 'var(--red-pale, #f7d3d3)',
    label,
    looping = false,
  }: {
    size?: number;
    /** 0 to 1: the dots fill clockwise. Leave out for the plain logo. */
    progress?: number;
    color?: string;
    /** Colour of the dots not filled yet. */
    pale?: string;
    /** Accessible name; without one the logo is decoration. */
    label?: string;
    /** Fill, hold and empty on a loop, for "working on it" without a number. */
    looping?: boolean;
  } = $props();

  const filled = $derived(progress === undefined ? LOGO_DOTS.length : dotsFor(progress));
</script>

<svg
  class="logo"
  class:looping
  width={size}
  height={size}
  viewBox={LOGO_VIEWBOX}
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
  style:--on={color}
  style:--off={pale}
>
  <g transform={LOGO_TRANSFORM}>
    {#each LOGO_DOTS as d, i (i)}
      <path
        {d}
        fill={looping ? undefined : i < filled ? color : pale}
        style:animation-delay={looping ? `${(i * 0.07).toFixed(2)}s` : undefined}
      />
    {/each}
    <path d={LOGO_ARROW} fill={color} />
  </g>
</svg>

<style>
  .logo {
    flex: none;
    display: block;
  }
  .logo path {
    transition: fill 0.25s;
  }
  .looping path:not(:last-child) {
    fill: var(--off);
    animation: fill-dots 4.4s linear infinite;
  }
  @keyframes fill-dots {
    0% {
      fill: var(--off);
    }
    4%,
    80% {
      fill: var(--on);
    }
    84%,
    100% {
      fill: var(--off);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .looping path:not(:last-child) {
      animation: none;
      fill: var(--on);
    }
    .logo path {
      transition: none;
    }
  }
</style>
