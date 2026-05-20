/**
 * Centralized fixture loader for OpenAPI examples.
 *
 * Read at startup from `packages/openapi/fixtures/*.json`. We use `createRequire`
 * + path resolution rather than ESM JSON import attributes so the bundle ships
 * cleanly on Vercel's Node runtime without flags.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = resolve(here, '../../../packages/openapi/fixtures');

function load(name: string): unknown {
  return require(resolve(fixturesDir, name));
}

export const tokenExample = load('token.example.json');
export const configurationAppVersionExample = load('configuration.appversion.example.json');
export const stationStatusFilteredExample = load('station.statusFiltered.example.json');
export const stationRenewEnergyExample = load('station.renewEnergy.example.json');
export const customerCardExample = load('customer.card.example.json');
export const cardExample = load('card.example.json');
export const cardAccountsExample = load('card.accounts.example.json');
export const networkExample = load('network.example.json');
export const remoteChargeUserExample = load('remotecharge.user.example.json');
