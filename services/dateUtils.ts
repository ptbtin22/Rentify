//
//  dateUtils.ts
//  Rentify
//

/**
 * Display dates as dd/mm/yyyy across landlord + tenant UI.
 * Accepts ISO YYYY-MM-DD, ISO datetime, or a Date.
 */
export const formatDisplayDate = (value: string | Date | null | undefined): string => {
  if (value == null || value === '') return '';

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    const d = String(value.getDate()).padStart(2, '0');
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const y = value.getFullYear();
    return `${d}/${m}/${y}`;
  }

  const raw = String(value).trim();
  // YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss...
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return formatDisplayDate(parsed);

  return raw;
};
