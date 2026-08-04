import { formatVND, formatVNDShort } from '../CurrencyUtils';

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
});
