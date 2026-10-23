<script lang="ts">
  import Logo from '../../ui/Logo.svelte';
  import { COURSE } from './examples';
  import { setup } from './setup.svelte';

  const place = $derived(
    setup.answers.saveTo === 'folder' && setup.folder ? setup.folder.name : 'Downloads',
  );
</script>

<!-- A 7-second loop drawn in CSS: on a Canvas course page the cursor presses our
     button, and a panel fills the logo's dots until the course is saved. With
     reduced motion it holds the last frame. -->
<div
  class="demo"
  role="img"
  aria-label="On a Canvas course page, the Download course button is pressed and the course is saved to {place}"
>
  <div class="nav"></div>
  <div class="page">
    <div class="crumbs">
      <span class="course">{COURSE}</span>
      <span class="here">› Modules</span>
      <span class="press">
        <span class="button"><Logo size={16} color="#fff" />Download course</span>
        <svg class="cursor" viewBox="0 0 24 24" aria-hidden="true"
          ><path
            d="M4 2l16 9-7 2-3 7z"
            fill="#14202f"
            stroke="#fff"
            stroke-width="1.5"
            stroke-linejoin="round"
          /></svg
        >
      </span>
    </div>
    <i class="bar title" style:width="60%"></i>
    <i class="bar" style:width="92%"></i>
    <i class="bar" style:width="78%"></i>
    <i class="bar" style:width="85%"></i>
    <i class="bar title" style:width="55%"></i>
    <i class="bar" style:width="88%"></i>
    <i class="bar" style:width="70%"></i>
    <div class="saving">
      <span class="ring"><Logo size={40} looping /></span>
      <span class="text">
        <strong>{COURSE}</strong>
        <span class="state">
          <span class="busy">Saving files…</span>
          <span class="done">Saved to {place}</span>
        </span>
      </span>
    </div>
  </div>
</div>

<style>
  .demo {
    position: absolute;
    top: 44px;
    left: 40px;
    right: 40px;
    height: 330px;
    border-radius: 16px;
    background: #fff;
    color: var(--ink);
    overflow: hidden;
    display: grid;
    grid-template-columns: 52px 1fr;
  }
  /* Canvas's own navigation colours, so it reads as Canvas. */
  .nav {
    background: #2d3b45;
  }
  .page {
    position: relative;
    padding: 16px 18px;
    display: grid;
    align-content: start;
    gap: 10px;
  }
  .crumbs {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    white-space: nowrap;
  }
  .course {
    font-weight: 600;
    color: #0770a3;
  }
  .here {
    color: var(--ink-3);
  }
  .press {
    position: relative;
  }
  .button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 10px;
    border-radius: 5px;
    background: #0770a3;
    color: #fff;
    font: 600 12px/1 var(--font-ui);
  }
  .cursor {
    position: absolute;
    left: 58%;
    top: 55%;
    width: 22px;
    height: 22px;
  }
  .bar {
    display: block;
    height: 14px;
    border-radius: 7px;
    background: #e9edf2;
  }
  .bar.title {
    height: 18px;
    margin-top: 8px;
    background: #dfe4ea;
  }
  .saving {
    position: absolute;
    right: 14px;
    bottom: 14px;
    width: 218px;
    padding: 12px 14px;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 10px 30px rgba(20, 32, 47, 0.22);
    display: grid;
    grid-template-columns: 40px 1fr;
    gap: 10px;
    align-items: center;
  }
  .text {
    display: grid;
    min-width: 0;
  }
  .text strong {
    font-size: 13px;
  }
  .state {
    display: grid;
    font-size: 12px;
    color: var(--ink-3);
  }
  .state > span {
    grid-area: 1 / 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .done {
    color: var(--mint-ink);
    font-weight: 700;
  }
  .busy {
    opacity: 0;
  }

  @media (prefers-reduced-motion: no-preference) {
    .cursor {
      animation: cursor 7s infinite;
    }
    .button {
      animation: press 7s infinite;
    }
    .saving {
      animation: panel 7s infinite;
    }
    .busy {
      animation: busy 7s infinite;
    }
    .done {
      animation: done 7s infinite;
    }
    /* The logo's own loop, retimed so the dots fill while the panel shows. */
    .ring :global(.logo.looping path:not(:last-child)) {
      animation-name: demo-fill;
      animation-duration: 7s;
    }
  }
  @keyframes cursor {
    0%,
    8% {
      transform: translate(142px, 196px);
    }
    26%,
    100% {
      transform: translate(0, 0);
    }
  }
  @keyframes press {
    0%,
    27% {
      transform: scale(1);
    }
    29% {
      transform: scale(0.94);
    }
    32%,
    100% {
      transform: scale(1);
    }
  }
  @keyframes panel {
    0%,
    32% {
      opacity: 0;
      transform: translateY(12px);
    }
    36%,
    92% {
      opacity: 1;
      transform: none;
    }
    97%,
    100% {
      opacity: 0;
      transform: translateY(12px);
    }
  }
  @keyframes busy {
    0%,
    74% {
      opacity: 1;
    }
    76%,
    100% {
      opacity: 0;
    }
  }
  @keyframes done {
    0%,
    74% {
      opacity: 0;
    }
    76%,
    100% {
      opacity: 1;
    }
  }
  @keyframes -global-demo-fill {
    0%,
    36% {
      fill: var(--off);
    }
    37%,
    95% {
      fill: var(--on);
    }
    100% {
      fill: var(--off);
    }
  }
</style>
