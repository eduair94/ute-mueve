import { z } from 'zod';

/**
 * Ergonomic, user-friendly station search filter.
 * Maps directly to the verbose `/station/statusFiltered` shape internally.
 *
 * All fields optional. Defaults:
 * - connectorTypes: all four types selected
 * - statuses: ["available"] only (most common intent)
 * - paymentTypes: both (rfid + app)
 * - cables: both (with + without)
 * - networks: all four (PUBLIC, TAXI, DMC, ONE)
 * - powers: [0] (any)
 */
export const StationsSearchRequestSchema = z.object({
  connectorTypes: z
    .array(z.enum(['Tipo 2', 'CCS2', 'CHAdeMO', 'GB/T']))
    .optional(),
  statuses: z
    .array(z.enum(['available', 'charging', 'no-comm', 'unavailable']))
    .optional(),
  paymentTypes: z.array(z.enum(['rfid', 'app'])).optional(),
  cables: z.array(z.enum(['with', 'without'])).optional(),
  networks: z.array(z.enum(['PUBLIC', 'TAXI', 'DMC', 'ONE'])).optional(),
  powers: z.array(z.number().nonnegative()).optional(),
});
export type StationsSearchRequest = z.infer<typeof StationsSearchRequestSchema>;
