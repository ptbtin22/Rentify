import {
  formatVND,
  formatVNDShort,
  formatAmountInput,
  parseAmountInput
} from '../CurrencyUtils';

describe('CurrencyUtils', () => {
  describe('formatVND', () => {
    it('formats whole VND amounts with vi-VN locale and ₫ symbol', () => {
      const result = formatVND(3500000);
      // Vietnamese locale uses period thousands separator: "3.500.000 ₫"
      expect(result).toContain('₫');
      expect(result).toContain('3');
    });

    it('formats zero correctly', () => {
      const result = formatVND(0);
      expect(result).toBe('0 ₫');
    });

    it('formats large numbers', () => {
      const result = formatVND(100000000);
      expect(result).toContain('₫');
    });
  });

  describe('formatVNDShort', () => {
    it('formats millions as "tr ₫"', () => {
      const result = formatVNDShort(3500000);
      expect(result).toContain('tr ₫');
      expect(result).toContain('3');
    });

    it('formats billions as "tỷ ₫"', () => {
      const result = formatVNDShort(1500000000);
      expect(result).toContain('tỷ ₫');
    });

    it('formats thousands as "k ₫"', () => {
      const result = formatVNDShort(150000);
      expect(result).toContain('k ₫');
    });

    it('formats small amounts with ₫ symbol', () => {
      const result = formatVNDShort(500);
      expect(result).toContain('₫');
    });
  });

  describe('formatAmountInput', () => {
    it('groups digits in threes', () => {
      expect(formatAmountInput('60000000')).toBe('60,000,000');
      expect(formatAmountInput(3500000)).toBe('3,500,000');
      expect(formatAmountInput('999')).toBe('999');
    });

    it('ignores non-digits, leading zeros and empty input', () => {
      expect(formatAmountInput('6a0,00b0')).toBe('60,000');
      expect(formatAmountInput('0012')).toBe('12');
      expect(formatAmountInput('')).toBe('');
    });
  });

  describe('parseAmountInput', () => {
    it('reads grouped text back as a number', () => {
      expect(parseAmountInput('60,000,000')).toBe(60000000);
      expect(parseAmountInput('3.500.000')).toBe(3500000);
    });

    it('returns 0 for empty or non-numeric input', () => {
      expect(parseAmountInput('')).toBe(0);
      expect(parseAmountInput('abc')).toBe(0);
    });
  });
});
