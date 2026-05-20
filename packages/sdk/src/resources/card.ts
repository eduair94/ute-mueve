import type { schemas } from '@ute-mueve/types';
import type { UteMueveHttp } from '../client.js';

export class CardResource {
  constructor(private readonly http: UteMueveHttp) {}

  /** UTE-issued cards (RFID, etc.) for the customer. */
  list(customerKey: string): Promise<schemas.CardListResponse> {
    return this.http.get<schemas.CardListResponse>(`/card/${encodeURIComponent(customerKey)}`);
  }

  /** @deprecated kept for legacy callers; use {@link list}. */
  detail(customerKey: string): Promise<schemas.CardListResponse> {
    return this.list(customerKey);
  }
}
