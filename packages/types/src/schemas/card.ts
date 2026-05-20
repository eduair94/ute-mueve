import { z } from 'zod';
import { uteEnvelope } from './envelope.js';
import { CustomerCardSchema } from './customer.js';

export const CardDetailSchema = CustomerCardSchema.extend({
  balance: z.number().optional(),
}).passthrough();
export type CardDetail = z.infer<typeof CardDetailSchema>;

export const CardListResponseSchema = uteEnvelope(z.array(CardDetailSchema));
export type CardListResponse = z.infer<typeof CardListResponseSchema>;
