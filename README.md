# ute-mueve

Unofficial TypeScript bridge API + npm SDK in front of UTE's electric-mobility backend (`https://movilidadelectrica.ute.com.uy/api/v2`). Reverse-engineered from the public Android APK.

## Packages

| Workspace | What it is | Publishable |
|---|---|---|
| `apps/bridge` | Hono v4 Vercel function. Handles the anonymous UTE JWT lifecycle (acquire, single-flight, cache, refresh on expiry/401). Mounts Scalar docs at `/docs` and emits OpenAPI 3.1 at `/openapi.json`. | no |
| `packages/sdk` (`@ute-mueve/sdk`) | Isomorphic TypeScript client. Zero runtime deps. ESM + CJS. | yes |
| `packages/types` (`@ute-mueve/types`) | Zod schemas (source of truth) + quicktype-generated companion interfaces from real captured responses. | yes |
| `packages/openapi` (`@ute-mueve/openapi`) | Generated OpenAPI 3.1 YAML + sanitized JSON fixtures. | yes |
| `tools/quicktype` | Re-generates `packages/types/src/generated/` from fixtures. | no |

## Quickstart

```bash
pnpm install
cp .env.example .env       # set UTE_UNIQUE_KEY (random 12-13 hex chars)
pnpm dev                   # bridge on http://localhost:3000 (docs at /docs)
pnpm test                  # 48 tests across types, bridge, sdk
pnpm build                 # builds all packages
UTE_UNIQUE_KEY=placeholder pnpm openapi:export   # regenerate openapi.yaml from Zod schemas
```

## End-to-end SDK example

```ts
import { UteMueveClient } from '@ute-mueve/sdk';

const client = new UteMueveClient({ baseUrl: 'https://your-bridge.vercel.app' });

const stations = await client.stations.filtered({
  connectorTypes: ['CCS2', 'CHAdeMO'],
  statuses: ['available'],
  networks: ['PUBLIC'],
});

const renewable = await client.stations.renewableEnergy({
  start: new Date('2026-05-01'),
  end: new Date('2026-05-31'),
});

const customerKey = '<8-digit CI or 28-char Firebase UID>';
const cards = await client.customer.cards(customerKey);
const networks = await client.network.get(customerKey);
const history = await client.remoteCharge.history(customerKey);
```

## Deploy

See [docs/VERCEL-DEPLOY.md](docs/VERCEL-DEPLOY.md) for the full Vercel guide, including `/status` validation, smoke-test commands, and cost notes.

## Architecture

- **Token lifecycle.** Bridge boot reads `UTE_UNIQUE_KEY`. First request triggers `POST /api/v2/token` (anonymous, `clientIdIDP=cargaME`). JWT `exp` claim is decoded and the token cached for `exp − 60s`. Subsequent requests reuse the cached token; concurrent cache misses are single-flight via a Promise lock. Any upstream 401 invalidates the cache and retries once.
- **Cache backend.** Upstash Redis when `UPSTASH_REDIS_REST_*` env vars are set; otherwise an in-memory `Map` (per-instance only).
- **Validation.** Every request body / path param is parsed by a Zod schema. Customer keys are validated against the Uruguayan CI check-digit algorithm when they look numeric, or accepted as Firebase UIDs otherwise.
- **OpenAPI.** Routes register with `@hono/zod-openapi`. Each route's response example is a real captured fixture (sanitized) bundled at boot via `createRequire`.
- **Scalar.** `@scalar/hono-api-reference` consumes `/openapi.json` at `/docs`.

## Security notice

This repository documents a **critical IDOR** in the UTE backend ([`docs/security/2026-05-20-VR-001-idor-customer-card.md`](docs/security/2026-05-20-VR-001-idor-customer-card.md)): the anonymous token lets any caller read PII + partial credit-card metadata of any Uruguayan UTE Mueve customer by CI. The bridge **exposes** the same endpoints (it has to, in order to be useful), but does not include enumeration tooling and intentionally validates CI check digits to discourage casual brute force.

See [SECURITY.md](SECURITY.md) for the full static-analysis report (12 findings, including F-05/VR-001 critical, two medium, and several informational items).

**Do not** host a public instance of this bridge before UTE has rate-limited or fixed the underlying API. Use behind an API-key gate (`x-api-key`) and your own rate limiter.

## Reverse engineering provenance

Endpoint shapes were derived by:
1. `apktool d UTE Mueve.apk` for `AndroidManifest.xml` + `res/values/strings.xml`.
2. PowerShell byte-walker over `lib/arm64-v8a/libapp.so` (Flutter AOT) to extract printable strings → endpoint paths, model names, OAuth scopes.
3. Operator-consented live probes against UTE's production API with a fresh random `uniquekeyuser` and the operator's own CI; all PII was sanitized inline before any data hit the repository.

The APK, `apk-extracted/`, `apk-decoded/`, and raw HTTP capture markdowns are gitignored.

## License

MIT
