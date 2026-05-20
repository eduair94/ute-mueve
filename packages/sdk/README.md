# @ute-mueve/sdk

Isomorphic TypeScript SDK for the [UTE Mueve bridge API](https://github.com/eduair94/ute-mueve) — unofficial.

Zero runtime dependencies. Works in Node 20+ and any browser/edge runtime with a global `fetch`.

## Install

```bash
pnpm add @ute-mueve/sdk
# or
npm i @ute-mueve/sdk
```

## Quickstart

```ts
import { UteMueveClient } from '@ute-mueve/sdk';

const client = new UteMueveClient({
  baseUrl: 'https://your-bridge.vercel.app',
});

// List available stations with CCS2/CHAdeMO/GB-T on public networks
const stations = await client.stations.filtered({
  connectorTypes: ['CCS2', 'CHAdeMO', 'GB/T'],
  statuses: ['available'],
  networks: ['PUBLIC'],
});

// Renewable-energy stats for May 2026
const renewable = await client.stations.renewableEnergy({
  start: new Date('2026-05-01'),
  end: new Date('2026-05-31'),
});

// Customer-scoped — see SECURITY.md F-05 / VR-001 for the IDOR caveat
const customerKey = '<CI or Firebase UID>';
const cards = await client.customer.cards(customerKey);
const networks = await client.network.get(customerKey);
const history = await client.remoteCharge.history(customerKey);

// Account lookup by Uruguayan CI
const accounts = await client.accounts.byCI('10000000');
```

## Resources

| Resource | Methods |
|---|---|
| `client.configuration` | `appVersion()` |
| `client.stations` | `filtered({connectorTypes,statuses,paymentTypes,cables,networks,powers})`, `renewableEnergy({start,end,cardNumbers?})` |
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
