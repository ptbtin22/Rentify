//
//  meterUtils.ts
//

/** kWh used = current − previous, floored at 0 */
export function calcConsumptionKwh(previous: number, current: number): number {
  const prev = Number(previous) || 0;
  const curr = Number(current) || 0;
  return Math.max(0, curr - prev);
}

export const METER_DIGITS = 6;

/** Electricity meters always show 6 digits, so pad shorter readings with zeros. */
export function formatMeterReading(value: number | string): string {
  const digits = String(value).replace(/\D/g, '');
  return digits.slice(-METER_DIGITS).padStart(METER_DIGITS, '0');
}

export const MOCK_PREVIOUS_METER_KWH = 1200;
export const MOCK_OCR_CURRENT_KWH = 1448;
export const MOCK_METER_PHOTO_URI =
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600';
