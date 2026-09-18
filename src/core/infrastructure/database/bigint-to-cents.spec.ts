import { bigintToCents } from './bigint-to-cents';

describe('bigintToCents', () => {
  it('should convert a monetary bigint to a safe integer', () => {
    expect(bigintToCents(BigInt(10050))).toBe(10050);
  });

  it('should reject values outside the safe integer range', () => {
    expect(() => bigintToCents(BigInt(Number.MAX_SAFE_INTEGER) + 1n)).toThrow(
      /safe integer range/,
    );
  });
});
