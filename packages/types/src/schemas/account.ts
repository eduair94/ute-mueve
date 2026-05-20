import { z } from 'zod';
import { uteEnvelope } from './envelope.js';

/**
 * Account lookup request used by `POST /api/v2/card/accounts/`.
 * Observed values: docType="CI" with Uruguayan cédula returns matching account(s);
 * docType="WEB" requires the UTE web/bill account number.
 */
export const AccountsLookupRequestSchema = z.object({
  docType: z.string().default('CI'),
  docNumber: z.string().min(1),
  onlyUte: z.boolean().default(false),
});
export type AccountsLookupRequest = z.infer<typeof AccountsLookupRequestSchema>;

export const AccountCardSummarySchema = z
  .object({
    cardId: z.string().optional(),
    alias: z.string().nullable().optional(),
    uso: z.string().optional(),
    estado: z.string().nullable().optional(),
  })
  .passthrough();
export type AccountCardSummary = z.infer<typeof AccountCardSummarySchema>;

export const AccountEntrySchema = z
  .object({
    accountId: z.union([z.string(), z.number()]).optional(),
    uso: z.string().optional(),
    cardData: z.array(AccountCardSummarySchema).optional(),
    docType: z.string().optional(),
    docNumber: z.string().optional(),
    customerName: z.string().optional(),
    customerKey: z.string().optional(),
  })
  .passthrough();
export type AccountEntry = z.infer<typeof AccountEntrySchema>;

export const AccountsLookupResponseSchema = uteEnvelope(z.array(AccountEntrySchema));
export type AccountsLookupResponse = z.infer<typeof AccountsLookupResponseSchema>;
