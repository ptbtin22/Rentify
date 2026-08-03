import { describe, expect, it } from '@jest/globals';
import {
  sanitisePhoneInput,
  validatePhone,
  getPhoneLimit,
  normalisePhoneForStorage
} from '../PhoneUtils';

describe('PhoneUtils Validation & Sanitisation Suite', () => {
  describe('getPhoneLimit', () => {
    it('returns exact limits for supported country codes', () => {
      expect(getPhoneLimit('+84')).toBe(9);
      expect(getPhoneLimit('+1')).toBe(10);
      expect(getPhoneLimit('+65')).toBe(8);
    });

    it('falls back to 9 for unknown country codes', () => {
      expect(getPhoneLimit('+99')).toBe(9);
    });
  });

  describe('sanitisePhoneInput', () => {
    it('removes non-digits characters', () => {
      expect(sanitisePhoneInput('123-456 abc', '+1')).toBe('123456');
    });

    it('strips leading 0 for Vietnam (+84) numbers', () => {
      expect(sanitisePhoneInput('0901234567', '+84')).toBe('901234567');
      expect(sanitisePhoneInput('901234567', '+84')).toBe('901234567');
    });

    it('does not strip leading 0 for US (+1) numbers', () => {
      expect(sanitisePhoneInput('0123456789', '+1')).toBe('0123456789');
    });

    it('enforces character limits', () => {
      expect(sanitisePhoneInput('123456789012345', '+84')).toBe('123456789'); // max 9
      expect(sanitisePhoneInput('123456789012345', '+1')).toBe('1234567890'); // max 10
      expect(sanitisePhoneInput('123456789012345', '+65')).toBe('12345678');  // max 8
    });
  });

  describe('validatePhone', () => {
    it('returns err_phone_empty when string is empty', () => {
      expect(validatePhone('', '+84')).toBe('err_phone_empty');
    });

    it('validates correct length for Vietnam numbers (+84)', () => {
      expect(validatePhone('901234567', '+84')).toBeNull();
      expect(validatePhone('90123456', '+84')).toBe('err_phone_digits_vi');
      expect(validatePhone('9012345678', '+84')).toBe('err_phone_digits_vi');
    });

    it('validates correct length for US numbers (+1)', () => {
      expect(validatePhone('5551234567', '+1')).toBeNull();
      expect(validatePhone('555123456', '+1')).toBe('err_phone_digits_us');
    });

    it('validates correct length for Singapore numbers (+65)', () => {
      expect(validatePhone('81234567', '+65')).toBeNull();
      expect(validatePhone('8123456', '+65')).toBe('err_phone_digits_sg');
    });
  });

  describe('normalisePhoneForStorage', () => {
    it('strips all non-numeric characters', () => {
      expect(normalisePhoneForStorage('+84 901-234-567')).toBe('84901234567');
    });
  });
});
