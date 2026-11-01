import { existsSync } from 'node:fs';
import { V3_BUILD } from './fixtures.ts';

export default function globalSetup(): void {
  if (!existsSync(V3_BUILD)) {
    throw new Error(
      `No v3 build at ${V3_BUILD}. Run \`pnpm build\` first (\`pnpm e2e\` does this).`,
    );
  }
}
