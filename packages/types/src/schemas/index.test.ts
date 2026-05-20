import { describe, expect, it } from 'vitest';
import {
  CardDetailSchema,
  CustomerCardSchema,
  NetworkSchema,
  RemoteChargeSessionSchema,
  StartRemoteChargeRequestSchema,
  TokenResponseSchema,
} from './index.js';

describe('schemas smoke', () => {
  it('TokenResponseSchema parses minimal', () => {
    expect(() => TokenResponseSchema.parse({ access_token: 'x', expires_in: 3600 })).not.toThrow();
  });
  it('CustomerCardSchema accepts passthrough fields', () => {
    expect(() => CustomerCardSchema.parse({ cardId: 'a', extra: 1 })).not.toThrow();
  });
  it('CardDetailSchema accepts inheritance', () => {
    expect(() => CardDetailSchema.parse({ balance: 42 })).not.toThrow();
  });
  it('NetworkSchema accepts varied ids', () => {
    expect(() => NetworkSchema.parse({ networkId: 'PUBLIC' })).not.toThrow();
    expect(() => NetworkSchema.parse({ networkId: 1 })).not.toThrow();
  });
  it('RemoteChargeSessionSchema accepts null endTime', () => {
    expect(() => RemoteChargeSessionSchema.parse({ endTime: null })).not.toThrow();
  });
  it('StartRemoteChargeRequestSchema requires fields', () => {
    expect(() =>
      StartRemoteChargeRequestSchema.parse({
        userId: 'u',
        stationId: 1,
        connectorId: 1,
        cardId: 'c',
      }),
    ).not.toThrow();
    expect(() => StartRemoteChargeRequestSchema.parse({ userId: 'u' })).toThrow();
  });
});
