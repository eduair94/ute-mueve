import { z } from 'zod';
import { uteEnvelope } from './envelope.js';

export const AppVersionDataSchema = z
  .object({
    customersAppMinVersionSupportedAndroid: z.string().optional(),
    customersAppMinVersionSupportediOS: z.string().optional(),
  })
  .passthrough();
export type AppVersionData = z.infer<typeof AppVersionDataSchema>;

export const AppVersionResponseSchema = uteEnvelope(AppVersionDataSchema);
export type AppVersionResponse = z.infer<typeof AppVersionResponseSchema>;

/** @deprecated Use AppVersionResponseSchema (envelope) or AppVersionDataSchema. */
export const AppVersionSchema = AppVersionDataSchema;
export type AppVersion = AppVersionData;
