import { t, type Lang } from './i18n.js';

export interface LayoutOpts {
  title: string;
  description?: string;
  active?: 'home' | 'map' | 'docs' | 'security' | 'vr' | 'openapi' | 'health';
  lang: Lang;
  /** Already-escaped HTML for the page body. */
  body: string;
}

const STYLES = /* css */ `
  :root {
    color-scheme: light dark;
    --bg: #0b0b10;
    --bg-elev: #16161f;
    --bg-elev-2: #1d1d28;
    --fg: #f4f4f5;
    --fg-muted: #a0a0b0;
    --border: #2a2a36;
    --accent: #a78bfa;
    --accent-strong: #8b5cf6;
    --danger: #f87171;
    --danger-bg: rgba(248, 113, 113, 0.1);
    --success: #34d399;
    --code-bg: #0d0d14;
    --shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  }
  @media (prefers-color-scheme: light) {
    :root {
      --bg: #f8fafc;
      --bg-elev: #ffffff;
      --bg-elev-2: #f1f5f9;
      --fg: #0f172a;
      --fg-muted: #475569;
      --border: #e2e8f0;
      --accent: #7c3aed;
      --accent-strong: #6d28d9;
      --code-bg: #f1f5f9;
      --shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
    }
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background: var(--bg);
    color: var(--fg);
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }
  .container { max-width: 1100px; margin: 0 auto; padding: 24px; }
  header.site {
    border-bottom: 1px solid var(--border);
    background: linear-gradient(180deg, var(--bg-elev) 0%, var(--bg) 100%);
    position: sticky; top: 0; z-index: 10;
    backdrop-filter: blur(8px);
  }
  header.site .row {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    flex-wrap: wrap;
  }
  .brand { display: flex; align-items: center; gap: 12px; text-decoration: none; color: var(--fg); }
  .brand-logo {
    width: 36px; height: 36px; border-radius: 8px;
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%);
    display: grid; place-items: center; font-weight: 700; color: #fff;
  }
  .brand h1 { font-size: 18px; margin: 0; line-height: 1; }
  .brand .sub { font-size: 12px; color: var(--fg-muted); }
  nav.main { display: flex; gap: 4px; flex-wrap: wrap; align-items: center; }
  nav.main a {
    padding: 8px 12px; border-radius: 8px; text-decoration: none; color: var(--fg-muted);
    font-size: 14px; font-weight: 500;
  }
  nav.main a:hover { background: var(--bg-elev-2); color: var(--fg); }
  nav.main a.active { color: var(--accent); background: var(--bg-elev-2); }
  .lang-switch {
    margin-left: 8px; padding: 4px;
    background: var(--bg-elev-2); border-radius: 8px;
    display: inline-flex; gap: 2px;
  }
  .lang-switch a {
    padding: 4px 10px !important; font-size: 12px !important;
    border-radius: 6px; font-weight: 600 !important;
    color: var(--fg-muted) !important;
  }
  .lang-switch a.active { color: #fff !important; background: var(--accent) !important; }

  .hero { padding: 48px 0 32px; }
  .hero h2 { font-size: clamp(28px, 5vw, 44px); margin: 0 0 12px; letter-spacing: -0.02em; }
  .hero p { color: var(--fg-muted); font-size: 17px; max-width: 720px; }
  .hero .pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--bg-elev-2); color: var(--fg-muted);
    padding: 4px 10px; border-radius: 999px; font-size: 12px;
    border: 1px solid var(--border); margin-bottom: 16px;
  }
  .hero .pill.danger { background: var(--danger-bg); color: var(--danger); border-color: rgba(248,113,113,0.3); }
  .hero .pill .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

  .grid { display: grid; gap: 16px; }
  .grid.cols-2 { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
  .grid.cols-3 { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }

  .card {
    background: var(--bg-elev); border: 1px solid var(--border);
    border-radius: 14px; padding: 20px;
    transition: transform 120ms ease, border-color 120ms ease;
  }
  .card.link { text-decoration: none; color: inherit; display: block; }
  .card.link:hover { transform: translateY(-2px); border-color: var(--accent); }
  .card h3 { margin: 0 0 6px; font-size: 16px; }
  .card .desc { color: var(--fg-muted); font-size: 14px; margin: 0; }
  .card .icon { width: 32px; height: 32px; border-radius: 8px; background: var(--bg-elev-2); display: grid; place-items: center; margin-bottom: 12px; font-size: 16px; }
  .card .icon.danger { background: var(--danger-bg); color: var(--danger); }
  .card .meta { display: flex; gap: 8px; margin-top: 12px; font-size: 12px; color: var(--fg-muted); flex-wrap: wrap; }
  .card .meta span { background: var(--bg-elev-2); padding: 2px 8px; border-radius: 6px; }

  section { margin: 48px 0; }
  section h2 { font-size: 22px; margin: 0 0 16px; letter-spacing: -0.01em; }
  section h2 .count { color: var(--fg-muted); font-size: 14px; font-weight: 400; margin-left: 8px; }

  .endpoint-table { width: 100%; border-collapse: separate; border-spacing: 0; background: var(--bg-elev); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; font-size: 14px; }
  .endpoint-table th, .endpoint-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border); }
  .endpoint-table tr:last-child td { border-bottom: none; }
  .endpoint-table th { background: var(--bg-elev-2); font-weight: 600; font-size: 12px; text-transform: uppercase; color: var(--fg-muted); letter-spacing: 0.05em; }
  .method { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 6px; display: inline-block; }
  .method.get { background: rgba(52, 211, 153, 0.15); color: #10b981; }
  .method.post { background: rgba(167, 139, 250, 0.15); color: var(--accent); }
  .endpoint-path { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: 13px; }
  .tag { font-size: 11px; padding: 2px 8px; border-radius: 5px; background: var(--bg-elev-2); color: var(--fg-muted); }
  .tag.write { background: rgba(248, 113, 113, 0.1); color: var(--danger); }

  pre {
    background: var(--code-bg); border: 1px solid var(--border); border-radius: 10px;
    padding: 16px; overflow-x: auto; font-size: 13px; line-height: 1.5;
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  }
  code { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
  p code, li code { background: var(--bg-elev-2); padding: 1px 6px; border-radius: 4px; font-size: 0.9em; }

  .alert {
    background: var(--danger-bg); border: 1px solid rgba(248, 113, 113, 0.3);
    border-radius: 12px; padding: 16px 20px;
  }
  .alert h3 { color: var(--danger); margin: 0 0 6px; font-size: 15px; }
  .alert p { margin: 0; color: var(--fg); }
  .alert a { color: var(--danger); }

  footer.site {
    border-top: 1px solid var(--border); margin-top: 64px;
    padding: 24px 0; color: var(--fg-muted); font-size: 13px;
  }
  footer.site a { color: var(--fg-muted); }

  .prose { max-width: 820px; }
  .prose h1, .prose h2, .prose h3 { letter-spacing: -0.01em; }
  .prose h1 { font-size: 28px; margin: 24px 0 12px; }
  .prose h2 { font-size: 22px; margin: 32px 0 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
  .prose h3 { font-size: 17px; margin: 24px 0 8px; }
  .prose p, .prose ul, .prose ol { color: var(--fg); }
  .prose a { color: var(--accent); }
  .prose blockquote {
    border-left: 3px solid var(--accent); padding: 8px 16px;
    color: var(--fg-muted); background: var(--bg-elev); border-radius: 0 8px 8px 0;
    margin: 16px 0;
  }
  .prose table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 14px; }
  .prose table th, .prose table td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; }
  .prose table th { background: var(--bg-elev-2); }
  .prose pre { margin: 16px 0; }
  .prose hr { border: none; border-top: 1px solid var(--border); margin: 32px 0; }

  a { color: var(--accent); }
  a:hover { color: var(--accent-strong); }

  @media (max-width: 600px) {
    .container { padding: 16px; }
    .hero { padding: 24px 0 16px; }
    nav.main a { padding: 6px 8px; font-size: 13px; }
  }
`;

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** Append/replace `lang=` on a URL. Preserves other query params. */
function withLang(href: string, lang: Lang): string {
  const [path, qs = ''] = href.split('?');
  const params = new URLSearchParams(qs);
  if (lang === 'es') params.delete('lang');
  else params.set('lang', lang);
  const str = params.toString();
  return str ? `${path}?${str}` : (path as string);
}

export function renderLayout(opts: LayoutOpts): string {
  const lang = opts.lang;
  const s = t(lang);
  const navItems: Array<{ id: NonNullable<LayoutOpts['active']>; href: string; label: string }> = [
    { id: 'home', href: '/', label: s.nav.home },
    { id: 'map', href: '/map', label: s.nav.map },
    { id: 'docs', href: '/docs', label: s.nav.api },
    { id: 'openapi', href: '/openapi.json', label: s.nav.openapi },
    { id: 'security', href: '/security', label: s.nav.security },
    { id: 'vr', href: '/security/vr-001', label: s.nav.vr },
    { id: 'health', href: '/status', label: s.nav.status },
  ];
  const nav = navItems
    .map(
      (n) =>
        `<a href="${escapeAttr(withLang(n.href, lang))}"${opts.active === n.id ? ' class="active"' : ''}>${n.label}</a>`,
    )
    .join('');
  // Lang switch — links to the same current path with lang flipped. We don't
  // know the precise current path here, so we link to '/' (the dashboard) for
  // the switch — works as a global toggle.
  const currentPath = navItems.find((n) => n.id === opts.active)?.href ?? '/';
  const langSwitch = `
    <div class="lang-switch">
      <a href="${escapeAttr(withLang(currentPath, 'es'))}"${lang === 'es' ? ' class="active"' : ''}>ES</a>
      <a href="${escapeAttr(withLang(currentPath, 'en'))}"${lang === 'en' ? ' class="active"' : ''}>EN</a>
    </div>`;
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeAttr(opts.title)}</title>
  ${opts.description ? `<meta name="description" content="${escapeAttr(opts.description)}" />` : ''}
  <meta name="theme-color" content="#7c3aed" />
  <link rel="alternate" hreflang="es" href="${escapeAttr(withLang(currentPath, 'es'))}" />
  <link rel="alternate" hreflang="en" href="${escapeAttr(withLang(currentPath, 'en'))}" />
  <style>${STYLES}</style>
</head>
<body>
  <header class="site">
    <div class="container">
      <div class="row">
        <a class="brand" href="${escapeAttr(withLang('/', lang))}">
          <div class="brand-logo">U</div>
          <div>
            <h1>${s.brand.name}</h1>
            <div class="sub">${s.brand.sub}</div>
          </div>
        </a>
        <nav class="main">${nav}${langSwitch}</nav>
      </div>
    </div>
  </header>
  <main class="container">
    ${opts.body}
  </main>
  <footer class="site">
    <div class="container">
      <p>
        ${s.footer.notAffiliated}
        ${s.footer.license} —
        <a href="https://github.com/eduair94/ute-mueve" target="_blank" rel="noopener">GitHub</a> ·
        <a href="https://www.npmjs.com/package/@ute-mueve/sdk" target="_blank" rel="noopener">@ute-mueve/sdk</a> ·
        <a href="https://www.npmjs.com/package/@ute-mueve/types" target="_blank" rel="noopener">@ute-mueve/types</a>.
        ${s.footer.rePrefix} <a href="${escapeAttr(withLang('/security', lang))}">${s.nav.security}</a>.
      </p>
    </div>
  </footer>
</body>
</html>`;
}
