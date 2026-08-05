//
//  paymentUtils.ts
//  Rentify
//

/** Today as YYYY-MM-DD in the device's local time zone. */
export const currentDateISO = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Payment history only covers bills already due — upcoming bills are hidden
 * so landlords do not read future charges as outstanding history.
 */
export const excludeFuturePayments = <T extends { dueDate: string }>(
  items: T[],
  today: string = currentDateISO()
): T[] => items.filter(p => p.dueDate <= today);
