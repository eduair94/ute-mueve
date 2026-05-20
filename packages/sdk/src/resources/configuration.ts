import type { schemas } from '@ute-mueve/types';
import type { UteMueveHttp } from '../client.js';

export class ConfigurationResource {
  constructor(private readonly http: UteMueveHttp) {}

  appVersion(): Promise<schemas.AppVersionResponse> {
    return this.http.get<schemas.AppVersionResponse>('/configuration/appversion');
  }
}
