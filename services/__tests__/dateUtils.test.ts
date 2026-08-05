import { formatDisplayDate } from '../dateUtils';

describe('dateUtils', () => {
  describe('formatDisplayDate', () => {
    it('formats ISO YYYY-MM-DD as dd/mm/yyyy', () => {
      expect(formatDisplayDate('2026-08-05')).toBe('05/08/2026');
      expect(formatDisplayDate('2026-01-09')).toBe('09/01/2026');
    });

    it('formats ISO datetime by calendar date prefix', () => {
      expect(formatDisplayDate('2026-08-05T12:30:00.000Z')).toBe('05/08/2026');
    });

    it('formats Date objects with local day/month/year', () => {
      expect(formatDisplayDate(new Date(2026, 7, 5))).toBe('05/08/2026');
    });

    it('returns empty string for nullish / invalid', () => {
      expect(formatDisplayDate(null)).toBe('');
      expect(formatDisplayDate(undefined)).toBe('');
      expect(formatDisplayDate('')).toBe('');
    });
  });
});
