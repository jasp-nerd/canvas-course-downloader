import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(import.meta.dirname, '..', '.certs');

/**
 * A throwaway self-signed certificate for the mock server, generated on first
 * use and never committed. Chrome is started with --ignore-certificate-errors,
 * so it only has to exist.
 */
export function ensureCerts(): { key: Buffer; cert: Buffer } {
  const key = join(DIR, 'key.pem');
  const cert = join(DIR, 'cert.pem');
  if (!existsSync(key) || !existsSync(cert)) {
    mkdirSync(DIR, { recursive: true });
    execFileSync(
      'openssl',
      [
        'req',
        '-x509',
        '-newkey',
        'rsa:2048',
        '-nodes',
        '-days',
        '3650',
        '-keyout',
        key,
        '-out',
        cert,
        '-subj',
        '/CN=mock-canvas',
      ],
      { stdio: 'ignore' },
    );
  }
  return { key: readFileSync(key), cert: readFileSync(cert) };
}
