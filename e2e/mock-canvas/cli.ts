// Standalone mock Canvas for manual and agent checks: `pnpm mock:canvas`.
// Point a browser at it with --host-resolver-rules="MAP school.instructure.com 127.0.0.1:8443".
import { startMockCanvas } from './server.ts';

const mock = await startMockCanvas(Number(process.env.PORT ?? 8443));
mock.state.apiDelayMs = Number(process.env.API_DELAY ?? 0);
mock.state.fileDelayMs = Number(process.env.FILE_DELAY ?? 0);
console.log(
  `Mock Canvas on https://127.0.0.1:${mock.port} (control: POST /__control, log: GET /__log)`,
);
