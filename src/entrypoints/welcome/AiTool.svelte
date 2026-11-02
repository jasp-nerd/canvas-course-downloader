<script lang="ts">
  import { AI_TARGETS, type AiTarget, type AiTargetId } from '../../export/study-pack';
  import Icon from '../../ui/Icon.svelte';
  import { setup } from './setup.svelte';

  const targets = Object.entries(AI_TARGETS) as [AiTargetId, AiTarget][];

  /** What the pack is sized to, from the same limits the export uses. */
  const limit = (target: AiTarget) =>
    Number.isFinite(target.maxFiles)
      ? `Up to ${target.maxFiles} files per ${target.unit}`
      : 'Markdown only, no file limit';
</script>

<h1 class="display" tabindex="-1">Which AI tool do you use?</h1>
<p class="lead">Each one takes files differently, so we size the pack to fit.</p>
<div class="choices choices-2" role="radiogroup" aria-label="AI tool">
  {#each targets as [id, target] (id)}
    <label class="choice no-icon">
      <input type="radio" name="tool" value={id} bind:group={setup.answers.aiTarget} />
      <span>
        <strong>{target.label}</strong>
        <span class="choice-text">{limit(target)}</span>
      </span>
      <span class="tick"></span>
    </label>
  {/each}
</div>
<div class="notice notice-sun">
  <Icon name="info" />
  <span>Using AI with course material? Check your course's rules first.</span>
</div>

<style>
  .choice {
    min-height: 58px;
  }
  /* An odd one out takes the whole row. */
  .choice:last-child:nth-child(odd) {
    grid-column: 1 / -1;
  }
</style>
