// Shared by both films: draw the logo and fill its dots as progress.
// The logo as progress: draw its 32 dots and arrow into an <svg>, then fill p (0..1) of them.
window.drawLogo = (svg) => {
  const ns = 'http://www.w3.org/2000/svg';
  svg.setAttribute('viewBox', window.LOGO.viewBox);
  const g = document.createElementNS(ns, 'g');
  g.setAttribute('transform', window.LOGO.transform);
  for (const d of window.LOGO.dots) {
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', 'dot');
    g.append(path);
  }
  const arrow = document.createElementNS(ns, 'path');
  arrow.setAttribute('d', window.LOGO.arrow);
  arrow.setAttribute('class', 'arrow');
  g.append(arrow);
  svg.append(g);
};
window.fillLogo = (svg, p) => {
  const dots = svg.querySelectorAll('.dot');
  const on = Math.round(p * dots.length);
  dots.forEach((d, i) => d.classList.toggle('on', i < on));
};

// The headline entrance every scene uses: its lines rise 24 px into place, 0.08 s apart.
window.enterTitle = (tl, sel, at) =>
  tl.fromTo(`${sel} .ln`, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.08, ease: 'power3.out' }, at);
window.exitTitle = (tl, sel, at) =>
  tl.fromTo(`${sel} .ln`, { y: 0, opacity: 1 }, { immediateRender: false, y: -14, opacity: 0, duration: 0.25, stagger: 0.04, ease: 'power2.in' }, at);
// A slow push-in while a shot holds, so nothing on screen is ever quite still.
window.pushIn = (tl, sel, at, duration, to = 1.03) =>
  tl.fromTo(sel, { scale: 1 }, { scale: to, duration, ease: 'sine.inOut' }, at);
// A cursor press: down, then back up.
window.press = (tl, sel, at) => {
  tl.fromTo(sel, { scale: 1 }, { immediateRender: false, scale: 0.86, duration: 0.08, ease: 'power2.out' }, at);
  tl.fromTo(sel, { scale: 0.86 }, { immediateRender: false, scale: 1, duration: 0.16, ease: 'power2.out' }, at + 0.08);
};
