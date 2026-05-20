import { z } from 'zod';
import { uteEnvelope } from './envelope.js';

export const RemoteChargeSessionSchema = z
  .object({
    transactionId: z.string().optional(),
    stationId: z.union([z.string(), z.number()]).optional(),
    connectorId: z.union([z.string(), z.number()]).optional(),
    startTime: z.string().optional(),
    endTime: z.string().nullable().optional(),
    energyKwh: z.number().optional(),
    cost: z.number().optional(),
    status: z.string().optional(),
  })
  .passthrough();
export type RemoteChargeSession = z.infer<typeof RemoteChargeSessionSchema>;

export const RemoteChargeHistoryResponseSchema = uteEnvelope(z.array(RemoteChargeSessionSchema));
export type RemoteChargeHistoryResponse = z.infer<typeof RemoteChargeHistoryResponseSchema>;

export const StartRemoteChargeRequestSchema = z
  .object({
    userId: z.string(),
    stationId: z.union([z.string(), z.number()]),
    connectorId: z.union([z.string(), z.number()]),
    cardId: z.string(),
  })
  .passthrough();
export type StartRemoteChargeRequest = z.infer<typeof StartRemoteChargeRequestSchema>;

export const StopRemoteChargeRequestSchema = z
  .object({
    userId: z.string(),
    transactionId: z.string(),
  })
  .passthrough();
export type StopRemoteChargeRequest = z.infer<typeof StopRemoteChargeRequestSchema>;

export const RemoteChargeActionResponseSchema = uteEnvelope(
  z
    .object({
      transactionId: z.string().optional(),
    })
    .passthrough(),
);
export type RemoteChargeActionResponse = z.infer<typeof RemoteChargeActionResponseSchema>;

export const ConnectorStatusRequestSchema = z
  .object({
    stationId: z.union([z.string(), z.number()]),
    connectorId: z.union([z.string(), z.number()]),
  })
  .passthrough();
export type ConnectorStatusRequest = z.infer<typeof ConnectorStatusRequestSchema>;

export const ConnectorStatusResponseSchema = uteEnvelope(
  z
    .object({
      status: z.string().optional(),
      energyKwh: z.number().optional(),
      durationSeconds: z.number().optional(),
    })
    .passthrough(),
);
export type ConnectorStatusResponse = z.infer<typeof ConnectorStatusResponseSchema>;
