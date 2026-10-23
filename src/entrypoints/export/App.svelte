<script lang="ts">
  // The Download tab: runs the courses the user asked for, shows progress (also
  // in this tab's title and icon, and on the toolbar icon), then the receipts.
  import { onMount } from 'svelte';
  import { browser } from 'wxt/browser';
  import { csrfKey } from '../../app/course-package';
  import { exportCourses, type CourseState } from '../../app/export-job';
  import { supportCardAfterExport } from '../../app/support';
  import { TimeLeft } from '../../app/time-left';
  import { AI_TARGETS } from '../../export/study-pack';
  import { PRODUCT_NAME } from '../../ui/brand';
  import Icon from '../../ui/Icon.svelte';
  import Logo from '../../ui/Logo.svelte';
  import { dotsFor } from '../../ui/logo';
  import { openSettings } from './actions';
  import NotSaved from './NotSaved.svelte';
  import Progress from './Progress.svelte';
  import Receipt from './Receipt.svelte';
  import Several from './Several.svelte';
  import StudyReceipt from './StudyReceipt.svelte';
  import TeacherReceipt from './TeacherReceipt.svelte';
  import { resetToolbarIcon, setFavicon, setToolbarIcon } from './tab-icon';

  let {
    origin,
    courseIds,
    onlyNew = false,
    quiet = false,
  }: { origin: string; courseIds: string[]; onlyNew?: boolean; quiet?: boolean } = $props();

  // Replaced as a whole on every change, so it needn't be deeply reactive.
  let courses = $state.raw<CourseState[]>([]);
  let running = $state(true);
  let stopping = $state(false);
  let showSupport = $state(false);
  let isWindows = $state(false);
  let secondsLeft = $state<number | null>(null);
  let folderPrompt = $state<{ name: string; allow: () => void; skip: () => void } | null>(null);
  /** Courses save one after another; each gets its own measure of the time left. */
  let timer: { courseId: string; left: TimeLeft } | undefined;

  /** Browsers need a click before writing to a chosen folder again; automatic exports can't ask. */
  const allowFolder = (folder: FileSystemDirectoryHandle) =>
    new Promise<boolean>((resolve) => {
      if (quiet) return resolve(false);
      folderPrompt = {
        name: folder.name,
        allow: () => {
          // First in the click handler: the browser only shows its prompt for a user gesture.
          folder
            .requestPermission({ mode: 'readwrite' })
            .then((state) => resolve(state === 'granted'))
            // It throws without a gesture or when the folder is gone: save to Downloads instead.
            .catch(() => resolve(false))
            .finally(() => (folderPrompt = null));
        },
        skip: () => {
          folderPrompt = null;
          resolve(false);
        },
      };
    });
  const controller = new AbortController();

  const fraction = (c: CourseState) => (c.total ? (c.done + c.failed) / c.total : 0);
  const active = $derived(courses.find((c) => c.phase === 'planning' || c.phase === 'saving'));
  /** All courses together, for the tab's icon and the toolbar. */
  const overall = $derived.by(() => {
    if (!courses.length) return 0;
    const finished = courses.filter((c) => c.phase === 'finished').length;
    const now = active?.phase === 'saving' ? fraction(active) : 0;
    return (finished + now) / courses.length;
  });
  const saved = $derived(courses.filter((c) => c.outcome === 'success' || c.outcome === 'partial'));
  const how = $derived(courses[0]?.how);

  function track(next: CourseState[]) {
    courses = next;
    const c = next.find((x) => x.phase === 'saving');
    if (!c) return;
    if (timer?.courseId !== c.id) timer = { courseId: c.id, left: new TimeLeft() };
    secondsLeft = timer.left.update(Date.now(), c.done + c.failed, c.total);
  }

  /** Automatic exports run in a background tab: tell the user how it went, and get out of the way if it worked. */
  async function reportQuietly(finished: CourseState[], allSaved: boolean) {
    const names = finished.map((c) => c.name).join(', ');
    const savedFiles = finished.reduce((n, c) => n + c.done, 0);
    const self = await browser.tabs.getCurrent();
    try {
      await browser.notifications.create({
        type: 'basic',
        iconUrl: browser.runtime.getURL('/icons/icon-128.png'),
        title: allSaved ? 'New Canvas files saved' : "Some new Canvas files couldn't be saved",
        message: allSaved
          ? `Saved ${savedFiles} files from ${names}.`
          : `Open the export tab to see what happened in ${names}.`,
      });
    } catch {
      // Notifications can be turned off for the browser; the downloads are what matter.
    }
    const tabId = self?.id;
    if (tabId === undefined) return;
    // window.close() isn't reliable for a tab the extension opened; remove it through the tabs API.
    if (allSaved) await browser.tabs.remove(tabId);
    else
      browser.notifications.onClicked.addListener(
        () => void browser.tabs.update(tabId, { active: true }),
      );
  }

  /** The Canvas page's security token, if the background kept one for us: used once, then gone. */
  async function takeCsrfToken(): Promise<string | undefined> {
    const key = csrfKey(origin);
    const stored = await browser.storage.session.get<Record<string, string | undefined>>(key);
    await browser.storage.session.remove(key);
    return stored[key];
  }

  function stop() {
    stopping = true;
    controller.abort();
  }

  onMount(() => {
    // Closing this tab stops the export, so ask first while it runs.
    const warn = (event: BeforeUnloadEvent) => {
      // Canvas may still be building a teacher's course package after the copy is saved.
      const packaging = courses.some((c) => c.coursePackage?.state === 'building');
      if (running || packaging) event.preventDefault();
    };
    // A tab closed halfway shouldn't leave the toolbar icon half full.
    const leave = () => void resetToolbarIcon();
    window.addEventListener('beforeunload', warn);
    window.addEventListener('pagehide', leave);
    void browser.runtime.getPlatformInfo().then((info) => (isWindows = info.os === 'win'));
    void takeCsrfToken()
      .then((csrfToken) =>
        exportCourses({
          origin,
          courseIds,
          onlyNew,
          allowFolder,
          ...(csrfToken ? { csrfToken } : {}),
          signal: controller.signal,
          onChange: track,
        }),
      )
      .then(async (finished) => {
        const allSaved = finished.length > 0 && finished.every((c) => c.outcome === 'success');
        if (quiet) {
          await reportQuietly(finished, allSaved);
          return;
        }
        // Only after an export where every file was saved.
        if (allSaved) showSupport = await supportCardAfterExport();
      })
      .finally(() => {
        running = false;
        void resetToolbarIcon();
      });
    return () => {
      window.removeEventListener('beforeunload', warn);
      window.removeEventListener('pagehide', leave);
    };
  });

  // The logo on this tab and on the toolbar fills dot by dot (32 dots, about 3% each).
  const filled = $derived(running ? dotsFor(overall) : dotsFor(1));
  $effect(() => setFavicon(filled));
  $effect(() => {
    if (running && courses.length) void setToolbarIcon(filled);
  });

  const title = $derived.by(() => {
    const several = courses.length > 1;
    if (running) {
      if (active?.phase !== 'saving') return `Getting ready · ${PRODUCT_NAME}`;
      const pct = Math.floor((several ? overall : fraction(active)) * 100);
      return `${pct}% · ${several ? `${courses.length} courses` : active.name}`;
    }
    if (several)
      return saved.length === courses.length
        ? `${courses.length} courses saved`
        : `${saved.length} of ${courses.length} courses saved`;
    const only = courses[0];
    if (!only || only.outcome === 'cancelled') return `Stopped · ${PRODUCT_NAME}`;
    return saved.length ? `${only.name} saved` : `${only.named ? only.name : 'Course'} not saved`;
  });
  $effect(() => {
    document.title = title;
  });

  /** Read out by screen readers; "Finished" is what tests wait for, too. */
  const status = $derived.by(() => {
    if (running) return active?.named ? `Saving ${active.name}` : '';
    if (courses.length > 1) return `Finished. ${saved.length} of ${courses.length} courses saved.`;
    const only = courses[0];
    if (!only) return 'Finished.';
    if (only.outcome === 'cancelled') return 'Finished. You stopped the download.';
    // The reason and the missing files are on the page, right after this.
    if (only.outcome === 'failed')
      return `Finished. ${only.named ? only.name : 'The course'} wasn't saved.`;
    if (only.outcome === 'partial') return `Finished. ${only.name} is saved, with files missing.`;
    return `Finished. ${only.name} is saved.`;
  });

  const chip = $derived.by(() => {
    if (!how) return undefined;
    if (how.profile === 'study') {
      const tool = AI_TARGETS[how.aiTarget].url ? AI_TARGETS[how.aiTarget].tool : 'Markdown';
      return { tone: 'chip-sun', icon: 'ai', text: `Study pack · ${tool}` } as const;
    }
    if (how.profile === 'agents')
      return { tone: 'chip-navy', icon: 'code', text: 'Files for code' } as const;
    if (how.role === 'teacher')
      return { tone: 'chip-navy', icon: 'teacher', text: 'Course archive' } as const;
    return { tone: 'chip-red', icon: 'folder', text: 'A copy to keep' } as const;
  });
  const only = $derived(courses.length === 1 ? courses[0] : undefined);
</script>

<div class="page">
  <header class="topbar">
    <span class="brand"><Logo size={36} /><span class="brand-name">{PRODUCT_NAME}</span></span>
    <div class="row">
      {#if chip}<span class="chip {chip.tone}"><Icon name={chip.icon} />{chip.text}</span>{/if}
      <button type="button" class="btn btn-text btn-sm" onclick={openSettings}>Settings</button>
    </div>
  </header>

  <div>
    <p class="sr-only" role="status">{status}</p>

    {#if folderPrompt}
      <div class="notice notice-sun folder-prompt" role="alert">
        <Icon name="folder" />
        <div class="prompt-body">
          <p>
            Your browser will ask to let us save into ‘{folderPrompt.name}’. Choose ‘Allow on every
            visit’ so it stops asking.
          </p>
          <div class="row">
            <button type="button" class="btn btn-primary btn-sm" onclick={folderPrompt.allow}
              >Allow access</button
            >
            <button type="button" class="btn btn-light btn-sm" onclick={folderPrompt.skip}
              >Save to Downloads instead</button
            >
          </div>
        </div>
      </div>
    {/if}

    {#if running}
      <Progress {courses} {active} {secondsLeft} {stopping} onStop={stop} />
    {:else if only && (only.outcome === 'failed' || only.outcome === 'cancelled')}
      <NotSaved course={only} />
    {:else if only?.how.profile === 'study'}
      <StudyReceipt course={only} {showSupport} />
    {:else if only?.studentWork?.teacher && only.how.profile === 'copy'}
      <TeacherReceipt course={only} {isWindows} {showSupport} />
    {:else if only}
      <Receipt course={only} {isWindows} {showSupport} />
    {:else if courses.length}
      <Several {courses} {showSupport} />
    {/if}
  </div>
</div>

<style>
  .row {
    gap: 14px;
  }
  .folder-prompt {
    margin: 8px 40px 12px;
  }
  .prompt-body {
    display: grid;
    gap: 10px;
  }
  .prompt-body .row {
    gap: 10px;
    flex-wrap: wrap;
  }
  @media (max-width: 1040px) {
    .folder-prompt {
      margin: 8px 16px 12px;
    }
  }
</style>
