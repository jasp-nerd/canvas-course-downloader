// Fails when a build could disable the extension for existing users.
//
// Chrome disables an extension on update when the update adds a permission that
// shows an install warning, until each user re-approves it. So:
//  1. Required host access (host_permissions and content-script matches) never
//     grows beyond what v2.11.0 shipped.
//  2. A required API permission that v2 didn't have must be on NO_WARNING.
//  3. Everything permission-related must equal manifest.snapshot.json, so even
//     an allowed change is a deliberate, reviewed edit of that file.
//
// Usage: node scripts/check-manifest.mjs [--update]   (after `pnpm build:all`)
import { readFileSync, writeFileSync } from 'node:fs';

const TARGETS = ['chrome-mv3', 'edge-mv3', 'firefox-mv3'];
const SNAPSHOT = 'manifest.snapshot.json';

// Permissions Chrome grants without an install warning, checked against
// https://developer.chrome.com/docs/extensions/reference/permissions-list
// Add an entry only after checking that page.
const NO_WARNING = new Set(['alarms', 'offscreen', 'unlimitedStorage']);

const v2 = JSON.parse(readFileSync('legacy/v2/manifest.json', 'utf8'));
const sorted = (list = []) => [...new Set(list)].sort();

function summarize(manifest) {
  return {
    manifest_version: manifest.manifest_version,
    permissions: sorted(manifest.permissions),
    host_permissions: sorted(manifest.host_permissions),
    optional_permissions: sorted(manifest.optional_permissions),
    optional_host_permissions: sorted(manifest.optional_host_permissions),
    content_script_matches: sorted((manifest.content_scripts ?? []).flatMap((c) => c.matches)),
    gecko_id: manifest.browser_specific_settings?.gecko?.id ?? null,
  };
}

const baseline = summarize(v2);
const actual = Object.fromEntries(
  TARGETS.map((t) => [
    t,
    summarize(JSON.parse(readFileSync(`.output/${t}/manifest.json`, 'utf8'))),
  ]),
);

const errors = [];
for (const [target, m] of Object.entries(actual)) {
  if (m.manifest_version !== 3)
    errors.push(`${target}: manifest_version is ${m.manifest_version}, not 3`);
  for (const host of [...m.host_permissions, ...m.content_script_matches]) {
    if (
      !baseline.host_permissions.includes(host) &&
      !baseline.content_script_matches.includes(host)
    ) {
      errors.push(
        `${target}: required host access "${host}" is new; make it optional_host_permissions`,
      );
    }
  }
  for (const perm of m.permissions) {
    if (!baseline.permissions.includes(perm) && !NO_WARNING.has(perm)) {
      errors.push(`${target}: required permission "${perm}" is new and not on NO_WARNING`);
    }
  }
}

if (process.argv.includes('--update')) {
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  writeFileSync(SNAPSHOT, JSON.stringify(actual, null, 2) + '\n');
  console.log(`Wrote ${SNAPSHOT}`);
  process.exit(0);
}

const snapshot = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
for (const target of TARGETS) {
  const expected = JSON.stringify(snapshot[target], null, 2);
  const got = JSON.stringify(actual[target], null, 2);
  if (expected !== got)
    errors.push(`${target}: differs from ${SNAPSHOT}\nexpected ${expected}\nactual   ${got}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Manifest permissions OK for ${TARGETS.join(', ')}`);
