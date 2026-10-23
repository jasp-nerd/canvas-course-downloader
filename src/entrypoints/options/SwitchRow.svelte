<script lang="ts">
  let {
    title,
    text,
    checked,
    onchange,
  }: { title: string; text: string; checked: boolean; onchange: (on: boolean) => void } = $props();
</script>

<label class="sw">
  <span>
    <strong>{title}</strong>
    <span class="text">{text}</span>
  </span>
  <input
    type="checkbox"
    role="switch"
    class="toggle"
    {checked}
    onchange={(e) => onchange(e.currentTarget.checked)}
  />
</label>

<style>
  .sw {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 16px;
    align-items: center;
    padding: 12px 0;
    cursor: pointer;
  }
  strong {
    display: block;
    font-size: 15px;
    font-weight: 700;
  }
  .text {
    display: block;
    font-size: 14px;
    color: var(--ink-3);
  }
</style>
