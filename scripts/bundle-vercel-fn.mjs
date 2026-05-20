// Bundles the Vercel function entrypoint into a single self-contained ESM file.
// Run by Vercel during buildCommand. Resulting api/index.js is what Vercel deploys.

import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

await esbuild.build({
  entryPoints: [resolve(ROOT, 'apps/bridge/api/index.ts')],
  outfile: resolve(ROOT, 'api/index.js'),
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  external: ['node:*', 'fsevents'],
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
  logLevel: 'info',
});

// Copy markdown + fixtures alongside the bundled function so import.meta.url-based
// loaders inside the bundle (markdown.ts, examples.ts) still find them at runtime.
const apiDir = resolve(ROOT, 'api');
mkdirSync(apiDir, { recursive: true });
mkdirSync(resolve(apiDir, 'docs/security'), { recursive: true });
mkdirSync(resolve(apiDir, 'packages/openapi/fixtures'), { recursive: true });

for (const f of ['SECURITY.md', 'SECURITY.es.md']) {
  const src = resolve(ROOT, f);
  if (existsSync(src)) copyFileSync(src, resolve(apiDir, f));
}
for (const f of [
  'docs/security/2026-05-20-VR-001-idor-customer-card.md',
  'docs/security/2026-05-20-VR-001-idor-customer-card.es.md',
]) {
  const src = resolve(ROOT, f);
  if (existsSync(src)) copyFileSync(src, resolve(apiDir, f));
}
const fxDir = resolve(ROOT, 'packages/openapi/fixtures');
if (existsSync(fxDir)) {
  for (const f of readdirSync(fxDir)) {
    if (f.endsWith('.json')) {
      copyFileSync(resolve(fxDir, f), resolve(apiDir, 'packages/openapi/fixtures', f));
    }
  }
}

console.log('bundled api/index.js + copied includeFiles');
