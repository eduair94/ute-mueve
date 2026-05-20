import type { schemas } from '@ute-mueve/types';
import { expandFilters, type StationFilterInput } from '../filters.js';
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
   * List stations matching connector filters. Pass selected categories with
   * ergonomic enum strings; the SDK expands them to UTE's verbose filter
   * payload internally.
   */
  filtered(input: StationFilterInput = {}): Promise<schemas.StatusFilteredResponse> {
    return this.http.post<schemas.StatusFilteredResponse>(
      '/station/statusFiltered',
      expandFilters(input),
    );
  }

  /**
   * Aggregated renewable-energy metrics for a date range. Pass Date objects or
   * pre-formatted `YYYY-MM-DD HH:mm:ss.SSS` strings.
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
