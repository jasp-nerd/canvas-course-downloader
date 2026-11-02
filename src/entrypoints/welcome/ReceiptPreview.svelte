<script lang="ts">
  import Icon from '../../ui/Icon.svelte';
  import { setup } from './setup.svelte';

  const INSIDE = ['Pages', 'Files', 'Assignments, with rubrics', 'Quizzes, with answers'];
</script>

<!-- What the page after each download says about student data. -->
<div class="card receipt">
  <span class="label">After each download</span>
  {#if setup.answers.includeStudentWork}
    <div class="banner banner-sun">
      <span class="dot"><Icon name="users" /></span>
      <span>
        <strong>Student data: submissions, grades and names</strong>
        <span class="small">Kept for your own records. Share this copy with care.</span>
      </span>
    </div>
  {:else}
    <div class="banner banner-mint">
      <span class="dot"><Icon name="userX" /></span>
      <span>
        <strong>Student data: none included</strong>
        <span class="small">Submissions, grades and names are left out.</span>
      </span>
    </div>
  {/if}
  <ul class="rows">
    {#each INSIDE as item (item)}
      <li class="row"><Icon name="check" size={18} />{item}</li>
    {/each}
  </ul>
</div>

<style>
  .receipt {
    position: absolute;
    top: 40px;
    left: 40px;
    right: 40px;
    padding: 18px 20px;
    display: grid;
    gap: 10px;
  }
  .banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: var(--r-choice);
  }
  .banner-mint {
    background: var(--mint-wash);
    color: #0f4c32;
  }
  .banner-sun {
    background: var(--sun-wash);
    color: #4d3500;
  }
  .dot {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #fff;
    display: grid;
    place-items: center;
    flex: none;
  }
  .banner strong {
    display: block;
    font-size: 15px;
  }
  .banner .small {
    display: block;
    color: inherit;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    min-height: 34px;
    font-size: 14px;
  }
  li :global(svg) {
    color: var(--mint-ink);
  }
</style>
