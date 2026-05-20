import { describe, expect, it } from 'vitest';
import {
  CustomerKeySchema,
  UruguayanCISchema,
  isValidUruguayanCI,
  normalizeCI,
} from './common.js';

describe('isValidUruguayanCI', () => {
  it('accepts known-valid 8-digit CIs', () => {
    // computed: digits 1..7 = "1000000", sum=2, check=(10-2)%10=8
    expect(isValidUruguayanCI('10000008')).toBe(true);
    // digits 1..7 = "1234567" (padded "01234567"), sum=109, check=1
    expect(isValidUruguayanCI('1234561')).toBe(true);
    // digits 1..7 = "1234567" pure 8-digit "12345672", sum=148, check=2
    expect(isValidUruguayanCI('12345672')).toBe(true);
  });

  it('rejects mismatched check digit', () => {
    expect(isValidUruguayanCI('10000000')).toBe(false);
    expect(isValidUruguayanCI('12345670')).toBe(false);
  });

  it('strips dots and dashes before validating', () => {
    expect(isValidUruguayanCI('1.000.000-8')).toBe(true);
  });

  it('rejects too short / too long', () => {
    expect(isValidUruguayanCI('123')).toBe(false);
    expect(isValidUruguayanCI('123456789012')).toBe(false);
  });
});

describe('normalizeCI', () => {
  it('strips formatting', () => {
    expect(normalizeCI('1.000.000-8')).toBe('10000008');
    expect(normalizeCI('  47073450  ')).toBe('47073450');
  });
});

describe('UruguayanCISchema', () => {
  it('accepts valid CI', () => {
    expect(UruguayanCISchema.parse('10000008')).toBe('10000008');
  });

  it('rejects invalid check digit', () => {
    expect(() => UruguayanCISchema.parse('10000000')).toThrow();
  });

  it('rejects letters', () => {
    expect(() => UruguayanCISchema.parse('100A0000')).toThrow();
  });

  it('rejects formatting characters', () => {
    expect(() => UruguayanCISchema.parse('1.000.000-8')).toThrow();
  });
});

describe('CustomerKeySchema', () => {
  it('accepts a Firebase Auth UID', () => {
    expect(CustomerKeySchema.parse('5H0M8zlFEKUiNnTlwQxj0A1LPWh1')).toBe(
      '5H0M8zlFEKUiNnTlwQxj0A1LPWh1',
    );
  });

  it('accepts a valid Uruguayan CI (8 digits)', () => {
    expect(CustomerKeySchema.parse('10000008')).toBe('10000008');
  });

  it('rejects an 8-digit string with invalid CI check digit', () => {
    expect(() => CustomerKeySchema.parse('10000000')).toThrow();
  });

  it('rejects too short', () => {
    expect(() => CustomerKeySchema.parse('abc')).toThrow();
  });

  it('rejects non-alphanumeric', () => {
    expect(() => CustomerKeySchema.parse('5H0M8zlFEKUiNnTlwQxj0A1LPW-1')).toThrow();
  });
});
