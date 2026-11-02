// The landing page: the hero demo, "when does your Canvas close", and the course saving as you scroll.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function fill(svg: Element | null, p: number) {
  const dots = svg?.querySelectorAll('.dot') ?? [];
  const on = Math.round(p * dots.length);
  dots.forEach((d, i) => d.classList.toggle('on', i < on));
}

// Hero: a cursor presses Download course on the captured page, and the course saves.
const FILES = [
  'Syllabus.pdf',
  'Lecture 01 - Academic Writing week 1.pdf',
  'Lecture 02 - Academic Writing week 2.pdf',
  'Week 1 - Core reading.pdf',
  'Lecture 03 - Academic Writing week 3.pdf',
  'Assignment 1 brief.pdf',
  'Lecture 04 - Academic Writing week 4.pdf',
  'Week 4 - Background article.pdf',
  'Rubric.pdf',
  'Lecture 05 - Academic Writing week 5.pdf',
  'Course schedule',
  'Assignment 2',
  'Practice exam.pdf',
  'Formula sheet.pdf',
  'Midterm project',
  'Grades.csv',
  'Deadlines.ics',
];
const stage = document.querySelector<HTMLElement>('[data-stage]');
let run = 0;
async function demo() {
  if (!stage) return;
  const card = stage.querySelector<HTMLElement>('.export-card')!;
  const cursor = stage.querySelector<SVGElement>('.cursor');
  const ring = stage.querySelector('[data-ring="hero"]');
  const replay = document.querySelector<HTMLButtonElement>('[data-replay]')!;
  const el = (name: string) => stage.querySelector<HTMLElement>(`[data-${name}]`)!;
  const id = ++run;
  const total = 54;
  const set = (done: number) => {
    const p = done / total;
    fill(ring, p);
    el('pct').textContent = `${Math.round(p * 100)}%`;
    el('count').textContent = `${done} of ${total} files`;
    el('bar').style.width = `${p * 100}%`;
  };
  const finish = () => {
    set(total);
    card.classList.add('shown', 'done');
    stage.classList.add('carded');
    el('name').textContent = 'Academic Writing is saved';
    el('count').textContent = '54 files, 27 MB, in Downloads';
    el('recent').innerHTML = [
      'Files, pages and assignments',
      'Quizzes, discussions and announcements',
      'Your grades and every deadline',
    ]
      .map((t) => `<li><svg class="icon" aria-hidden="true"><use href="#i-check"></use></svg>${t}</li>`)
      .join('');
    replay.hidden = false;
  };
  stage.classList.add('demo-ready');
  stage.classList.remove('carded');
  card.classList.remove('shown', 'done');
  replay.hidden = true;
  el('name').textContent = 'Saving Academic Writing';
  el('recent').innerHTML = '';
  set(0);
  if (reduced) return finish();

  const target = stage.querySelector('.target')!.getBoundingClientRect();
  const box = stage.querySelector('.window')!.getBoundingClientRect();
  if (cursor) {
    cursor.style.left = '70%';
    cursor.style.top = '74%';
    await wait(450);
    if (id !== run) return;
    cursor.style.left = `${target.left - box.left + target.width * 0.55}px`;
    cursor.style.top = `${target.top - box.top + target.height * 0.45}px`;
    await wait(1200);
    if (id !== run) return;
    cursor.classList.add('click');
    await wait(160);
    cursor.classList.remove('click');
  }
  await wait(220);
  card.classList.add('shown');
  stage.classList.add('carded');
  for (let done = 1; done <= total; done++) {
    await wait(done < 6 ? 110 : 55);
    if (id !== run) return;
    set(done);
    if (done % 3 === 0) {
      const list = el('recent');
      list.insertAdjacentHTML(
        'afterbegin',
        `<li><svg class="icon" aria-hidden="true"><use href="#i-check"></use></svg><span>${FILES[(done / 3) % FILES.length]}</span></li>`,
      );
      while (list.children.length > 3) list.lastElementChild!.remove();
    }
  }
  await wait(250);
  if (id === run) finish();
}
if (stage) {
  document.querySelector('[data-replay]')!.addEventListener('click', () => void demo());
  stage.querySelector('.target')!.addEventListener('click', () => void demo());
  // Start when the stage is on screen, once.
  new IntersectionObserver((entries, io) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    void demo();
  }).observe(stage);
}

// Everything in the course: pick a kind, and while the section is on screen the ring fills and
// the folder fills in, row by row.
const ev = document.querySelector<HTMLElement>('[data-everything]');
if (ev) {
  // The ring beside the text, and on phones the one in the bar that stays on top of the tree.
  const rings = ev.querySelectorAll('[data-ring="everything"]');
  const statuses = ev.querySelectorAll<HTMLElement>('[data-ev-pct]');
  let progress = reduced ? 1 : 0;
  // Rows a phone folds away don't take a share of the progress.
  const rows = () =>
    [...ev.querySelectorAll<HTMLElement>('[data-tree]:not([hidden]) [data-row]')].filter(
      (r) => r.getClientRects().length > 0,
    );
  const paint = () => {
    rings.forEach((ring) => fill(ring, progress));
    const list = rows();
    const shown = Math.round(progress * list.length);
    list.forEach((r, i) => r.classList.toggle('pending', i >= shown));
    const text = progress >= 1 ? 'Saved' : `${Math.round(progress * 100)}%`;
    statuses.forEach((s) => (s.textContent = text));
  };
  for (const input of ev.querySelectorAll<HTMLInputElement>('input[name="kind"]')) {
    input.addEventListener('change', () => {
      for (const panel of ev.querySelectorAll<HTMLElement>('[data-kind]'))
        panel.hidden = panel.dataset.kind !== input.value;
      paint();
    });
  }
  if (!reduced) {
    // Progress follows the section through the screen: empty as it enters, full by the middle.
    const update = () => {
      const r = ev.getBoundingClientRect();
      const p = (innerHeight * 0.85 - r.top) / (r.height * 0.6);
      progress = Math.min(1, Math.max(0, p));
      paint();
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  } else {
    paint();
  }
}
