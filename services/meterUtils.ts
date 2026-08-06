//
//  meterUtils.ts
//

import type { ImageSourcePropType } from 'react-native';

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

/** Local demo photo of a Vietnamese 1-phase meter. */
export const MOCK_METER_PHOTO: ImageSourcePropType = require('../assets/dong-ho-dien.jpeg');

/** URI string for components that need `{ uri }` (e.g. ContractImageViewer). */
export function getMockMeterPhotoUri(): string {
  try {
    // Lazy require so Jest (node) can import pure helpers without RN.
    const { Image } = require('react-native') as typeof import('react-native');
    const resolved = Image.resolveAssetSource?.(MOCK_METER_PHOTO as number);
    if (resolved?.uri) return resolved.uri;
  } catch {
    // ignore — fall through
  }
  return 'asset:/dong-ho-dien.jpeg';
}

/** Nguyễn Thị An — chỉ số tháng trước (6 số: 020620). */
export const MOCK_PREVIOUS_METER_KWH = 20620;
/** Nguyễn Thị An — chỉ số tháng này / OCR (6 số: 020748). */
export const MOCK_OCR_CURRENT_KWH = 20748;
