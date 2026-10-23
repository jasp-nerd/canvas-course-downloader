<script lang="ts">
  import {
    describeNew,
    downloadNewLabel,
    newItems,
    totalNew,
    type CourseUpdate,
  } from '../../app/updates';
  import Icon from '../../ui/Icon.svelte';
  import Logo from '../../ui/Logo.svelte';

  let {
    updates,
    ondownload,
    ondismiss,
  }: { updates: CourseUpdate[]; ondownload: () => void; ondismiss: () => void } = $props();
  const total = $derived(totalNew(updates));
</script>

<div class="cd note" role="status">
  <Logo size={28} />
  <p>
    <strong>{describeNew(total)} since your last download</strong>
    <span>{updates.map((c) => `${c.courseName} (${newItems(c)})`).join(', ')}</span>
  </p>
  <button type="button" class="btn btn-primary btn-sm" onclick={ondownload}>
    <Icon name="download" size={18} />{downloadNewLabel(total)}
  </button>
  <button type="button" class="icon-btn" aria-label="Dismiss" onclick={ondismiss}>
    <Icon name="x" />
  </button>
</div>

<style>
  /* Canvas's dashboard header sits above; px, as rem follows Canvas's root size. */
  .note {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 0 0 24px;
    padding: 12px 12px 12px 16px;
    border-radius: var(--r-choice);
    background: var(--mint-wash);
    color: #0f4c32;
    font-size: 14px;
    line-height: 1.45;
  }
  p {
    flex: 1;
    min-width: 0;
  }
  strong {
    display: block;
    font-weight: 700;
  }
  p span {
    display: block;
    font-size: 13px;
  }
  .icon-btn {
    color: #0f4c32;
  }
  .icon-btn:hover {
    background: rgba(255, 255, 255, 0.6);
    color: #0f4c32;
  }
</style>
