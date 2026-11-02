<script lang="ts">
  import { ICONS, type IconName, type Shape } from './icons';

  let {
    name,
    size = 20,
    label,
  }: {
    name: IconName;
    size?: number;
    /** Set when the icon carries meaning on its own; otherwise it's hidden from screen readers. */
    label?: string;
  } = $props();

  const shapes = $derived(ICONS[name] as Shape[]);
</script>

<svg
  class="icon"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>
  {#each shapes as shape, i (i)}
    {#if shape[0] === 'path'}
      <path d={shape[1].d} />
    {:else if shape[0] === 'circle'}
      <circle cx={shape[1].cx} cy={shape[1].cy} r={shape[1].r} />
    {:else if shape[0] === 'rect'}
      <rect
        x={shape[1].x}
        y={shape[1].y}
        width={shape[1].width}
        height={shape[1].height}
        rx={shape[1].rx}
      />
    {:else}
      <line x1={shape[1].x1} y1={shape[1].y1} x2={shape[1].x2} y2={shape[1].y2} />
    {/if}
  {/each}
</svg>

<style>
  .icon {
    flex: none;
    display: block;
  }
</style>
