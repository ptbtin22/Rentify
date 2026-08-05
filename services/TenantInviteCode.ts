//
//  TenantInviteCode.ts
//  Rentify — demo invite codes for linking tenants to landlords
//


export const INVITE_TTL_MS = 2 * 60 * 1000;

export interface TenantInvite {
  code: string;
  tenantId: string;
  expiresAt: number;
}

let activeInvites: TenantInvite[] = [];

function randomFourDigits(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function createInviteCode(tenantId: string): TenantInvite {
  // One active invite per tenant
  activeInvites = activeInvites.filter(i => i.tenantId !== tenantId);
  const invite: TenantInvite = {
    code: randomFourDigits(),
    tenantId,
    expiresAt: Date.now() + INVITE_TTL_MS,
  };
  activeInvites.push(invite);
  return invite;
}

export function getActiveInvite(tenantId: string): TenantInvite | null {
  const invite = activeInvites.find(i => i.tenantId === tenantId);
  if (!invite) return null;
  if (invite.expiresAt <= Date.now()) {
    activeInvites = activeInvites.filter(i => i !== invite);
    return null;
  }
  return invite;
}

const MIN_PHONE_DIGITS = 9;

/**
 * Landlord side: the phone number and the code must both check out.
 * Demo mode accepts any 4-digit code, so only the phone completeness is enforced.
 */
export function verifyCodeForPhone(phone: string, code: string): boolean {
  const digits = phone.replace(/\D/g, '').replace(/^84/, '').replace(/^0/, '');
  if (digits.length < MIN_PHONE_DIGITS) return false;
  return /^\d{4}$/.test(code.trim());
}

export function clearInviteForTests(): void {
  activeInvites = [];
}
