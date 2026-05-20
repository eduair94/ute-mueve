/**
 * Static JSON imports. esbuild bundles the fixture content directly into the
 * function bundle, so no runtime fs is required.
 */
import tokenJson from '../../../packages/openapi/fixtures/token.example.json' with { type: 'json' };
import configurationJson from '../../../packages/openapi/fixtures/configuration.appversion.example.json' with { type: 'json' };
import stationStatusFilteredJson from '../../../packages/openapi/fixtures/station.statusFiltered.example.json' with { type: 'json' };
import stationRenewEnergyJson from '../../../packages/openapi/fixtures/station.renewEnergy.example.json' with { type: 'json' };
import customerCardJson from '../../../packages/openapi/fixtures/customer.card.example.json' with { type: 'json' };
import cardJson from '../../../packages/openapi/fixtures/card.example.json' with { type: 'json' };
import cardAccountsJson from '../../../packages/openapi/fixtures/card.accounts.example.json' with { type: 'json' };
import networkJson from '../../../packages/openapi/fixtures/network.example.json' with { type: 'json' };
import remoteChargeUserJson from '../../../packages/openapi/fixtures/remotecharge.user.example.json' with { type: 'json' };

export const tokenExample: unknown = tokenJson;
export const configurationAppVersionExample: unknown = configurationJson;
export const stationStatusFilteredExample: unknown = stationStatusFilteredJson;
export const stationRenewEnergyExample: unknown = stationRenewEnergyJson;
export const customerCardExample: unknown = customerCardJson;
export const cardExample: unknown = cardJson;
export const cardAccountsExample: unknown = cardAccountsJson;
export const networkExample: unknown = networkJson;
export const remoteChargeUserExample: unknown = remoteChargeUserJson;
