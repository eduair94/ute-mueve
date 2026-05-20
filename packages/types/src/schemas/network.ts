import { z } from 'zod';
import { uteEnvelope } from './envelope.js';

export const NetworkSchema = z
  .object({
    id: z.number().optional(),
    networkId: z.union([z.string(), z.number()]).optional(),
    networkDesc: z.string().optional(),
    internalCode: z.string().optional(),
    enabled: z.boolean().optional(),
    source: z.string().optional(),
  })
  .passthrough();
export type Network = z.infer<typeof NetworkSchema>;

export const UserNetworksResponseSchema = uteEnvelope(z.array(NetworkSchema));
export type UserNetworksResponse = z.infer<typeof UserNetworksResponseSchema>;
