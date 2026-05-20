import { z } from 'zod';
import { uteEnvelope } from './envelope.js';

/**
 * One entry in the `data` array returned by `GET /api/v2/customer/card/{customerKey}`.
 * Fields observed via live capture: credit-card / MercadoPago metadata. See
 * SECURITY.md F-05 for the IDOR caveat — the upstream returns this data when the
 * path parameter is a bare Uruguayan CI.
 */
export const CustomerCardSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    cardId: z.string().optional(),
    firstSixDigits: z.string().optional(),
    lastFourDigits: z.string().optional(),
    expirationMonth: z.union([z.string(), z.number()]).optional(),
    expirationYear: z.union([z.string(), z.number()]).optional(),
    identifType: z.string().optional(),
    identifNumber: z.string().optional(),
    paymentMethodId: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    status: z.string().optional(),
    statusDate: z.string().nullable().optional(),
    cvvMandatory: z.boolean().optional(),
    payerCardId: z.string().optional(),
    issuerId: z.union([z.string(), z.number()]).optional(),
    minPay: z.number().optional(),
    cardUseType: z.number().optional(),
    cardUseTypeDesc: z.string().optional(),
    alias: z.string().optional(),
    cardNumber: z.string().optional(),
  })
  .passthrough();
export type CustomerCard = z.infer<typeof CustomerCardSchema>;

export const CustomerCardListSchema = uteEnvelope(z.array(CustomerCardSchema));
export type CustomerCardList = z.infer<typeof CustomerCardListSchema>;

export const RegisterCardRequestSchema = z
  .object({
    userId: z.string(),
    cardNumber: z.string().min(4),
    alias: z.string().max(64).optional(),
  })
  .passthrough();
export type RegisterCardRequest = z.infer<typeof RegisterCardRequestSchema>;

export const RegisterCardResponseSchema = uteEnvelope(
  z
    .object({
      cardId: z.string().optional(),
    })
    .passthrough(),
);
export type RegisterCardResponse = z.infer<typeof RegisterCardResponseSchema>;
