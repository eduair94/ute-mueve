# ute-mueve

TypeScript bridge API + npm SDK in front of UTE's electric-mobility backend (`movilidadelectrica.ute.com.uy/api/v2`).

- `apps/bridge` — Vercel-deployable Hono API. Handles anonymous JWT lifecycle.
- `packages/sdk` — `@ute-mueve/sdk`. Isomorphic, zero-deps client.
- `packages/types` — Zod schemas + quicktype-generated interfaces.
- `packages/openapi` — OpenAPI 3.1 YAML + sanitized JSON fixtures.

See:
- [docs/superpowers/specs/2026-05-20-ute-mueve-bridge-design.md](docs/superpowers/specs/2026-05-20-ute-mueve-bridge-design.md) — design rationale.
- [SECURITY.md](SECURITY.md) — static analysis report of the UTE Mueve APK.

## Status

Unofficial. Not affiliated with UTE. See SECURITY.md for the responsible-disclosure stance.

## Quickstart

```bash
pnpm install
pnpm dev          # bridge on :3000, docs at /docs
pnpm test
pnpm build
```

## License

MIT
