import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { renderLayout } from './layout.js';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * Markdown source files may live in one of two places:
 * - Dev / `tsx`: at the repo root (resolved via `../../../..` from this file).
 * - Vercel bundled function: alongside the bundle (copied by `scripts/bundle-vercel-fn.mjs`).
 */
const SEARCH_ROOTS = [
  resolve(HERE, '../../../..'), // dev: monorepo root
  HERE, // bundled: same dir as api/index.js (which is api/)
  resolve(HERE, '..'), // bundled fallback: parent of api/
];

function readMd(relative: string): string {
  for (const root of SEARCH_ROOTS) {
    const candidate = resolve(root, relative);
    if (existsSync(candidate)) {
      try {
        return readFileSync(candidate, 'utf8');
      } catch {
        // continue
      }
    }
  }
  return `# ${relative}\n\n_(Archivo no incluido en este deployment. Buscá la versión en el repositorio.)_`;
}

marked.setOptions({ gfm: true, breaks: false });

export interface MarkdownPageOpts {
  title: string;
  active: 'security' | 'vr';
  source: string;
}

export function renderMarkdownPage(opts: MarkdownPageOpts): string {
  const md = readMd(opts.source);
  const html = marked.parse(md) as string;
  const body = `
    <section style="padding-top: 32px;">
      <div class="prose">
        ${html}
      </div>
    </section>
  `;
  return renderLayout({
    title: `${opts.title} — UTE Mueve Bridge`,
    description: `${opts.title}. Análisis del puente UTE Mueve.`,
    active: opts.active,
    body,
  });
}

export function renderSecurityIndex(): string {
  return renderMarkdownPage({
    title: 'Reporte de Seguridad',
    active: 'security',
    source: 'SECURITY.md',
  });
}

export function renderVr001(): string {
  return renderMarkdownPage({
    title: 'VR-001 — IDOR de Customer Card',
    active: 'vr',
    source: 'docs/security/2026-05-20-VR-001-idor-customer-card.md',
  });
}
