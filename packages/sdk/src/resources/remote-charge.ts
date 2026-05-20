import type { schemas } from '@ute-mueve/types';
import type { UteMueveHttp } from '../client.js';

export class RemoteChargeResource {
  constructor(private readonly http: UteMueveHttp) {}

  history(customerKey: string): Promise<schemas.RemoteChargeHistoryResponse> {
    return this.http.get<schemas.RemoteChargeHistoryResponse>(
      `/remotecharge/user/${encodeURIComponent(customerKey)}`,
    );
  }

  transaction(transactionId: string): Promise<schemas.ConnectorStatusResponse> {
    return this.http.get<schemas.ConnectorStatusResponse>(
      `/remotecharge/transaction/${encodeURIComponent(transactionId)}`,
    );
  }

  connectorStatus(
    payload: schemas.ConnectorStatusRequest,
  ): Promise<schemas.ConnectorStatusResponse> {
    return this.http.post<schemas.ConnectorStatusResponse>(
      '/remotecharge/connector/status',
      payload,
    );
  }

  start(
    payload: schemas.StartRemoteChargeRequest,
  ): Promise<schemas.RemoteChargeActionResponse> {
    return this.http.post<schemas.RemoteChargeActionResponse>('/remotecharge/start', payload);
  }

  stop(payload: schemas.StopRemoteChargeRequest): Promise<schemas.RemoteChargeActionResponse> {
    return this.http.post<schemas.RemoteChargeActionResponse>('/remotecharge/stop', payload);
  }
}
