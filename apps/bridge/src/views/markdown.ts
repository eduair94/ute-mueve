import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { renderLayout } from './layout.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../../..');

function readMd(relative: string): string {
  try {
    return readFileSync(resolve(REPO_ROOT, relative), 'utf8');
  } catch {
    return `# ${relative}\n\n_(Archivo no incluido en este deployment. Buscá la versión en el repositorio.)_`;
  }
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
  return renderMarkdownPage({ title: 'Reporte de Seguridad', active: 'security', source: 'SECURITY.md' });
}

export function renderVr001(): string {
  return renderMarkdownPage({
    title: 'VR-001 — IDOR de Customer Card',
    active: 'vr',
    source: 'docs/security/2026-05-20-VR-001-idor-customer-card.md',
  });
}
