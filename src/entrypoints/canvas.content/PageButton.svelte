<script lang="ts">
  import Icon from '../../ui/Icon.svelte';
  import Logo from '../../ui/Logo.svelte';
  import { canvasButtonColors } from '../../ui/contrast';
  import { shortDay } from './day';
  import { pageState } from './state.svelte';

  let {
    label,
    hint,
    onclick,
    showNew = false,
  }: { label: string; hint: string; onclick: () => void; showNew?: boolean } = $props();
  // The school's own button colour, so the button looks like part of Canvas.
  const colors = canvasButtonColors();

  let button: HTMLButtonElement | undefined = $state();
  let tip: HTMLElement | undefined = $state();
  const newFiles = $derived(showNew ? pageState.newFiles : 0);
  const since = $derived.by(() => {
    if (!pageState.savedAt) return '';
    const day = shortDay(pageState.savedAt);
    return ` since ${day === 'today' ? 'earlier today' : day}`;
  });

  // The tooltip is a popover: the browser's top layer keeps it above whatever
  // Canvas stacks under the breadcrumbs, and nothing on the page can clip it.
  // Placed under the button by hand: Firefox has no CSS anchor positioning yet.
  function showTip() {
    if (!button || !tip || tip.matches(':popover-open')) return;
    tip.showPopover();
    const b = button.getBoundingClientRect();
    const left = Math.max(8, Math.min(b.left, innerWidth - tip.offsetWidth - 8));
    tip.style.top = `${b.bottom + 9}px`;
    tip.style.left = `${left}px`;
    // The arrow points at the button, also when the tooltip had to move left.
    tip.style.setProperty('--arrow', `${Math.max(12, b.left - left + 22)}px`);
  }
  function hideTip() {
    if (tip?.matches(':popover-open')) tip.hidePopover();
  }
</script>

<svelte:window onscroll={hideTip} />

<span class="cd wrap">
  <button
    bind:this={button}
    type="button"
    aria-describedby={newFiles ? 'ccd-tip ccd-new' : 'ccd-tip'}
    style:--bg={colors.background}
    style:--fg={colors.text}
    onclick={() => {
      hideTip();
      onclick();
    }}
    onmouseenter={showTip}
    onmouseleave={hideTip}
    onfocus={showTip}
    onblur={hideTip}
    onkeydown={(e) => {
      if (e.key === 'Escape') hideTip();
    }}
  >
    <Logo size={20} color={colors.text} pale={colors.text} />
    {label}
  </button>
  {#if newFiles}
    <span class="chip chip-mint num" id="ccd-new">
      <Icon name="refresh" size={14} />{newFiles} new{since}
    </span>
  {/if}
  <span bind:this={tip} id="ccd-tip" class="tip" role="tooltip" popover="manual">{hint}</span>
</span>

<style>
  /* px, not rem: rem would follow the Canvas page's root font size. */
  .wrap {
    display: inline-flex;
    align-items: center;
    gap: 16px;
    margin-left: 12px;
    vertical-align: middle;
  }
  button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 38px;
    padding: 0 14px;
    border: 0;
    border-radius: 6px;
    background: var(--bg);
    color: var(--fg);
    font: 600 14px/1 var(--font-ui);
    cursor: pointer;
    white-space: nowrap;
  }
  button:hover {
    filter: brightness(0.92);
  }
  .tip {
    position: fixed;
    inset: auto;
    margin: 0;
    border: 0;
    overflow: visible;
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--ink);
    color: #fff;
    font: 500 13px/1.35 var(--font-ui);
    white-space: nowrap;
    box-shadow: 0 6px 18px rgba(20, 32, 47, 0.2);
    pointer-events: none;
  }
  .tip::before {
    content: '';
    position: absolute;
    top: -5px;
    left: var(--arrow, 22px);
    width: 10px;
    height: 10px;
    background: var(--ink);
    transform: rotate(45deg);
    border-radius: 2px;
  }
</style>
