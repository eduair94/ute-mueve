import { z } from 'zod';

export const NetworkSchema = z
  .object({
    networkId: z.union([z.string(), z.number()]).optional(),
    networkDesc: z.string().optional(),
    internalCode: z.string().optional(),
    enabled: z.boolean().optional(),
  })
  .passthrough();
export type Network = z.infer<typeof NetworkSchema>;

export const UserNetworksResponseSchema = z.array(NetworkSchema);
export type UserNetworksResponse = z.infer<typeof UserNetworksResponseSchema>;
