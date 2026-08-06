import {
  createInviteCode,
  verifyCodeForPhone,
  getActiveInvite,
  clearInviteForTests,
  INVITE_TTL_MS,
} from '../TenantInviteCode';
import { Database } from '../Database';
import { calcConsumptionKwh, formatMeterReading, METER_DIGITS } from '../meterUtils';

describe('TenantInviteCode', () => {
  beforeEach(() => {
    clearInviteForTests();
    if (typeof (Database as any).__resetForTests === 'function') {
      (Database as any).__resetForTests();
    }
  });

  it('creates a 4-digit code with ~2 minute TTL for a tenant', () => {
    const before = Date.now();
    const invite = createInviteCode('tenant-1');
    expect(invite.code).toMatch(/^\d{4}$/);
    expect(invite.tenantId).toBe('tenant-1');
    expect(invite.expiresAt).toBeGreaterThanOrEqual(before + INVITE_TTL_MS - 50);
    expect(invite.expiresAt).toBeLessThanOrEqual(Date.now() + INVITE_TTL_MS + 50);
  });

  it('getActiveInvite returns null after expiry', () => {
    const invite = createInviteCode('tenant-1');
    // Force expire
    (invite as { expiresAt: number }).expiresAt = Date.now() - 1;
    expect(getActiveInvite('tenant-1')).toBeNull();
  });

  it('accepts any 4-digit code in demo mode once a full phone number is given', () => {
    expect(verifyCodeForPhone('+84901234567', '4242')).toBe(true);
    expect(verifyCodeForPhone('0901234567', '0000')).toBe(true);
  });

  it('rejects a code when the phone number is missing or incomplete', () => {
    expect(verifyCodeForPhone('', '4242')).toBe(false);
    expect(verifyCodeForPhone('+8490123', '4242')).toBe(false);
  });

  it('rejects codes that are not exactly 4 digits', () => {
    expect(verifyCodeForPhone('+84901234567', '12')).toBe(false);
    expect(verifyCodeForPhone('+84901234567', '12345')).toBe(false);
    expect(verifyCodeForPhone('+84901234567', 'abcd')).toBe(false);
  });
});

describe('calcConsumptionKwh', () => {
  it('returns difference when current >= previous', () => {
    expect(calcConsumptionKwh(1200, 1448)).toBe(248);
  });

  it('returns 0 when current < previous', () => {
    expect(calcConsumptionKwh(1500, 1400)).toBe(0);
  });
});

describe('formatMeterReading', () => {
  it('pads readings to 6 digits', () => {
    expect(formatMeterReading(20720)).toBe('020720');
    expect(formatMeterReading('20748')).toBe('020748');
    expect(METER_DIGITS).toBe(6);
  });

  it('keeps only the last 6 digits of longer input', () => {
    expect(formatMeterReading('12345678')).toBe('345678');
  });
});
