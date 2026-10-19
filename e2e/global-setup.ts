import { cpSync, existsSync, rmSync } from 'node:fs';
import { V2_BUILD, V3_BUILD } from './fixtures.ts';

export default function globalSetup(): void {
  if (!existsSync(V3_BUILD)) {
    throw new Error(
      `No v3 build at ${V3_BUILD}. Run \`pnpm build\` first (\`pnpm e2e\` does this).`,
    );
  }
  // Chrome writes _metadata/ into unpacked extensions, so v2 runs from a copy, never legacy/v2 itself.
  rmSync(V2_BUILD, { recursive: true, force: true });
  cpSync('legacy/v2', V2_BUILD, {
    recursive: true,
    filter: (src) => !src.includes('/tests'),
  });
}
