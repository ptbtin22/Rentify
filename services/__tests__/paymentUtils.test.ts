import { currentDateISO, excludeFuturePayments } from '../paymentUtils';

describe('paymentUtils', () => {
  describe('currentDateISO', () => {
    it('formats a date as YYYY-MM-DD using local parts', () => {
      expect(currentDateISO(new Date(2026, 7, 5))).toBe('2026-08-05');
      expect(currentDateISO(new Date(2026, 0, 9))).toBe('2026-01-09');
    });
  });

  describe('excludeFuturePayments', () => {
    const list = [
      { id: 'a', dueDate: '2026-07-01' },
      { id: 'b', dueDate: '2026-08-05' },
      { id: 'c', dueDate: '2026-09-01' }
    ];

    it('keeps payments due today or earlier', () => {
      expect(excludeFuturePayments(list, '2026-08-05').map(p => p.id)).toEqual(['a', 'b']);
    });

    it('drops everything when all dues are ahead', () => {
      expect(excludeFuturePayments(list, '2026-06-01')).toEqual([]);
    });

    it('defaults the cutoff to today', () => {
      const future = [{ id: 'x', dueDate: '2999-01-01' }];
      expect(excludeFuturePayments(future)).toEqual([]);
    });
  });
});
