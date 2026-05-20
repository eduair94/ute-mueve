import { describe, expect, it } from 'vitest';
import { CustomerKeySchema, UruguayanCISchema } from './common.js';

describe('CustomerKeySchema', () => {
  it('accepts a Firebase Auth UID', () => {
    expect(CustomerKeySchema.parse('5H0M8zlFEKUiNnTlwQxj0A1LPWh1')).toBe(
      '5H0M8zlFEKUiNnTlwQxj0A1LPWh1',
    );
  });

  it('accepts a Uruguayan CI (8 digits)', () => {
    expect(CustomerKeySchema.parse('10000000')).toBe('10000000');
  });

  it('rejects too short', () => {
    expect(() => CustomerKeySchema.parse('abc')).toThrow();
  });

  it('rejects non-alphanumeric', () => {
    expect(() => CustomerKeySchema.parse('5H0M8zlFEKUiNnTlwQxj0A1LPW-1')).toThrow();
  });
});

describe('UruguayanCISchema', () => {
  it('accepts 8-digit CI', () => {
    expect(UruguayanCISchema.parse('10000000')).toBe('10000000');
  });

  it('rejects letters', () => {
    expect(() => UruguayanCISchema.parse('100A0000')).toThrow();
  });

  it('rejects formatting characters', () => {
    expect(() => UruguayanCISchema.parse('1.000.000-0')).toThrow();
  });
});
