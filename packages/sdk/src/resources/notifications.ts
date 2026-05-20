import type { schemas } from '@ute-mueve/types';
import type { UteMueveHttp } from '../client.js';

export class NotificationsResource {
  constructor(private readonly http: UteMueveHttp) {}

  register(
    payload: schemas.NotificationRegisterRequest,
  ): Promise<schemas.NotificationRegisterResponse> {
    const path = this.http.isDirect() ? '/notification/register/' : '/notification/register';
    return this.http.post<schemas.NotificationRegisterResponse>(path, payload);
  }
}
