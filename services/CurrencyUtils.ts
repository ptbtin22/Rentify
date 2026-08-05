//
//  CurrencyUtils.ts
//  Rentify
//
//  Created by Tin Pham on 4/8/26.
//

/**
 * Format a number as Vietnamese Dong (VND).
 * Example: 3500000 → "3.500.000 ₫"
 */
export const formatVND = (amount: number): string => {
  return amount.toLocaleString('vi-VN') + ' ₫';
};

/**
 * Group digits for money text inputs: "60000000" → "60,000,000".
 * Non-digit characters are dropped so it is safe to feed raw keyboard input in.
 */
export const formatAmountInput = (value: string | number): string => {
  const digits = String(value).replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/** Inverse of formatAmountInput: "60,000,000" → 60000000 ("" → 0). */
export const parseAmountInput = (value: string): number => {
  const digits = String(value).replace(/\D/g, '');
  return digits ? Number(digits) : 0;
};

/**
 * Short format for metric cards: 3.500.000 → "3,5tr ₫"
 */
export const formatVNDShort = (amount: number): string => {
  if (amount >= 1_000_000_000) {
    return (amount / 1_000_000_000).toFixed(1).replace('.', ',') + 'tỷ ₫';
  }
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace('.', ',') + 'tr ₫';
  }
  if (amount >= 1_000) {
    return (amount / 1_000).toFixed(0) + 'k ₫';
  }
  return amount.toLocaleString('vi-VN') + ' ₫';
};
