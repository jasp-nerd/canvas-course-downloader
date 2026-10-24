<script lang="ts">
  // The receipt for a course the user teaches: an archive of the course, and
  // plainly whether students' work is in it.
  import type { CourseState } from '../../app/export-job';
  import Icon from '../../ui/Icon.svelte';
  import Pip from '../../ui/Pip.svelte';
  import { openSettings } from './actions';
  import Inside from './Inside.svelte';
  import { joined, sizeOf, whenLine } from './lines';
  import Notices from './Notices.svelte';
  import OpeningIt from './OpeningIt.svelte';
  import PackageRow from './PackageRow.svelte';
  import ShowInFolder from './ShowInFolder.svelte';
  import SupportCard from './SupportCard.svelte';

  let {
    course,
    isWindows,
    showSupport,
  }: { course: CourseState; isWindows: boolean; showSupport: boolean } = $props();

  const included = $derived(course.studentWork?.included ?? false);
  const files = $derived(course.kinds.reduce((n, k) => n + k.done, 0));
  const size = $derived(sizeOf(course));
  let explainChoice = $state<boolean | undefined>(undefined);
  const explain = $derived(explainChoice ?? isWindows);
</script>

<section class="card archive">
  <div class="band-text">
    <h1 class="display">{course.name} is archived</h1>
    <p class="band-meta num">
      {joined(included ? 'Content and student work' : 'Course content only', size)}, saved as
      <span>{course.savedAs}</span>
    </p>
    <div class="row band-actions">
      <ShowInFolder {course} />
      {#if course.how.zip}
        <button
          type="button"
          class="btn btn-text"
          aria-expanded={explain}
          aria-controls="opening-it"
          onclick={() => (explainChoice = !explain)}>How to open a ZIP</button
        >
      {/if}
    </div>
  </div>
  <div class="art"><Pip pose="read" height={176} /></div>
</section>

<section class="student-data" class:included aria-labelledby="student-data-title">
  <span class="badge"><Icon name={included ? 'users' : 'userX'} size={22} /></span>
  <span>
    <strong id="student-data-title"
      >{included ? 'Student data: included' : 'Student data: none included'}</strong
    >
    <span class="why"
      >{included
        ? 'Submissions, grades and names are in this copy. Keep it somewhere private.'
        : 'Submissions, grades and names were left out.'}</span
    >
  </span>
  <button type="button" class="link change" onclick={openSettings}>Change in Settings</button>
</section>

{#if course.coursePackage}
  <PackageRow pkg={course.coursePackage} />
{/if}

<main class="teacher-grid">
  <section class="card inside-card" aria-labelledby="inside-title">
    <div class="card-head">
      <h2 class="heading" id="inside-title">What's inside</h2>
      <span class="small num">{joined(`${files} ${files === 1 ? 'file' : 'files'}`, size)}</span>
    </div>
    <Inside {course} labelledby="inside-title" columns={2} />
    <div class="notes">
      <Notices {course} />
    </div>
    <p class="small when">{whenLine(course)}</p>
  </section>
  {#if (course.how.zip && explain) || showSupport}
    <div class="below">
      {#if course.how.zip && explain}<OpeningIt {course} {isWindows} />{/if}
      {#if showSupport}<SupportCard />{/if}
    </div>
  {/if}
</main>

<style>
  .archive {
    margin: 8px 40px 0;
    border-radius: 28px;
    padding: 32px 40px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 200px;
    gap: 32px;
    align-items: center;
  }
  .archive .band-text {
    padding-bottom: 0;
  }
  .archive h1 {
    font-size: 48px;
  }
  .art {
    width: 200px;
    height: 200px;
    border-radius: 28px;
    background: var(--navy-wash);
    display: grid;
    place-items: end center;
    overflow: hidden;
  }
  .art :global(.pip) {
    margin-bottom: 6px;
  }
  .student-data {
    margin: 16px 40px 0;
    border-radius: 20px;
    background: var(--mint-wash);
    color: #0f4c32;
    padding: 18px 24px;
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) auto;
    gap: 16px;
    align-items: center;
  }
  .student-data.included {
    background: var(--sun-wash);
    color: #4d3500;
  }
  .badge {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #fff;
    display: grid;
    place-items: center;
    color: var(--mint-ink);
  }
  .included .badge {
    color: var(--sun-ink);
  }
  strong {
    display: block;
    font-size: 17px;
  }
  .why {
    font-size: 14px;
  }
  .change {
    font-size: 13px;
    font-weight: 600;
    color: var(--mint-ink);
  }
  .included .change {
    color: var(--sun-ink);
  }
  .teacher-grid {
    display: grid;
    gap: 16px;
    padding: 16px 40px 40px;
  }
  .teacher-grid .inside-card {
    padding: 22px 32px 18px;
    gap: 6px;
  }
  .notes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 12px;
    margin-top: 14px;
  }
  .notes:empty {
    display: none;
  }
  .when {
    margin-top: 8px;
  }
  .below {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 16px;
    align-items: start;
  }
  @media (max-width: 1040px) {
    .archive,
    .student-data {
      margin-left: 16px;
      margin-right: 16px;
    }
    .teacher-grid {
      padding: 16px 16px 32px;
    }
  }
  @media (max-width: 760px) {
    .archive {
      grid-template-columns: minmax(0, 1fr);
      padding: 24px;
    }
    .art {
      display: none;
    }
    .archive h1 {
      font-size: 32px;
    }
    .student-data {
      grid-template-columns: 44px minmax(0, 1fr);
    }
    .change {
      grid-column: 2;
      justify-self: start;
    }
  }
</style>
