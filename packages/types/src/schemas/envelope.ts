import { z } from 'zod';

/**
 * The standard envelope wrapping every authenticated UTE Mueve API response.
 * Confirmed via live probes on 2026-05-20.
 *
 *   { "data": T | T[] | null, "messages": [], "success": true, "errors": [], "result": 0 }
 */
export function uteEnvelope<T extends z.ZodTypeAny>(payload: T) {
  return z.object({
    data: payload.nullable(),
    messages: z.array(z.unknown()).default([]),
    success: z.boolean().default(true),
    errors: z.array(z.unknown()).default([]),
    result: z.number().default(0),
  });
}

export const UteMessageSchema = z
  .object({
    code: z.union([z.string(), z.number()]).optional(),
    message: z.string().optional(),
    severity: z.string().optional(),
  })
  .passthrough();
export type UteMessage = z.infer<typeof UteMessageSchema>;
