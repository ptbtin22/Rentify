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
