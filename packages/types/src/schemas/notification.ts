import { z } from 'zod';
import { uteEnvelope } from './envelope.js';

/**
 * Body shape for `POST /api/v2/notification/register/`.
 * Registers a Firebase Cloud Messaging (FCM) token against a device key.
 */
export const NotificationRegisterRequestSchema = z.object({
  UniqueKeyUser: z.string().min(1),
  TokenId: z.string().min(1),
});
export type NotificationRegisterRequest = z.infer<typeof NotificationRegisterRequestSchema>;

export const NotificationRegisterResponseSchema = uteEnvelope(z.unknown());
export type NotificationRegisterResponse = z.infer<typeof NotificationRegisterResponseSchema>;
