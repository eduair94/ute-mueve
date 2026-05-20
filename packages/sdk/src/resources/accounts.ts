import type { schemas } from '@ute-mueve/types';
import type { UteMueveHttp } from '../client.js';

export class AccountsResource {
  constructor(private readonly http: UteMueveHttp) {}

  /**
   * Look up a customer's account(s) by document number.
   *
   * Most common form: `byCI('47073450')`. This is the same lookup
   * documented in VR-001; treat the result as PII.
   */
  byCI(ci: string, opts: { onlyUte?: boolean } = {}): Promise<schemas.AccountsLookupResponse> {
    return this.http.post<schemas.AccountsLookupResponse>('/card/accounts', {
      docType: 'CI',
      docNumber: ci,
      onlyUte: opts.onlyUte ?? false,
    });
  }

  lookup(payload: schemas.AccountsLookupRequest): Promise<schemas.AccountsLookupResponse> {
    return this.http.post<schemas.AccountsLookupResponse>('/card/accounts', payload);
  }
}
