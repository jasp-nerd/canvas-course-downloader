<script lang="ts">
  import type { CourseUpdate } from '../../app/updates';

  let {
    updates,
    ondownload,
    ondismiss,
  }: { updates: CourseUpdate[]; ondownload: () => void; ondismiss: () => void } = $props();
  const total = $derived(updates.reduce((n, c) => n + c.newFiles, 0));
</script>

<div class="note" role="status">
  <p>
    <strong>{total} new {total === 1 ? 'file' : 'files'}</strong> since your last download:
    {updates.map((c) => `${c.courseName} (${c.newFiles})`).join(', ')}
  </p>
  <button type="button" class="primary" onclick={ondownload}>Download new files</button>
  <button type="button" class="dismiss" aria-label="Dismiss" onclick={ondismiss}>×</button>
</div>

<style>
  .note {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0 0 16px;
    padding: 10px 14px;
    border: 1px solid #b9d5f2;
    background: #eef6fd;
    color: #1d2733;
    border-radius: 8px;
    font:
      14px/1.4 system-ui,
      -apple-system,
      'Segoe UI',
      Roboto,
      sans-serif;
  }
  p {
    margin: 0;
    flex: 1;
  }
  .primary {
    border: 0;
    border-radius: 6px;
    padding: 7px 12px;
    background: #0b5cad;
    color: #ffffff;
    font: 600 14px/1.2 inherit;
    font-family: inherit;
    cursor: pointer;
    white-space: nowrap;
  }
  .dismiss {
    border: 0;
    background: none;
    font-size: 20px;
    line-height: 1;
    color: #556270;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
  }
  button:focus-visible {
    outline: 3px solid #0b5cad;
    outline-offset: 2px;
  }
</style>
