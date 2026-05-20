import { describe, expect, it } from 'vitest';
import { RenewEnergyRequestSchema, StatusFilteredRequestSchema } from './station.js';

describe('StatusFilteredRequestSchema', () => {
  it('parses real APK-derived payload', () => {
    const payload = {
      connectorTypes: [
        { id: 1, internalCode: '', text: 'Tipo 2', selected: false, icon: 'x.png' },
      ],
      connectorStatuses: [
        { id: 1, internalCode: '', text: 'Disponible', selected: true, icon: '' },
      ],
      connectorPaymentTypes: [
        { id: 1, internalCode: '', text: 'App', selected: true, icon: '' },
      ],
      connectorPowers: [{ id: 1, internalCode: '', text: '60.0', selected: true, icon: '' }],
      connectorCables: [
        { id: 2, internalCode: '', text: 'Sin cable', selected: true, icon: '' },
      ],
      connectorNetworks: [
        { id: 1, internalCode: 'PUBLIC', text: 'Pública', selected: true, icon: '' },
      ],
    };
    expect(() => StatusFilteredRequestSchema.parse(payload)).not.toThrow();
  });
});

describe('RenewEnergyRequestSchema', () => {
  it('parses observed body', () => {
    const body = {
      CardNumber: [],
      EndDate: '2026-05-31 23:59:59.000',
      StartDate: '2026-05-01 00:00:00.000',
    };
    expect(() => RenewEnergyRequestSchema.parse(body)).not.toThrow();
  });
});
