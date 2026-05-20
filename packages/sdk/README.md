# @ute-mueve/sdk

Isomorphic TypeScript SDK for the [UTE Mueve bridge API](https://github.com/eduair94/ute-mueve) — unofficial.

Zero runtime dependencies. Works in Node 20+ and any browser/edge runtime with a global `fetch`.

## Install

```bash
pnpm add @ute-mueve/sdk
# or
npm i @ute-mueve/sdk
```

## Modes

| Mode | When to use | Setup |
|---|---|---|
| **Direct** (default) | Node.js scripts, server-side code | `new UteMueveClient()` — SDK handles token + `uniquekeyuser` |
| **Bridge** | Browser (CORS) or hosted gateway with API-key/rate-limit | `new UteMueveClient({ baseUrl: 'https://your-bridge.vercel.app' })` |

## Quickstart

```ts
import { UteMueveClient } from '@ute-mueve/sdk';

// Direct mode — SDK calls movilidadelectrica.ute.com.uy/api/v2 itself,
// acquires the anonymous JWT on first request, caches it in memory,
// refreshes on expiry/401.
const client = new UteMueveClient();

// Browser? Use the public bridge to bypass CORS:
//   const client = new UteMueveClient({ baseUrl: 'https://ute-mueve.vercel.app' });

// Shortest path: all available stations right now
const open = await client.stations.available();

// Friendly filter
const ccs2 = await client.stations.search({
  connectorTypes: ['CCS2', 'CHAdeMO'],
  statuses: ['available'],
  networks: ['PUBLIC'],
});

// Within 5 km of a point (Haversine, client-side)
const nearby = await client.stations.near({
  lat: -34.9061, lng: -56.1990, radiusMeters: 5000,
});

// Single-network shortcut
const taxi = await client.stations.byNetwork('TAXI');

// Renewable-energy stats for May 2026
const renewable = await client.stations.renewableEnergy({
  start: new Date('2026-05-01'),
  end: new Date('2026-05-31'),
});

// Customer-scoped — see SECURITY.md F-05 / VR-001 for the IDOR caveat
const customerKey = '<8-digit CI or Firebase UID>';
const cards = await client.customer.cards(customerKey);
const networks = await client.network.get(customerKey);
const history = await client.remoteCharge.history(customerKey);

// Account lookup by Uruguayan CI (digit-verifier validated)
const accounts = await client.accounts.byCI('12345672');

// Power user: send UTE's verbose body verbatim
const advanced = await client.stations.filtered({ /* same StationFilterInput */ });
```

### Filter enums

| Field | Values |
|---|---|
| `connectorTypes` | `'Tipo 2'`, `'CCS2'`, `'CHAdeMO'`, `'GB/T'` |
| `statuses` | `'available'`, `'charging'`, `'no-comm'`, `'unavailable'` |
| `paymentTypes` | `'rfid'`, `'app'` |
| `cables` | `'with'`, `'without'` |
| `networks` | `'PUBLIC'`, `'TAXI'`, `'DMC'`, `'ONE'` |
| `powers` | `number[]` kW (use `[0]` for any) |

All fields optional. Defaults: every connector type + network + payment + cable selected; status defaults to `['available']`; power defaults to `[0]` (any).

## Resources

| Resource | Methods |
|---|---|
| `client.configuration` | `appVersion()` |
| `client.stations` | `search(input?)`, `available()`, `byNetwork(network, extra?)`, `near({lat,lng,radiusMeters?}, extra?)`, `filtered(input?)`, `renewableEnergy({start,end,cardNumbers?})` |
| `client.customer` | `cards(customerKey)`, `registerCard(payload)` *(write)*, `unregisterCard(payload)` *(write)* |
| `client.card` | `list(customerKey)` |
| `client.network` | `get(customerKey)` |
| `client.remoteCharge` | `history(customerKey)`, `transaction(transactionId)`, `connectorStatus(payload)`, `start(payload)` *(write)*, `stop(payload)` *(write)* |
| `client.accounts` | `byCI(ci, {onlyUte?})`, `lookup(payload)` |
| `client.notifications` | `register(payload)` *(write)* |

Write endpoints require `ENABLE_WRITE_ENDPOINTS=true` on the bridge.

## Errors

All SDK methods throw `UteSdkError` on failure with `code`, `status`, `message`, `details`, and the raw `upstream` body when available.

```ts
import { UteSdkError } from '@ute-mueve/sdk';

try {
  await client.customer.cards(customerKey);
} catch (err) {
  if (err instanceof UteSdkError) {
    console.error(err.code, err.status, err.message);
  }
}
```

## Types

All response types are exported from the package root (re-export of `@ute-mueve/types/schemas`). Quicktype-generated companion interfaces — derived from real captured responses — are available in `@ute-mueve/types/generated`.

## License

MIT
