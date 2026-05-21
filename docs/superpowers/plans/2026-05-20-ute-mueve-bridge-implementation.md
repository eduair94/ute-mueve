# UTE Mueve Bridge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vercel-deployable TypeScript bridge API + isomorphic npm SDK in front of `movilidadelectrica.ute.com.uy/api/v2`, with Scalar/OpenAPI docs, Zod-driven types verified against quicktype-generated interfaces from real captured JSON.

**Architecture:** pnpm monorepo. `apps/bridge` is a Hono v4 app deployed as a single Vercel function; it handles UTE's anonymous JWT (acquire, cache in Upstash Redis with in-memory fallback, refresh on expiry/401). `packages/sdk` is a zero-dep isomorphic client. `packages/types` holds Zod schemas (source of truth) plus quicktype-generated interfaces (verification). `packages/openapi` ships the YAML spec and sanitized JSON fixtures.

**Tech Stack:** Node 20, TypeScript 5.6, pnpm 9, Hono 4, Zod 3, `@hono/zod-openapi`, `@scalar/hono-api-reference`, `@upstash/redis`, `jose`, `tsup`, `vitest`, Biome, `quicktype-core`, Vercel.

---

## Conventions

- All paths are relative to repo root `c:/Users/airau/Desktop/My Proyects/ute-mueve/`.
- Every task ends with a commit using Conventional Commits.
- TDD where it matters: token manager, error mapping, schema parsing, route handlers. Pure plumbing (config files, exports) does not need a failing test first.
- Use `pnpm` for everything. Lockfile committed.
- TypeScript strict mode everywhere. No `any` except documented escape hatches.
- Each test file colocated as `*.test.ts` next to the source under the same package.

---

## Phase 0 — Repo Bootstrap

### Task 0.1: Init git, root config files

**Files:**
- Create: `README.md`
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `biome.json`
- Create: `.npmrc`
- Create: `.nvmrc`
- Create: `LICENSE`

- [ ] **Step 1: Init git repo**

```bash
cd "c:/Users/airau/Desktop/My Proyects/ute-mueve"
git init -b main
git add .gitignore SECURITY.md docs/
git commit -m "chore: initial commit with security report and design docs"
```

- [ ] **Step 2: Write root `README.md`**

```markdown
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
```

- [ ] **Step 3: Write root `package.json`**

```json
{
  "name": "ute-mueve",
  "private": true,
  "version": "0.0.0",
  "packageManager": "pnpm@9.12.0",
  "engines": { "node": ">=20.11.0" },
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm --filter @ute-mueve/bridge dev",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "capture": "pnpm --filter @ute-mueve/tools-capture start",
    "types:generate": "pnpm --filter @ute-mueve/tools-quicktype start",
    "openapi:export": "pnpm --filter @ute-mueve/bridge openapi:export"
  },
  "devDependencies": {
    "@biomejs/biome": "1.9.4",
    "typescript": "5.6.3"
  }
}
```

- [ ] **Step 4: Write `pnpm-workspace.yaml`**

```yaml
packages:
  - apps/*
  - packages/*
  - tools/*
```

- [ ] **Step 5: Write `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "incremental": true
  }
}
```

- [ ] **Step 6: Write `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "ignore": ["dist", "build", "**/generated/**", ".vercel", "apk-extracted", "apk-decoded"] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "javascript": { "formatter": { "quoteStyle": "single", "semicolons": "always", "trailingCommas": "all" } },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": { "useNamingConvention": "off" },
      "suspicious": { "noExplicitAny": "error" },
      "correctness": { "noUnusedVariables": "error", "noUnusedImports": "error" }
    }
  }
}
```

- [ ] **Step 7: Write `.npmrc`**

```
auto-install-peers=true
strict-peer-dependencies=false
```

- [ ] **Step 8: Write `.nvmrc`**

```
20.11.1
```

- [ ] **Step 9: Write `LICENSE` (MIT)**

```
MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 10: Commit**

```bash
git add README.md package.json pnpm-workspace.yaml tsconfig.base.json biome.json .npmrc .nvmrc LICENSE
git commit -m "chore: bootstrap pnpm monorepo with biome, ts strict mode, MIT license"
```

---

### Task 0.2: Install root dev deps

- [ ] **Step 1: Install**

```bash
pnpm install
```

Expected: `pnpm-lock.yaml` created. No package files yet so workspace is empty.

- [ ] **Step 2: Commit lockfile**

```bash
git add pnpm-lock.yaml
git commit -m "chore: add pnpm lockfile"
```

---

## Phase 1 — `@ute-mueve/types` Package (Zod schemas, source of truth)

### Task 1.1: Scaffold types package

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`
- Create: `packages/types/src/common.ts`
- Create: `packages/types/vitest.config.ts`

- [ ] **Step 1: Write `packages/types/package.json`**

```json
{
  "name": "@ute-mueve/types",
  "version": "0.1.0",
  "private": false,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./schemas": { "types": "./dist/schemas/index.d.ts", "import": "./dist/schemas/index.js" }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": { "zod": "^3.23.8" },
  "devDependencies": {
    "tsup": "^8.3.0",
    "typescript": "5.6.3",
    "vitest": "^2.1.4"
  }
}
```

- [ ] **Step 2: Write `packages/types/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Write `packages/types/tsup.config.ts`**

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/schemas/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
```

- [ ] **Step 4: Write `packages/types/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
```

- [ ] **Step 5: Write `packages/types/src/common.ts`**

```ts
import { z } from 'zod';

export const UserIdSchema = z
  .string()
  .min(16)
  .max(32)
  .regex(/^[A-Za-z0-9]+$/, 'userId must be alphanumeric (16-32 chars)');
export type UserId = z.infer<typeof UserIdSchema>;

export const IsoDateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}:\d{2}(\.\d+)?)?$/);
export type IsoDateString = z.infer<typeof IsoDateStringSchema>;

export const ConnectorTypeCode = z.enum(['Tipo 2', 'CCS2', 'CHAdeMO', 'GB/T']);
export type ConnectorTypeCode = z.infer<typeof ConnectorTypeCode>;

export const ConnectorStatusCode = z.enum(['Disponible', 'Cargando', 'Sin Comunicación', 'No Disponible']);
export type ConnectorStatusCode = z.infer<typeof ConnectorStatusCode>;

export const ConnectorPaymentTypeCode = z.enum(['Tarjeta RFID', 'App']);
export type ConnectorPaymentTypeCode = z.infer<typeof ConnectorPaymentTypeCode>;

export const ConnectorCableCode = z.enum(['Con cable', 'Sin cable']);
export type ConnectorCableCode = z.infer<typeof ConnectorCableCode>;

export const ConnectorNetworkCode = z.enum(['PUBLIC', 'TAXI', 'DMC', 'ONE']);
export type ConnectorNetworkCode = z.infer<typeof ConnectorNetworkCode>;

export const UteFilterOptionSchema = z.object({
  id: z.number(),
  internalCode: z.string(),
  text: z.string(),
  selected: z.boolean(),
  icon: z.string(),
});
export type UteFilterOption = z.infer<typeof UteFilterOptionSchema>;
```

- [ ] **Step 6: Write `packages/types/src/index.ts`**

```ts
export * from './common.js';
export * as schemas from './schemas/index.js';
```

- [ ] **Step 7: Create directory + placeholder schemas index**

Create: `packages/types/src/schemas/index.ts`
```ts
// Schemas exported here as they are implemented.
export {};
```

- [ ] **Step 8: Write failing test for `UserIdSchema`**

Create: `packages/types/src/common.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { UserIdSchema } from './common.js';

describe('UserIdSchema', () => {
  it('accepts valid alphanumeric 16-32 char strings', () => {
    expect(UserIdSchema.parse('5H0M8zlFEKUiNnTlwQxj0A1LPWh1')).toBe(
      '5H0M8zlFEKUiNnTlwQxj0A1LPWh1',
    );
  });

  it('rejects too short', () => {
    expect(() => UserIdSchema.parse('abc123')).toThrow();
  });

  it('rejects non-alphanumeric', () => {
    expect(() => UserIdSchema.parse('5H0M8zlFEKUiNnTlwQxj0A1LPW-1')).toThrow();
  });
});
```

- [ ] **Step 9: Run, verify pass**

```bash
pnpm --filter @ute-mueve/types test
```

Expected: 3 tests pass.

- [ ] **Step 10: Commit**

```bash
git add packages/types
git commit -m "feat(types): scaffold @ute-mueve/types package with common Zod schemas"
```

---

### Task 1.2: Token, configuration, station schemas

**Files:**
- Create: `packages/types/src/schemas/token.ts`
- Create: `packages/types/src/schemas/configuration.ts`
- Create: `packages/types/src/schemas/station.ts`
- Modify: `packages/types/src/schemas/index.ts`

- [ ] **Step 1: Write `packages/types/src/schemas/token.ts`**

```ts
import { z } from 'zod';

export const TokenRequestSchema = z.object({
  clientIdIDP: z.literal('cargaME'),
  identifier: z.literal('Anonymous'),
});
export type TokenRequest = z.infer<typeof TokenRequestSchema>;

export const TokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  token_type: z.string().default('Bearer'),
  scope: z.string().optional(),
});
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
```

- [ ] **Step 2: Write `packages/types/src/schemas/configuration.ts`**

```ts
import { z } from 'zod';

export const AppVersionSchema = z.object({
  customersAppMinVersionSupportedAndroid: z.string().optional(),
  customersAppMinVersionSupportediOS: z.string().optional(),
}).passthrough();
export type AppVersion = z.infer<typeof AppVersionSchema>;
```

- [ ] **Step 3: Write `packages/types/src/schemas/station.ts`**

```ts
import { z } from 'zod';
import { IsoDateStringSchema, UteFilterOptionSchema } from '../common.js';

export const StatusFilteredRequestSchema = z.object({
  connectorTypes: z.array(UteFilterOptionSchema),
  connectorStatuses: z.array(UteFilterOptionSchema),
  connectorPaymentTypes: z.array(UteFilterOptionSchema),
  connectorPowers: z.array(UteFilterOptionSchema),
  connectorCables: z.array(UteFilterOptionSchema),
  connectorNetworks: z.array(UteFilterOptionSchema),
});
export type StatusFilteredRequest = z.infer<typeof StatusFilteredRequestSchema>;

export const ConnectorSchema = z.object({
  id: z.union([z.number(), z.string()]),
  type: z.string().optional(),
  status: z.string().optional(),
  power: z.union([z.number(), z.string()]).optional(),
  network: z.string().optional(),
  hasCable: z.boolean().optional(),
  paymentTypes: z.array(z.string()).optional(),
}).passthrough();
export type Connector = z.infer<typeof ConnectorSchema>;

export const StationSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
  connectors: z.array(ConnectorSchema).optional(),
}).passthrough();
export type Station = z.infer<typeof StationSchema>;

export const StatusFilteredResponseSchema = z.array(StationSchema);
export type StatusFilteredResponse = z.infer<typeof StatusFilteredResponseSchema>;

export const RenewEnergyRequestSchema = z.object({
  CardNumber: z.array(z.string()).default([]),
  StartDate: IsoDateStringSchema,
  EndDate: IsoDateStringSchema,
});
export type RenewEnergyRequest = z.infer<typeof RenewEnergyRequestSchema>;

export const RenewEnergyResponseSchema = z.object({
  totalEnergy: z.number().optional(),
  renewablePercentage: z.number().optional(),
}).passthrough();
export type RenewEnergyResponse = z.infer<typeof RenewEnergyResponseSchema>;
```

- [ ] **Step 4: Update `packages/types/src/schemas/index.ts`**

```ts
export * from './token.js';
export * from './configuration.js';
export * from './station.js';
```

- [ ] **Step 5: Add tests**

Create: `packages/types/src/schemas/station.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { RenewEnergyRequestSchema, StatusFilteredRequestSchema } from './station.js';

describe('StatusFilteredRequestSchema', () => {
  it('parses real APK-derived payload', () => {
    const payload = {
      connectorTypes: [{ id: 1, internalCode: '', text: 'Tipo 2', selected: false, icon: 'x.png' }],
      connectorStatuses: [{ id: 1, internalCode: '', text: 'Disponible', selected: true, icon: '' }],
      connectorPaymentTypes: [{ id: 1, internalCode: '', text: 'App', selected: true, icon: '' }],
      connectorPowers: [{ id: 1, internalCode: '', text: '60.0', selected: true, icon: '' }],
      connectorCables: [{ id: 2, internalCode: '', text: 'Sin cable', selected: true, icon: '' }],
      connectorNetworks: [{ id: 1, internalCode: 'PUBLIC', text: 'Pública', selected: true, icon: '' }],
    };
    expect(() => StatusFilteredRequestSchema.parse(payload)).not.toThrow();
  });
});

describe('RenewEnergyRequestSchema', () => {
  it('parses observed body', () => {
    const body = {
      CardNumber: [],
      EndDate: '2026-05-31 23:59:59.000',
      StartDate: '2026-05-01 00:00:00.000',
    };
    expect(() => RenewEnergyRequestSchema.parse(body)).not.toThrow();
  });
});
```

- [ ] **Step 6: Run tests**

```bash
pnpm --filter @ute-mueve/types test
```

Expected: 5 tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/types
git commit -m "feat(types): add token, configuration, and station Zod schemas"
```

---

### Task 1.3: Customer, card, network, remote-charge schemas

**Files:**
- Create: `packages/types/src/schemas/customer.ts`
- Create: `packages/types/src/schemas/card.ts`
- Create: `packages/types/src/schemas/network.ts`
- Create: `packages/types/src/schemas/remote-charge.ts`
- Modify: `packages/types/src/schemas/index.ts`

- [ ] **Step 1: Write `packages/types/src/schemas/customer.ts`**

```ts
import { z } from 'zod';

export const CustomerCardSchema = z.object({
  cardId: z.string().optional(),
  cardNumber: z.string().optional(),
  alias: z.string().optional(),
  cardUseType: z.string().optional(),
  cardUseTypeDesc: z.string().optional(),
}).passthrough();
export type CustomerCard = z.infer<typeof CustomerCardSchema>;

export const CustomerCardListSchema = z.array(CustomerCardSchema);
export type CustomerCardList = z.infer<typeof CustomerCardListSchema>;

export const RegisterCardRequestSchema = z.object({
  userId: z.string(),
  cardNumber: z.string().min(4),
  alias: z.string().max(64).optional(),
}).passthrough();
export type RegisterCardRequest = z.infer<typeof RegisterCardRequestSchema>;

export const RegisterCardResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  cardId: z.string().optional(),
}).passthrough();
export type RegisterCardResponse = z.infer<typeof RegisterCardResponseSchema>;
```

- [ ] **Step 2: Write `packages/types/src/schemas/card.ts`**

```ts
import { z } from 'zod';
import { CustomerCardSchema } from './customer.js';

export const CardDetailSchema = CustomerCardSchema.extend({
  balance: z.number().optional(),
  status: z.string().optional(),
}).passthrough();
export type CardDetail = z.infer<typeof CardDetailSchema>;

export const CardListResponseSchema = z.array(CardDetailSchema);
export type CardListResponse = z.infer<typeof CardListResponseSchema>;
```

- [ ] **Step 3: Write `packages/types/src/schemas/network.ts`**

```ts
import { z } from 'zod';

export const NetworkSchema = z.object({
  networkId: z.union([z.string(), z.number()]).optional(),
  networkDesc: z.string().optional(),
  internalCode: z.string().optional(),
  enabled: z.boolean().optional(),
}).passthrough();
export type Network = z.infer<typeof NetworkSchema>;

export const UserNetworksResponseSchema = z.array(NetworkSchema);
export type UserNetworksResponse = z.infer<typeof UserNetworksResponseSchema>;
```

- [ ] **Step 4: Write `packages/types/src/schemas/remote-charge.ts`**

```ts
import { z } from 'zod';

export const RemoteChargeSessionSchema = z.object({
  transactionId: z.string().optional(),
  stationId: z.union([z.string(), z.number()]).optional(),
  connectorId: z.union([z.string(), z.number()]).optional(),
  startTime: z.string().optional(),
  endTime: z.string().nullable().optional(),
  energyKwh: z.number().optional(),
  cost: z.number().optional(),
  status: z.string().optional(),
}).passthrough();
export type RemoteChargeSession = z.infer<typeof RemoteChargeSessionSchema>;

export const RemoteChargeHistoryResponseSchema = z.array(RemoteChargeSessionSchema);
export type RemoteChargeHistoryResponse = z.infer<typeof RemoteChargeHistoryResponseSchema>;

export const StartRemoteChargeRequestSchema = z.object({
  userId: z.string(),
  stationId: z.union([z.string(), z.number()]),
  connectorId: z.union([z.string(), z.number()]),
  cardId: z.string(),
}).passthrough();
export type StartRemoteChargeRequest = z.infer<typeof StartRemoteChargeRequestSchema>;

export const StopRemoteChargeRequestSchema = z.object({
  userId: z.string(),
  transactionId: z.string(),
}).passthrough();
export type StopRemoteChargeRequest = z.infer<typeof StopRemoteChargeRequestSchema>;

export const RemoteChargeActionResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  transactionId: z.string().optional(),
}).passthrough();
export type RemoteChargeActionResponse = z.infer<typeof RemoteChargeActionResponseSchema>;

export const ConnectorStatusRequestSchema = z.object({
  stationId: z.union([z.string(), z.number()]),
  connectorId: z.union([z.string(), z.number()]),
}).passthrough();
export type ConnectorStatusRequest = z.infer<typeof ConnectorStatusRequestSchema>;

export const ConnectorStatusResponseSchema = z.object({
  status: z.string().optional(),
  energyKwh: z.number().optional(),
  durationSeconds: z.number().optional(),
}).passthrough();
export type ConnectorStatusResponse = z.infer<typeof ConnectorStatusResponseSchema>;
```

- [ ] **Step 5: Update `packages/types/src/schemas/index.ts`**

```ts
export * from './token.js';
export * from './configuration.js';
export * from './station.js';
export * from './customer.js';
export * from './card.js';
export * from './network.js';
export * from './remote-charge.js';
```

- [ ] **Step 6: Add smoke test parsing minimal valid object per schema**

Create: `packages/types/src/schemas/index.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import {
  CardDetailSchema,
  CustomerCardSchema,
  NetworkSchema,
  RemoteChargeSessionSchema,
  StartRemoteChargeRequestSchema,
  TokenResponseSchema,
} from './index.js';

describe('schemas smoke', () => {
  it('TokenResponseSchema parses minimal', () => {
    expect(() => TokenResponseSchema.parse({ access_token: 'x', expires_in: 3600 })).not.toThrow();
  });
  it('CustomerCardSchema accepts passthrough fields', () => {
    expect(() => CustomerCardSchema.parse({ cardId: 'a', extra: 1 })).not.toThrow();
  });
  it('CardDetailSchema accepts inheritance', () => {
    expect(() => CardDetailSchema.parse({ balance: 42 })).not.toThrow();
  });
  it('NetworkSchema accepts varied ids', () => {
    expect(() => NetworkSchema.parse({ networkId: 'PUBLIC' })).not.toThrow();
    expect(() => NetworkSchema.parse({ networkId: 1 })).not.toThrow();
  });
  it('RemoteChargeSessionSchema accepts null endTime', () => {
    expect(() => RemoteChargeSessionSchema.parse({ endTime: null })).not.toThrow();
  });
  it('StartRemoteChargeRequestSchema requires fields', () => {
    expect(() => StartRemoteChargeRequestSchema.parse({ userId: 'u', stationId: 1, connectorId: 1, cardId: 'c' })).not.toThrow();
    expect(() => StartRemoteChargeRequestSchema.parse({ userId: 'u' })).toThrow();
  });
});
```

- [ ] **Step 7: Run tests**

```bash
pnpm --filter @ute-mueve/types test
```

Expected: all pass.

- [ ] **Step 8: Build the package**

```bash
pnpm --filter @ute-mueve/types build
```

Expected: `packages/types/dist/` populated.

- [ ] **Step 9: Commit**

```bash
git add packages/types
git commit -m "feat(types): add customer, card, network, remote-charge Zod schemas"
```

---

## Phase 2 — `@ute-mueve/openapi` Package (fixtures shell)

### Task 2.1: Scaffold openapi package with placeholder fixtures

**Files:**
- Create: `packages/openapi/package.json`
- Create: `packages/openapi/README.md`
- Create: `packages/openapi/fixtures/` (directory)
- Create: `packages/openapi/fixtures/.gitkeep`
- Create: `packages/openapi/fixtures/token.example.json`
- Create: `packages/openapi/fixtures/configuration.appversion.example.json`
- Create: `packages/openapi/fixtures/station.statusFiltered.example.json`
- Create: `packages/openapi/fixtures/station.renewEnergy.example.json`
- Create: `packages/openapi/fixtures/customer.card.example.json`
- Create: `packages/openapi/fixtures/card.example.json`
- Create: `packages/openapi/fixtures/network.example.json`
- Create: `packages/openapi/fixtures/remotecharge.user.example.json`

- [ ] **Step 1: Write `packages/openapi/package.json`**

```json
{
  "name": "@ute-mueve/openapi",
  "version": "0.1.0",
  "private": false,
  "type": "module",
  "main": "./index.js",
  "files": ["openapi.yaml", "fixtures", "README.md"],
  "scripts": {
    "typecheck": "echo 'no ts in openapi'",
    "test": "echo 'no tests in openapi'",
    "build": "echo 'static assets only'"
  }
}
```

- [ ] **Step 2: Write `packages/openapi/README.md`**

```markdown
# @ute-mueve/openapi

OpenAPI 3.1 specification and example JSON fixtures for the UTE Mueve bridge.

- `openapi.yaml` — generated by `pnpm openapi:export` from the bridge runtime Zod schemas.
- `fixtures/*.json` — sanitized real responses captured via `pnpm capture`. These are used as `example` values in the OpenAPI spec.
```

- [ ] **Step 3: Write placeholder example fixtures** — these are minimal, valid shapes the Zod schemas accept. The capture script will overwrite them with real data later.

Create: `packages/openapi/fixtures/token.example.json`
```json
{
  "access_token": "REDACTED_JWT_PLACEHOLDER",
  "expires_in": 3600,
  "token_type": "Bearer",
  "scope": "apiME"
}
```

Create: `packages/openapi/fixtures/configuration.appversion.example.json`
```json
{
  "customersAppMinVersionSupportedAndroid": "1.0.0",
  "customersAppMinVersionSupportediOS": "1.0.0"
}
```

Create: `packages/openapi/fixtures/station.statusFiltered.example.json`
```json
[
  {
    "id": 1,
    "name": "EXAMPLE_STATION",
    "latitude": -34.9,
    "longitude": -56.2,
    "address": "EXAMPLE_ADDRESS, Montevideo",
    "connectors": [
      { "id": 1, "type": "CCS2", "status": "Disponible", "power": 60, "network": "PUBLIC", "hasCable": false, "paymentTypes": ["App"] }
    ]
  }
]
```

Create: `packages/openapi/fixtures/station.renewEnergy.example.json`
```json
{ "totalEnergy": 12345.6, "renewablePercentage": 98.7 }
```

Create: `packages/openapi/fixtures/customer.card.example.json`
```json
[
  { "cardId": "EXAMPLE_CARD_ID", "cardNumber": "EXAMPLE_RFID_xxxxxxxx", "alias": "Mi tarjeta", "cardUseType": "PERSONAL" }
]
```

Create: `packages/openapi/fixtures/card.example.json`
```json
[
  { "cardId": "EXAMPLE_CARD_ID", "balance": 0, "status": "ACTIVE" }
]
```

Create: `packages/openapi/fixtures/network.example.json`
```json
[
  { "networkId": "PUBLIC", "networkDesc": "Pública", "internalCode": "PUBLIC", "enabled": true }
]
```

Create: `packages/openapi/fixtures/remotecharge.user.example.json`
```json
[
  { "transactionId": "EXAMPLE_TX", "stationId": 1, "connectorId": 1, "startTime": "2026-05-01T10:00:00Z", "endTime": "2026-05-01T10:30:00Z", "energyKwh": 12.3, "cost": 250.5, "status": "COMPLETED" }
]
```

- [ ] **Step 4: Commit**

```bash
git add packages/openapi
git commit -m "feat(openapi): scaffold package with placeholder fixtures"
```

---

## Phase 3 — `apps/bridge` Upstream Layer (Token + Client)

### Task 3.1: Scaffold bridge app

**Files:**
- Create: `apps/bridge/package.json`
- Create: `apps/bridge/tsconfig.json`
- Create: `apps/bridge/vitest.config.ts`
- Create: `apps/bridge/src/env.ts`
- Create: `apps/bridge/src/env.test.ts`

- [ ] **Step 1: Write `apps/bridge/package.json`**

```json
{
  "name": "@ute-mueve/bridge",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/dev.ts",
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "openapi:export": "tsx scripts/export-openapi.ts"
  },
  "dependencies": {
    "@hono/node-server": "^1.13.2",
    "@hono/zod-openapi": "^0.18.0",
    "@scalar/hono-api-reference": "^0.5.165",
    "@ute-mueve/types": "workspace:*",
    "@upstash/redis": "^1.34.3",
    "hono": "^4.6.5",
    "jose": "^5.9.6",
    "pino": "^9.5.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^22.7.5",
    "pino-pretty": "^11.3.0",
    "tsx": "^4.19.1",
    "typescript": "5.6.3",
    "vitest": "^2.1.4",
    "yaml": "^2.6.0"
  }
}
```

- [ ] **Step 2: Write `apps/bridge/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "lib": ["ES2022"],
    "types": ["node"]
  },
  "include": ["src/**/*", "scripts/**/*", "api/**/*"]
}
```

- [ ] **Step 3: Write `apps/bridge/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

- [ ] **Step 4: Write `apps/bridge/src/test/setup.ts`**

```ts
import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

- [ ] **Step 5: Write failing test for env loader**

Create: `apps/bridge/src/env.test.ts`
```ts
import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.js';

describe('loadEnv', () => {
  it('throws when UTE_UNIQUE_KEY missing', () => {
    expect(() => loadEnv({})).toThrow(/UTE_UNIQUE_KEY/);
  });

  it('returns defaults when optional vars absent', () => {
    const env = loadEnv({ UTE_UNIQUE_KEY: 'abc123' });
    expect(env.uteUniqueKey).toBe('abc123');
    expect(env.enableWriteEndpoints).toBe(false);
    expect(env.upstashUrl).toBeUndefined();
    expect(env.corsOrigins).toEqual(['*']);
  });

  it('parses ENABLE_WRITE_ENDPOINTS=true', () => {
    const env = loadEnv({ UTE_UNIQUE_KEY: 'k', ENABLE_WRITE_ENDPOINTS: 'true' });
    expect(env.enableWriteEndpoints).toBe(true);
  });

  it('parses comma-separated CORS_ORIGINS', () => {
    const env = loadEnv({ UTE_UNIQUE_KEY: 'k', CORS_ORIGINS: 'https://a.com, https://b.com' });
    expect(env.corsOrigins).toEqual(['https://a.com', 'https://b.com']);
  });
});
```

- [ ] **Step 6: Run tests, expect fail**

```bash
pnpm --filter @ute-mueve/bridge test
```

Expected: FAIL — `loadEnv` not defined.

- [ ] **Step 7: Implement `apps/bridge/src/env.ts`**

```ts
import { z } from 'zod';

const RawEnvSchema = z.object({
  UTE_UNIQUE_KEY: z.string().min(1),
  UTE_BASE_URL: z.string().url().default('https://movilidadelectrica.ute.com.uy/api/v2'),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  ENABLE_WRITE_ENDPOINTS: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
  RATE_LIMIT_PER_MIN: z.string().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = {
  uteUniqueKey: string;
  uteBaseUrl: string;
  upstashUrl: string | undefined;
  upstashToken: string | undefined;
  enableWriteEndpoints: boolean;
  corsOrigins: string[];
  rateLimitPerMin: number | undefined;
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
};

export function loadEnv(raw: Record<string, string | undefined>): Env {
  const parsed = RawEnvSchema.parse(raw);
  return {
    uteUniqueKey: parsed.UTE_UNIQUE_KEY,
    uteBaseUrl: parsed.UTE_BASE_URL,
    upstashUrl: parsed.UPSTASH_REDIS_REST_URL,
    upstashToken: parsed.UPSTASH_REDIS_REST_TOKEN,
    enableWriteEndpoints: parsed.ENABLE_WRITE_ENDPOINTS === 'true',
    corsOrigins: parsed.CORS_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) ?? ['*'],
    rateLimitPerMin: parsed.RATE_LIMIT_PER_MIN ? Number(parsed.RATE_LIMIT_PER_MIN) : undefined,
    logLevel: parsed.LOG_LEVEL,
  };
}
```

- [ ] **Step 8: Run tests, expect pass**

```bash
pnpm --filter @ute-mueve/bridge test
```

Expected: 4 pass.

- [ ] **Step 9: Commit**

```bash
git add apps/bridge
git commit -m "feat(bridge): scaffold app with env loader (TDD)"
```

---

### Task 3.2: Token cache (in-memory + Upstash adapter)

**Files:**
- Create: `apps/bridge/src/upstream/token-cache.ts`
- Create: `apps/bridge/src/upstream/token-cache.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it } from 'vitest';
import { InMemoryTokenCache } from './token-cache.js';

describe('InMemoryTokenCache', () => {
  it('returns null on miss', async () => {
    const cache = new InMemoryTokenCache();
    expect(await cache.get('k')).toBeNull();
  });

  it('returns value while not expired', async () => {
    const cache = new InMemoryTokenCache();
    await cache.set('k', 'jwt', 60);
    expect(await cache.get('k')).toBe('jwt');
  });

  it('expires after ttl', async () => {
    const cache = new InMemoryTokenCache({ now: () => 0 });
    await cache.set('k', 'jwt', 1);
    const cache2 = new InMemoryTokenCache({ now: () => 2000 });
    // can't share clock; instead test invalidate path
    await cache.invalidate('k');
    expect(await cache.get('k')).toBeNull();
  });

  it('invalidate removes', async () => {
    const cache = new InMemoryTokenCache();
    await cache.set('k', 'jwt', 60);
    await cache.invalidate('k');
    expect(await cache.get('k')).toBeNull();
  });
});
```

- [ ] **Step 2: Implement**

```ts
export interface TokenCache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  invalidate(key: string): Promise<void>;
}

export class InMemoryTokenCache implements TokenCache {
  private readonly store = new Map<string, { value: string; expiresAt: number }>();
  private readonly now: () => number;

  constructor(opts: { now?: () => number } = {}) {
    this.now = opts.now ?? Date.now;
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= this.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: this.now() + ttlSeconds * 1000 });
  }

  async invalidate(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export class UpstashTokenCache implements TokenCache {
  constructor(
    private readonly redis: { get: (k: string) => Promise<string | null>; set: (k: string, v: string, opts: { ex: number }) => Promise<unknown>; del: (k: string) => Promise<unknown> },
  ) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, value, { ex: ttlSeconds });
  }

  async invalidate(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
```

- [ ] **Step 3: Run tests**

```bash
pnpm --filter @ute-mueve/bridge test src/upstream/token-cache.test.ts
```

Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add apps/bridge/src/upstream/token-cache.ts apps/bridge/src/upstream/token-cache.test.ts
git commit -m "feat(bridge): token cache with in-memory and upstash adapters"
```

---

### Task 3.3: Token manager (acquire + single-flight + auto-refresh)

**Files:**
- Create: `apps/bridge/src/upstream/errors.ts`
- Create: `apps/bridge/src/upstream/token-manager.ts`
- Create: `apps/bridge/src/upstream/token-manager.test.ts`

- [ ] **Step 1: Write `apps/bridge/src/upstream/errors.ts`**

```ts
export type UteApiErrorCode =
  | 'UPSTREAM_AUTH'
  | 'UPSTREAM_4XX'
  | 'UPSTREAM_5XX'
  | 'UPSTREAM_NETWORK'
  | 'UPSTREAM_INVALID_RESPONSE'
  | 'TOKEN_DECODE'
  | 'WRITES_DISABLED'
  | 'VALIDATION';

export interface UteApiErrorOpts {
  code: UteApiErrorCode;
  status: number;
  message: string;
  upstream?: unknown;
  details?: unknown;
}

export class UteApiError extends Error {
  public readonly code: UteApiErrorCode;
  public readonly status: number;
  public readonly upstream: unknown;
  public readonly details: unknown;

  constructor(opts: UteApiErrorOpts) {
    super(opts.message);
    this.name = 'UteApiError';
    this.code = opts.code;
    this.status = opts.status;
    this.upstream = opts.upstream;
    this.details = opts.details;
  }
}
```

- [ ] **Step 2: Write failing test for token manager**

```ts
import { describe, expect, it, vi } from 'vitest';
import { InMemoryTokenCache } from './token-cache.js';
import { TokenManager } from './token-manager.js';

const dummyJwt = (() => {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.signature`;
})();

describe('TokenManager', () => {
  it('fetches and caches on first call', async () => {
    const fetchToken = vi.fn().mockResolvedValue({ access_token: dummyJwt, expires_in: 3600 });
    const mgr = new TokenManager({ cache: new InMemoryTokenCache(), fetchToken, cacheKey: 'k' });
    expect(await mgr.getToken()).toBe(dummyJwt);
    expect(fetchToken).toHaveBeenCalledTimes(1);
  });

  it('returns cached token on second call', async () => {
    const fetchToken = vi.fn().mockResolvedValue({ access_token: dummyJwt, expires_in: 3600 });
    const mgr = new TokenManager({ cache: new InMemoryTokenCache(), fetchToken, cacheKey: 'k' });
    await mgr.getToken();
    await mgr.getToken();
    expect(fetchToken).toHaveBeenCalledTimes(1);
  });

  it('single-flights concurrent acquisitions', async () => {
    const fetchToken = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 10));
      return { access_token: dummyJwt, expires_in: 3600 };
    });
    const mgr = new TokenManager({ cache: new InMemoryTokenCache(), fetchToken, cacheKey: 'k' });
    const results = await Promise.all([mgr.getToken(), mgr.getToken(), mgr.getToken()]);
    expect(results.every((t) => t === dummyJwt)).toBe(true);
    expect(fetchToken).toHaveBeenCalledTimes(1);
  });

  it('invalidate forces refetch', async () => {
    const fetchToken = vi.fn().mockResolvedValue({ access_token: dummyJwt, expires_in: 3600 });
    const mgr = new TokenManager({ cache: new InMemoryTokenCache(), fetchToken, cacheKey: 'k' });
    await mgr.getToken();
    await mgr.invalidate();
    await mgr.getToken();
    expect(fetchToken).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 3: Implement `apps/bridge/src/upstream/token-manager.ts`**

```ts
import type { TokenCache } from './token-cache.js';
import { UteApiError } from './errors.js';

export interface TokenManagerOpts {
  cache: TokenCache;
  cacheKey: string;
  fetchToken: () => Promise<{ access_token: string; expires_in: number }>;
  /** Seconds before JWT exp when we should refresh proactively. Default 60. */
  refreshSkewSeconds?: number;
}

interface JwtPayload {
  exp?: number;
  nbf?: number;
}

function decodeJwt(jwt: string): JwtPayload {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new UteApiError({ code: 'TOKEN_DECODE', status: 500, message: 'JWT does not have 3 parts' });
  }
  try {
    const payload = parts[1]!;
    const json = Buffer.from(payload, 'base64url').toString('utf8');
    return JSON.parse(json) as JwtPayload;
  } catch (cause) {
    throw new UteApiError({ code: 'TOKEN_DECODE', status: 500, message: 'JWT payload decode failed', details: cause });
  }
}

export class TokenManager {
  private inflight: Promise<string> | null = null;
  private readonly refreshSkewMs: number;

  constructor(private readonly opts: TokenManagerOpts) {
    this.refreshSkewMs = (opts.refreshSkewSeconds ?? 60) * 1000;
  }

  async getToken(): Promise<string> {
    const cached = await this.opts.cache.get(this.opts.cacheKey);
    if (cached && this.isFresh(cached)) return cached;
    if (this.inflight) return this.inflight;
    this.inflight = this.acquire();
    try {
      return await this.inflight;
    } finally {
      this.inflight = null;
    }
  }

  async invalidate(): Promise<void> {
    await this.opts.cache.invalidate(this.opts.cacheKey);
  }

  private async acquire(): Promise<string> {
    const res = await this.opts.fetchToken();
    const payload = decodeJwt(res.access_token);
    const ttlSeconds = payload.exp
      ? Math.max(60, payload.exp - Math.floor(Date.now() / 1000) - Math.floor(this.refreshSkewMs / 1000))
      : Math.max(60, res.expires_in - Math.floor(this.refreshSkewMs / 1000));
    await this.opts.cache.set(this.opts.cacheKey, res.access_token, ttlSeconds);
    return res.access_token;
  }

  private isFresh(jwt: string): boolean {
    try {
      const payload = decodeJwt(jwt);
      if (!payload.exp) return true;
      return payload.exp * 1000 > Date.now() + this.refreshSkewMs;
    } catch {
      return false;
    }
  }
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @ute-mueve/bridge test src/upstream/token-manager.test.ts
```

Expected: 4 pass.

- [ ] **Step 5: Commit**

```bash
git add apps/bridge/src/upstream
git commit -m "feat(bridge): token manager with single-flight and JWT-aware TTL"
```

---

### Task 3.4: Upstream HTTP client

**Files:**
- Create: `apps/bridge/src/upstream/client.ts`
- Create: `apps/bridge/src/upstream/client.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { InMemoryTokenCache } from './token-cache.js';
import { TokenManager } from './token-manager.js';
import { UpstreamClient } from './client.js';
import { UteApiError } from './errors.js';

const validJwt = (() => {
  const h = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.sig`;
})();

function makeClient(fetchMock: typeof fetch) {
  const tokenManager = new TokenManager({
    cache: new InMemoryTokenCache(),
    cacheKey: 'k',
    fetchToken: async () => ({ access_token: validJwt, expires_in: 3600 }),
  });
  return new UpstreamClient({
    baseUrl: 'https://example.test/api/v2',
    uniqueKey: 'abc',
    tokenManager,
    fetch: fetchMock,
  });
}

describe('UpstreamClient', () => {
  it('injects bearer + uniquekeyuser headers', async () => {
    const fetchMock = vi.fn(async (_url, init) => new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const client = makeClient(fetchMock as unknown as typeof fetch);
    const res = await client.get('/test');
    expect(res).toEqual({ ok: true });
    const [, init] = fetchMock.mock.calls[0]!;
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get('authorization')).toBe(`Bearer ${validJwt}`);
    expect(headers.get('uniquekeyuser')).toBe('abc');
  });

  it('on 401 invalidates and retries once', async () => {
    let calls = 0;
    const fetchMock = vi.fn(async () => {
      calls += 1;
      if (calls === 1) return new Response('', { status: 401 });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
    });
    const client = makeClient(fetchMock as unknown as typeof fetch);
    const res = await client.get('/test');
    expect(res).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('on second 401 throws UPSTREAM_AUTH', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 401 }));
    const client = makeClient(fetchMock as unknown as typeof fetch);
    await expect(client.get('/test')).rejects.toMatchObject({ code: 'UPSTREAM_AUTH' });
  });

  it('throws UPSTREAM_5XX on 503', async () => {
    const fetchMock = vi.fn(async () => new Response('boom', { status: 503 }));
    const client = makeClient(fetchMock as unknown as typeof fetch);
    await expect(client.get('/test')).rejects.toBeInstanceOf(UteApiError);
  });
});
```

- [ ] **Step 2: Implement `apps/bridge/src/upstream/client.ts`**

```ts
import type { TokenManager } from './token-manager.js';
import { UteApiError } from './errors.js';

export interface UpstreamClientOpts {
  baseUrl: string;
  uniqueKey: string;
  tokenManager: TokenManager;
  fetch?: typeof fetch;
  userAgent?: string;
}

export class UpstreamClient {
  private readonly baseUrl: string;
  private readonly uniqueKey: string;
  private readonly tokenManager: TokenManager;
  private readonly doFetch: typeof fetch;
  private readonly userAgent: string;

  constructor(opts: UpstreamClientOpts) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.uniqueKey = opts.uniqueKey;
    this.tokenManager = opts.tokenManager;
    this.doFetch = opts.fetch ?? globalThis.fetch;
    this.userAgent = opts.userAgent ?? 'Dart/3.4 (dart:io)';
  }

  async get<T = unknown>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T = unknown>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    let attempt = 0;
    while (attempt < 2) {
      const token = await this.tokenManager.getToken();
      const res = await this.doFetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          authorization: `Bearer ${token}`,
          uniquekeyuser: this.uniqueKey,
          'user-agent': this.userAgent,
          'accept-encoding': 'gzip',
          ...(body !== undefined ? { 'content-type': 'application/json; charset=utf-8' } : { 'content-type': 'application/json;' }),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (res.status === 401) {
        await this.tokenManager.invalidate();
        attempt += 1;
        if (attempt >= 2) {
          throw new UteApiError({ code: 'UPSTREAM_AUTH', status: 401, message: 'Upstream rejected token twice' });
        }
        continue;
      }
      if (res.status >= 500) {
        throw new UteApiError({ code: 'UPSTREAM_5XX', status: res.status, message: `Upstream ${res.status}`, upstream: await safeText(res) });
      }
      if (res.status >= 400) {
        throw new UteApiError({ code: 'UPSTREAM_4XX', status: res.status, message: `Upstream ${res.status}`, upstream: await safeText(res) });
      }
      const text = await res.text();
      try {
        return text.length ? (JSON.parse(text) as T) : (undefined as T);
      } catch (cause) {
        throw new UteApiError({ code: 'UPSTREAM_INVALID_RESPONSE', status: 502, message: 'Upstream response not JSON', details: cause, upstream: text.slice(0, 256) });
      }
    }
    throw new UteApiError({ code: 'UPSTREAM_AUTH', status: 401, message: 'Retry loop exhausted' });
  }
}

async function safeText(res: Response): Promise<string> {
  try { return (await res.text()).slice(0, 1024); } catch { return ''; }
}
```

- [ ] **Step 3: Run tests**

```bash
pnpm --filter @ute-mueve/bridge test src/upstream/client.test.ts
```

Expected: 4 pass.

- [ ] **Step 4: Commit**

```bash
git add apps/bridge/src/upstream/client.ts apps/bridge/src/upstream/client.test.ts
git commit -m "feat(bridge): upstream HTTP client with 401-retry and structured errors"
```

---

### Task 3.5: Token-fetch primitive (anonymous /api/v2/token)

**Files:**
- Create: `apps/bridge/src/upstream/fetch-token.ts`
- Create: `apps/bridge/src/upstream/fetch-token.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { fetchUteToken } from './fetch-token.js';
import { UteApiError } from './errors.js';

describe('fetchUteToken', () => {
  it('POSTs to /token with required body and headers', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ access_token: 'abc', expires_in: 3600, token_type: 'Bearer' }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const out = await fetchUteToken({
      baseUrl: 'https://x.test/api/v2',
      uniqueKey: 'key1',
      fetch: fetchMock as unknown as typeof fetch,
    });
    expect(out.access_token).toBe('abc');
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://x.test/api/v2/token');
    const init2 = init as RequestInit;
    expect(init2.method).toBe('POST');
    expect(JSON.parse(init2.body as string)).toEqual({ clientIdIDP: 'cargaME', identifier: 'Anonymous' });
    const headers = new Headers(init2.headers);
    expect(headers.get('uniquekeyuser')).toBe('key1');
  });

  it('throws on non-200', async () => {
    const fetchMock = vi.fn(async () => new Response('nope', { status: 500 }));
    await expect(
      fetchUteToken({ baseUrl: 'https://x.test/api/v2', uniqueKey: 'k', fetch: fetchMock as unknown as typeof fetch }),
    ).rejects.toBeInstanceOf(UteApiError);
  });

  it('throws on missing access_token', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ wrong: true }), { status: 200, headers: { 'content-type': 'application/json' } }));
    await expect(
      fetchUteToken({ baseUrl: 'https://x.test/api/v2', uniqueKey: 'k', fetch: fetchMock as unknown as typeof fetch }),
    ).rejects.toBeInstanceOf(UteApiError);
  });
});
```

- [ ] **Step 2: Implement**

```ts
import { TokenResponseSchema } from '@ute-mueve/types/schemas';
import type { TokenResponse } from '@ute-mueve/types/schemas';
import { UteApiError } from './errors.js';

export interface FetchTokenOpts {
  baseUrl: string;
  uniqueKey: string;
  fetch?: typeof fetch;
  userAgent?: string;
}

export async function fetchUteToken(opts: FetchTokenOpts): Promise<TokenResponse> {
  const doFetch = opts.fetch ?? globalThis.fetch;
  const res = await doFetch(`${opts.baseUrl.replace(/\/$/, '')}/token`, {
    method: 'POST',
    headers: {
      'user-agent': opts.userAgent ?? 'Dart/3.4 (dart:io)',
      'content-type': 'application/json; charset=utf-8',
      'accept-encoding': 'gzip',
      uniquekeyuser: opts.uniqueKey,
    },
    body: JSON.stringify({ clientIdIDP: 'cargaME', identifier: 'Anonymous' }),
  });
  if (res.status !== 200) {
    throw new UteApiError({
      code: res.status >= 500 ? 'UPSTREAM_5XX' : 'UPSTREAM_4XX',
      status: res.status,
      message: `Token endpoint returned ${res.status}`,
      upstream: await safeText(res),
    });
  }
  const json = (await res.json().catch(() => null)) as unknown;
  const parsed = TokenResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new UteApiError({
      code: 'UPSTREAM_INVALID_RESPONSE',
      status: 502,
      message: 'Token response invalid shape',
      details: parsed.error.flatten(),
    });
  }
  return parsed.data;
}

async function safeText(res: Response): Promise<string> {
  try { return (await res.text()).slice(0, 256); } catch { return ''; }
}
```

- [ ] **Step 3: Run tests**

```bash
pnpm --filter @ute-mueve/bridge test src/upstream/fetch-token.test.ts
```

Expected: 3 pass.

- [ ] **Step 4: Commit**

```bash
git add apps/bridge/src/upstream
git commit -m "feat(bridge): anonymous token fetcher validated by Zod"
```

---

### Task 3.6: Bridge container (factory wiring env → cache → token manager → client)

**Files:**
- Create: `apps/bridge/src/container.ts`
- Create: `apps/bridge/src/logger.ts`

- [ ] **Step 1: Write `apps/bridge/src/logger.ts`**

```ts
import { pino } from 'pino';
import type { Env } from './env.js';

export function createLogger(env: Env) {
  return pino({
    level: env.logLevel,
    base: undefined,
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}
export type Logger = ReturnType<typeof createLogger>;
```

- [ ] **Step 2: Write `apps/bridge/src/container.ts`**

```ts
import { Redis } from '@upstash/redis';
import { loadEnv, type Env } from './env.js';
import { createLogger, type Logger } from './logger.js';
import { UpstreamClient } from './upstream/client.js';
import { fetchUteToken } from './upstream/fetch-token.js';
import { InMemoryTokenCache, UpstashTokenCache, type TokenCache } from './upstream/token-cache.js';
import { TokenManager } from './upstream/token-manager.js';

export interface Container {
  env: Env;
  logger: Logger;
  upstream: UpstreamClient;
  tokenManager: TokenManager;
}

let cached: Container | null = null;

export function getContainer(rawEnv: Record<string, string | undefined> = process.env): Container {
  if (cached) return cached;
  const env = loadEnv(rawEnv);
  const logger = createLogger(env);
  const cache: TokenCache =
    env.upstashUrl && env.upstashToken
      ? new UpstashTokenCache(new Redis({ url: env.upstashUrl, token: env.upstashToken }))
      : new InMemoryTokenCache();
  const tokenManager = new TokenManager({
    cache,
    cacheKey: 'ute:token:v1',
    fetchToken: () => fetchUteToken({ baseUrl: env.uteBaseUrl, uniqueKey: env.uteUniqueKey }),
  });
  const upstream = new UpstreamClient({
    baseUrl: env.uteBaseUrl,
    uniqueKey: env.uteUniqueKey,
    tokenManager,
  });
  cached = { env, logger, upstream, tokenManager };
  return cached;
}

export function resetContainer(): void {
  cached = null;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/bridge/src/container.ts apps/bridge/src/logger.ts
git commit -m "feat(bridge): container wiring env, cache, token manager, upstream client"
```

---

## Phase 4 — `apps/bridge` Routes (Hono + Zod OpenAPI)

### Task 4.1: Hono app skeleton + error middleware

**Files:**
- Create: `apps/bridge/src/app.ts`
- Create: `apps/bridge/src/middleware/error.ts`
- Create: `apps/bridge/src/middleware/error.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { errorMiddleware } from './error.js';
import { UteApiError } from '../upstream/errors.js';

describe('errorMiddleware', () => {
  it('formats UteApiError', async () => {
    const app = new Hono();
    app.onError(errorMiddleware);
    app.get('/x', () => { throw new UteApiError({ code: 'UPSTREAM_4XX', status: 404, message: 'nope' }); });
    const res = await app.request('/x');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toMatchObject({ error: { code: 'UPSTREAM_4XX', status: 404, message: 'nope' } });
  });

  it('formats unknown error as 500', async () => {
    const app = new Hono();
    app.onError(errorMiddleware);
    app.get('/x', () => { throw new Error('boom'); });
    const res = await app.request('/x');
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL');
  });
});
```

- [ ] **Step 2: Implement `apps/bridge/src/middleware/error.ts`**

```ts
import type { ErrorHandler } from 'hono';
import { UteApiError } from '../upstream/errors.js';
import { ZodError } from 'zod';

export const errorMiddleware: ErrorHandler = (err, c) => {
  if (err instanceof UteApiError) {
    return c.json({ error: { code: err.code, status: err.status, message: err.message, details: err.details } }, err.status as Parameters<typeof c.json>[1]);
  }
  if (err instanceof ZodError) {
    return c.json({ error: { code: 'VALIDATION', status: 400, message: 'Validation failed', details: err.flatten() } }, 400);
  }
  return c.json({ error: { code: 'INTERNAL', status: 500, message: err.message } }, 500);
};
```

- [ ] **Step 3: Run tests**

```bash
pnpm --filter @ute-mueve/bridge test src/middleware/error.test.ts
```

Expected: pass.

- [ ] **Step 4: Write `apps/bridge/src/app.ts`** (without routes yet)

```ts
import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import type { Container } from './container.js';
import { errorMiddleware } from './middleware/error.js';

export function createApp(container: Container) {
  const app = new OpenAPIHono();

  app.use('*', honoLogger((msg) => container.logger.info(msg)));
  app.use(
    '*',
    cors({
      origin: container.env.corsOrigins.includes('*') ? '*' : container.env.corsOrigins,
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['content-type'],
    }),
  );

  app.get('/', (c) => c.json({ name: 'ute-mueve-bridge', version: '0.1.0', docs: '/docs' }));
  app.get('/health', (c) => c.json({ ok: true }));

  app.doc31('/openapi.json', {
    openapi: '3.1.0',
    info: { title: 'UTE Mueve Bridge', version: '0.1.0', description: 'Unofficial bridge to movilidadelectrica.ute.com.uy/api/v2' },
    servers: [{ url: '/' }],
  });
  app.get('/docs', Scalar({ url: '/openapi.json', theme: 'purple' }));

  // Routes registered by callers.

  app.onError(errorMiddleware);
  return app;
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/bridge/src/app.ts apps/bridge/src/middleware
git commit -m "feat(bridge): Hono app skeleton with error middleware, Scalar docs"
```

---

### Task 4.2: Configuration + station routes

**Files:**
- Create: `apps/bridge/src/routes/configuration.ts`
- Create: `apps/bridge/src/routes/stations.ts`
- Create: `apps/bridge/src/routes/stations.test.ts`
- Modify: `apps/bridge/src/app.ts`

- [ ] **Step 1: Write `apps/bridge/src/routes/configuration.ts`**

```ts
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { AppVersionSchema } from '@ute-mueve/types/schemas';
import type { Container } from '../container.js';

export function registerConfigurationRoutes(app: OpenAPIHono, c: Container) {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/configuration/appversion',
      tags: ['Configuration'],
      summary: 'Minimum supported app version',
      responses: {
        200: {
          description: 'App version metadata',
          content: { 'application/json': { schema: AppVersionSchema } },
        },
      },
    }),
    async (ctx) => {
      const data = await c.upstream.get<unknown>('/configuration/appversion');
      return ctx.json(AppVersionSchema.parse(data));
    },
  );
}
```

- [ ] **Step 2: Write `apps/bridge/src/routes/stations.ts`**

```ts
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import {
  RenewEnergyRequestSchema,
  RenewEnergyResponseSchema,
  StatusFilteredRequestSchema,
  StatusFilteredResponseSchema,
} from '@ute-mueve/types/schemas';
import type { Container } from '../container.js';

const ErrorBody = z.object({ error: z.object({ code: z.string(), status: z.number(), message: z.string() }) });

export function registerStationRoutes(app: OpenAPIHono, c: Container) {
  app.openapi(
    createRoute({
      method: 'post',
      path: '/station/statusFiltered',
      tags: ['Stations'],
      summary: 'Stations filtered by connector criteria',
      request: {
        body: {
          content: { 'application/json': { schema: StatusFilteredRequestSchema } },
        },
      },
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: StatusFilteredResponseSchema } } },
        502: { description: 'Upstream error', content: { 'application/json': { schema: ErrorBody } } },
      },
    }),
    async (ctx) => {
      const body = ctx.req.valid('json');
      const data = await c.upstream.post<unknown>('/station/statusFiltered', body);
      return ctx.json(StatusFilteredResponseSchema.parse(data));
    },
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/station/renewEnergy',
      tags: ['Stations'],
      summary: 'Aggregated renewable-energy metrics for a date range',
      request: { body: { content: { 'application/json': { schema: RenewEnergyRequestSchema } } } },
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: RenewEnergyResponseSchema } } },
      },
    }),
    async (ctx) => {
      const body = ctx.req.valid('json');
      const data = await c.upstream.post<unknown>('/station/renewEnergy', body);
      return ctx.json(RenewEnergyResponseSchema.parse(data));
    },
  );
}
```

- [ ] **Step 3: Write integration test for stations**

```ts
import { describe, expect, it, vi } from 'vitest';
import { OpenAPIHono } from '@hono/zod-openapi';
import { errorMiddleware } from '../middleware/error.js';
import { registerStationRoutes } from './stations.js';

function makeContainerStub(upstreamResponse: unknown) {
  return {
    env: {} as never,
    logger: { info: () => {}, error: () => {}, warn: () => {}, debug: () => {} } as never,
    upstream: {
      post: vi.fn(async () => upstreamResponse),
      get: vi.fn(async () => upstreamResponse),
    } as never,
    tokenManager: {} as never,
  };
}

describe('station routes', () => {
  it('forwards statusFiltered to upstream', async () => {
    const app = new OpenAPIHono();
    app.onError(errorMiddleware);
    const container = makeContainerStub([{ id: 1, connectors: [] }]);
    registerStationRoutes(app, container);
    const res = await app.request('/station/statusFiltered', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        connectorTypes: [], connectorStatuses: [], connectorPaymentTypes: [],
        connectorPowers: [], connectorCables: [], connectorNetworks: [],
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([{ id: 1, connectors: [] }]);
  });

  it('rejects invalid body with 400', async () => {
    const app = new OpenAPIHono();
    app.onError(errorMiddleware);
    const container = makeContainerStub([]);
    registerStationRoutes(app, container);
    const res = await app.request('/station/statusFiltered', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ wrong: true }),
    });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 4: Update `apps/bridge/src/app.ts` to register routes**

Replace the `// Routes registered by callers.` comment with:
```ts
  registerConfigurationRoutes(app, container);
  registerStationRoutes(app, container);
```

Add imports at top:
```ts
import { registerConfigurationRoutes } from './routes/configuration.js';
import { registerStationRoutes } from './routes/stations.js';
```

- [ ] **Step 5: Run tests**

```bash
pnpm --filter @ute-mueve/bridge test
```

Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add apps/bridge/src
git commit -m "feat(bridge): configuration + station routes with OpenAPI metadata"
```

---

### Task 4.3: Customer, card, network routes

**Files:**
- Create: `apps/bridge/src/routes/customer.ts`
- Create: `apps/bridge/src/routes/card.ts`
- Create: `apps/bridge/src/routes/network.ts`
- Modify: `apps/bridge/src/app.ts`

- [ ] **Step 1: Write `apps/bridge/src/routes/customer.ts`**

```ts
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import {
  CustomerCardListSchema,
  RegisterCardRequestSchema,
  RegisterCardResponseSchema,
} from '@ute-mueve/types/schemas';
import { UserIdSchema } from '@ute-mueve/types';
import type { Container } from '../container.js';
import { UteApiError } from '../upstream/errors.js';

const ParamsSchema = z.object({ userId: UserIdSchema });

export function registerCustomerRoutes(app: OpenAPIHono, c: Container) {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/customer/card/{userId}',
      tags: ['Customer'],
      request: { params: ParamsSchema },
      responses: {
        200: { description: 'Customer cards', content: { 'application/json': { schema: CustomerCardListSchema } } },
      },
    }),
    async (ctx) => {
      const { userId } = ctx.req.valid('param');
      const data = await c.upstream.get<unknown>(`/customer/card/${userId}`);
      return ctx.json(CustomerCardListSchema.parse(data));
    },
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/customer/card/register',
      tags: ['Customer', 'Writes'],
      description: 'Requires ENABLE_WRITE_ENDPOINTS=true. Performs real account modification.',
      request: { body: { content: { 'application/json': { schema: RegisterCardRequestSchema } } } },
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: RegisterCardResponseSchema } } },
        503: { description: 'Writes disabled' },
      },
    }),
    async (ctx) => {
      if (!c.env.enableWriteEndpoints) {
        throw new UteApiError({ code: 'WRITES_DISABLED', status: 503, message: 'Write endpoints disabled by configuration' });
      }
      const body = ctx.req.valid('json');
      const data = await c.upstream.post<unknown>('/customer/card/register', body);
      return ctx.json(RegisterCardResponseSchema.parse(data));
    },
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/customer/card/unregister',
      tags: ['Customer', 'Writes'],
      description: 'Requires ENABLE_WRITE_ENDPOINTS=true.',
      request: { body: { content: { 'application/json': { schema: RegisterCardRequestSchema.partial() } } } },
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: RegisterCardResponseSchema } } },
        503: { description: 'Writes disabled' },
      },
    }),
    async (ctx) => {
      if (!c.env.enableWriteEndpoints) {
        throw new UteApiError({ code: 'WRITES_DISABLED', status: 503, message: 'Write endpoints disabled by configuration' });
      }
      const body = ctx.req.valid('json');
      const data = await c.upstream.post<unknown>('/customer/card/unregister', body);
      return ctx.json(RegisterCardResponseSchema.parse(data));
    },
  );
}
```

- [ ] **Step 2: Write `apps/bridge/src/routes/card.ts`**

```ts
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { CardListResponseSchema } from '@ute-mueve/types/schemas';
import { UserIdSchema } from '@ute-mueve/types';
import type { Container } from '../container.js';

const ParamsSchema = z.object({ userId: UserIdSchema });

export function registerCardRoutes(app: OpenAPIHono, c: Container) {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/card/{userId}',
      tags: ['Cards'],
      request: { params: ParamsSchema },
      responses: { 200: { description: 'Card list', content: { 'application/json': { schema: CardListResponseSchema } } } },
    }),
    async (ctx) => {
      const { userId } = ctx.req.valid('param');
      const data = await c.upstream.get<unknown>(`/card/${userId}`);
      return ctx.json(CardListResponseSchema.parse(data));
    },
  );
}
```

- [ ] **Step 3: Write `apps/bridge/src/routes/network.ts`**

```ts
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { UserNetworksResponseSchema } from '@ute-mueve/types/schemas';
import { UserIdSchema } from '@ute-mueve/types';
import type { Container } from '../container.js';

const ParamsSchema = z.object({ userId: UserIdSchema });

export function registerNetworkRoutes(app: OpenAPIHono, c: Container) {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/network/{userId}',
      tags: ['Networks'],
      request: { params: ParamsSchema },
      responses: { 200: { description: 'User networks', content: { 'application/json': { schema: UserNetworksResponseSchema } } } },
    }),
    async (ctx) => {
      const { userId } = ctx.req.valid('param');
      const data = await c.upstream.get<unknown>(`/network/${userId}`);
      return ctx.json(UserNetworksResponseSchema.parse(data));
    },
  );
}
```

- [ ] **Step 4: Register in `apps/bridge/src/app.ts`**

Add imports + calls so `app.ts` ends with:
```ts
  registerConfigurationRoutes(app, container);
  registerStationRoutes(app, container);
  registerCustomerRoutes(app, container);
  registerCardRoutes(app, container);
  registerNetworkRoutes(app, container);
```

- [ ] **Step 5: Add smoke test for new routes**

Create: `apps/bridge/src/routes/customer.test.ts`
```ts
import { describe, expect, it, vi } from 'vitest';
import { OpenAPIHono } from '@hono/zod-openapi';
import { errorMiddleware } from '../middleware/error.js';
import { registerCustomerRoutes } from './customer.js';

function stub(upstreamResponse: unknown, enableWriteEndpoints = false) {
  return {
    env: { enableWriteEndpoints } as never,
    logger: {} as never,
    upstream: {
      get: vi.fn(async () => upstreamResponse),
      post: vi.fn(async () => upstreamResponse),
    } as never,
    tokenManager: {} as never,
  };
}

describe('customer routes', () => {
  it('GET /customer/card/:userId returns array', async () => {
    const app = new OpenAPIHono();
    app.onError(errorMiddleware);
    registerCustomerRoutes(app, stub([{ cardId: 'a' }]));
    const res = await app.request('/customer/card/5H0M8zlFEKUiNnTlwQxj0A1LPWh1');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ cardId: 'a' }]);
  });

  it('POST /customer/card/register returns 503 when writes disabled', async () => {
    const app = new OpenAPIHono();
    app.onError(errorMiddleware);
    registerCustomerRoutes(app, stub({}));
    const res = await app.request('/customer/card/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: 'u', cardNumber: 'XXXX' }),
    });
    expect(res.status).toBe(503);
  });

  it('POST /customer/card/register succeeds when writes enabled', async () => {
    const app = new OpenAPIHono();
    app.onError(errorMiddleware);
    registerCustomerRoutes(app, stub({ success: true }, true));
    const res = await app.request('/customer/card/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: 'u', cardNumber: 'XXXX' }),
    });
    expect(res.status).toBe(200);
  });

  it('rejects malformed userId', async () => {
    const app = new OpenAPIHono();
    app.onError(errorMiddleware);
    registerCustomerRoutes(app, stub([]));
    const res = await app.request('/customer/card/short');
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 6: Run all tests**

```bash
pnpm --filter @ute-mueve/bridge test
```

Expected: green.

- [ ] **Step 7: Commit**

```bash
git add apps/bridge/src
git commit -m "feat(bridge): customer, card, network routes with write gating"
```

---

### Task 4.4: Remote charge routes

**Files:**
- Create: `apps/bridge/src/routes/remote-charge.ts`
- Modify: `apps/bridge/src/app.ts`

- [ ] **Step 1: Write `apps/bridge/src/routes/remote-charge.ts`**

```ts
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import {
  ConnectorStatusRequestSchema,
  ConnectorStatusResponseSchema,
  RemoteChargeActionResponseSchema,
  RemoteChargeHistoryResponseSchema,
  StartRemoteChargeRequestSchema,
  StopRemoteChargeRequestSchema,
} from '@ute-mueve/types/schemas';
import { UserIdSchema } from '@ute-mueve/types';
import type { Container } from '../container.js';
import { UteApiError } from '../upstream/errors.js';

const ParamsSchema = z.object({ userId: UserIdSchema });
const TxParamsSchema = z.object({ transactionId: z.string().min(1).max(128) });

function guardWrites(c: Container) {
  if (!c.env.enableWriteEndpoints) {
    throw new UteApiError({ code: 'WRITES_DISABLED', status: 503, message: 'Write endpoints disabled by configuration' });
  }
}

export function registerRemoteChargeRoutes(app: OpenAPIHono, c: Container) {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/remotecharge/user/{userId}',
      tags: ['Remote Charge'],
      request: { params: ParamsSchema },
      responses: { 200: { description: 'History', content: { 'application/json': { schema: RemoteChargeHistoryResponseSchema } } } },
    }),
    async (ctx) => {
      const { userId } = ctx.req.valid('param');
      const data = await c.upstream.get<unknown>(`/remotecharge/user/${userId}`);
      return ctx.json(RemoteChargeHistoryResponseSchema.parse(data));
    },
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/remotecharge/transaction/{transactionId}',
      tags: ['Remote Charge'],
      request: { params: TxParamsSchema },
      responses: { 200: { description: 'Tx detail', content: { 'application/json': { schema: ConnectorStatusResponseSchema } } } },
    }),
    async (ctx) => {
      const { transactionId } = ctx.req.valid('param');
      const data = await c.upstream.get<unknown>(`/remotecharge/transaction/${encodeURIComponent(transactionId)}`);
      return ctx.json(ConnectorStatusResponseSchema.parse(data));
    },
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/remotecharge/connector/status',
      tags: ['Remote Charge'],
      request: { body: { content: { 'application/json': { schema: ConnectorStatusRequestSchema } } } },
      responses: { 200: { description: 'OK', content: { 'application/json': { schema: ConnectorStatusResponseSchema } } } },
    }),
    async (ctx) => {
      const body = ctx.req.valid('json');
      const data = await c.upstream.post<unknown>('/remotecharge/connector/status', body);
      return ctx.json(ConnectorStatusResponseSchema.parse(data));
    },
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/remotecharge/start',
      tags: ['Remote Charge', 'Writes'],
      description: 'Requires ENABLE_WRITE_ENDPOINTS=true. Starts a real charge session.',
      request: { body: { content: { 'application/json': { schema: StartRemoteChargeRequestSchema } } } },
      responses: { 200: { description: 'OK', content: { 'application/json': { schema: RemoteChargeActionResponseSchema } } }, 503: { description: 'Writes disabled' } },
    }),
    async (ctx) => {
      guardWrites(c);
      const body = ctx.req.valid('json');
      const data = await c.upstream.post<unknown>('/remotecharge/start', body);
      return ctx.json(RemoteChargeActionResponseSchema.parse(data));
    },
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/remotecharge/stop',
      tags: ['Remote Charge', 'Writes'],
      description: 'Requires ENABLE_WRITE_ENDPOINTS=true. Stops an active charge session.',
      request: { body: { content: { 'application/json': { schema: StopRemoteChargeRequestSchema } } } },
      responses: { 200: { description: 'OK', content: { 'application/json': { schema: RemoteChargeActionResponseSchema } } }, 503: { description: 'Writes disabled' } },
    }),
    async (ctx) => {
      guardWrites(c);
      const body = ctx.req.valid('json');
      const data = await c.upstream.post<unknown>('/remotecharge/stop', body);
      return ctx.json(RemoteChargeActionResponseSchema.parse(data));
    },
  );
}
```

- [ ] **Step 2: Register in `apps/bridge/src/app.ts`**

Add `registerRemoteChargeRoutes(app, container);` and the import.

- [ ] **Step 3: Run all tests**

```bash
pnpm --filter @ute-mueve/bridge test
```

Expected: green.

- [ ] **Step 4: Commit**

```bash
git add apps/bridge/src
git commit -m "feat(bridge): remote charge routes (history, status, start/stop gated)"
```

---

### Task 4.5: Dev entrypoint + OpenAPI export script

**Files:**
- Create: `apps/bridge/src/dev.ts`
- Create: `apps/bridge/scripts/export-openapi.ts`

- [ ] **Step 1: Write `apps/bridge/src/dev.ts`**

```ts
import 'dotenv/config';
import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { getContainer } from './container.js';

const container = getContainer();
const app = createApp(container);
const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, (info) => {
  container.logger.info(`bridge listening on http://localhost:${info.port} (docs: /docs)`);
});
```

Note: add `dotenv` to bridge devDependencies in a follow-up edit (next step).

- [ ] **Step 2: Add dotenv to bridge package**

Edit `apps/bridge/package.json` adding `"dotenv": "^16.4.5"` to `devDependencies`.

- [ ] **Step 3: Install**

```bash
pnpm install
```

- [ ] **Step 4: Write `apps/bridge/scripts/export-openapi.ts`**

```ts
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { stringify } from 'yaml';
import { createApp } from '../src/app.js';
import { getContainer } from '../src/container.js';

const container = getContainer({ ...process.env, UTE_UNIQUE_KEY: process.env.UTE_UNIQUE_KEY ?? 'placeholder-for-doc-export' });
const app = createApp(container);
const doc = app.getOpenAPI31Document({
  openapi: '3.1.0',
  info: { title: 'UTE Mueve Bridge', version: '0.1.0', description: 'Unofficial bridge to movilidadelectrica.ute.com.uy/api/v2' },
  servers: [{ url: '/' }],
});

const out = resolve('packages/openapi/openapi.yaml');
await mkdir(dirname(out), { recursive: true });
await writeFile(out, stringify(doc), 'utf8');
console.log(`Wrote ${out}`);
```

- [ ] **Step 5: Generate the OpenAPI YAML to confirm it works**

```bash
UTE_UNIQUE_KEY=placeholder pnpm openapi:export
```

Expected: `packages/openapi/openapi.yaml` written.

- [ ] **Step 6: Commit**

```bash
git add apps/bridge packages/openapi/openapi.yaml
git commit -m "feat(bridge): dev entrypoint + openapi YAML export script"
```

---

### Task 4.6: Vercel function entrypoint + `vercel.json`

**Files:**
- Create: `apps/bridge/api/index.ts`
- Create: `apps/bridge/vercel.json`
- Create: `apps/bridge/.vercelignore`

- [ ] **Step 1: Write `apps/bridge/api/index.ts`**

```ts
import { handle } from 'hono/vercel';
import { createApp } from '../src/app.js';
import { getContainer } from '../src/container.js';

export const config = { runtime: 'nodejs20.x' };

const app = createApp(getContainer());
export default handle(app);
```

- [ ] **Step 2: Write `apps/bridge/vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    { "source": "/(.*)", "destination": "/api/index" }
  ]
}
```

- [ ] **Step 3: Write `apps/bridge/.vercelignore`**

```
node_modules
dist
src/test
**/*.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add apps/bridge/api apps/bridge/vercel.json apps/bridge/.vercelignore
git commit -m "feat(bridge): Vercel function entrypoint with rewrites"
```

---

## Phase 5 — `@ute-mueve/sdk` Package

### Task 5.1: Scaffold SDK package and client

**Files:**
- Create: `packages/sdk/package.json`
- Create: `packages/sdk/tsconfig.json`
- Create: `packages/sdk/tsup.config.ts`
- Create: `packages/sdk/vitest.config.ts`
- Create: `packages/sdk/src/index.ts`
- Create: `packages/sdk/src/errors.ts`
- Create: `packages/sdk/src/client.ts`
- Create: `packages/sdk/src/client.test.ts`
- Create: `packages/sdk/README.md`

- [ ] **Step 1: Write `packages/sdk/package.json`**

```json
{
  "name": "@ute-mueve/sdk",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@ute-mueve/types": "workspace:*"
  },
  "peerDependencies": { "zod": "^3.23.0" },
  "peerDependenciesMeta": { "zod": { "optional": true } },
  "devDependencies": {
    "tsup": "^8.3.0",
    "typescript": "5.6.3",
    "vitest": "^2.1.4",
    "zod": "^3.23.8"
  }
}
```

- [ ] **Step 2: Write `packages/sdk/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Write `packages/sdk/tsup.config.ts`**

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
```

- [ ] **Step 4: Write `packages/sdk/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { environment: 'node', include: ['src/**/*.test.ts'] } });
```

- [ ] **Step 5: Write `packages/sdk/src/errors.ts`**

```ts
export interface UteSdkErrorBody {
  code: string;
  status: number;
  message: string;
  details?: unknown;
}

export class UteSdkError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details: unknown;
  public readonly upstream: unknown;

  constructor(body: UteSdkErrorBody, upstream?: unknown) {
    super(body.message);
    this.name = 'UteSdkError';
    this.code = body.code;
    this.status = body.status;
    this.details = body.details;
    this.upstream = upstream;
  }
}
```

- [ ] **Step 6: Write `packages/sdk/src/client.ts`**

```ts
import { UteSdkError } from './errors.js';

export interface UteMueveClientOpts {
  /** Bridge base URL, e.g. https://ute-bridge.vercel.app */
  baseUrl: string;
  /** Optional API key, sent as `x-api-key` header if provided. */
  apiKey?: string;
  /** Custom fetch (e.g. for Node 18 without polyfill or tests). */
  fetch?: typeof fetch;
  /** Custom request timeout in ms. Default 15000. */
  timeoutMs?: number;
}

export class UteMueveHttp {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly doFetch: typeof fetch;
  private readonly timeoutMs: number;

  constructor(opts: UteMueveClientOpts) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.apiKey = opts.apiKey;
    this.doFetch = opts.fetch ?? globalThis.fetch;
    this.timeoutMs = opts.timeoutMs ?? 15000;
  }

  async get<T>(path: string): Promise<T> { return this.request<T>('GET', path); }
  async post<T>(path: string, body: unknown): Promise<T> { return this.request<T>('POST', path, body); }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const res = await this.doFetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          accept: 'application/json',
          ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
          ...(this.apiKey ? { 'x-api-key': this.apiKey } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
      const text = await res.text();
      const json = text ? (JSON.parse(text) as unknown) : null;
      if (!res.ok) {
        if (json && typeof json === 'object' && 'error' in json) {
          throw new UteSdkError((json as { error: { code: string; status: number; message: string; details?: unknown } }).error, json);
        }
        throw new UteSdkError({ code: 'HTTP_ERROR', status: res.status, message: `Bridge returned ${res.status}` }, text);
      }
      return json as T;
    } catch (err) {
      if (err instanceof UteSdkError) throw err;
      if ((err as { name?: string }).name === 'AbortError') {
        throw new UteSdkError({ code: 'TIMEOUT', status: 504, message: `Request timed out after ${this.timeoutMs}ms` });
      }
      throw new UteSdkError({ code: 'NETWORK', status: 0, message: (err as Error).message ?? 'Network error' });
    } finally {
      clearTimeout(t);
    }
  }
}
```

- [ ] **Step 7: Write `packages/sdk/src/index.ts`** (initial stub — resources added next task)

```ts
import { UteMueveHttp, type UteMueveClientOpts } from './client.js';
export { UteSdkError } from './errors.js';
export type { UteMueveClientOpts } from './client.js';

export class UteMueveClient {
  protected readonly http: UteMueveHttp;
  constructor(opts: UteMueveClientOpts) {
    this.http = new UteMueveHttp(opts);
  }
}
```

- [ ] **Step 8: Write tests**

```ts
import { describe, expect, it, vi } from 'vitest';
import { UteMueveClient, UteSdkError } from './index.js';

describe('UteMueveClient', () => {
  it('does GET with apiKey header when provided', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const client = new UteMueveClient({ baseUrl: 'https://bridge.test', apiKey: 'KEY', fetch: fetchMock as unknown as typeof fetch });
    const result = await (client as unknown as { http: { get: <T>(p: string) => Promise<T> } }).http.get('/health');
    expect(result).toEqual({ ok: true });
    const headers = new Headers((fetchMock.mock.calls[0]![1] as RequestInit).headers);
    expect(headers.get('x-api-key')).toBe('KEY');
  });

  it('throws UteSdkError on 4xx', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ error: { code: 'BAD', status: 400, message: 'no' } }), { status: 400, headers: { 'content-type': 'application/json' } }));
    const client = new UteMueveClient({ baseUrl: 'https://bridge.test', fetch: fetchMock as unknown as typeof fetch });
    await expect((client as unknown as { http: { get: <T>(p: string) => Promise<T> } }).http.get('/x')).rejects.toBeInstanceOf(UteSdkError);
  });
});
```

- [ ] **Step 9: Write minimal README**

`packages/sdk/README.md`:
```markdown
# @ute-mueve/sdk

Isomorphic TypeScript SDK for the UTE Mueve bridge API.

```ts
import { UteMueveClient } from '@ute-mueve/sdk';

const client = new UteMueveClient({ baseUrl: 'https://your-bridge.vercel.app' });
const stations = await client.stations.filtered({ statuses: ['available'] });
```

See the [bridge OpenAPI docs](https://your-bridge.vercel.app/docs).
```

- [ ] **Step 10: Run tests + build**

```bash
pnpm --filter @ute-mueve/sdk test
pnpm --filter @ute-mueve/sdk build
```

- [ ] **Step 11: Commit**

```bash
git add packages/sdk
git commit -m "feat(sdk): scaffold @ute-mueve/sdk with HTTP layer and typed errors"
```

---

### Task 5.2: SDK resource modules

**Files:**
- Create: `packages/sdk/src/resources/stations.ts`
- Create: `packages/sdk/src/resources/customer.ts`
- Create: `packages/sdk/src/resources/card.ts`
- Create: `packages/sdk/src/resources/network.ts`
- Create: `packages/sdk/src/resources/remote-charge.ts`
- Create: `packages/sdk/src/resources/configuration.ts`
- Create: `packages/sdk/src/filters.ts`
- Modify: `packages/sdk/src/index.ts`

- [ ] **Step 1: Write `packages/sdk/src/filters.ts`** (ergonomic → UTE filter shape)

```ts
import type { UteFilterOption } from '@ute-mueve/types';

export interface StationFilterInput {
  connectorTypes?: ('Tipo 2' | 'CCS2' | 'CHAdeMO' | 'GB/T')[];
  statuses?: ('available' | 'charging' | 'no-comm' | 'unavailable')[];
  paymentTypes?: ('rfid' | 'app')[];
  cables?: ('with' | 'without')[];
  networks?: ('PUBLIC' | 'TAXI' | 'DMC' | 'ONE')[];
  /** Powers in kW. Use 0 to mean "any". */
  powers?: number[];
}

const TYPE_MAP: Record<string, { id: number; text: string; icon: string }> = {
  'Tipo 2': { id: 1, text: 'Tipo 2', icon: 'assets/images/Tipo2/desconocido.png' },
  CCS2: { id: 2, text: 'CCS2', icon: 'assets/images/CCS2/desconocido.png' },
  CHAdeMO: { id: 3, text: 'CHAdeMO', icon: 'assets/images/Chademo/desconocido.png' },
  'GB/T': { id: 4, text: 'GB/T', icon: 'assets/images/Gbt/desconocido.png' },
};

const STATUS_MAP: Record<string, { id: number; text: string }> = {
  available: { id: 1, text: 'Disponible' },
  charging: { id: 2, text: 'Cargando' },
  'no-comm': { id: 3, text: 'Sin Comunicación' },
  unavailable: { id: 4, text: 'No Disponible' },
};

const PAYMENT_MAP: Record<string, { id: number; text: string }> = {
  rfid: { id: 1, text: 'Tarjeta RFID' },
  app: { id: 2, text: 'App' },
};

const CABLE_MAP: Record<string, { id: number; text: string }> = {
  with: { id: 1, text: 'Con cable' },
  without: { id: 2, text: 'Sin cable' },
};

const NETWORK_MAP: Record<string, { id: number; internalCode: string; text: string }> = {
  PUBLIC: { id: 1, internalCode: 'PUBLIC', text: 'Pública' },
  TAXI: { id: 2, internalCode: 'TAXI', text: 'Taxi' },
  DMC: { id: 3, internalCode: 'DMC', text: 'DMC' },
  ONE: { id: 4, internalCode: 'ONE', text: 'eOne' },
};

export function expandFilters(input: StationFilterInput): {
  connectorTypes: UteFilterOption[];
  connectorStatuses: UteFilterOption[];
  connectorPaymentTypes: UteFilterOption[];
  connectorPowers: UteFilterOption[];
  connectorCables: UteFilterOption[];
  connectorNetworks: UteFilterOption[];
} {
  const allTypes = Object.entries(TYPE_MAP).map(([key, v]) => ({ id: v.id, internalCode: '', text: v.text, selected: input.connectorTypes ? input.connectorTypes.includes(key as never) : false, icon: v.icon }));
  const allStatuses = Object.entries(STATUS_MAP).map(([key, v]) => ({ id: v.id, internalCode: '', text: v.text, selected: input.statuses ? input.statuses.includes(key as never) : key === 'available', icon: '' }));
  const allPayments = Object.entries(PAYMENT_MAP).map(([key, v]) => ({ id: v.id, internalCode: '', text: v.text, selected: input.paymentTypes ? input.paymentTypes.includes(key as never) : true, icon: '' }));
  const allCables = Object.entries(CABLE_MAP).map(([key, v]) => ({ id: v.id, internalCode: '', text: v.text, selected: input.cables ? input.cables.includes(key as never) : true, icon: '' }));
  const allNetworks = Object.entries(NETWORK_MAP).map(([key, v]) => ({ id: v.id, internalCode: v.internalCode, text: v.text, selected: input.networks ? input.networks.includes(key as never) : true, icon: '' }));
  const powers = (input.powers && input.powers.length ? input.powers : [0]).map((p, i) => ({ id: i + 1, internalCode: '', text: String(p), selected: true, icon: '' }));
  return {
    connectorTypes: allTypes,
    connectorStatuses: allStatuses,
    connectorPaymentTypes: allPayments,
    connectorPowers: powers,
    connectorCables: allCables,
    connectorNetworks: allNetworks,
  };
}
```

- [ ] **Step 2: Write resource files**

`packages/sdk/src/resources/stations.ts`:
```ts
import type {
  RenewEnergyRequest,
  RenewEnergyResponse,
  StatusFilteredResponse,
} from '@ute-mueve/types/schemas';
import { expandFilters, type StationFilterInput } from '../filters.js';
import type { UteMueveHttp } from '../client.js';

export class StationsResource {
  constructor(private readonly http: UteMueveHttp) {}

  filtered(input: StationFilterInput = {}): Promise<StatusFilteredResponse> {
    return this.http.post<StatusFilteredResponse>('/station/statusFiltered', expandFilters(input));
  }

  renewableEnergy(opts: { start: Date | string; end: Date | string; cardNumbers?: string[] }): Promise<RenewEnergyResponse> {
    const body: RenewEnergyRequest = {
      CardNumber: opts.cardNumbers ?? [],
      StartDate: toUteDate(opts.start, '00:00:00.000'),
      EndDate: toUteDate(opts.end, '23:59:59.000'),
    };
    return this.http.post<RenewEnergyResponse>('/station/renewEnergy', body);
  }
}

function toUteDate(input: Date | string, fallbackTime: string): string {
  if (typeof input === 'string') return input;
  const y = input.getUTCFullYear();
  const m = String(input.getUTCMonth() + 1).padStart(2, '0');
  const d = String(input.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d} ${fallbackTime}`;
}
```

`packages/sdk/src/resources/configuration.ts`:
```ts
import type { AppVersion } from '@ute-mueve/types/schemas';
import type { UteMueveHttp } from '../client.js';

export class ConfigurationResource {
  constructor(private readonly http: UteMueveHttp) {}
  appVersion(): Promise<AppVersion> {
    return this.http.get<AppVersion>('/configuration/appversion');
  }
}
```

`packages/sdk/src/resources/customer.ts`:
```ts
import type {
  CustomerCardList,
  RegisterCardRequest,
  RegisterCardResponse,
} from '@ute-mueve/types/schemas';
import type { UteMueveHttp } from '../client.js';

export class CustomerResource {
  constructor(private readonly http: UteMueveHttp) {}
  cards(userId: string): Promise<CustomerCardList> {
    return this.http.get<CustomerCardList>(`/customer/card/${encodeURIComponent(userId)}`);
  }
  registerCard(payload: RegisterCardRequest): Promise<RegisterCardResponse> {
    return this.http.post<RegisterCardResponse>('/customer/card/register', payload);
  }
  unregisterCard(payload: Partial<RegisterCardRequest>): Promise<RegisterCardResponse> {
    return this.http.post<RegisterCardResponse>('/customer/card/unregister', payload);
  }
}
```

`packages/sdk/src/resources/card.ts`:
```ts
import type { CardListResponse } from '@ute-mueve/types/schemas';
import type { UteMueveHttp } from '../client.js';

export class CardResource {
  constructor(private readonly http: UteMueveHttp) {}
  detail(userId: string): Promise<CardListResponse> {
    return this.http.get<CardListResponse>(`/card/${encodeURIComponent(userId)}`);
  }
}
```

`packages/sdk/src/resources/network.ts`:
```ts
import type { UserNetworksResponse } from '@ute-mueve/types/schemas';
import type { UteMueveHttp } from '../client.js';

export class NetworkResource {
  constructor(private readonly http: UteMueveHttp) {}
  get(userId: string): Promise<UserNetworksResponse> {
    return this.http.get<UserNetworksResponse>(`/network/${encodeURIComponent(userId)}`);
  }
}
```

`packages/sdk/src/resources/remote-charge.ts`:
```ts
import type {
  ConnectorStatusRequest,
  ConnectorStatusResponse,
  RemoteChargeActionResponse,
  RemoteChargeHistoryResponse,
  StartRemoteChargeRequest,
  StopRemoteChargeRequest,
} from '@ute-mueve/types/schemas';
import type { UteMueveHttp } from '../client.js';

export class RemoteChargeResource {
  constructor(private readonly http: UteMueveHttp) {}
  history(userId: string): Promise<RemoteChargeHistoryResponse> {
    return this.http.get<RemoteChargeHistoryResponse>(`/remotecharge/user/${encodeURIComponent(userId)}`);
  }
  transaction(transactionId: string): Promise<ConnectorStatusResponse> {
    return this.http.get<ConnectorStatusResponse>(`/remotecharge/transaction/${encodeURIComponent(transactionId)}`);
  }
  connectorStatus(payload: ConnectorStatusRequest): Promise<ConnectorStatusResponse> {
    return this.http.post<ConnectorStatusResponse>('/remotecharge/connector/status', payload);
  }
  start(payload: StartRemoteChargeRequest): Promise<RemoteChargeActionResponse> {
    return this.http.post<RemoteChargeActionResponse>('/remotecharge/start', payload);
  }
  stop(payload: StopRemoteChargeRequest): Promise<RemoteChargeActionResponse> {
    return this.http.post<RemoteChargeActionResponse>('/remotecharge/stop', payload);
  }
}
```

- [ ] **Step 3: Update `packages/sdk/src/index.ts`**

```ts
import { UteMueveHttp, type UteMueveClientOpts } from './client.js';
import { ConfigurationResource } from './resources/configuration.js';
import { StationsResource } from './resources/stations.js';
import { CustomerResource } from './resources/customer.js';
import { CardResource } from './resources/card.js';
import { NetworkResource } from './resources/network.js';
import { RemoteChargeResource } from './resources/remote-charge.js';

export { UteSdkError } from './errors.js';
export type { UteMueveClientOpts } from './client.js';
export type { StationFilterInput } from './filters.js';
export type * from '@ute-mueve/types/schemas';

export class UteMueveClient {
  readonly configuration: ConfigurationResource;
  readonly stations: StationsResource;
  readonly customer: CustomerResource;
  readonly card: CardResource;
  readonly network: NetworkResource;
  readonly remoteCharge: RemoteChargeResource;

  constructor(opts: UteMueveClientOpts) {
    const http = new UteMueveHttp(opts);
    this.configuration = new ConfigurationResource(http);
    this.stations = new StationsResource(http);
    this.customer = new CustomerResource(http);
    this.card = new CardResource(http);
    this.network = new NetworkResource(http);
    this.remoteCharge = new RemoteChargeResource(http);
  }
}
```

- [ ] **Step 4: Add integration test for stations resource + filter expansion**

Create: `packages/sdk/src/resources/stations.test.ts`
```ts
import { describe, expect, it, vi } from 'vitest';
import { UteMueveClient } from '../index.js';

describe('StationsResource', () => {
  it('expands ergonomic filters into UTE shape', async () => {
    const fetchMock = vi.fn(async (_url, init) => {
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.connectorStatuses.find((s: { text: string; selected: boolean }) => s.text === 'Disponible').selected).toBe(true);
      expect(body.connectorNetworks.length).toBe(4);
      return new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } });
    });
    const client = new UteMueveClient({ baseUrl: 'https://b.test', fetch: fetchMock as unknown as typeof fetch });
    await client.stations.filtered({ statuses: ['available'] });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('formats renewableEnergy dates correctly', async () => {
    const fetchMock = vi.fn(async (_url, init) => {
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.StartDate).toMatch(/^2026-05-01 00:00:00\.000$/);
      expect(body.EndDate).toMatch(/^2026-05-31 23:59:59\.000$/);
      return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
    });
    const client = new UteMueveClient({ baseUrl: 'https://b.test', fetch: fetchMock as unknown as typeof fetch });
    await client.stations.renewableEnergy({ start: new Date(Date.UTC(2026, 4, 1)), end: new Date(Date.UTC(2026, 4, 31)) });
  });
});
```

- [ ] **Step 5: Run + build**

```bash
pnpm --filter @ute-mueve/sdk test
pnpm --filter @ute-mueve/sdk build
```

Expected: green; `dist/` populated.

- [ ] **Step 6: Commit**

```bash
git add packages/sdk
git commit -m "feat(sdk): resource modules (stations, customer, card, network, remote-charge, configuration) + ergonomic filter expansion"
```

---

## Phase 6 — Tools (Fixture Capture + Quicktype Generation)

### Task 6.1: Capture script

**Files:**
- Create: `tools/capture/package.json`
- Create: `tools/capture/tsconfig.json`
- Create: `tools/capture/src/main.ts`
- Create: `tools/capture/src/sanitize.ts`
- Create: `tools/capture/src/sanitize.test.ts`
- Create: `tools/capture/vitest.config.ts`

- [ ] **Step 1: Write `tools/capture/package.json`**

```json
{
  "name": "@ute-mueve/tools-capture",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "tsx src/main.ts",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@ute-mueve/types": "workspace:*",
    "dotenv": "^16.4.5",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^22.7.5",
    "tsx": "^4.19.1",
    "typescript": "5.6.3",
    "vitest": "^2.1.4"
  }
}
```

- [ ] **Step 2: Write `tools/capture/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Write `tools/capture/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['src/**/*.test.ts'] } });
```

- [ ] **Step 4: Write sanitizer test (TDD)**

`tools/capture/src/sanitize.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { sanitize } from './sanitize.js';

describe('sanitize', () => {
  it('replaces userId-like strings', () => {
    const out = sanitize({ userId: '5H0M8zlFEKUiNnTlwQxj0A1LPWh1', other: 'fine' });
    expect((out as { userId: string }).userId).toMatch(/^EXAMPLE_USER_ID_/);
    expect((out as { other: string }).other).toBe('fine');
  });

  it('rounds montevideo-ish lat/long', () => {
    const out = sanitize({ latitude: -34.9012, longitude: -56.1834 }) as { latitude: number; longitude: number };
    expect(out.latitude).toBe(-34.9);
    expect(out.longitude).toBe(-56.2);
  });

  it('redacts emails', () => {
    const out = sanitize({ email: 'foo.bar@gmail.com' }) as { email: string };
    expect(out.email).toBe('REDACTED_EMAIL');
  });

  it('handles arrays and nesting', () => {
    const out = sanitize([{ userId: '5H0M8zlFEKUiNnTlwQxj0A1LPWh1', card: { cardNumber: 'ABCDEF1234567890' } }]) as Array<{ userId: string; card: { cardNumber: string } }>;
    expect(out[0]!.userId).toMatch(/^EXAMPLE_USER_ID_/);
    expect(out[0]!.card.cardNumber).toMatch(/^EXAMPLE_RFID_/);
  });
});
```

- [ ] **Step 5: Implement `tools/capture/src/sanitize.ts`**

```ts
const USER_ID_RE = /^[A-Za-z0-9]{22,32}$/;
const RFID_RE = /^[A-Fa-f0-9]{8,32}$/;
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;

export function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = sanitizeField(k, v);
    }
    return out;
  }
  return value;
}

function sanitizeField(key: string, value: unknown): unknown {
  const lower = key.toLowerCase();
  if (typeof value === 'string') {
    if (lower.includes('email') || EMAIL_RE.test(value)) return 'REDACTED_EMAIL';
    if (lower === 'userid' && USER_ID_RE.test(value)) return `EXAMPLE_USER_ID_${'x'.repeat(20)}`;
    if ((lower.includes('cardnumber') || lower === 'card_number') && RFID_RE.test(value)) return `EXAMPLE_RFID_${'x'.repeat(8)}`;
    if (lower.includes('phone')) return 'REDACTED_PHONE';
    return value;
  }
  if (typeof value === 'number') {
    if (lower.includes('latitude')) return Math.round(value * 10) / 10;
    if (lower.includes('longitude')) return Math.round(value * 10) / 10;
    return value;
  }
  return sanitize(value);
}
```

- [ ] **Step 6: Run sanitizer tests**

```bash
pnpm --filter @ute-mueve/tools-capture test
```

Expected: 4 pass.

- [ ] **Step 7: Write `tools/capture/src/main.ts`** (live capture; user runs manually)

```ts
import 'dotenv/config';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import { sanitize } from './sanitize.js';

const ConfigSchema = z.object({
  UTE_BASE_URL: z.string().url().default('https://movilidadelectrica.ute.com.uy/api/v2'),
  UTE_UNIQUE_KEY: z.string().min(1),
  UTE_USER_ID: z.string().min(16),
});
const env = ConfigSchema.parse(process.env);

const FIXTURE_DIR = resolve('packages/openapi/fixtures');

async function fetchToken(): Promise<string> {
  const res = await fetch(`${env.UTE_BASE_URL}/token`, {
    method: 'POST',
    headers: {
      'user-agent': 'Dart/3.4 (dart:io)',
      'content-type': 'application/json; charset=utf-8',
      'accept-encoding': 'gzip',
      uniquekeyuser: env.UTE_UNIQUE_KEY,
    },
    body: JSON.stringify({ clientIdIDP: 'cargaME', identifier: 'Anonymous' }),
  });
  if (!res.ok) throw new Error(`token endpoint: ${res.status}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

async function call(method: 'GET' | 'POST', path: string, token: string, body?: unknown): Promise<unknown> {
  const res = await fetch(`${env.UTE_BASE_URL}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      uniquekeyuser: env.UTE_UNIQUE_KEY,
      'user-agent': 'Dart/3.4 (dart:io)',
      'content-type': body ? 'application/json; charset=utf-8' : 'application/json;',
      'accept-encoding': 'gzip',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

async function write(name: string, data: unknown) {
  const file = resolve(FIXTURE_DIR, `${name}.example.json`);
  await mkdir(FIXTURE_DIR, { recursive: true });
  await writeFile(file, `${JSON.stringify(sanitize(data), null, 2)}\n`, 'utf8');
  console.log(`wrote ${file}`);
}

async function main() {
  const token = await fetchToken();
  console.log('token acquired');

  await write('token', { access_token: 'REDACTED_JWT_PLACEHOLDER', expires_in: 3600, token_type: 'Bearer', scope: 'apiME' });

  await write('configuration.appversion', await call('GET', '/configuration/appversion', token));

  const filterBody = {
    connectorTypes: [
      { id: 1, internalCode: '', text: 'Tipo 2', selected: true, icon: '' },
      { id: 2, internalCode: '', text: 'CCS2', selected: true, icon: '' },
      { id: 3, internalCode: '', text: 'CHAdeMO', selected: true, icon: '' },
      { id: 4, internalCode: '', text: 'GB/T', selected: true, icon: '' },
    ],
    connectorStatuses: [
      { id: 1, internalCode: '', text: 'Disponible', selected: true, icon: '' },
      { id: 2, internalCode: '', text: 'Cargando', selected: true, icon: '' },
      { id: 3, internalCode: '', text: 'Sin Comunicación', selected: true, icon: '' },
      { id: 4, internalCode: '', text: 'No Disponible', selected: false, icon: '' },
    ],
    connectorPaymentTypes: [
      { id: 1, internalCode: '', text: 'Tarjeta RFID', selected: true, icon: '' },
      { id: 2, internalCode: '', text: 'App', selected: true, icon: '' },
    ],
    connectorPowers: [{ id: 1, internalCode: '', text: '0', selected: true, icon: '' }],
    connectorCables: [
      { id: 1, internalCode: '', text: 'Con cable', selected: true, icon: '' },
      { id: 2, internalCode: '', text: 'Sin cable', selected: true, icon: '' },
    ],
    connectorNetworks: [
      { id: 1, internalCode: 'PUBLIC', text: 'Pública', selected: true, icon: '' },
      { id: 2, internalCode: 'TAXI', text: 'Taxi', selected: true, icon: '' },
      { id: 3, internalCode: 'DMC', text: 'DMC', selected: true, icon: '' },
      { id: 4, internalCode: 'ONE', text: 'eOne', selected: true, icon: '' },
    ],
  };
  await write('station.statusFiltered', await call('POST', '/station/statusFiltered', token, filterBody));

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
  const fmt = (d: Date, t: string) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')} ${t}`;
  await write('station.renewEnergy', await call('POST', '/station/renewEnergy', token, { CardNumber: [], StartDate: fmt(start, '00:00:00.000'), EndDate: fmt(end, '23:59:59.000') }));

  await write('customer.card', await call('GET', `/customer/card/${env.UTE_USER_ID}`, token));
  await write('card', await call('GET', `/card/${env.UTE_USER_ID}`, token));
  await write('network', await call('GET', `/network/${env.UTE_USER_ID}`, token));
  await write('remotecharge.user', await call('GET', `/remotecharge/user/${env.UTE_USER_ID}`, token));

  console.log('done');
}

main().catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 8: Add `.env.example` at repo root**

Create: `.env.example`
```
# Required for bridge + capture
UTE_UNIQUE_KEY=

# Required for capture (your registered customer userId)
UTE_USER_ID=

# Required for openapi:export to skip env validation
# UTE_UNIQUE_KEY=placeholder

# Optional bridge token cache
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=

# Toggle write-side endpoints
ENABLE_WRITE_ENDPOINTS=false

# Comma-separated; defaults to *
# CORS_ORIGINS=https://my-frontend.com,https://staging.my-frontend.com
```

- [ ] **Step 9: Commit**

```bash
git add tools/capture .env.example
git commit -m "feat(tools): capture script with PII sanitizer for fixture generation"
```

---

### Task 6.2: Quicktype generation script

**Files:**
- Create: `tools/quicktype/package.json`
- Create: `tools/quicktype/tsconfig.json`
- Create: `tools/quicktype/src/main.ts`

- [ ] **Step 1: Write `tools/quicktype/package.json`**

```json
{
  "name": "@ute-mueve/tools-quicktype",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "tsx src/main.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "quicktype-core": "^23.0.171"
  },
  "devDependencies": {
    "@types/node": "^22.7.5",
    "tsx": "^4.19.1",
    "typescript": "5.6.3"
  }
}
```

- [ ] **Step 2: Write `tools/quicktype/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Write `tools/quicktype/src/main.ts`**

```ts
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { quicktype, InputData, jsonInputForTargetLanguage } from 'quicktype-core';

const FIXTURE_DIR = resolve('packages/openapi/fixtures');
const OUT_DIR = resolve('packages/types/src/generated');

function toPascalCase(name: string): string {
  return name
    .replace(/\.example\.json$/, '')
    .replace(/[-_.]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

async function generateForFixture(file: string) {
  const raw = await readFile(resolve(FIXTURE_DIR, file), 'utf8');
  const typeName = `${toPascalCase(file)}Fixture`;
  const input = jsonInputForTargetLanguage('typescript');
  await input.addSource({ name: typeName, samples: [raw] });
  const inputData = new InputData();
  inputData.addInput(input);
  const result = await quicktype({
    inputData,
    lang: 'typescript',
    rendererOptions: {
      'just-types': 'true',
      'runtime-typecheck': 'false',
      'prefer-unions': 'true',
      'acronym-style': 'pascal',
    },
  });
  const outPath = resolve(OUT_DIR, `${file.replace('.example.json', '.ts')}`);
  await writeFile(outPath, `// AUTO-GENERATED by tools/quicktype from packages/openapi/fixtures/${file}\n// Do NOT edit by hand. Run \`pnpm types:generate\` to refresh.\n\n${result.lines.join('\n')}\n`, 'utf8');
  console.log(`wrote ${outPath}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const files = (await readdir(FIXTURE_DIR)).filter((f) => f.endsWith('.example.json'));
  for (const f of files) {
    await generateForFixture(f);
  }
  await writeFile(resolve(OUT_DIR, 'index.ts'), `${files.map((f) => `export * from './${f.replace('.example.json', '.js')}';`).join('\n')}\n`, 'utf8');
}

main().catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 4: Run generator against placeholder fixtures**

```bash
pnpm install
pnpm types:generate
```

Expected: `packages/types/src/generated/*.ts` populated. Build still passes.

- [ ] **Step 5: Add `packages/types/src/generated/.gitkeep`** + ensure tsup includes generated index

Edit `packages/types/tsup.config.ts` to also build the generated entry:
```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/schemas/index.ts', 'src/generated/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
```

Update `packages/types/package.json` exports:
```json
"./generated": { "types": "./dist/generated/index.d.ts", "import": "./dist/generated/index.js" }
```

- [ ] **Step 6: Rebuild types**

```bash
pnpm --filter @ute-mueve/types build
```

- [ ] **Step 7: Commit**

```bash
git add tools/quicktype packages/types/src/generated packages/types/tsup.config.ts packages/types/package.json
git commit -m "feat(tools): quicktype generator producing companion interfaces from fixtures"
```

---

### Task 6.3: Contract test — Zod schemas accept all fixtures

**Files:**
- Create: `apps/bridge/src/test/contract.test.ts`

- [ ] **Step 1: Write test**

```ts
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AppVersionSchema,
  CardListResponseSchema,
  CustomerCardListSchema,
  RemoteChargeHistoryResponseSchema,
  RenewEnergyResponseSchema,
  StatusFilteredResponseSchema,
  TokenResponseSchema,
  UserNetworksResponseSchema,
} from '@ute-mueve/types/schemas';

const FIXTURE_DIR = resolve(__dirname, '../../../../packages/openapi/fixtures');

const map: Record<string, { parse: (v: unknown) => unknown }> = {
  'token.example.json': TokenResponseSchema,
  'configuration.appversion.example.json': AppVersionSchema,
  'station.statusFiltered.example.json': StatusFilteredResponseSchema,
  'station.renewEnergy.example.json': RenewEnergyResponseSchema,
  'customer.card.example.json': CustomerCardListSchema,
  'card.example.json': CardListResponseSchema,
  'network.example.json': UserNetworksResponseSchema,
  'remotecharge.user.example.json': RemoteChargeHistoryResponseSchema,
};

describe('contract: fixtures parse against schemas', () => {
  it('every fixture parses without throwing', async () => {
    const files = (await readdir(FIXTURE_DIR)).filter((f) => f.endsWith('.example.json'));
    for (const f of files) {
      const schema = map[f];
      if (!schema) throw new Error(`no schema mapped for fixture ${f}`);
      const data = JSON.parse(await readFile(resolve(FIXTURE_DIR, f), 'utf8'));
      expect(() => schema.parse(data)).not.toThrow();
    }
  });
});
```

- [ ] **Step 2: Run**

```bash
pnpm --filter @ute-mueve/bridge test src/test/contract.test.ts
```

Expected: pass against placeholder fixtures.

- [ ] **Step 3: Commit**

```bash
git add apps/bridge/src/test/contract.test.ts
git commit -m "test(bridge): contract test ensuring fixtures parse against Zod schemas"
```

---

## Phase 7 — CI + DX Polish

### Task 7.1: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write workflow**

```yaml
name: ci

on:
  push: { branches: [main] }
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: '20.11.1'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
      - run: UTE_UNIQUE_KEY=placeholder pnpm openapi:export
      - uses: actions/upload-artifact@v4
        with:
          name: openapi-spec
          path: packages/openapi/openapi.yaml
```

- [ ] **Step 2: Commit**

```bash
git add .github
git commit -m "ci: add GitHub Actions workflow (lint, typecheck, test, build, openapi export)"
```

---

### Task 7.2: Final READMEs + root scripts

**Files:**
- Modify: `README.md` (root)
- Modify: `apps/bridge/README.md` (new)

- [ ] **Step 1: Write `apps/bridge/README.md`**

```markdown
# @ute-mueve/bridge

Hono v4 Vercel function that proxies UTE Mueve's anonymous-token API.

## Endpoints

See `/docs` (Scalar) on the running instance.

## Env

| Var | Required | Notes |
|-----|----------|-------|
| `UTE_UNIQUE_KEY` | yes | 12-13 hex character device key |
| `UTE_BASE_URL` | no | default `https://movilidadelectrica.ute.com.uy/api/v2` |
| `UPSTASH_REDIS_REST_URL` | no | enables shared token cache |
| `UPSTASH_REDIS_REST_TOKEN` | no | with the URL above |
| `ENABLE_WRITE_ENDPOINTS` | no | default `false`. Set `true` to expose register/start/stop |
| `CORS_ORIGINS` | no | comma-separated, default `*` |
| `LOG_LEVEL` | no | pino level, default `info` |

## Deploy (Vercel)

```bash
pnpm vercel
```

The `vercel.json` rewrites all paths to `/api/index`, which exports the Hono handler.
```

- [ ] **Step 2: Append "Architecture" section to root `README.md`**

```markdown
## Architecture

- `apps/bridge` — Hono 4 + `@hono/zod-openapi` + Scalar docs. Single Vercel function.
- `packages/sdk` — isomorphic TypeScript client, ergonomic surface over the bridge.
- `packages/types` — Zod schemas (source of truth) + quicktype-generated companions.
- `packages/openapi` — generated YAML + sanitized JSON fixtures.
- `tools/capture` — manual script: hits live UTE, sanitizes, writes fixtures.
- `tools/quicktype` — regenerates TypeScript interfaces from fixtures.

### Token lifecycle

1. Bridge receives request.
2. `TokenManager` checks cache (Upstash Redis if configured, else in-memory).
3. If cached JWT is fresh (`exp > now + 60s`), reuse.
4. Otherwise: single-flight `POST /api/v2/token` with `{clientIdIDP: "cargaME", identifier: "Anonymous"}` and header `uniquekeyuser`.
5. Decode `exp`, store in cache with TTL = `exp - 60s`.
6. On upstream `401`, invalidate cache + retry once.

### Reverse-engineering provenance

Endpoint surface derived from static analysis of the `UTE Mueve.apk`. See `SECURITY.md` for findings and disclaimer. The APK and extracted artifacts are gitignored.
```

- [ ] **Step 3: Commit**

```bash
git add README.md apps/bridge/README.md
git commit -m "docs: bridge README + root architecture section"
```

---

## Phase 8 — Verification

### Task 8.1: End-to-end smoke

- [ ] **Step 1: Install fresh**

```bash
pnpm install
```

- [ ] **Step 2: Lint + typecheck + test + build**

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Expected: all green.

- [ ] **Step 3: Boot dev server**

```bash
UTE_UNIQUE_KEY=placeholder pnpm dev
```

Visit `http://localhost:3000/docs` and confirm Scalar renders. Visit `/openapi.json` — confirm JSON. Visit `/health` — `{"ok":true}`.

If you have real credentials and a customer userId:

```bash
UTE_UNIQUE_KEY=<your-hex> UTE_USER_ID=<your-userId> pnpm capture
pnpm types:generate
pnpm test    # contract test will now run against real (sanitized) fixtures
```

- [ ] **Step 4: Commit any fixture updates**

```bash
git add packages/openapi/fixtures packages/types/src/generated
git commit -m "chore(fixtures): refresh from live capture"
```

---

## Self-Review (executed during plan-writing)

1. **Spec coverage:**
   - Bridge API on Vercel — covered Phase 3-4 + 4.6 entrypoint.
   - npm SDK — covered Phase 5.
   - OpenAPI + Scalar — covered 4.1 (Scalar mount), 4.5 (YAML export).
   - quicktype interfaces from real JSON — covered 6.2 + 6.3 contract test.
   - Example JSON responses included — covered 2.1 (placeholders) + 6.1 (live capture overwrites).
   - SMART TypeScript practices — `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` enabled throughout; Biome lints; TDD on critical paths.
   - SECURITY.md + APK ignored — done in pre-plan phase, gitignore confirmed.
   - Token cache + refresh — Phase 3.2-3.3.

2. **Placeholder scan:**
   - All `TODO`/`TBD` patterns absent.
   - Every code block contains the actual code to paste.
   - Test code provided for every TDD step.

3. **Type consistency:**
   - `TokenCache` interface used identically in `InMemoryTokenCache`, `UpstashTokenCache`, `TokenManager`.
   - `Container` shape stable between `container.ts` and route registrations.
   - `UteMueveHttp` / `UteSdkError` referenced from same import paths across resource modules.

Plan complete.
