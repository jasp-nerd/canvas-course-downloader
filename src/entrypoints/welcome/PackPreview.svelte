<script lang="ts">
  import { AI_TARGETS } from '../../export/study-pack';
  import { GUIDE, MODULE_FILE, SLIDES, type PreviewRow } from './examples';
  import Preview from './Preview.svelte';
  import { setup } from './setup.svelte';

  const target = $derived(AI_TARGETS[setup.answers.aiTarget]);
  const rows = $derived<PreviewRow[]>([
    { icon: 'fileText', name: GUIDE, note: 'deadlines, grading' },
    { icon: 'fileText', name: MODULE_FILE, note: "a module's pages" },
    // A text-only tool gets no slides or PDFs.
    ...(target.accepts.length
      ? [{ icon: 'file' as const, name: SLIDES, note: 'slides and PDFs' }]
      : []),
  ]);
  const foot = $derived(
    Number.isFinite(target.maxFiles)
      ? `Up to ${target.maxFiles} files fit in one ${target.unit}; a bigger course is split into ${target.unit}s.`
      : 'Text only: slides and PDFs are left out.',
  );
</script>

<Preview label="Your study pack for {target.tool}" {rows} {foot} tone="sun" />
