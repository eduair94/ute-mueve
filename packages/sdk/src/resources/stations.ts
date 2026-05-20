import { distance, expandStationsFilters, type schemas } from '@ute-mueve/types';
import type { UteMueveHttp } from '../client.js';

function toUteDate(input: Date | string, fallbackTime: string): string {
  if (typeof input === 'string') return input;
  const y = input.getUTCFullYear();
  const m = String(input.getUTCMonth() + 1).padStart(2, '0');
  const d = String(input.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d} ${fallbackTime}`;
}

export class StationsResource {
  constructor(private readonly http: UteMueveHttp) {}

  /**
   * Friendly search using ergonomic enum strings.
   *
   * ```ts
   * await client.stations.search({
   *   connectorTypes: ['CCS2', 'CHAdeMO'],
   *   statuses: ['available'],
   *   networks: ['PUBLIC'],
   * });
   * ```
   */
  search(input: schemas.StationsSearchRequest = {}): Promise<schemas.StatusFilteredResponse> {
    // Always expand locally and call UTE-native `/station/statusFiltered` so the
    // request works against UTE directly or via the bridge (which proxies 1:1).
    return this.http.post<schemas.StatusFilteredResponse>(
      '/station/statusFiltered',
      expandStationsFilters(input),
    );
  }

  /** Shortcut: all stations that report `Disponible` right now. */
  available(): Promise<schemas.StatusFilteredResponse> {
    return this.search({ statuses: ['available'] });
  }

  /** All stations on a specific network (PUBLIC, TAXI, DMC, ONE). */
  byNetwork(
    network: 'PUBLIC' | 'TAXI' | 'DMC' | 'ONE',
    extra: Omit<schemas.StationsSearchRequest, 'networks'> = {},
  ): Promise<schemas.StatusFilteredResponse> {
    return this.search({ ...extra, networks: [network] });
  }

  /**
   * Friendly search + client-side radius filter. UTE doesn't accept a geo
   * filter, so we fetch and trim by Haversine distance.
   */
  async near(
    point: { lat: number; lng: number; radiusMeters?: number },
    extra: schemas.StationsSearchRequest = {},
  ): Promise<schemas.StatusFilteredResponse> {
    const all = await this.search(extra);
    const r = point.radiusMeters ?? 10000;
    const data = (all.data ?? []).filter((s) => {
      const lat = (s as { lat?: number }).lat;
      const lng = (s as { lat?: number; lng?: number }).lng;
      if (typeof lat !== 'number' || typeof lng !== 'number') return false;
      return distance({ lat, lng }, point) <= r;
    });
    return { ...all, data };
  }

  /**
   * Power-user method: send UTE's verbose filter body verbatim.
   * Use only when you need access to a specific connector-power filter
   * or other niche selectors. Most callers should use `search()`.
   */
  filtered(
    input: schemas.StationsSearchRequest = {},
  ): Promise<schemas.StatusFilteredResponse> {
    return this.http.post<schemas.StatusFilteredResponse>(
      '/station/statusFiltered',
      expandStationsFilters(input),
    );
  }

  /**
   * Aggregated renewable-energy metrics for a date range.
   */
  renewableEnergy(opts: {
    start: Date | string;
    end: Date | string;
    cardNumbers?: string[];
  }): Promise<schemas.RenewEnergyResponse> {
    const body: schemas.RenewEnergyRequest = {
      CardNumber: opts.cardNumbers ?? [],
      StartDate: toUteDate(opts.start, '00:00:00.000'),
      EndDate: toUteDate(opts.end, '23:59:59.000'),
    };
    return this.http.post<schemas.RenewEnergyResponse>('/station/renewEnergy', body);
  }
}
