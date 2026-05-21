import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { createApp } from '../src/app.js';
import { getContainer, resetContainer } from '../src/container.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');

resetContainer();
const env = { ...process.env, UTE_UNIQUE_KEY: process.env.UTE_UNIQUE_KEY ?? 'placeholder' };
const container = getContainer(env);
const app = createApp(container);

const doc = app.getOpenAPI31Document({
  openapi: '3.1.0',
  info: {
    title: 'UTE Mueve Bridge',
    version: '0.1.0',
    description:
      'Unofficial bridge to movilidadelectrica.ute.com.uy/api/v2. See SECURITY.md and docs/security/2026-05-20-VR-001-idor-customer-card.md.',
    contact: { email: 'admin@checkleaked.cc' },
    license: { name: 'MIT' },
  },
  servers: [{ url: '/' }],
});

const outYaml = resolve(REPO_ROOT, 'packages/openapi/openapi.yaml');
const outJson = resolve(REPO_ROOT, 'packages/openapi/openapi.json');
await mkdir(dirname(outYaml), { recursive: true });
await writeFile(outYaml, stringify(doc), 'utf8');
await writeFile(outJson, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
console.log(`wrote ${outYaml}`);
console.log(`wrote ${outJson}`);
