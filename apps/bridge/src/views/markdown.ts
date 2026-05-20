import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import type { Lang } from './i18n.js';
import { renderLayout } from './layout.js';

const HERE = dirname(fileURLToPath(import.meta.url));

const SEARCH_ROOTS = [
  resolve(HERE, '../../../..'), // dev: monorepo root
  HERE, // bundled: same dir as api/index.js
  resolve(HERE, '..'),
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
  return '';
}

/** Pick the `.es.md` variant when lang=es, fall back to original. */
function pickMarkdown(basePath: string, lang: Lang): string {
  if (lang === 'es') {
    const es = basePath.replace(/\.md$/, '.es.md');
    const content = readMd(es);
    if (content) return content;
  }
  const fallback = readMd(basePath);
  if (fallback) return fallback;
  return `# ${basePath}\n\n_(File not bundled in this deployment.)_`;
}

marked.setOptions({ gfm: true, breaks: false });

export interface MarkdownPageOpts {
  title: string;
  active: 'security' | 'vr';
  source: string;
  lang: Lang;
}

export function renderMarkdownPage(opts: MarkdownPageOpts): string {
  const md = pickMarkdown(opts.source, opts.lang);
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
    description: `${opts.title}.`,
    active: opts.active,
    lang: opts.lang,
    body,
  });
}

export function renderSecurityIndex(lang: Lang): string {
  return renderMarkdownPage({
    title: lang === 'es' ? 'Reporte de Seguridad' : 'Security Report',
    active: 'security',
    source: 'SECURITY.md',
    lang,
  });
}

export function renderVr001(lang: Lang): string {
  return renderMarkdownPage({
    title: lang === 'es' ? 'VR-001 — IDOR de Customer Card' : 'VR-001 — Customer Card IDOR',
    active: 'vr',
    source: 'docs/security/2026-05-20-VR-001-idor-customer-card.md',
    lang,
  });
}
