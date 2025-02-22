import { describe, it, expect } from 'vitest';
import {
  parseDollarAmount,
  dollarsToCents,
  centsToDollars,
  formatMoney,
  isValidMoneyAmount,
} from '../money';

describe('parseDollarAmount', () => {
  it('handles valid number inputs', () => {
    expect(parseDollarAmount(10.99)).toBe(10.99);
    expect(parseDollarAmount(0)).toBe(0);
    expect(parseDollarAmount(-10.99)).toBe(-10.99);
  });

  it('handles valid string inputs', () => {
    expect(parseDollarAmount('10.99')).toBe(10.99);
    expect(parseDollarAmount('$10.99')).toBe(10.99);
    expect(parseDollarAmount('1,234.56')).toBe(1234.56);
    expect(parseDollarAmount('($10.99)')).toBe(-10.99);
    expect(parseDollarAmount('-10.99')).toBe(-10.99);
    expect(parseDollarAmount('  $10.99  ')).toBe(10.99);
  });

  it('returns null for invalid inputs', () => {
    expect(parseDollarAmount('invalid')).toBeNull();
    expect(parseDollarAmount('$1B')).toBeNull();
    expect(parseDollarAmount(NaN)).toBeNull();
    expect(parseDollarAmount(Infinity)).toBeNull();
    expect(parseDollarAmount(1000000001)).toBeNull(); // over $1B limit
  });

  it('rounds to 2 decimal places', () => {
    expect(parseDollarAmount(10.999)).toBe(11.00);
    expect(parseDollarAmount(10.994)).toBe(10.99);
    expect(parseDollarAmount(10.995)).toBe(11.00);
  });
});

describe('dollarsToCents', () => {
  it('converts dollar amounts to cents', () => {
    expect(dollarsToCents(10.99)).toBe(1099);
    expect(dollarsToCents(0)).toBe(0);
    expect(dollarsToCents(-10.99)).toBe(-1099);
  });

  it('handles string inputs', () => {
    expect(dollarsToCents('$10.99')).toBe(1099);
    expect(dollarsToCents('1,234.56')).toBe(123456);
  });

  it('rounds to nearest cent', () => {
    expect(dollarsToCents(10.994)).toBe(1099);
    expect(dollarsToCents(10.995)).toBe(1100);
    expect(dollarsToCents(10.996)).toBe(1100);
  });

  it('throws error for invalid inputs', () => {
    expect(() => dollarsToCents('invalid')).toThrow();
    expect(() => dollarsToCents(NaN)).toThrow();
    expect(() => dollarsToCents(Infinity)).toThrow();
  });
});

describe('centsToDollars', () => {
  it('converts cents to dollars', () => {
    expect(centsToDollars(1099)).toBe(10.99);
    expect(centsToDollars(0)).toBe(0.00);
    expect(centsToDollars(-1099)).toBe(-10.99);
  });

  it('handles fractional cents by rounding to 2 decimals', () => {
    expect(centsToDollars(1099.5)).toBe(11.00);
    expect(centsToDollars(1099.4)).toBe(10.99);
  });
});

describe('formatMoney', () => {
  it('formats money in USD by default', () => {
    expect(formatMoney(1099)).toBe('$10.99');
    expect(formatMoney(0)).toBe('$0.00');
    expect(formatMoney(-1099)).toBe('-$10.99');
  });

  it('handles different locales and currencies', () => {
    // Note: These tests might be environment-dependent
    // The exact string output can vary based on the system's locale support
    const eurResult = formatMoney(1099, 'de-DE', 'EUR');
    expect(eurResult.includes('10,99')).toBe(true);
    expect(eurResult.includes('€')).toBe(true);

    const jpyResult = formatMoney(1099, 'ja-JP', 'JPY');
    expect(jpyResult.includes('11')).toBe(true); // JPY rounds to whole numbers
    expect(jpyResult.includes('￥') || jpyResult.includes('¥')).toBe(true);

    const gbpResult = formatMoney(1099, 'en-GB', 'GBP');
    expect(gbpResult.includes('10.99')).toBe(true);
    expect(gbpResult.includes('£')).toBe(true);
  });
});

describe('isValidMoneyAmount', () => {
  it('validates valid money amounts', () => {
    expect(isValidMoneyAmount(10.99)).toBe(true);
    expect(isValidMoneyAmount(0)).toBe(true);
    expect(isValidMoneyAmount(-10.99)).toBe(true);
    expect(isValidMoneyAmount(999999999)).toBe(true); // just under $1B
  });

  it('rejects invalid money amounts', () => {
    expect(isValidMoneyAmount('10.99')).toBe(false); // string
    expect(isValidMoneyAmount(NaN)).toBe(false);
    expect(isValidMoneyAmount(Infinity)).toBe(false);
    expect(isValidMoneyAmount(1000000001)).toBe(false); // over $1B
    expect(isValidMoneyAmount(null)).toBe(false);
    expect(isValidMoneyAmount(undefined)).toBe(false);
  });
});
