import { describe, expect, it, beforeEach } from '@jest/globals';
import { AuthManager } from '../AuthManager';
import { Database } from '../Database';

describe('AuthManager Logic Suite', () => {
  beforeEach(() => {
    // Reset Auth state
    AuthManager.logout();
  });

  describe('Login & Logout status', () => {
    it('sets login state and role correctly', () => {
      expect(AuthManager.isLoggedIn()).toBe(false);
      AuthManager.login('landlord');
      expect(AuthManager.isLoggedIn()).toBe(true);
      expect(AuthManager.currentRole()).toBe('landlord');

      AuthManager.logout();
      expect(AuthManager.isLoggedIn()).toBe(false);
    });
  });

  describe('verifyPassword', () => {
    it('verifies landlord passwords', () => {
      expect(AuthManager.verifyPassword('landlord', '123456')).toBe(true);
      expect(AuthManager.verifyPassword('landlord', 'wrongpass')).toBe(false);
    });

    it('verifies tenant passwords dynamically', () => {
      // tenant-1 has phone '901234567' and password '123456'
      expect(AuthManager.verifyPassword('tenant', '123456', '901234567')).toBe(true);
      expect(AuthManager.verifyPassword('tenant', 'wrongpass', '901234567')).toBe(false);
    });

    it('fails verification for unregistered tenant phone numbers', () => {
      expect(AuthManager.verifyPassword('tenant', '123456', '999999999')).toBe(false);
    });
  });

  describe('changePassword', () => {
    it('allows landlord to change password', () => {
      const res = AuthManager.changePassword('landlord', '123456', '654321');
      expect(res.success).toBe(true);
      expect(AuthManager.verifyPassword('landlord', '654321')).toBe(true);

      // Reset landlord password back
      AuthManager.changePassword('landlord', '654321', '123456');
    });

    it('refuses short passwords', () => {
      const res = AuthManager.changePassword('landlord', '123456', '123');
      expect(res.success).toBe(false);
      expect(res.error).toBe('err_password_too_short');
    });
  });
});
