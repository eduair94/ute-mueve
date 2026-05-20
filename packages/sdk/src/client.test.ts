import { describe, expect, it, vi } from 'vitest';
import { UteMueveClient, UteSdkError } from './index.js';

describe('UteMueveClient', () => {
  it('exposes resource groups', () => {
    const client = new UteMueveClient({ baseUrl: 'https://b.test' });
    expect(client.stations).toBeDefined();
    expect(client.customer).toBeDefined();
    expect(client.card).toBeDefined();
    expect(client.network).toBeDefined();
    expect(client.remoteCharge).toBeDefined();
    expect(client.accounts).toBeDefined();
    expect(client.notifications).toBeDefined();
    expect(client.configuration).toBeDefined();
  });

  it('stations.filtered expands ergonomic filters into UTE shape', async () => {
    const fetchMock = vi.fn(async (_url, init) => {
      const body = JSON.parse((init as RequestInit).body as string);
      const status = body.connectorStatuses.find(
        (s: { text: string; selected: boolean }) => s.text === 'Disponible',
      );
      expect(status.selected).toBe(true);
      expect(body.connectorNetworks.length).toBe(4);
      return new Response(
        JSON.stringify({ data: [], messages: [], success: true, errors: [], result: 0 }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    });
    const client = new UteMueveClient({
      baseUrl: 'https://b.test',
      fetch: fetchMock as unknown as typeof fetch,
    });
    await client.stations.filtered({ statuses: ['available'] });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('stations.renewableEnergy formats dates correctly', async () => {
    const fetchMock = vi.fn(async (_url, init) => {
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.StartDate).toMatch(/^2026-05-01 00:00:00\.000$/);
      expect(body.EndDate).toMatch(/^2026-05-31 23:59:59\.000$/);
      return new Response(
        JSON.stringify({ data: {}, messages: [], success: true, errors: [], result: 0 }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    });
    const client = new UteMueveClient({
      baseUrl: 'https://b.test',
      fetch: fetchMock as unknown as typeof fetch,
    });
    await client.stations.renewableEnergy({
      start: new Date(Date.UTC(2026, 4, 1)),
      end: new Date(Date.UTC(2026, 4, 31)),
    });
  });

  it('throws UteSdkError on bridge error body', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ error: { code: 'BAD', status: 400, message: 'no' } }),
          { status: 400, headers: { 'content-type': 'application/json' } },
        ),
    );
    const client = new UteMueveClient({
      baseUrl: 'https://b.test',
      fetch: fetchMock as unknown as typeof fetch,
    });
    await expect(client.configuration.appVersion()).rejects.toBeInstanceOf(UteSdkError);
  });

  it('accounts.byCI sends docType=CI', async () => {
    const fetchMock = vi.fn(async (_url, init) => {
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body).toEqual({ docType: 'CI', docNumber: '10000000', onlyUte: false });
      return new Response(
        JSON.stringify({ data: [], messages: [], success: true, errors: [], result: 0 }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    });
    const client = new UteMueveClient({
      baseUrl: 'https://b.test',
      fetch: fetchMock as unknown as typeof fetch,
    });
    await client.accounts.byCI('10000000');
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
