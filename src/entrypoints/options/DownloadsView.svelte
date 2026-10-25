<script lang="ts">
  import { NO_FOLDER_ACCESS } from '../../app/folder-access';
  import { LINKS, tracked } from '../../app/links';
  import { AI_TARGETS, type AiTargetId } from '../../export/study-pack';
  import type { Settings } from '../../storage/settings';
  import Icon from '../../ui/Icon.svelte';
  import type { IconName } from '../../ui/icons';
  import Setting from './Setting.svelte';
  import { chooseFolder, folderAccess, options, save } from './state.svelte';
  import SwitchRow from './SwitchRow.svelte';

  const settings = $derived(options.settings);
  const target = $derived(AI_TARGETS[settings.aiTarget]);

  // Each kind of download has its own colour, in an icon band rather than the mascot.
  const MODES: { profile: Settings['profile']; title: string; icon: IconName; tone: string }[] = [
    { profile: 'copy', title: 'A copy to keep', icon: 'folder', tone: 'red' },
    { profile: 'study', title: 'A study pack', icon: 'ai', tone: 'sun' },
    { profile: 'agents', title: 'Files for code', icon: 'code', tone: 'navy' },
  ];
  const modeText = (profile: Settings['profile']) =>
    profile === 'copy'
      ? 'The course as it is in Canvas'
      : profile === 'study'
        ? `Sized for ${target.tool}`
        : 'Markdown and AGENTS.md';

  const folderChosen = $derived(folderAccess === 'yes' && settings.saveTo === 'folder');
  let downloadsRadio = $state<HTMLInputElement>();

  async function pickFolder() {
    await chooseFolder();
    // Closed or failed: the radio the user pressed goes back to what still holds.
    if (options.settings.saveTo !== 'folder' && downloadsRadio) downloadsRadio.checked = true;
  }
</script>

<Setting
  id="s-makes"
  title="Each download makes"
  text="What you get when you press Download on a course."
>
  <div class="modes" role="radiogroup" aria-labelledby="s-makes">
    {#each MODES as mode (mode.profile)}
      <label class="mode">
        <input
          type="radio"
          name="profile"
          checked={settings.profile === mode.profile}
          onchange={() => save({ profile: mode.profile })}
        />
        <span class="mode-art tone-{mode.tone}"><Icon name={mode.icon} size={30} /></span>
        <span class="mode-body">
          <strong>{mode.title}</strong>
          <span class="small">{modeText(mode.profile)}</span>
        </span>
      </label>
    {/each}
  </div>
  {#if settings.profile === 'study'}
    <div class="for">
      <label class="for-field">
        <span class="label">For</span>
        <select
          class="select"
          value={settings.aiTarget}
          onchange={(e) => save({ aiTarget: e.currentTarget.value as AiTargetId })}
        >
          {#each Object.entries(AI_TARGETS) as [id, t] (id)}
            <option value={id}>{t.label}</option>
          {/each}
        </select>
      </label>
      <p class="small">
        {#if target.maxFiles === Infinity}
          Only Markdown text: pages, assignments, quizzes and announcements. No slides or PDFs.
        {:else}
          A {target.unit} in {target.tool} takes up to {target.maxFiles} files. A bigger course is split
          into {target.unit}s that each fit.
        {/if}
      </p>
    </div>
  {/if}
</Setting>

<Setting
  id="s-you"
  title="You are"
  text="Teachers choose whether their students' work is saved too."
>
  <div class="seg" role="radiogroup" aria-labelledby="s-you">
    <label
      ><input
        type="radio"
        name="role"
        checked={settings.role === 'student'}
        onchange={() => save({ role: 'student' })}
      />A student</label
    >
    <label
      ><input
        type="radio"
        name="role"
        checked={settings.role === 'teacher'}
        onchange={() => save({ role: 'teacher' })}
      />A teacher</label
    >
  </div>
  {#if settings.role === 'teacher'}
    <div class="wide">
      <SwitchRow
        title="Include students' work in courses you teach"
        text="Submissions, grades and names. Leave it off for a copy you might share."
        checked={settings.includeStudentWork}
        onchange={(on: boolean) => save({ includeStudentWork: on })}
      />
      <SwitchRow
        title="Also save Canvas's course package (.imscc)"
        text="For re-importing your course into Canvas. Canvas builds it on its servers, which can take a while. Co-teachers see it under Settings › Export Course Content for 30 days."
        checked={settings.coursePackage}
        onchange={(on: boolean) => save({ coursePackage: on })}
      />
      <a class="it-link" href={tracked(LINKS.forIt, 'options')} target="_blank" rel="noopener"
        >A page to send your IT or privacy office<Icon name="external" size={16} /></a
      >
    </div>
  {/if}
</Setting>

<Setting
  id="s-to"
  title="Save to"
  text="A folder in Google Drive or OneDrive backs your courses up to the cloud."
>
  <div class="opts wide" role="radiogroup" aria-labelledby="s-to">
    <div class="opt">
      <label>
        <input
          type="radio"
          class="radio"
          name="saveTo"
          bind:this={downloadsRadio}
          checked={!folderChosen}
          onchange={() => save({ saveTo: 'downloads' })}
        />
        <span>
          <strong>Downloads folder</strong>
          <span class="small">Where your browser saves everything</span>
        </span>
      </label>
    </div>
    <div class="opt" class:is-off={folderAccess !== 'yes'}>
      <label>
        <input
          type="radio"
          class="radio"
          name="saveTo"
          checked={folderChosen}
          disabled={folderAccess !== 'yes'}
          onchange={pickFolder}
        />
        <span>
          <strong>A folder you choose</strong>
          {#if folderAccess !== 'yes'}
            <span class="small">{NO_FOLDER_ACCESS[folderAccess]}</span>
          {:else if !(folderChosen && options.folderName)}
            <span class="small"
              >Pick or create a folder inside Downloads or Documents, not the folder itself.</span
            >
          {/if}
        </span>
      </label>
      {#if folderChosen}
        <div class="folder">
          <Icon name="folder" size={18} />
          <span class="folder-name">{options.folderName || 'No folder chosen yet'}</span>
          <button type="button" class="btn btn-light btn-sm" onclick={chooseFolder}
            >{options.folderName ? 'Change' : 'Choose'}</button
          >
        </div>
      {/if}
      {#if options.folderError}
        <p class="error" role="alert">{options.folderError}</p>
      {/if}
    </div>
  </div>
</Setting>

<Setting id="s-as" title="Save as" text="A ZIP is one tidy file; folders open without unpacking.">
  <div class="seg" role="radiogroup" aria-labelledby="s-as">
    <label
      ><input
        type="radio"
        name="zipMode"
        checked={settings.zipMode}
        onchange={() => save({ zipMode: true })}
      />One ZIP per course</label
    >
    <label
      ><input
        type="radio"
        name="zipMode"
        checked={!settings.zipMode}
        onchange={() => save({ zipMode: false })}
      />Folders</label
    >
  </div>
  {#if !settings.zipMode}
    <p class="small hint">
      If your browser asks where to save each file, turn that off in its download settings, or use
      one ZIP per course.
    </p>
  {/if}
</Setting>

<Setting id="s-up" title="Updates" text="Download a course again and only the new parts are added.">
  <div class="rows wide">
    <SwitchRow
      title="Only add what's new"
      text="Changed files get the date in their name. No duplicates."
      checked={settings.incrementalMode}
      onchange={(on: boolean) => save({ incrementalMode: on })}
    />
    <SwitchRow
      title="Download new files automatically"
      text="When you open Canvas, courses you saved are checked every few hours and new files are saved quietly."
      checked={settings.autoDownloadNew}
      onchange={(on: boolean) => save({ autoDownloadNew: on })}
    />
  </div>
</Setting>

<style>
  /* The same outlined pill as the links in Help. */
  .it-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    margin-top: 12px;
    padding: 0 16px 0 14px;
    border-radius: var(--r-pill);
    box-shadow: inset 0 0 0 1.5px var(--control);
    color: var(--ink);
    font-weight: 600;
    font-size: 14px;
    text-decoration: none;
  }
  .it-link:hover {
    box-shadow: inset 0 0 0 1.5px var(--ink-3);
  }
  .it-link :global(svg) {
    color: var(--ink-3);
  }
  .modes {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }
  .mode {
    position: relative;
    display: flex;
    flex-direction: column;
    border-radius: var(--r-card);
    background: #fff;
    box-shadow: 0 0 0 1.5px var(--line);
    overflow: hidden;
    cursor: pointer;
    transition: box-shadow 0.12s;
  }
  .mode:hover {
    box-shadow: 0 0 0 1.5px var(--control);
  }
  .mode:has(input:checked) {
    box-shadow: 0 0 0 2.5px var(--red);
  }
  .mode:has(input:focus-visible) {
    outline: 3px solid var(--ink);
    outline-offset: 4px;
  }
  /* Invisible, over the whole card: a click on the card is a click on the radio. */
  .mode input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
  .mode-art {
    height: 76px;
    display: grid;
    place-items: center;
  }
  .tone-red {
    background: var(--red-wash);
    color: var(--red-ink);
  }
  .tone-sun {
    background: var(--sun);
    color: var(--ink);
  }
  .tone-navy {
    background: var(--navy-wash);
    color: var(--ink);
  }
  .mode-body {
    display: grid;
    gap: 4px;
    padding: 12px 14px 14px;
  }
  .mode-body strong {
    font-size: 15px;
    font-weight: 700;
    line-height: 1.3;
  }

  .for {
    display: grid;
    gap: 8px;
    width: 100%;
    max-width: 420px;
  }
  .for-field {
    display: grid;
    gap: 6px;
  }

  .folder {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: 32px;
    padding: 8px 8px 8px 14px;
    border-radius: 12px;
    background: #fff;
    box-shadow: inset 0 0 0 1px var(--line);
    color: var(--ink-3);
  }
  .folder-name {
    flex: 1;
    min-width: 0;
    font-weight: 600;
    font-size: 14px;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .error {
    margin: 0 0 0 32px;
    font-size: 14px;
    color: var(--red-ink);
  }
  .hint {
    margin: 0;
    max-width: 520px;
  }

  @media (max-width: 760px) {
    .modes {
      grid-template-columns: minmax(0, 1fr);
    }
    .mode {
      flex-direction: row;
    }
    .mode-art {
      height: auto;
      width: 72px;
      flex: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .mode {
      transition: none;
    }
  }
</style>
