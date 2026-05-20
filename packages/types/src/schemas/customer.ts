import { z } from 'zod';

export const CustomerCardSchema = z
  .object({
    cardId: z.string().optional(),
    cardNumber: z.string().optional(),
    alias: z.string().optional(),
    cardUseType: z.string().optional(),
    cardUseTypeDesc: z.string().optional(),
  })
  .passthrough();
export type CustomerCard = z.infer<typeof CustomerCardSchema>;

export const CustomerCardListSchema = z.array(CustomerCardSchema);
export type CustomerCardList = z.infer<typeof CustomerCardListSchema>;

export const RegisterCardRequestSchema = z
  .object({
    userId: z.string(),
    cardNumber: z.string().min(4),
    alias: z.string().max(64).optional(),
  })
  .passthrough();
export type RegisterCardRequest = z.infer<typeof RegisterCardRequestSchema>;

export const RegisterCardResponseSchema = z
  .object({
    success: z.boolean().optional(),
    message: z.string().optional(),
    cardId: z.string().optional(),
  })
  .passthrough();
export type RegisterCardResponse = z.infer<typeof RegisterCardResponseSchema>;
