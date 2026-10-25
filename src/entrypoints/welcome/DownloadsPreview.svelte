<script lang="ts">
  import { COURSE, GUIDE, MODULE_FILE, OPEN_ME, type PreviewRow } from './examples';
  import Preview from './Preview.svelte';
  import { setup } from './setup.svelte';

  // An update a week from now, named as the export names it.
  const later = new Date(Date.now() + 7 * 864e5);
  const date = [later.getFullYear(), later.getMonth() + 1, later.getDate()]
    .map((n) => String(n).padStart(2, '0'))
    .join('-');

  const rows = $derived.by((): PreviewRow[] => {
    const { goal, zipMode, incrementalMode } = setup.answers;
    const name = goal === 'study' ? `${COURSE} - AI study pack` : COURSE;
    const inside: PreviewRow[] =
      goal === 'study'
        ? [
            { icon: 'fileText', name: GUIDE, nested: true },
            { icon: 'fileText', name: MODULE_FILE, nested: true },
          ]
        : goal === 'code'
          ? [
              { icon: 'fileText', name: 'AGENTS.md, llms.txt, course.json', nested: true },
              {
                icon: 'folder',
                name: 'Files, Pages, Assignments',
                note: 'in Markdown',
                nested: true,
              },
            ]
          : [
              { icon: 'fileText', name: OPEN_ME, note: 'opens offline', nested: true },
              { icon: 'folder', name: 'Files, Pages, Assignments', nested: true },
            ];
    // Study packs are always made whole.
    const update: PreviewRow[] =
      goal === 'study' || !incrementalMode
        ? []
        : zipMode
          ? [
              {
                icon: 'archive',
                name: `${COURSE} (update ${date}).zip`,
                chip: 'only new files',
                strong: true,
              },
            ]
          : [
              {
                icon: 'file',
                name: `Lecture 1 (updated ${date}).pdf`,
                chip: 'changed',
                nested: true,
              },
            ];
    return [
      zipMode
        ? { icon: 'archive', name: `${name}.zip`, strong: true }
        : { icon: 'folder', name, strong: true },
      ...inside,
      ...update,
    ];
  });
  const label = $derived(
    setup.answers.saveTo === 'folder' && setup.folder
      ? `In ${setup.folder.name}`
      : 'In your Downloads folder',
  );
</script>

<Preview {label} {rows} tone="mint" />
