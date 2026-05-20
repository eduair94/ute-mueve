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
  .min(6)
  .max(32)
  .regex(/^[A-Za-z0-9]+$/, 'customer key must be alphanumeric (6-32 chars)')
  .refine(
    (s) => {
      // If it's a pure numeric 6-8 digit string, validate the Uruguayan CI check digit.
      if (/^\d{6,8}$/.test(s)) return isValidUruguayanCI(s);
      // Otherwise (Firebase UID etc.), accept by length/charset only.
      return s.length >= 16;
    },
    {
      message:
        'customer key must be either a valid Uruguayan CI (6-8 digits, valid check digit) or a Firebase UID (>= 16 alphanumeric chars)',
    },
  );
export type CustomerKey = z.infer<typeof CustomerKeySchema>;

/**
 * Verifies the check digit on a Uruguayan cédula (CI).
 *
 * Algorithm: pad to 8 digits with leading zeros, multiply digits 1..7 by
 * weights [2,9,8,7,6,3,4], sum, take `(10 - sum % 10) % 10`. That must equal
 * the 8th (check) digit.
 *
 * Accepts input with optional dots and dashes (e.g. `1.234.567-8`); strips
 * non-digit characters before validating.
 */
export function isValidUruguayanCI(input: string): boolean {
  const digits = input.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 8) return false;
  const padded = digits.padStart(8, '0');
  const weights = [2, 9, 8, 7, 6, 3, 4];
  let sum = 0;
  for (let i = 0; i < 7; i += 1) {
    sum += Number(padded[i]) * (weights[i] as number);
  }
  const expected = (10 - (sum % 10)) % 10;
  return Number(padded[7]) === expected;
}

/** Strip dots/dashes from a Uruguayan CI string. */
export function normalizeCI(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Uruguayan cédula (CI) — 6 to 8 digits (numeric only), validated against the
 * official check-digit algorithm. Rejects values that fail the digit check.
 */
export const UruguayanCISchema = z
  .string()
  .regex(/^\d{6,8}$/, 'CI must be 6-8 digits (numeric only)')
  .refine(isValidUruguayanCI, { message: 'invalid Uruguayan CI check digit' });
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
