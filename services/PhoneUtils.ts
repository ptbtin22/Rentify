// PhoneUtils.ts – shared phone-number validation rules
// Used by login.tsx, tenants.tsx (and anywhere else a phone field appears).

export interface CountryOption {
  code: string;       // e.g. '+84'
  flag: string;       // emoji flag
  label: string;      // display text e.g. 'VN (+84)'
  digitLimit: number; // exact digits expected after stripping country prefix
  placeholder: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: '+84', flag: '🇻🇳', label: 'VN (+84)', digitLimit: 9,  placeholder: '901234567' },
  { code: '+1',  flag: '🇺🇸', label: 'US (+1)',  digitLimit: 10, placeholder: '5551234567' },
  { code: '+65', flag: '🇸🇬', label: 'SG (+65)', digitLimit: 8,  placeholder: '81234567' },
];

export const DEFAULT_COUNTRY = COUNTRY_OPTIONS[0]; // +84 Vietnam

/** Return the expected digit count for a given country code string. */
export const getPhoneLimit = (code: string): number => {
  return COUNTRY_OPTIONS.find(c => c.code === code)?.digitLimit ?? 9;
};

/**
 * Sanitise raw keyboard input:
 *  - strip non-digits
 *  - strip leading 0 for VN numbers (users often type 0912…)
 *  - enforce max digit length
 */
export const sanitisePhoneInput = (text: string, countryCode: string): string => {
  let filtered = text.replace(/[^0-9]/g, '');
  if (countryCode === '+84' && filtered.startsWith('0')) {
    filtered = filtered.substring(1);
  }
  const limit = getPhoneLimit(countryCode);
  return filtered.substring(0, limit);
};

/** Returns null when valid, or an error key string when invalid. */
export const validatePhone = (
  phone: string,
  countryCode: string
): 'err_phone_empty' | 'err_phone_digits_vi' | 'err_phone_digits_us' | 'err_phone_digits_sg' | null => {
  if (!phone) return 'err_phone_empty';
  const limit = getPhoneLimit(countryCode);
  if (phone.length !== limit) {
    if (countryCode === '+84') return 'err_phone_digits_vi';
    if (countryCode === '+1')  return 'err_phone_digits_us';
    return 'err_phone_digits_sg';
  }
  return null;
};

/** Produce a normalised storage string (digits only, no prefix). */
export const normalisePhoneForStorage = (phone: string): string =>
  phone.replace(/[^0-9]/g, '');
