import { z } from 'zod';
import { CustomerCardSchema } from './customer.js';

export const CardDetailSchema = CustomerCardSchema.extend({
  balance: z.number().optional(),
  status: z.string().optional(),
}).passthrough();
export type CardDetail = z.infer<typeof CardDetailSchema>;

export const CardListResponseSchema = z.array(CardDetailSchema);
export type CardListResponse = z.infer<typeof CardListResponseSchema>;
