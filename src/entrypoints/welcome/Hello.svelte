<script lang="ts">
  import Icon from '../../ui/Icon.svelte';
  import type { IconName } from '../../ui/icons';

  const PROMISES: { icon: IconName; title: string; text: string }[] = [
    {
      icon: 'shield',
      title: 'Only what you can already see',
      text: 'Like opening each file yourself, just faster. It never sees your password.',
    },
    {
      icon: 'laptop',
      title: 'Everything stays on this computer',
      text: 'Nothing is sent to us or to anyone else.',
    },
    {
      icon: 'heart',
      title: 'Free, no account',
      text: 'Open source on GitHub, used by over 10,000 students and teachers.',
    },
  ];

  let allowedOpen = $state(false);
</script>

<h1 class="display" tabindex="-1">Never lose a course again</h1>
<p class="lead">
  Save your Canvas courses to your computer, so slides, readings and your own work stay yours after
  the course closes.
</p>
<ul class="card rows promises">
  {#each PROMISES as promise (promise.title)}
    <li class="row">
      <Icon name={promise.icon} size={24} />
      <span><strong>{promise.title}</strong><span class="small">{promise.text}</span></span>
    </li>
  {/each}
</ul>
<div class="allowed">
  <button
    type="button"
    class="link small"
    aria-expanded={allowedOpen}
    aria-controls="allowed-answer"
    onclick={() => (allowedOpen = !allowedOpen)}
    >Is this allowed at my school? Will my teacher know?</button
  >
  <ul id="allowed-answer" class="answer" hidden={!allowedOpen}>
    <li>Saving material you can already see, for your own study, is normally fine.</li>
    <li>Don't share other people's work.</li>
    <li>
      Your teacher isn't notified, but Canvas may log page views the same way as when you open them
      yourself.
    </li>
  </ul>
</div>

<style>
  h1 {
    font-size: 52px;
  }
  .promises {
    list-style: none;
    margin: 0;
    padding: 4px 20px;
    display: grid;
  }
  .promises li {
    min-height: 64px;
    gap: 14px;
    padding: 10px 0;
  }
  .promises li > :global(svg) {
    color: var(--mint-ink);
  }
  .promises strong {
    display: block;
    font-size: 15px;
    line-height: 1.4;
  }
  .promises .small {
    display: block;
  }
  .allowed {
    display: grid;
    gap: 10px;
    margin-top: -10px;
    justify-items: start;
  }
  .answer {
    margin: 0;
    padding: 12px 16px 12px 32px;
    border-radius: var(--r-choice);
    background: var(--navy-wash);
    font-size: 14px;
    line-height: 1.45;
    display: grid;
    gap: 4px;
  }
  .answer[hidden] {
    display: none;
  }
</style>
