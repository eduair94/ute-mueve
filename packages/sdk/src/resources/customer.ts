import type { schemas } from '@ute-mueve/types';
import type { UteMueveHttp } from '../client.js';

export class CustomerResource {
  constructor(private readonly http: UteMueveHttp) {}

  /**
   * Credit-card metadata associated with the customer. `customerKey` accepts
   * either a Firebase UID or a bare Uruguayan CI (see SECURITY.md F-05).
   */
  cards(customerKey: string): Promise<schemas.CustomerCardList> {
    return this.http.get<schemas.CustomerCardList>(
      `/customer/card/${encodeURIComponent(customerKey)}`,
    );
  }

  registerCard(payload: schemas.RegisterCardRequest): Promise<schemas.RegisterCardResponse> {
    return this.http.post<schemas.RegisterCardResponse>('/customer/card/register', payload);
  }

  unregisterCard(
    payload: Partial<schemas.RegisterCardRequest>,
  ): Promise<schemas.RegisterCardResponse> {
    return this.http.post<schemas.RegisterCardResponse>('/customer/card/unregister', payload);
  }
}
