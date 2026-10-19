// Canvas-looking HTML for the mock. The markup carries the signals real Canvas
// pages have (.ic-app, breadcrumbs, brandable_css, DOMAIN_ROOT_ACCOUNT_ID) so
// detection runs the same way it does on a custom domain like canvas.vu.nl.
import { COURSES, modules, moduleItems, type Course } from './data.ts';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const CSS = `
:root{--ic-brand-primary:#3375AE;--ic-brand-global-nav-bgd:#3375AE;--ic-brand-font-color-dark:#2D3B45}
*{box-sizing:border-box}html,body{margin:0}
body{font-family:Helvetica,Arial,sans-serif;color:#2D3B45;background:#fff;font-size:15px}
a{color:#0374B5;text-decoration:none}
.ic-app{display:flex;min-height:100vh}
.ic-app-header{width:84px;flex:none;background:var(--ic-brand-global-nav-bgd);color:#fff;display:flex;flex-direction:column;align-items:center;padding-top:14px;position:fixed;top:0;bottom:0;left:0}
.logo{width:48px;height:48px;border-radius:10px;background:#fff;color:var(--ic-brand-primary);display:grid;place-items:center;font-weight:700;font-size:22px;margin-bottom:18px}
.avatar{width:40px;height:40px;border-radius:50%;background:#e2e8f0;color:#334155;display:grid;place-items:center;font-weight:700;font-size:14px}
.nav-item{color:#fff;font-size:12px;padding:12px 0}
.ic-Layout-wrapper{margin-left:84px;flex:1;padding:0 36px 40px;min-width:0}
.ic-Dashboard-header__layout{border-bottom:1px solid #C7CDD1;padding:20px 0 14px;margin-bottom:24px}
.ic-Dashboard-header__title{font-size:30px;font-weight:300;margin:0}
.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}
.card{border-radius:4px;box-shadow:0 2px 5px rgba(0,0,0,.25);overflow:hidden}
.card-hero{height:110px}
.card-body{padding:12px 16px}
.card-title{font-weight:700}
.ic-app-nav-toggle-and-crumbs{display:flex;align-items:center;gap:18px;border-bottom:1px solid #C7CDD1;padding:18px 0 14px;margin:0 0 20px}
#breadcrumbs ul{list-style:none;margin:0;padding:0;font-size:16px}
#breadcrumbs li{display:inline-flex;align-items:center}
#breadcrumbs li+li:before{content:"›";color:#73818C;margin:0 10px}
.module{border:1px solid #C7CDD1;border-radius:4px;margin-bottom:16px}
.module-head{background:#F5F5F5;padding:11px 16px;font-weight:700}
.module-item{padding:9px 16px;border-top:1px solid #eef0f2}
`;

function shell(title: string, inner: string, brand?: string): string {
  const brandCss = brand
    ? `:root{--ic-brand-primary:${brand};--ic-brand-global-nav-bgd:${brand}}`
    : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<link rel="stylesheet" href="/dist/brandable_css/mock/variables.css">
<style>${CSS}${brandCss}</style>
<script>window.ENV = { DOMAIN_ROOT_ACCOUNT_ID: "1" };</script>
</head><body><div class="ic-app" id="application">
<header class="ic-app-header" id="header"><div class="logo">S</div><div class="avatar">SS</div>
<a class="nav-item" href="/">Dashboard</a><a class="nav-item" href="/courses">Courses</a></header>
<div class="ic-Layout-wrapper" id="wrapper"><div id="content">${inner}</div></div></div></body></html>`;
}

export function dashboardPage(brand?: string): string {
  const cards = COURSES.filter((c) => c.state === 'active')
    .map(
      (
        c,
      ) => `<a class="card" href="/courses/${c.id}"><div class="card-hero" style="background:${c.color}"></div>
<div class="card-body"><div class="card-title">${esc(c.name)}</div><div>${esc(c.course_code)}</div><div>${esc(c.term.name)}</div></div></a>`,
    )
    .join('');
  return shell(
    'Dashboard',
    `<div class="ic-Dashboard-header__layout"><h1 class="ic-Dashboard-header__title">Dashboard</h1></div><div class="cards">${cards}</div>`,
    brand,
  );
}

export function coursePage(c: Course, origin: string, brand?: string): string {
  const mods = modules(c)
    .slice(0, 4)
    .map((m) => {
      const items = moduleItems(c, m.id as number, origin)
        .map((it) => `<div class="module-item">${esc(String(it.title))}</div>`)
        .join('');
      return `<div class="module"><div class="module-head">${esc(String(m.name))}</div>${items}</div>`;
    })
    .join('');
  return shell(
    c.name,
    `<div class="ic-app-nav-toggle-and-crumbs"><div class="ic-app-crumbs"><nav id="breadcrumbs"><ul>
<li><a href="/courses/${c.id}"><span class="ellipsible">${esc(c.name)}</span></a></li><li><span>Modules</span></li></ul></nav></div></div>
<h2>Modules</h2>${mods}`,
    brand,
  );
}

export function plainPage(): string {
  return '<!doctype html><html><head><title>Not Canvas</title></head><body><main id="main"><h1>Just a website</h1></main></body></html>';
}
