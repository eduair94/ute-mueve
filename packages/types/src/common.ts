import { z } from 'zod';

/**
 * A "customer key" accepted by UTE's user-scoped endpoints. Two shapes:
 * 1. A Uruguayan cédula (CI) — 7 to 9 numeric digits.
 * 2. A Firebase Auth UID — 20 to 32 alphanumeric chars.
 *
 * NOTE: The fact that a bare CI works against `/customer/card/{key}`,
 * `/card/{key}`, `/network/{key}` and `/remotecharge/user/{key}` is the
 * IDOR vulnerability documented in SECURITY.md F-05. Documented here so
 * consumers know the surface explicitly.
 */
export const CustomerKeySchema = z
  .string()
  .min(7)
  .max(32)
  .regex(/^[A-Za-z0-9]+$/, 'customer key must be alphanumeric (7-32 chars)');
export type CustomerKey = z.infer<typeof CustomerKeySchema>;

/** Uruguayan cédula (CI) — 7 to 9 digits, no dashes/dots. */
export const UruguayanCISchema = z
  .string()
  .min(7)
  .max(9)
  .regex(/^\d+$/, 'CI must be 7-9 digits');
export type UruguayanCI = z.infer<typeof UruguayanCISchema>;

/** @deprecated Use `CustomerKeySchema`. Kept as alias for compatibility. */
export const UserIdSchema = CustomerKeySchema;
export type UserId = CustomerKey;

export const IsoDateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}:\d{2}(\.\d+)?)?$/);
export type IsoDateString = z.infer<typeof IsoDateStringSchema>;

export const ConnectorTypeCode = z.enum(['Tipo 2', 'CCS2', 'CHAdeMO', 'GB/T']);
export type ConnectorTypeCode = z.infer<typeof ConnectorTypeCode>;

export const ConnectorStatusCode = z.enum([
  'Disponible',
  'Cargando',
  'Sin Comunicación',
  'No Disponible',
]);
export type ConnectorStatusCode = z.infer<typeof ConnectorStatusCode>;

export const ConnectorPaymentTypeCode = z.enum(['Tarjeta RFID', 'App']);
export type ConnectorPaymentTypeCode = z.infer<typeof ConnectorPaymentTypeCode>;

export const ConnectorCableCode = z.enum(['Con cable', 'Sin cable']);
export type ConnectorCableCode = z.infer<typeof ConnectorCableCode>;

export const ConnectorNetworkCode = z.enum(['PUBLIC', 'TAXI', 'DMC', 'ONE']);
export type ConnectorNetworkCode = z.infer<typeof ConnectorNetworkCode>;

export const UteFilterOptionSchema = z.object({
  id: z.number(),
  internalCode: z.string(),
  text: z.string(),
  selected: z.boolean(),
  icon: z.string(),
});
export type UteFilterOption = z.infer<typeof UteFilterOptionSchema>;
