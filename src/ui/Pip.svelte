<script lang="ts">
  import { MASCOT_NAME, type PipPose } from './brand';

  let {
    pose,
    height,
    alt = '',
    class: className = '',
  }: {
    pose: PipPose;
    height: number;
    /** Empty for decoration; most poses only repeat what the text says. */
    alt?: string;
    class?: string;
  } = $props();
</script>

<img
  class="pip {className}"
  src="/pip/{pose}.webp"
  {alt}
  title={alt ? MASCOT_NAME : undefined}
  style:height="{height}px"
  draggable="false"
/>

<style>
  .pip {
    display: block;
    width: auto;
    user-select: none;
  }
</style>
