import type { schemas } from '@ute-mueve/types';
import type { UteMueveHttp } from '../client.js';

export class NetworkResource {
  constructor(private readonly http: UteMueveHttp) {}

  get(customerKey: string): Promise<schemas.UserNetworksResponse> {
    return this.http.get<schemas.UserNetworksResponse>(
      `/network/${encodeURIComponent(customerKey)}`,
    );
  }
}
