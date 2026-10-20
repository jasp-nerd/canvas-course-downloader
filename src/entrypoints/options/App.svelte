<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from 'wxt/browser';
  import { LINKS, reviewUrl, tracked } from '../../app/links';
  import { PROFILES } from '../../app/profiles';
  import { exportOptionsFrom } from '../../engine/options';
  import { canChooseFolder, loadSaveFolder, storeSaveFolder } from '../../storage/folder';
  import { CONTENT_TYPES, type ContentType } from '../../engine/types';
  import { AI_TARGETS, type AiTargetId } from '../../export/study-pack';
  import {
    DEFAULT_SETTINGS,
    loadSettings,
    saveSettings,
    type Settings,
  } from '../../storage/settings';

  const TYPE_LABELS: Record<ContentType, [string, string]> = {
    files: ['Files and folders', 'Everything in the Files tab, in its folders'],
    pages: ['Pages', 'Course pages, including ones only linked from modules'],
    assignments: ['Assignments', 'Instructions, due dates and rubrics'],
    submissions: ['Submissions', "Your work and feedback; every student's if you teach"],
    discussions: ['Discussions', 'Topics with all replies and attachments'],
    announcements: ['Announcements', ''],
    modules: ['Modules', 'An overview of every module, plus files only found there'],
    syllabus: ['Syllabus', ''],
    grades: ['Grades', 'Your grades as a spreadsheet; the gradebook if you teach'],
    quizzes: ['Quizzes', 'Details and your results; questions and scores if you teach'],
    linkedFiles: [
      'Linked files and videos',
      "Files and Canvas videos linked in pages and assignments, also when you don't save those",
    ],
  };

  const PRESETS: Record<string, { label: string; types: ContentType[] }> = {
    'full-archive': { label: 'Everything', types: [...CONTENT_TYPES] },
    'files-only': { label: 'Files only', types: ['files'] },
    'text-only': {
      label: 'Pages and text',
      types: CONTENT_TYPES.filter((t) => t !== 'files' && t !== 'linkedFiles'),
    },
  };

  const CDN = { origins: ['*://*.canvas-user-content.com/*'] };

  let settings = $state<Settings>({ ...DEFAULT_SETTINGS });
  let types = $state<Record<ContentType, boolean>>(
    exportOptionsFrom(DEFAULT_SETTINGS, '').contentTypes,
  );
  let maxSizeText = $state('');
  let status = $state('');
  let cdnGranted = $state<boolean | null>(null);
  const version = browser.runtime.getManifest().version;
  const review = tracked(reviewUrl(), 'options');

  const preset = $derived(
    Object.entries(PRESETS).find(([, p]) =>
      CONTENT_TYPES.every((t) => types[t] === p.types.includes(t)),
    )?.[0] ?? 'custom',
  );

  onMount(async () => {
    settings = await loadSettings();
    types = exportOptionsFrom(settings, '').contentTypes;
    maxSizeText = settings.maxFileSizeMB ? String(settings.maxFileSizeMB) : '';
    cdnGranted = await browser.permissions.contains(CDN);
    folderName = (await loadSaveFolder().catch(() => null))?.name ?? '';
  });

  let statusTimer: ReturnType<typeof setTimeout> | undefined;
  async function save(changes: Partial<Settings>) {
    Object.assign(settings, changes);
    await saveSettings(changes);
    status = 'Saved';
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => (status = ''), 2000);
  }

  function setTypes(next: Record<ContentType, boolean>) {
    types = next;
    const matched = Object.entries(PRESETS).find(([, p]) =>
      CONTENT_TYPES.every((t) => next[t] === p.types.includes(t)),
    );
    void save({ contentTypes: { ...next }, preset: matched?.[0] ?? 'custom' });
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

  const maxSizeError = $derived(
    maxSizeText.trim() !== '' && !/^\d+$/.test(maxSizeText.trim())
      ? 'Enter a whole number of megabytes, or leave it empty.'
      : '',
  );

  function commitMaxSize() {
    if (maxSizeError) return;
    void save({ maxFileSizeMB: Number(maxSizeText.trim() || 0) });
  }

  let folderName = $state('');
  const folderPicker = canChooseFolder();

  async function chooseFolder() {
    try {
      // First in the click handler: the picker needs the user's click.
      const folder = await window.showDirectoryPicker!({
        id: 'ccd-save',
        mode: 'readwrite',
        startIn: 'downloads',
      });
      await storeSaveFolder(folder);
      folderName = folder.name;
      await save({ saveTo: 'folder' });
    } catch {
      // Closed the picker: keep the previous choice.
      settings.saveTo = folderName ? settings.saveTo : 'downloads';
    }
  }

  async function allowCdn() {
    // Must be the first thing in the click handler, or Firefox refuses the prompt.
    cdnGranted = await browser.permissions.request(CDN);
  }
</script>

<main>
  <header>
    <h1>Canvas Course Downloader settings</h1>
    <p class="saved" role="status" aria-live="polite">{status}</p>
  </header>

  <section aria-labelledby="makes">
    <h2 id="makes">Each download makes</h2>
    <fieldset>
      <legend class="visually-hidden">Each download makes</legend>
      {#each PROFILES as choice (choice.profile)}
        <label>
          <input
            type="radio"
            name="profile"
            checked={settings.profile === choice.profile}
            onchange={() => save({ profile: choice.profile })}
          />
          <span>
            <strong>{choice.title}</strong>
            <small>{choice.text}</small>
          </span>
        </label>
      {/each}
    </fieldset>
    {#if settings.profile === 'study'}
      <label class="field">
        <span>For</span>
        <select
          value={settings.aiTarget}
          onchange={(e) => save({ aiTarget: e.currentTarget.value as AiTargetId })}
        >
          {#each Object.entries(AI_TARGETS) as [id, target] (id)}
            <option value={id}>{target.label}</option>
          {/each}
        </select>
      </label>
      <p class="hint">
        {#if AI_TARGETS[settings.aiTarget].maxFiles === Infinity}
          Only Markdown text: pages, assignments, quizzes and announcements. No slides or PDFs.
        {:else}
          {@const target = AI_TARGETS[settings.aiTarget]}
          A {target.unit} in {target.tool} takes up to {target.maxFiles} files. A bigger course is split
          into {target.unit}s that each fit.
        {/if}
      </p>
    {/if}
  </section>

  <section aria-labelledby="what">
    <h2 id="what">What to download</h2>
    <div class="presets" role="radiogroup" aria-label="Preset">
      {#each Object.entries(PRESETS) as [key, p] (key)}
        <button
          type="button"
          role="radio"
          aria-checked={preset === key}
          onclick={() => choosePreset(key)}>{p.label}</button
        >
      {/each}
      <span class="custom" aria-hidden={preset !== 'custom'}
        >{preset === 'custom' ? 'Custom' : ''}</span
      >
    </div>
    <div class="types">
      {#each CONTENT_TYPES as type (type)}
        <label>
          <input
            type="checkbox"
            checked={types[type]}
            onchange={(e) => setTypes({ ...types, [type]: e.currentTarget.checked })}
          />
          <span>
            <strong>{TYPE_LABELS[type][0]}</strong>
            {#if TYPE_LABELS[type][1]}<small>{TYPE_LABELS[type][1]}</small>{/if}
          </span>
        </label>
      {/each}
    </div>
  </section>

  <section aria-labelledby="how">
    <h2 id="how">How to save</h2>
    {#if folderPicker}
      <fieldset>
        <legend>Save to</legend>
        <label>
          <input
            type="radio"
            name="saveTo"
            checked={settings.saveTo !== 'folder'}
            onchange={() => save({ saveTo: 'downloads' })}
          />
          Your Downloads folder
        </label>
        <label>
          <input
            type="radio"
            name="saveTo"
            checked={settings.saveTo === 'folder'}
            onchange={chooseFolder}
          />
          <span>
            A folder you choose{folderName && settings.saveTo === 'folder' ? `: ${folderName}` : ''}
            <small
              >Choose a folder inside Google Drive, OneDrive or Dropbox to back your courses up to
              the cloud. Big courses also save more reliably this way.</small
            >
          </span>
        </label>
        {#if settings.saveTo === 'folder'}
          <button type="button" class="secondary" onclick={chooseFolder}
            >Choose another folder…</button
          >
        {/if}
      </fieldset>
    {/if}
    <fieldset>
      <legend class="visually-hidden">Save as</legend>
      <label
        ><input
          type="radio"
          name="zip"
          checked={settings.zipMode}
          onchange={() => save({ zipMode: true })}
        /> One ZIP file per course</label
      >
      <label
        ><input
          type="radio"
          name="zip"
          checked={!settings.zipMode}
          onchange={() => save({ zipMode: false })}
        /> Folders, one file at a time</label
      >
    </fieldset>
    <label class="field">
      <span
        >Folder inside {settings.saveTo === 'folder' ? 'that folder' : 'Downloads'}
        <small>(optional, e.g. "Canvas")</small></span
      >
      <input
        type="text"
        value={settings.folderPrefix}
        onchange={(e) => save({ folderPrefix: e.currentTarget.value.trim() })}
      />
    </label>
    <label class="field">
      <span>If a file with the same name is already there</span>
      <select
        value={settings.conflictAction}
        onchange={(e) =>
          save({
            conflictAction: e.currentTarget.value === 'overwrite' ? 'overwrite' : 'uniquify',
          })}
      >
        <option value="uniquify">Keep both</option>
        <option value="overwrite">Replace it</option>
      </select>
    </label>
  </section>

  <section aria-labelledby="updates">
    <h2 id="updates">Keep courses up to date</h2>
    <label>
      <input
        type="checkbox"
        checked={settings.incrementalMode}
        onchange={(e) => save({ incrementalMode: e.currentTarget.checked })}
      />
      <span>
        <strong>Only download what's new</strong>
        <small
          >Skip files you already saved from a course. A file that changed is saved again with
          "(updated date)" in its name.</small
        >
      </span>
    </label>
    <label>
      <input
        type="checkbox"
        checked={settings.autoDownloadNew}
        onchange={(e) => save({ autoDownloadNew: e.currentTarget.checked })}
      />
      <span>
        <strong>Download new files automatically</strong>
        <small
          >When you open Canvas, courses you downloaded before are checked every few hours, and new
          files are saved in the background.</small
        >
      </span>
    </label>
  </section>

  {#if settings.profile === 'copy'}
    <section aria-labelledby="format">
      <h2 id="format">Pages, assignments and discussions as</h2>
      <fieldset>
        <legend class="visually-hidden">Format</legend>
        <label
          ><input
            type="radio"
            name="format"
            checked={settings.exportFormat !== 'markdown'}
            onchange={() => save({ exportFormat: 'html' })}
          /> Web pages (HTML), open in any browser</label
        >
        <label
          ><input
            type="radio"
            name="format"
            checked={settings.exportFormat === 'markdown'}
            onchange={() => save({ exportFormat: 'markdown' })}
          /> Markdown, for notes apps and AI tools</label
        >
      </fieldset>
    </section>
  {/if}

  <section aria-labelledby="skip">
    <h2 id="skip">Skip</h2>
    <label
      ><input
        type="checkbox"
        checked={settings.excludeVideos}
        onchange={(e) => save({ excludeVideos: e.currentTarget.checked })}
      /> Videos</label
    >
    <label class="field">
      <span>Files larger than <small>(MB, empty for no limit)</small></span>
      <input
        type="text"
        inputmode="numeric"
        bind:value={maxSizeText}
        onchange={commitMaxSize}
        aria-invalid={maxSizeError !== ''}
        aria-describedby="max-size-error"
      />
      <small id="max-size-error" class="error">{maxSizeError}</small>
    </label>
  </section>

  {#if cdnGranted === false}
    <section aria-labelledby="cdn">
      <h2 id="cdn">Submitted files</h2>
      <p>
        Some schools serve submitted files and discussion attachments from canvas-user-content.com.
        If those files fail, allow access.
      </p>
      <button type="button" class="secondary" onclick={allowCdn}>Allow access</button>
    </section>
  {/if}

  <section aria-labelledby="support">
    <h2 id="support">Support this project</h2>
    <p>It's free and open source. A review or a star helps other students find it.</p>
    <ul class="links">
      {#if review}<li><a href={review} target="_blank" rel="noopener">Write a review</a></li>{/if}
      <li>
        <a href={tracked(LINKS.github, 'options')} target="_blank" rel="noopener"
          >Star it on GitHub</a
        >
      </li>
      {#if LINKS.koFi}<li>
          <a href={tracked(LINKS.koFi, 'options')} target="_blank" rel="noopener">Buy me a coffee</a
          >
        </li>{/if}
      <li>
        <a href={tracked(LINKS.sponsors, 'options')} target="_blank" rel="noopener"
          >Sponsor on GitHub</a
        >
      </li>
      {#if LINKS.feedbackForm}<li>
          <a href={LINKS.feedbackForm} target="_blank" rel="noopener">Report a problem</a>
        </li>{/if}
    </ul>
  </section>

  <footer>
    <span>Version {version}</span>
    <a href={LINKS.privacy} target="_blank" rel="noopener">Privacy</a>
  </footer>
</main>

<style>
  :global(:root) {
    --bg: #f6f7f9;
    --surface: #ffffff;
    --text: #1d2733;
    --muted: #556270;
    --border: #d9dee4;
    --accent: #0b5cad;
    --bad: #b42318;
    color-scheme: light dark;
  }
  @media (prefers-color-scheme: dark) {
    :global(:root) {
      --bg: #12161b;
      --surface: #1b2128;
      --text: #e6eaef;
      --muted: #a3adb8;
      --border: #303943;
      --accent: #7cb8f2;
      --bad: #f2867c;
    }
  }
  :global(body) {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font:
      15px/1.5 system-ui,
      -apple-system,
      'Segoe UI',
      Roboto,
      sans-serif;
  }
  main {
    max-width: 680px;
    margin: 40px auto;
    padding: 0 16px;
  }
  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }
  h1 {
    font-size: 22px;
    margin: 0 0 16px;
  }
  .saved {
    color: var(--muted);
    margin: 0;
    min-width: 4em;
    text-align: right;
  }
  section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px 18px;
    margin-bottom: 14px;
    display: grid;
    gap: 10px;
  }
  h2 {
    font-size: 16px;
    margin: 0;
  }
  p {
    margin: 0;
  }
  label {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    cursor: pointer;
  }
  label small,
  .field small {
    display: block;
    color: var(--muted);
  }
  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  [role='radio'] {
    font: inherit;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text);
    cursor: pointer;
  }
  [role='radio'][aria-checked='true'] {
    border-color: var(--accent);
    color: var(--accent);
    font-weight: 600;
  }
  .custom {
    color: var(--muted);
    font-size: 14px;
  }
  .types {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 10px 16px;
  }
  fieldset {
    border: 0;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .field {
    flex-direction: column;
    gap: 4px;
    cursor: default;
  }
  .field input,
  .field select {
    font: inherit;
    padding: 7px 9px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    max-width: 320px;
  }
  .error {
    color: var(--bad) !important;
  }
  .hint {
    color: var(--muted);
    font-size: 14px;
  }
  .secondary {
    justify-self: start;
    font: inherit;
    padding: 8px 14px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 18px;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  a {
    color: var(--accent);
  }
  footer {
    display: flex;
    justify-content: space-between;
    color: var(--muted);
    font-size: 13px;
    padding: 8px 2px 24px;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  a:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }
</style>
