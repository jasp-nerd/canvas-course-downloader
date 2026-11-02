// Real-looking Canvas pages for the store images, in place of the mock's plain ones: Canvas's own
// markup and class names, its stylesheets from Instructure's public CDN, and the default Canvas
// theme (slate navigation, the Canvas logomark). Everything on them is the mock's invented data.
//
// Canvas is AGPL, so nothing of it is copied into this repo: the stylesheets load from the CDN
// and the navigation icons are fetched from the canvas-lms repository when a capture runs.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { COURSES, findCourse, type Course } from '../../../../e2e/mock-canvas/data.ts';

const CDN = 'https://du11hjcvx0uqb.cloudfront.net/dist';
const ICONS_FROM = 'https://raw.githubusercontent.com/instructure/canvas-lms/master/app/views/shared/svg';
// A stock portrait (Unsplash, free to use without attribution) for the invented student's avatar.
const AVATAR = `data:image/jpeg;base64,${readFileSync(path.join(import.meta.dirname, 'assets/avatar.jpg')).toString('base64')}`;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

let icons: Record<string, string> | undefined;
/** Canvas's global navigation icons, fetched once per run. */
export async function loadCanvasIcons(): Promise<void> {
  const names = {
    dashboard: '_svg_icon_dashboard.svg',
    courses: '_svg_icon_courses.svg',
    calendar: '_svg_icon_calendar_new_styles.svg',
    inbox: '_svg_icon_inbox.svg',
    history: '_svg_icon_history.svg',
    help: '_svg_icon_help.svg',
    navtoggle: '_svg_icon_navtoggle.svg',
  };
  icons = Object.fromEntries(
    await Promise.all(
      Object.entries(names).map(async ([key, file]) => {
        const res = await fetch(`${ICONS_FROM}/${file}`);
        if (!res.ok) throw new Error(`Couldn't fetch the Canvas icon ${file}: ${res.status}`);
        return [key, (await res.text()).replace(/<%.*?%>/gs, '')];
      }),
    ),
  );
}

const icon = (name: string) => icons?.[name] ?? '';

function head(title: string, bundles: string[]): string {
  const css = (href: string, media = 'all') => `<link rel="stylesheet" href="${CDN}/${href}" media="${media}">`;
  return `<!DOCTYPE html><html dir="ltr" lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title>
${css('brandable_css/no_variables/bundles/fonts-eb4a10fb18.css', 'screen')}
${css('brandable_css/default/variables-9dec371ad57e3dd0396f0b2eddb63479.css')}
${css('brandable_css/new_styles_normal_contrast/bundles/common-0b407277f8.css')}
${bundles.map((b) => css(b, 'screen')).join('\n')}
<link rel="icon" href="${CDN}/images/favicon-e10d657a73.ico">
<script>window.ENV = { DOMAIN_ROOT_ACCOUNT_ID: "1" };</script>
<style>
  /* Canvas's JavaScript isn't loaded, so what it would do is done here: show the breadcrumbs
     once measured, and fill the dashboard cards' colour. */
  #breadcrumbs, #breadcrumbs ol, #breadcrumbs li { visibility: visible !important; }
  .ic-DashboardCard__header_hero { opacity: .9; }
</style></head>`;
}

function globalNav(active: 'dashboard' | 'courses'): string {
  const item = (id: string, href: string, label: string, svg: string, on = false) =>
    `<li class="menu-item ic-app-header__menu-list-item${on ? ' ic-app-header__menu-list-item--active' : ''}">
<a id="global_nav_${id}_link" href="${href}" class="ic-app-header__menu-list-link"${on ? ' aria-current="page"' : ''}>
<div class="menu-item-icon-container" aria-hidden="true">${svg}</div><div class="menu-item__text">${label}</div></a></li>`;
  return `<header id="header" class="ic-app-header no-print" aria-label="Global Header">
<div role="region" class="ic-app-header__main-navigation" aria-label="Global Navigation">
<div class="ic-app-header__logomark-container"><a href="/" class="ic-app-header__logomark"><span class="screenreader-only">Dashboard</span></a></div>
<ul id="menu" class="ic-app-header__menu-list">
<li class="menu-item ic-app-header__menu-list-item"><a id="global_nav_profile_link" href="/profile" class="ic-app-header__menu-list-link">
<div class="menu-item-icon-container" aria-hidden="true"><div class="ic-avatar"><img src="${AVATAR}" alt=""></div></div><div class="menu-item__text">Account</div></a></li>
${item('dashboard', '/', 'Dashboard', icon('dashboard'), active === 'dashboard')}
${item('courses', '/courses', 'Courses', icon('courses'), active === 'courses')}
${item('calendar', '/calendar', 'Calendar', icon('calendar'))}
${item('conversations', '/conversations', 'Inbox', icon('inbox'))}
${item('history', '#', 'History', icon('history'))}
${item('help', '#', 'Help', icon('help'))}
</ul></div>
<div class="ic-app-header__secondary-navigation"><ul class="ic-app-header__menu-list"><li class="menu-item ic-app-header__menu-list-item">
<a id="primaryNavToggle" role="button" href="#" class="ic-app-header__menu-list-link ic-app-header__menu-list-link--nav-toggle" aria-label="Minimize global navigation">
<div class="menu-item-icon-container" aria-hidden="true">${icon('navtoggle')}</div></a></li></ul></div></header>`;
}

const activeCourses = () => COURSES.filter((c) => c.state === 'active');

const TODO = [
  { title: 'Essay draft 2', course: 104, points: 10, due: 'Due 4 Nov at 23:59' },
  { title: 'Problem set 6', course: 103, points: 20, due: 'Due 5 Nov at 17:00' },
  { title: 'Reading response: Week 9', course: 101, points: 5, due: 'Due 6 Nov at 12:00' },
  { title: 'Lab 4: Hash tables', course: 102, points: 15, due: 'Due 7 Nov at 23:59' },
];

export function dashboardPage(): string {
  const cards = activeCourses()
    .map(
      (c) => `<div class="ic-DashboardCard" aria-label="${esc(c.name)}"><div class="ic-DashboardCard__header">
<span class="screenreader-only">${esc(c.name)}</span>
<div class="ic-DashboardCard__header_hero" style="background-color:${c.color}"></div>
<a href="/courses/${c.id}" class="ic-DashboardCard__link"><div class="ic-DashboardCard__header_content">
<h2 class="ic-DashboardCard__header-title ellipsis" title="${esc(c.name)}"><span style="color:${c.color}">${esc(c.name)}</span></h2>
<div class="ic-DashboardCard__header-subtitle ellipsis" title="${esc(c.course_code)}">${esc(c.course_code)}</div>
<div class="ic-DashboardCard__header-term ellipsis" title="${esc(c.term.name)}">${esc(c.term.name)}</div></div></a></div>
<nav class="ic-DashboardCard__action-container" aria-label="${esc(c.name)}">
<a href="/courses/${c.id}/announcements" class="ic-DashboardCard__action"><span class="screenreader-only">Announcements</span><i class="icon-announcement"></i></a>
<a href="/courses/${c.id}/assignments" class="ic-DashboardCard__action"><span class="screenreader-only">Assignments</span><i class="icon-assignment"></i></a>
<a href="/courses/${c.id}/discussion_topics" class="ic-DashboardCard__action"><span class="screenreader-only">Discussions</span><i class="icon-discussion"></i></a>
<a href="/courses/${c.id}/files" class="ic-DashboardCard__action"><span class="screenreader-only">Files</span><i class="icon-folder"></i></a>
</nav></div>`,
    )
    .join('');
  const todo = TODO.map((t) => {
    const c = findCourse(t.course)!;
    return `<li class="ToDoSidebarItem" style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #E8EAEC">
<i class="icon-assignment" style="color:${c.color};margin-top:3px"></i><div style="min-width:0">
<a href="/courses/${c.id}/assignments" style="font-weight:700;display:block">${esc(t.title)}</a>
<div style="color:#6A7883;font-size:.875rem">${esc(c.course_code)}</div>
<div style="color:#6A7883;font-size:.875rem">${t.points} points <span aria-hidden="true">&nbsp;|&nbsp;</span> ${esc(t.due)}</div></div></li>`;
  }).join('');
  return `${head('Dashboard', [
    'brandable_css/new_styles_normal_contrast/bundles/dashboard-7acb7a7087.css',
    'brandable_css/new_styles_normal_contrast/bundles/dashboard_card-7ef7335416.css',
  ])}
<body class="with-right-side primary-nav-expanded full-width dashboard-is-planner context-user_1">
<div id="application" class="ic-app">${globalNav('dashboard')}
<div id="wrapper" class="ic-Layout-wrapper"><div id="main" class="ic-Layout-columns">
<div id="not_right_side" class="ic-app-main-content"><div id="content-wrapper" class="ic-Layout-contentWrapper">
<div id="content" class="ic-Layout-contentMain" role="main"><div id="dashboard" class="ic-dashboard-app">
<div id="dashboard_header_container"><div class="ic-Dashboard-header"><div class="large ic-Dashboard-header__layout">
<h1 class="ic-Dashboard-header__title"><span class="hidden-phone">Dashboard</span></h1>
<div class="ic-Dashboard-header__actions"><button type="button" class="Button Button--icon-action" aria-label="Dashboard Options"><i class="icon-more"></i></button></div>
</div></div></div>
<div id="DashboardCard_Container"><div class="ic-DashboardCard__box">
<h2 class="ic-DashboardCard__box__header">Published Courses (${activeCourses().length})</h2>
<div class="ic-DashboardCard__box__container">${cards}</div></div></div>
</div></div></div></div>
<div id="right-side-wrapper" class="ic-app-main-content__secondary"><aside id="right-side" role="complementary">
<div class="Sidebar__TodoListContainer"><h2 class="todo-list-header" style="border-bottom:1px solid #C7CDD1;padding-bottom:8px">To Do</h2>
<ul class="to-do-list" style="list-style:none;margin:0;padding:0">${todo}</ul></div></aside></div>
</div></div></div></body></html>`;
}

const SECTIONS = ['Home', 'Announcements', 'Modules', 'Assignments', 'Discussions', 'Grades', 'People', 'Files', 'Syllabus'];

export function coursePage(c: Course): string {
  const menu = SECTIONS.map(
    (s, i) =>
      `<li class="section"><a href="/courses/${c.id}${i ? `/${s.toLowerCase()}` : ''}" class="${s.toLowerCase()}${i ? '' : ' active'}"${i ? '' : ' aria-current="page"'}>${s}</a></li>`,
  ).join('');
  const weeks = [
    ['Week 9', 'Using evidence'],
    ['Week 10', 'Style and clarity'],
    ['Week 11', 'Revising your draft'],
  ]
    .map(([w, t]) => `<li><strong>${esc(w!)}</strong>: ${esc(t!)}</li>`)
    .join('');
  return `${head(c.name, [
    'brandable_css/new_styles_normal_contrast/bundles/dashboard-7acb7a7087.css',
    'brandable_css/new_styles_normal_contrast/bundles/wiki_page-5a55818398.css',
    'brandable_css/new_styles_normal_contrast/bundles/course_show-10d5a5b1a2.css',
  ])}
<body class="with-left-side course-menu-expanded padless-content pages home primary-nav-expanded full-width context-course_${c.id}">
<div id="application" class="ic-app">${globalNav('courses')}
<div id="wrapper" class="ic-Layout-wrapper">
<div class="ic-app-nav-toggle-and-crumbs no-print">
<button type="button" id="courseMenuToggle" class="Button Button--link ic-app-course-nav-toggle" aria-label="Hide Courses Navigation Menu"><i class="icon-hamburger" aria-hidden="true"></i></button>
<div class="ic-app-crumbs"><nav id="breadcrumbs" role="navigation" aria-label="breadcrumbs"><ol>
<li id="crumb_course_${c.id}" aria-current="page"><a href="/courses/${c.id}"><span class="ellipsible">${esc(c.name)}</span></a></li></ol></nav></div>
<div class="right-of-crumbs right-of-crumbs-no-reverse"></div></div>
<div id="main" class="ic-Layout-columns">
<div id="left-side" class="ic-app-course-menu ic-sticky-on list-view" style="display:block"><div id="sticky-container" class="ic-sticky-frame">
<nav role="navigation" aria-label="Courses Navigation Menu"><ul id="section-tabs">${menu}</ul></nav></div></div>
<div id="not_right_side" class="ic-app-main-content"><div id="content-wrapper" class="ic-Layout-contentWrapper">
<div id="content" class="ic-Layout-contentMain" role="main"><div id="course_home_content"><div id="wiki_page_show">
<div class="show-content user_content clearfix enhanced"><h1 class="page-title">${esc(c.name)}</h1>
<p>Welcome! Lectures are on Tuesdays and seminars on Thursdays. The slides for each lecture are under Files the evening before.</p>
<h3>Coming up</h3><ul>${weeks}</ul>
</div></div></div></div></div></div></div></div></div></body></html>`;
}

/** The realistic page for a Canvas URL the mock answers with its plain one, else null. */
export function realisticPage(url: string): string | null {
  const { pathname } = new URL(url);
  if (pathname === '/' || pathname === '/courses') return dashboardPage();
  const id = /^\/courses\/(\d+)$/.exec(pathname)?.[1];
  const course = id ? findCourse(id) : undefined;
  return course ? coursePage(course) : null;
}
