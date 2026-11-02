<script lang="ts">
  import { exportOptionsFrom } from '../../engine/options';
  import { CONTENT_TYPES, type ContentType } from '../../engine/types';
  import Setting from './Setting.svelte';
  import { options, save } from './state.svelte';

  const settings = $derived(options.settings);
  const types = $derived(exportOptionsFrom(settings, '').contentTypes);

  // Students' work is only saved in courses the user teaches, and only when they include it.
  const others = $derived(settings.includeStudentWork);
  const labels = $derived<Record<ContentType, [string, string]>>({
    files: ['Files and folders', 'Everything in the Files tab, in its folders'],
    pages: ['Pages', 'Course pages, including ones only linked from modules'],
    assignments: ['Assignments', 'Instructions, due dates and rubrics'],
    submissions: [
      'Submissions',
      others
        ? "Your work and feedback; every student's in courses you teach"
        : 'Your work and feedback',
    ],
    discussions: ['Discussions', 'Topics with all replies and attachments'],
    announcements: ['Announcements', "The course's announcements"],
    modules: ['Modules', 'An overview of every module, plus files only found there'],
    syllabus: ['Syllabus', 'The syllabus page'],
    grades: [
      'Grades',
      others
        ? 'Your grades as a spreadsheet; the gradebook in courses you teach'
        : 'Your grades as a spreadsheet',
    ],
    quizzes: [
      'Quizzes',
      others
        ? 'Details and your results; questions and scores in courses you teach'
        : 'Details and your results',
    ],
    linkedFiles: [
      'Linked files and videos',
      "Files and Canvas videos linked in pages and assignments, also when you don't save those",
    ],
  });

  const PRESETS: Record<string, { label: string; types: ContentType[] }> = {
    'full-archive': { label: 'Everything', types: [...CONTENT_TYPES] },
    'files-only': { label: 'Files only', types: ['files'] },
    'text-only': {
      label: 'Pages and text',
      types: CONTENT_TYPES.filter((t) => t !== 'files' && t !== 'linkedFiles'),
    },
  };

  const presetOf = (next: Record<ContentType, boolean>) =>
    Object.entries(PRESETS).find(([, p]) =>
      CONTENT_TYPES.every((t) => next[t] === p.types.includes(t)),
    )?.[0] ?? 'custom';
  const preset = $derived(presetOf(types));

  function setTypes(next: Record<ContentType, boolean>) {
    void save({ contentTypes: { ...next }, preset: presetOf(next) });
  }

  function choosePreset(key: string) {
    const p = PRESETS[key];
    if (p)
      setTypes(
        Object.fromEntries(CONTENT_TYPES.map((t) => [t, p.types.includes(t)])) as Record<
          ContentType,
          boolean
        >,
      );
  }
</script>

<Setting id="s-preset" title="Start from" text="A quick way to set the boxes below.">
  <div class="presets">
    <div class="seg" role="radiogroup" aria-labelledby="s-preset">
      {#each Object.entries(PRESETS) as [key, p] (key)}
        <label
          ><input
            type="radio"
            name="preset"
            checked={preset === key}
            onchange={() => choosePreset(key)}
          />{p.label}</label
        >
      {/each}
    </div>
    {#if preset === 'custom'}<span class="chip chip-line">Custom</span>{/if}
  </div>
</Setting>

<Setting
  id="s-types"
  title="Saved from each course"
  text="Turn off what you don't need. Whatever you leave out isn't downloaded."
>
  <div class="rows types" role="group" aria-labelledby="s-types">
    {#each CONTENT_TYPES as type (type)}
      <label class="type">
        <input
          type="checkbox"
          class="check"
          checked={types[type]}
          onchange={(e) => setTypes({ ...types, [type]: e.currentTarget.checked })}
        />
        <span>
          <strong>{labels[type][0]}</strong>
          <span class="text">{labels[type][1]}</span>
        </span>
      </label>
    {/each}
  </div>
</Setting>

<style>
  .presets {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }
  .types {
    width: 100%;
    max-width: 620px;
  }
  .type {
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr);
    gap: 14px;
    align-items: start;
    padding: 12px 0;
    cursor: pointer;
  }
  .type input {
    margin-top: 2px;
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
