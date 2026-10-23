<script lang="ts">
  import type { SetupGoal } from '../../app/onboarding';
  import Icon from '../../ui/Icon.svelte';
  import type { IconName } from '../../ui/icons';
  import { chooseGoal, setup } from './setup.svelte';

  const GOALS: { goal: SetupGoal; icon: IconName; title: string; text: string }[] = [
    {
      goal: 'copy',
      icon: 'folder',
      title: 'Keep a copy',
      text: 'Slides, readings and pages, in folders that open offline',
    },
    {
      goal: 'study',
      icon: 'ai',
      title: 'Study with AI',
      text: 'A few tidy files for NotebookLM, ChatGPT or Claude',
    },
    {
      goal: 'code',
      icon: 'code',
      title: 'Build with code',
      text: 'Markdown and AGENTS.md for coding agents',
    },
    {
      goal: 'teach',
      icon: 'teacher',
      title: 'Archive a course I teach',
      text: 'Content, quizzes and rubrics, ready to reuse',
    },
  ];
</script>

<h1 class="display" tabindex="-1">What do you want to do with your courses?</h1>
<p class="lead">Pick what fits best. You can change it any time in Settings.</p>
<div class="choices" role="radiogroup" aria-label="What do you want to do">
  {#each GOALS as goal (goal.goal)}
    <label class="choice">
      <input
        type="radio"
        name="goal"
        value={goal.goal}
        bind:group={setup.answers.goal}
        onchange={chooseGoal}
      />
      <Icon name={goal.icon} size={26} />
      <span>
        <strong>{goal.title}</strong>
        <span class="choice-text">{goal.text}</span>
      </span>
      <span class="tick"></span>
    </label>
  {/each}
</div>
