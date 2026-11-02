// On every page: the bar's line once you scroll, section entrances, and install buttons that
// match the visitor's browser.
import { STORE } from '../data/site';

const nav = document.querySelector<HTMLElement>('[data-nav]');
const onScroll = () => nav?.classList.toggle('scrolled', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Firefox and Edge visitors get their own store. Without a listing, Firefox goes to the install
// page and Edge to the Chrome Web Store, which Edge can install from.
const firefox = navigator.userAgent.includes('Firefox/');
const edge = navigator.userAgent.includes('Edg/');
for (const a of document.querySelectorAll<HTMLAnchorElement>('[data-install]')) {
  const own = firefox ? STORE.firefox : edge ? STORE.edge : '';
  const name = firefox ? 'Firefox' : 'Edge';
  if (own) a.href = own;
  else if (firefox && a.dataset.fallback) a.href = a.dataset.fallback;
  if (!firefox && !edge) continue;
  // Their own logo instead of Chrome's.
  a.querySelector('use')?.setAttribute('href', firefox ? '#i-firefox' : '#i-edge');
  const text = a.lastChild;
  if (text?.textContent) {
    text.textContent = firefox && !own ? 'Install' : text.textContent.replace('Chrome', name);
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
