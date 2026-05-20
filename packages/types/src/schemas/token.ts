import { z } from 'zod';

export const TokenRequestSchema = z.object({
  clientIdIDP: z.literal('cargaME'),
  identifier: z.literal('Anonymous'),
});
export type TokenRequest = z.infer<typeof TokenRequestSchema>;

export const TokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  token_type: z.string().default('Bearer'),
  scope: z.string().optional(),
});
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
