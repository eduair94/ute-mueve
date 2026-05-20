import { z } from 'zod';

export const AppVersionSchema = z
  .object({
    customersAppMinVersionSupportedAndroid: z.string().optional(),
    customersAppMinVersionSupportediOS: z.string().optional(),
  })
  .passthrough();
export type AppVersion = z.infer<typeof AppVersionSchema>;
