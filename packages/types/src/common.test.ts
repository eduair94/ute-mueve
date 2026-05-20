import { describe, expect, it } from 'vitest';
import { UserIdSchema } from './common.js';

describe('UserIdSchema', () => {
  it('accepts valid alphanumeric 16-32 char strings', () => {
    expect(UserIdSchema.parse('5H0M8zlFEKUiNnTlwQxj0A1LPWh1')).toBe(
      '5H0M8zlFEKUiNnTlwQxj0A1LPWh1',
    );
  });

  it('rejects too short', () => {
    expect(() => UserIdSchema.parse('abc123')).toThrow();
  });

  it('rejects non-alphanumeric', () => {
    expect(() => UserIdSchema.parse('5H0M8zlFEKUiNnTlwQxj0A1LPW-1')).toThrow();
  });
});
