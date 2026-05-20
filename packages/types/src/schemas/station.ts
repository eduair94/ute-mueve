import { z } from 'zod';
import { uteEnvelope } from './envelope.js';
import { IsoDateStringSchema, UteFilterOptionSchema } from '../common.js';

export const StatusFilteredRequestSchema = z.object({
  connectorTypes: z.array(UteFilterOptionSchema),
  connectorStatuses: z.array(UteFilterOptionSchema),
  connectorPaymentTypes: z.array(UteFilterOptionSchema),
  connectorPowers: z.array(UteFilterOptionSchema),
  connectorCables: z.array(UteFilterOptionSchema),
  connectorNetworks: z.array(UteFilterOptionSchema),
});
export type StatusFilteredRequest = z.infer<typeof StatusFilteredRequestSchema>;

export const ConnectorSchema = z
  .object({
    id: z.union([z.number(), z.string()]),
    type: z.string().optional(),
    status: z.string().optional(),
    power: z.union([z.number(), z.string()]).optional(),
    network: z.string().optional(),
    hasCable: z.boolean().optional(),
    paymentTypes: z.array(z.string()).optional(),
  })
  .passthrough();
export type Connector = z.infer<typeof ConnectorSchema>;

/**
 * Station shape observed via live capture against `POST /station/statusFiltered`.
 * Numeric `status` values seen so far: `0` → Available. `statusDetails` is the
 * human-readable counterpart.
 */
export const StationSchema = z
  .object({
    id: z.union([z.number(), z.string()]),
    name: z.string().optional(),
    source: z.string().optional(),
    status: z.union([z.number(), z.string()]).optional(),
    statusDetails: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    chargeNetworkName: z.string().optional(),
    countryCode: z.string().optional(),
    operatorLogoUrl: z.string().nullable().optional(),
    cardUseTypeDiscount: z.unknown().nullable().optional(),
    /** @deprecated use lat */
    latitude: z.number().optional(),
    /** @deprecated use lng */
    longitude: z.number().optional(),
    address: z.string().optional(),
    connectors: z.array(ConnectorSchema).optional(),
  })
  .passthrough();
export type Station = z.infer<typeof StationSchema>;

export const StatusFilteredResponseSchema = uteEnvelope(z.array(StationSchema));
export type StatusFilteredResponse = z.infer<typeof StatusFilteredResponseSchema>;

export const RenewEnergyRequestSchema = z.object({
  CardNumber: z.array(z.string()).default([]),
  StartDate: IsoDateStringSchema,
  EndDate: IsoDateStringSchema,
});
export type RenewEnergyRequest = z.infer<typeof RenewEnergyRequestSchema>;

export const RenewEnergyDataSchema = z
  .object({
    totalEnergy: z.number().optional(),
    renewablePercentage: z.number().optional(),
  })
  .passthrough();
export type RenewEnergyData = z.infer<typeof RenewEnergyDataSchema>;

export const RenewEnergyResponseSchema = uteEnvelope(RenewEnergyDataSchema);
export type RenewEnergyResponse = z.infer<typeof RenewEnergyResponseSchema>;
