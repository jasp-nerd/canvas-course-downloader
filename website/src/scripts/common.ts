// On every page: the bar's line once you scroll, section entrances, and install buttons that
// match the visitor's browser.
import { STORE } from '../data/site';

const nav = document.querySelector<HTMLElement>('[data-nav]');
const onScroll = () => nav?.classList.toggle('scrolled', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Firefox has no listing yet: its visitors go to the install page instead of a store they can't use.
const firefox = navigator.userAgent.includes('Firefox/');
const edge = navigator.userAgent.includes('Edg/');
for (const a of document.querySelectorAll<HTMLAnchorElement>('[data-install]')) {
  if (firefox && !STORE.firefox) {
    if (a.dataset.fallback) a.href = a.dataset.fallback;
    a.lastChild?.replaceWith(' Install');
  } else if (edge && !STORE.edge) {
    // Edge installs from the Chrome Web Store until its own listing exists.
    const text = a.lastChild;
    if (text?.textContent) text.textContent = text.textContent.replace('Chrome', 'Edge');
  }
}

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const parts = document.querySelectorAll<HTMLElement>('.rise');
if (reduced || !('IntersectionObserver' in window)) {
  parts.forEach((el) => el.classList.add('in'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  parts.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 3) * 80}ms`;
    io.observe(el);
  });
}
