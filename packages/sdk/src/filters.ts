import type { UteFilterOption } from '@ute-mueve/types';

export interface StationFilterInput {
  connectorTypes?: ('Tipo 2' | 'CCS2' | 'CHAdeMO' | 'GB/T')[];
  statuses?: ('available' | 'charging' | 'no-comm' | 'unavailable')[];
  paymentTypes?: ('rfid' | 'app')[];
  cables?: ('with' | 'without')[];
  networks?: ('PUBLIC' | 'TAXI' | 'DMC' | 'ONE')[];
  /** Powers in kW. Use 0 to mean "any". */
  powers?: number[];
}

const TYPE_MAP: Record<string, { id: number; text: string; icon: string }> = {
  'Tipo 2': { id: 1, text: 'Tipo 2', icon: 'assets/images/Tipo2/desconocido.png' },
  CCS2: { id: 2, text: 'CCS2', icon: 'assets/images/CCS2/desconocido.png' },
  CHAdeMO: { id: 3, text: 'CHAdeMO', icon: 'assets/images/Chademo/desconocido.png' },
  'GB/T': { id: 4, text: 'GB/T', icon: 'assets/images/Gbt/desconocido.png' },
};

const STATUS_MAP: Record<string, { id: number; text: string }> = {
  available: { id: 1, text: 'Disponible' },
  charging: { id: 2, text: 'Cargando' },
  'no-comm': { id: 3, text: 'Sin Comunicación' },
  unavailable: { id: 4, text: 'No Disponible' },
};

const PAYMENT_MAP: Record<string, { id: number; text: string }> = {
  rfid: { id: 1, text: 'Tarjeta RFID' },
  app: { id: 2, text: 'App' },
};

const CABLE_MAP: Record<string, { id: number; text: string }> = {
  with: { id: 1, text: 'Con cable' },
  without: { id: 2, text: 'Sin cable' },
};

const NETWORK_MAP: Record<string, { id: number; internalCode: string; text: string }> = {
  PUBLIC: { id: 1, internalCode: 'PUBLIC', text: 'Pública' },
  TAXI: { id: 2, internalCode: 'TAXI', text: 'Taxi' },
  DMC: { id: 3, internalCode: 'DMC', text: 'DMC' },
  ONE: { id: 4, internalCode: 'ONE', text: 'eOne' },
};

export function expandFilters(input: StationFilterInput): {
  connectorTypes: UteFilterOption[];
  connectorStatuses: UteFilterOption[];
  connectorPaymentTypes: UteFilterOption[];
  connectorPowers: UteFilterOption[];
  connectorCables: UteFilterOption[];
  connectorNetworks: UteFilterOption[];
} {
  const allTypes = Object.entries(TYPE_MAP).map(([key, v]) => ({
    id: v.id,
    internalCode: '',
    text: v.text,
    selected: input.connectorTypes ? input.connectorTypes.includes(key as never) : true,
    icon: v.icon,
  }));
  const allStatuses = Object.entries(STATUS_MAP).map(([key, v]) => ({
    id: v.id,
    internalCode: '',
    text: v.text,
    selected: input.statuses ? input.statuses.includes(key as never) : key === 'available',
    icon: '',
  }));
  const allPayments = Object.entries(PAYMENT_MAP).map(([key, v]) => ({
    id: v.id,
    internalCode: '',
    text: v.text,
    selected: input.paymentTypes ? input.paymentTypes.includes(key as never) : true,
    icon: '',
  }));
  const allCables = Object.entries(CABLE_MAP).map(([key, v]) => ({
    id: v.id,
    internalCode: '',
    text: v.text,
    selected: input.cables ? input.cables.includes(key as never) : true,
    icon: '',
  }));
  const allNetworks = Object.entries(NETWORK_MAP).map(([key, v]) => ({
    id: v.id,
    internalCode: v.internalCode,
    text: v.text,
    selected: input.networks ? input.networks.includes(key as never) : true,
    icon: '',
  }));
  const powers = (input.powers && input.powers.length ? input.powers : [0]).map((p, i) => ({
    id: i + 1,
    internalCode: '',
    text: String(p),
    selected: true,
    icon: '',
  }));
  return {
    connectorTypes: allTypes,
    connectorStatuses: allStatuses,
    connectorPaymentTypes: allPayments,
    connectorPowers: powers,
    connectorCables: allCables,
    connectorNetworks: allNetworks,
  };
}
