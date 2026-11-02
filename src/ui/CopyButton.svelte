<script lang="ts">
  import Icon from './Icon.svelte';

  let {
    text,
    label = 'Copy',
    onCopied,
  }: {
    text: string;
    label?: string;
    /** Told whether it worked, e.g. to say so in a status line. */
    onCopied?: (ok: boolean) => void;
  } = $props();

  let copied = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function copy() {
    let ok = true;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // The page says so through onCopied; the text is on screen to select by hand.
      ok = false;
    }
    onCopied?.(ok);
    if (!ok) return;
    copied = true;
    clearTimeout(timer);
    timer = setTimeout(() => (copied = false), 2000);
  }
</script>

<button type="button" class="btn btn-light btn-sm" onclick={copy}>
  <Icon name={copied ? 'check' : 'copy'} size={16} />{copied ? 'Copied' : label}
</button>
