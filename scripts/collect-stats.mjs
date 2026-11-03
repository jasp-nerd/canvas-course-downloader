// Collects every number about the extension into one place, for the private dashboard at
// coursedownloader.com/stats. Runs hourly on the server (see website/scripts/stats-server.sh).
//
// Usage: node scripts/collect-stats.mjs <out-dir>
// Writes <out-dir>/stats.json (everything now) and adds today to <out-dir>/history.json.
//
// Each source is optional and says why when it's missing, so one store being down never
// loses the others:
// - Chrome: the Chrome Web Store API v2 when CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL,
//   CHROME_SERVICE_ACCOUNT_PRIVATE_KEY and CHROME_PUBLISHER_ID are set (users, installs,
//   uninstalls, store impressions and page views per day, users per country, ratings);
//   otherwise the public listing's rounded user count.
// - Firefox: AMO's public API (daily users, weekly downloads, ratings).
// - Edge: the store's public product JSON, once EDGE_CRX_ID (the id in the Edge store URL) is set.
// - GitHub: stars, forks, open issues and release downloads, from the public API.
// - Website: Umami through a share link (no password), when UMAMI_SHARE_ID is set.
import { createHmac, createSign, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const CHROME_ID = process.env.CHROME_EXTENSION_ID || 'mmnmcnffbkcnhcjiidmdnaclpfeekiol';
const FIREFOX_ID = process.env.FIREFOX_EXTENSION_ID || 'canvas-course-downloader@jasp-nerd';
const REPO = process.env.GITHUB_REPO || 'jasp-nerd/canvas-course-downloader';
const UMAMI_URL = process.env.UMAMI_URL || 'https://stats.coursedownloader.com';
const UA = 'coursedownloader.com stats (https://github.com/jasp-nerd/canvas-course-downloader)';
const DAY = 86_400_000;

const out = process.argv[2];
if (!out) throw new Error('Usage: node scripts/collect-stats.mjs <out-dir>');

const isoDay = (d) => d.toISOString().slice(0, 10);
const int = (s) => (s === undefined || s === null || s === '' ? null : Number(s));

async function json(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { 'user-agent': UA, ...init.headers } });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
  return res.json();
}

/** An access token for the service account, by the JWT bearer flow (no Google library needed). */
async function googleToken(email, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const claims = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/chromewebstore.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 600,
  };
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64(claims)}`;
  const signature = createSign('RSA-SHA256')
    .update(unsigned)
    .sign(privateKey.replace(/\\n/g, '\n'), 'base64url');
  const res = await json('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });
  return res.access_token;
}

async function chromeFromApi(email, key, publisher) {
  const token = await googleToken(email, key);
  const auth = { authorization: `Bearer ${token}` };
  const item = `https://chromewebstore.googleapis.com/v2/publishers/${publisher}/items/${CHROME_ID}`;
  /** Rows for `days` days up to `lastDate` (default yesterday). */
  const query = async (metrics, days, dimension, lastDate) => {
    const last = lastDate ? new Date(`${lastDate}T00:00:00Z`) : new Date(Date.now() - DAY);
    const first = new Date(last.getTime() - (days - 1) * DAY);
    const params = new URLSearchParams({ pageSize: '1000' });
    for (const m of metrics) params.append('metrics', m);
    if (dimension) params.append('dimensions', dimension);
    for (const [k, v] of [
      ['firstDate', first],
      ['lastDate', last],
    ]) {
      params.set(`timeSpec.${k}.year`, v.getUTCFullYear());
      params.set(`timeSpec.${k}.month`, v.getUTCMonth() + 1);
      params.set(`timeSpec.${k}.day`, v.getUTCDate());
    }
    const res = await json(`${item}:queryMetrics?${params}`, { headers: auth });
    return (res.metricRows ?? []).map((r) => ({
      date: `${r.date.year}-${String(r.date.month).padStart(2, '0')}-${String(r.date.day).padStart(2, '0')}`,
      ...(r.dimensionValues?.length ? { key: r.dimensionValues[0] } : {}),
      ...Object.fromEntries((r.metricValues ?? []).map((v) => [v.metric, int(v.value)])),
    }));
  };
  // A year of days: Google's own history, so the chart starts full.
  const daily = (
    await query(['users', 'users-7d', 'installs', 'uninstalls', 'impressions', 'page-views'], 365)
  ).sort((a, b) => a.date.localeCompare(b.date));
  // Google's numbers lag a day or two: the newest row that has weekly users is "now".
  const latest = [...daily].reverse().find((r) => r['users-7d'] != null) ?? {};
  const week = daily.slice(-7);
  const sum = (key) => week.reduce((n, r) => n + (r[key] ?? 0), 0);
  // On the same day as "now": Google has no countries yet for the newest day or two.
  const byCountry = latest.date
    ? (await query(['users-7d'], 1, 'country', latest.date).catch(() => []))
        .map((r) => ({ key: r.key, users: r['users-7d'] }))
        .sort((a, b) => b.users - a.users)
        .slice(0, 15)
    : [];
  const rating = await json(`${item}/ratingSummary`, { headers: auth });
  // Which version is live, and which one Google is still reviewing.
  const state = await json(`${item}:fetchStatus`, { headers: auth }).catch(() => null);
  const version = (s) => s?.distributionChannels?.[0]?.crxVersion ?? null;
  const submitted = state?.submittedItemRevisionStatus;
  return {
    source: 'api',
    status: {
      live: version(state?.publishedItemRevisionStatus),
      review: submitted && submitted.state !== 'PUBLISHED' ? version(submitted) : null,
      reviewState: submitted?.state ?? null,
    },
    asOf: latest.date ?? null,
    users: latest['users-7d'] ?? null,
    dailyUsers: latest.users ?? null,
    installs7d: sum('installs'),
    uninstalls7d: sum('uninstalls'),
    impressions7d: sum('impressions'),
    pageViews7d: sum('page-views'),
    rating: rating.rating ?? null,
    ratings: int(rating.ratingCount),
    reviews: int(rating.nonEmptyReviewCount),
    stars: [1, 2, 3, 4, 5].map(
      (n) => int(rating[`${['one', 'two', 'three', 'four', 'five'][n - 1]}StarRatingCount`]) ?? 0,
    ),
    byCountry,
    daily: daily.map((r) => ({
      date: r.date,
      users: r['users-7d'] ?? null,
      installs: r.installs ?? null,
      uninstalls: r.uninstalls ?? null,
      pageViews: r['page-views'] ?? null,
    })),
    url: `https://chromewebstore.google.com/detail/${CHROME_ID}`,
  };
}

async function chromeFromListing() {
  const res = await fetch(`https://chromewebstore.google.com/detail/${CHROME_ID}?hl=en`, {
    headers: { 'user-agent': UA, 'accept-language': 'en' },
  });
  if (!res.ok) throw new Error(`${res.status} from the Chrome Web Store`);
  const html = await res.text();
  const users = /([\d,]+)\+? users/.exec(html)?.[1];
  const ratings = /([\d,]+) ratings?/.exec(html)?.[1];
  return {
    source: 'listing',
    // The listing rounds users (e.g. "3,000"); the API gives the exact weekly number.
    users: users ? Number(users.replace(/,/g, '')) : null,
    ratings: ratings ? Number(ratings.replace(/,/g, '')) : null,
    note: 'Public listing only: set up the Chrome Web Store API for exact numbers and history.',
    url: `https://chromewebstore.google.com/detail/${CHROME_ID}`,
  };
}

async function chrome() {
  const { CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL: email, CHROME_SERVICE_ACCOUNT_PRIVATE_KEY: key } =
    process.env;
  const publisher = process.env.CHROME_PUBLISHER_ID;
  if (email && key && publisher) return chromeFromApi(email, key, publisher);
  return chromeFromListing();
}

/** A JWT for addons.mozilla.org, from the key in FIREFOX_JWT_ISSUER and FIREFOX_JWT_SECRET. */
function amoAuth() {
  const { FIREFOX_JWT_ISSUER: iss, FIREFOX_JWT_SECRET: secret } = process.env;
  if (!iss || !secret) return {};
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ iss, jti: randomUUID(), iat: now, exp: now + 60 })}`;
  const signature = createHmac('sha256', secret).update(unsigned).digest('base64url');
  return { authorization: `JWT ${unsigned}.${signature}` };
}

async function firefox() {
  const base = `https://addons.mozilla.org/api/v5/addons/addon/${encodeURIComponent(FIREFOX_ID)}`;
  try {
    // With the key, AMO also answers before the listing is public, and says what's in review.
    const a = await json(`${base}/`, { headers: amoAuth() });
    const versions = await json(`${base}/versions/?filter=all_with_unlisted&page_size=5`, {
      headers: amoAuth(),
    }).catch(() => null);
    const waiting = (versions?.results ?? []).find(
      (v) => v.channel === 'listed' && v.file?.status === 'unreviewed',
    );
    const live = a.status === 'public' ? (a.current_version?.version ?? null) : null;
    return {
      users: a.average_daily_users ?? null,
      weeklyDownloads: a.weekly_downloads ?? null,
      rating: a.ratings?.average || null,
      ratings: a.ratings?.count ?? null,
      reviews: a.ratings?.text_count ?? null,
      version: a.current_version?.version ?? null,
      status: { live, review: waiting?.version ?? null, reviewState: a.status ?? null },
      url: a.url,
    };
  } catch (error) {
    if (/^(401|404)/.test(error.message)) return { missing: 'Not public on Firefox Add-ons yet.' };
    throw error;
  }
}

async function edge() {
  const id = process.env.EDGE_CRX_ID;
  if (!id) return { missing: 'Not on Edge Add-ons yet.' };
  // Undocumented, but what the Edge store's own pages use. It knows only what's public: Edge's
  // API has no way to ask whether a version is in review.
  let p;
  try {
    p = await json(`https://microsoftedge.microsoft.com/addons/getproductdetailsbycrxid/${id}`);
  } catch (error) {
    if (!/^404/.test(error.message)) throw error;
    return {
      missing: "Not public on Edge Add-ons yet. Edge's API doesn't say whether it's in review.",
      status: { live: null, review: null, reviewState: 'NOT_PUBLIC' },
    };
  }
  return {
    status: { live: p.version ?? null, review: null, reviewState: 'PUBLISHED' },
    users: p.activeInstallCount ?? null,
    rating: p.averageRating || null,
    ratings: p.ratingCount ?? null,
    version: p.version ?? null,
    url: `https://microsoftedge.microsoft.com/addons/detail/canvas-course-downloader-/${id}`,
  };
}

async function github() {
  const repo = await json(`https://api.github.com/repos/${REPO}`);
  const releases = await json(`https://api.github.com/repos/${REPO}/releases?per_page=100`);
  const downloads = releases
    .flatMap((r) => r.assets ?? [])
    .reduce((n, a) => n + a.download_count, 0);
  return {
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    watchers: repo.subscribers_count,
    openIssues: repo.open_issues_count,
    releaseDownloads: downloads,
    latestRelease: releases.find((r) => !r.draft)?.tag_name ?? null,
    url: repo.html_url,
  };
}

async function website() {
  const share = process.env.UMAMI_SHARE_ID;
  if (!share) return { missing: 'Turn on a share link in Umami to see website visits here.' };
  // A share link gives read-only access to one website's numbers, without a password.
  const { websiteId, token } = await json(`${UMAMI_URL}/api/share/${share}`);
  const get = (p, params) =>
    json(`${UMAMI_URL}/api/websites/${websiteId}/${p}?${new URLSearchParams(params)}`, {
      // Umami 3 also wants x-umami-share-context, or it answers 401.
      headers: { 'x-umami-share-token': token, 'x-umami-share-context': '1' },
    });
  const since = (days) => ({ startAt: String(Date.now() - days * DAY), endAt: String(Date.now()) });
  const value = (v) => (typeof v === 'object' && v !== null ? v.value : v) ?? null;
  const top = async (type) => {
    // Umami 3 calls pages "path"; older versions "url".
    const rows = await get('metrics', { ...since(30), type, limit: '10' }).catch(() => null);
    return (rows ?? []).map((r) => ({ key: r.x, count: r.y }));
  };
  const [week, month, pages, referrers, series] = await Promise.all([
    get('stats', since(7)),
    get('stats', since(30)),
    top('path').then((r) => (r.length ? r : top('url'))),
    top('referrer'),
    get('pageviews', { ...since(30), unit: 'day', timezone: 'UTC' }).catch(() => null),
  ]);
  return {
    visitors7d: value(week.visitors),
    pageviews7d: value(week.pageviews),
    visitors30d: value(month.visitors),
    pageviews30d: value(month.pageviews),
    topPages: pages,
    topReferrers: referrers,
    daily: (series?.sessions ?? []).map((r) => ({ date: String(r.x).slice(0, 10), visitors: r.y })),
    url: `${UMAMI_URL}/share/${share}`,
  };
}

const sources = { chrome, firefox, edge, github, website };
const now = { date: isoDay(new Date()), collectedAt: new Date().toISOString() };
for (const [name, collect] of Object.entries(sources)) {
  try {
    now[name] = await collect();
  } catch (error) {
    now[name] = { error: error.message };
  }
}
// "Users" is each store's own measure: Chrome's weekly active users, Firefox's average daily
// users, Edge's active installs. Close enough to add up as "people using it".
now.totalUsers = ['chrome', 'firefox', 'edge']
  .map((s) => now[s]?.users)
  .filter((n) => typeof n === 'number')
  .reduce((a, b) => a + b, 0);

/** Writes through a temporary file, so the page never reads a half-written one. */
function save(name, data) {
  const file = path.join(out, name);
  writeFileSync(`${file}.tmp`, JSON.stringify(data, null, 2) + '\n');
  renameSync(`${file}.tmp`, file);
}

mkdirSync(out, { recursive: true });
save('stats.json', now);
let history = [];
try {
  history = JSON.parse(readFileSync(path.join(out, 'history.json'), 'utf8'));
} catch {
  // The first run starts the history.
}
const row = {
  date: now.date,
  total: now.totalUsers,
  chrome: now.chrome?.users ?? null,
  firefox: now.firefox?.users ?? null,
  edge: now.edge?.users ?? null,
  stars: now.github?.stars ?? null,
  visitors7d: now.website?.visitors7d ?? null,
};
history = [...history.filter((r) => r.date !== row.date), row].sort((a, b) =>
  a.date.localeCompare(b.date),
);
save('history.json', history);
console.log(`${now.collectedAt}: ${now.totalUsers} users`);
