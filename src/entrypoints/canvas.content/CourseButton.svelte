<script lang="ts">
  let { onclick }: { onclick: () => void } = $props();
</script>

<button type="button" {onclick}>
  <svg
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
  Download course
</button>

<style>
  /* px, not rem: rem would follow the Canvas page's root font size. */
  button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: 12px;
    padding: 6px 12px;
    border: 0;
    border-radius: 6px;
    /* Canvas exposes each school's brand colours as custom properties, which reach into the shadow root. */
    background: var(--ic-brand-button--primary-bgd, var(--ic-brand-primary, #0b6bcb));
    color: var(--ic-brand-button--primary-text, #ffffff);
    font:
      600 14px/1.2 system-ui,
      -apple-system,
      'Segoe UI',
      Roboto,
      sans-serif;
    cursor: pointer;
    white-space: nowrap;
  }
  button:hover {
    filter: brightness(0.92);
  }
  button:focus-visible {
    outline: 3px solid #1d2733;
    outline-offset: 2px;
  }
</style>
