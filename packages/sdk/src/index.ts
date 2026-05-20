import { UteMueveHttp, type UteMueveClientOpts } from './client.js';
import { ConfigurationResource } from './resources/configuration.js';
import { StationsResource } from './resources/stations.js';
import { CustomerResource } from './resources/customer.js';
import { CardResource } from './resources/card.js';
import { NetworkResource } from './resources/network.js';
import { RemoteChargeResource } from './resources/remote-charge.js';
import { AccountsResource } from './resources/accounts.js';
import { NotificationsResource } from './resources/notifications.js';

export { UteSdkError } from './errors.js';
export type { UteMueveClientOpts, UteMueveHttp } from './client.js';
export type { StationFilterInput, ExpandedStationFilters } from './filters.js';
export { expandFilters, distance } from './filters.js';
export type * from '@ute-mueve/types/schemas';

/**
 * Main entry point. One instance covers all resources.
 *
 * ```ts
 * import { UteMueveClient } from '@ute-mueve/sdk';
 *
 * const client = new UteMueveClient({ baseUrl: 'https://ute-mueve.vercel.app' });
 *
 * // All available stations
 * const open = await client.stations.available();
 *
 * // Friendly filter
 * const ccs2 = await client.stations.search({
 *   connectorTypes: ['CCS2', 'CHAdeMO'],
 *   statuses: ['available'],
 *   networks: ['PUBLIC'],
 * });
 *
 * // Within 5 km of Plaza Independencia
 * const nearby = await client.stations.near({
 *   lat: -34.9061, lng: -56.1990, radiusMeters: 5000,
 * });
 * ```
 */
export class UteMueveClient {
  readonly configuration: ConfigurationResource;
  readonly stations: StationsResource;
  readonly customer: CustomerResource;
  readonly card: CardResource;
  readonly network: NetworkResource;
  readonly remoteCharge: RemoteChargeResource;
  readonly accounts: AccountsResource;
  readonly notifications: NotificationsResource;

  constructor(opts: UteMueveClientOpts = {}) {
    const http = new UteMueveHttp(opts);
    this.configuration = new ConfigurationResource(http);
    this.stations = new StationsResource(http);
    this.customer = new CustomerResource(http);
    this.card = new CardResource(http);
    this.network = new NetworkResource(http);
    this.remoteCharge = new RemoteChargeResource(http);
    this.accounts = new AccountsResource(http);
    this.notifications = new NotificationsResource(http);
  }
}
