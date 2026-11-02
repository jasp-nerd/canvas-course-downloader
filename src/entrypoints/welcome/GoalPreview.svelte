<script lang="ts">
  import type { SetupGoal } from '../../app/onboarding';
  import { COURSE, GUIDE, MODULE_FILE, OPEN_ME, SLIDES, type PreviewRow } from './examples';
  import Preview from './Preview.svelte';
  import { setup } from './setup.svelte';

  /** What each goal makes, by the names the export really writes. */
  const PREVIEWS: Record<SetupGoal, { label: string; rows: PreviewRow[] }> = {
    copy: {
      label: `A copy of ${COURSE}`,
      rows: [
        { icon: 'fileText', name: OPEN_ME, note: 'opens offline' },
        { icon: 'folder', name: 'Files', note: 'slides and readings' },
        { icon: 'folder', name: 'Pages', note: 'as web pages' },
        { icon: 'folder', name: 'Assignments', note: 'with due dates' },
      ],
    },
    study: {
      label: 'A study pack for AI',
      rows: [
        { icon: 'fileText', name: GUIDE, note: 'deadlines, grading' },
        { icon: 'fileText', name: MODULE_FILE, note: "a module's pages" },
        { icon: 'file', name: SLIDES, note: 'slides as they are' },
      ],
    },
    code: {
      label: 'Files for coding agents',
      rows: [
        { icon: 'fileText', name: 'AGENTS.md', note: 'how to read the folder' },
        { icon: 'fileText', name: 'llms.txt', note: 'an index by module' },
        { icon: 'fileText', name: 'course.json', note: 'structure and deadlines' },
        { icon: 'folder', name: 'Pages', note: 'in Markdown' },
      ],
    },
    teach: {
      label: `An archive of ${COURSE}`,
      rows: [
        { icon: 'fileText', name: OPEN_ME, note: 'opens offline' },
        { icon: 'folder', name: 'Quizzes', note: 'with answers' },
        { icon: 'folder', name: 'Assignments', note: 'with rubrics' },
        { icon: 'folder', name: 'Files', note: 'slides and readings' },
      ],
    },
  };
  const preview = $derived(PREVIEWS[setup.answers.goal]);
</script>

<Preview label={preview.label} rows={preview.rows} tone="ink" />
