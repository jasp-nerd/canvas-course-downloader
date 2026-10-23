<script lang="ts">
  import Icon from '../../ui/Icon.svelte';
  import { setup } from './setup.svelte';
</script>

<h1 class="display" tabindex="-1">Leave your students' work out?</h1>
<p class="lead">
  As a teacher you can see every student's submissions and grades. A copy you might share shouldn't
  hold them.
</p>
<div class="choices" role="radiogroup" aria-label="Student work">
  <label class="choice">
    <input
      type="radio"
      name="students"
      value={false}
      bind:group={setup.answers.includeStudentWork}
    />
    <Icon name="userX" size={26} />
    <span>
      <strong>Course content only <span class="chip chip-mint">Recommended</span></strong>
      <span class="choice-text">Pages, files, assignments, quizzes with answers and rubrics</span>
    </span>
    <span class="tick"></span>
  </label>
  <label class="choice">
    <input
      type="radio"
      name="students"
      value={true}
      bind:group={setup.answers.includeStudentWork}
    />
    <Icon name="users" size={26} />
    <span>
      <strong>Content and student work</strong>
      <span class="choice-text"
        >Adds submissions, the gradebook and replies with names, for your own records</span
      >
    </span>
    <span class="tick"></span>
  </label>
</div>
<div class="notice notice-navy">
  <Icon name="shield" />
  <span>Either way, the copy stays on your computer. You can change this any time in Settings.</span
  >
</div>

<style>
  .chip {
    margin-left: 6px;
    vertical-align: 2px;
  }
</style>
