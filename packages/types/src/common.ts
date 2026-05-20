import { z } from 'zod';

export const UserIdSchema = z
  .string()
  .min(16)
  .max(32)
  .regex(/^[A-Za-z0-9]+$/, 'userId must be alphanumeric (16-32 chars)');
export type UserId = z.infer<typeof UserIdSchema>;

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
