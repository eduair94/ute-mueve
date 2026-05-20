# Vercel Deployment Guide

End-to-end walk-through to publish the **`@ute-mueve/bridge`** Vercel function and verify it works against UTE's live backend.

> The bridge is **public** by default (no API-key gate). Anyone with the URL can use it. Add `BRIDGE_PUBLIC=false` + an API-key middleware if/when you want it gated.

---

## 1. Prerequisites

- Vercel account (free tier is enough).
- (Recommended) Upstash account with a Redis database (free tier) — provides a shared JWT cache between Vercel invocations. Without it, each cold-start re-issues an anonymous token from UTE.
- The CLI:
  ```bash
  pnpm dlx vercel@latest --version
  ```

---

## 2. Required environment variables

Set these in the Vercel project (Project Settings → Environment Variables):

| Name | Required | Purpose | Example |
|---|---|---|---|
| `UTE_UNIQUE_KEY` | **yes** | 12–13-hex device key sent on every UTE call. Pick once; keep stable. | `c0ffee1234abc` |
| `UTE_BASE_URL` | no | Override UTE base URL. | `https://movilidadelectrica.ute.com.uy/api/v2` |
| `UPSTASH_REDIS_REST_URL` | recommended | Shared token cache URL from Upstash. | `https://us1-foo-12345.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | recommended | Read/write token. | (long string) |
| `ENABLE_WRITE_ENDPOINTS` | no | Default `false`. Set to `true` to expose `customer/card/register`, `remotecharge/start`, etc. | `false` |
| `CORS_ORIGINS` | no | Comma-separated origin allowlist. Default `*`. | `https://my-frontend.com` |
| `LOG_LEVEL` | no | pino level. Default `info`. | `debug` |

Generating a `UTE_UNIQUE_KEY`:

```bash
node -e "console.log([...crypto.getRandomValues(new Uint8Array(7))].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,13))"
```

---

## 3. First deploy

```bash
cd apps/bridge

# One-time link to a new Vercel project
pnpm dlx vercel@latest link

# Push env vars (Production by default; add --environment=preview for previews)
pnpm dlx vercel env add UTE_UNIQUE_KEY production
pnpm dlx vercel env add UPSTASH_REDIS_REST_URL production
pnpm dlx vercel env add UPSTASH_REDIS_REST_TOKEN production

# Deploy
pnpm dlx vercel@latest deploy --prod
```

Vercel auto-detects the monorepo, installs with pnpm, and binds `apps/bridge/api/index.ts` as the Node 20 function. `vercel.json` rewrites every path to `/api/index` so Hono handles the routing.

If `vercel link` does not auto-pick this directory as the project root, set **Root Directory** = `apps/bridge` in Project Settings → General.

---

## 4. Smoke tests after deploy

Replace `<URL>` with your `*.vercel.app` host.

```bash
# 1) Service identity
curl -s https://<URL>/
# {"name":"ute-mueve-bridge","version":"0.1.0",...}

# 2) Liveness (no upstream)
curl -s https://<URL>/health
# {"ok":true}

# 3) Deep validation — acquires a token and probes UTE for /configuration/appversion
curl -s https://<URL>/status
# {"ok":true,"ms":...,"upstreamSampleKeys":["customersAppMinVersionSupportedAndroid",...],"cache":"upstash"}

# 4) OpenAPI JSON
curl -s https://<URL>/openapi.json | head -c 300

# 5) Scalar reference UI — open in browser
open https://<URL>/docs

# 6) Real call — list available CCS2/CHAdeMO stations on the public network
curl -s -X POST https://<URL>/station/statusFiltered \
  -H 'content-type: application/json' \
  -d @<(node -e "console.log(JSON.stringify({
    connectorTypes: [{id:2,internalCode:'',text:'CCS2',selected:true,icon:''},{id:3,internalCode:'',text:'CHAdeMO',selected:true,icon:''}],
    connectorStatuses: [{id:1,internalCode:'',text:'Disponible',selected:true,icon:''}],
    connectorPaymentTypes: [{id:2,internalCode:'',text:'App',selected:true,icon:''}],
    connectorPowers: [{id:1,internalCode:'',text:'0',selected:true,icon:''}],
    connectorCables: [{id:2,internalCode:'',text:'Sin cable',selected:true,icon:''}],
    connectorNetworks: [{id:1,internalCode:'PUBLIC',text:'Pública',selected:true,icon:''}]
  }))") | head -c 400
```

If `/status` returns `{ok:false}`:
- Double-check `UTE_UNIQUE_KEY` is set in the *production* environment, not just preview.
- Check the Vercel function logs (`vercel logs <URL>`) for the upstream error code.

---

## 5. Updating the OpenAPI export bundled with the package

The bridge serves OpenAPI live at `/openapi.json`. The static copy under `packages/openapi/openapi.yaml` is regenerated locally via:

```bash
UTE_UNIQUE_KEY=placeholder pnpm openapi:export
```

Commit the result if you ship `@ute-mueve/openapi` to consumers.

---

## 6. Cost / quota notes

- **UTE backend:** the bridge issues exactly one anonymous token per `expires_in - 60s` window when Upstash caching is configured. Without Upstash, every Vercel cold-start re-issues, but each call is cheap.
- **Upstash Redis:** ~1 GET + 1 SET per token (every 59 minutes) on the cache. Trivial vs the free tier.
- **Vercel:** invocations are 1:1 with bridge requests.

---

## 7. Tear down

```bash
cd apps/bridge
pnpm dlx vercel@latest remove <project-name>
```

Then revoke the Upstash database if no longer needed.

---

## 8. Coordinated-disclosure reminder

Before promoting this deployment to a publicly indexable URL, please read [`SECURITY.md`](../SECURITY.md) and [`docs/security/2026-05-20-VR-001-idor-customer-card.md`](security/2026-05-20-VR-001-idor-customer-card.md). The bridge can technically be aimed at any customer key, but the IDOR documented in VR-001 makes mass-scraping a Uruguayan-CI dataset technically trivial. The bridge code does not encourage that — but you should not host an open instance until UTE has rate-limited or fixed the underlying API.
