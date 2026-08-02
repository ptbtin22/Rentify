//
//  AuthManager.ts
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

import { useState, useEffect } from 'react';
import { Database } from './Database';

export type Role = 'landlord' | 'tenant';

let isLoggedInGlobal = false;
let currentRoleGlobal: Role = 'landlord';
let onboardingCompletedGlobal = false;
let loggedInTenantIdGlobal = 'tenant-1'; // Default for fallback

// Stateful passwords (Q9 Change Password feature)
let landlordPasswordGlobal = '123456';

const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

export const AuthManager = {
  isLoggedIn: () => isLoggedInGlobal,
  currentRole: () => currentRoleGlobal,
  onboardingCompleted: () => onboardingCompletedGlobal,
  getLoggedInTenantId: () => loggedInTenantIdGlobal,
  
  login: (role: Role) => {
    isLoggedInGlobal = true;
    currentRoleGlobal = role;
    notify();
  },
  
  logout: () => {
    isLoggedInGlobal = false;
    notify();
  },
  
  completeOnboarding: () => {
    onboardingCompletedGlobal = true;
    notify();
  },
  
  verifyPassword: (role: Role, password: string, phone?: string): boolean => {
    if (role === 'landlord') {
      return password === landlordPasswordGlobal;
    }
    
    // For tenant, look up by phone number in Database
    if (!phone) {
      // Fallback/Quick login
      loggedInTenantIdGlobal = 'tenant-1';
      const tenant1 = Database.getTenants().find(t => t.id === 'tenant-1');
      return password === (tenant1?.password || '123456');
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const matchedTenant = Database.getTenants().find(t => {
      const tc = t.phone.replace(/[^0-9]/g, '');
      return tc === cleanPhone || (cleanPhone.startsWith('0') && tc === cleanPhone.substring(1)) || (tc.startsWith('0') && cleanPhone === tc.substring(1));
    });

    if (!matchedTenant) {
      return false;
    }

    if (password === matchedTenant.password) {
      loggedInTenantIdGlobal = matchedTenant.id;
      return true;
    }
    return false;
  },
  
  changePassword: (role: Role, oldPass: string, newPass: string): { success: boolean; error?: string } => {
    if (newPass.length < 6) {
      return { success: false, error: 'err_password_too_short' };
    }

    if (role === 'landlord') {
      if (oldPass !== landlordPasswordGlobal) {
        return { success: false, error: 'err_incorrect_password' };
      }
      landlordPasswordGlobal = newPass;
      return { success: true };
    } else {
      const tenant = Database.getTenants().find(t => t.id === loggedInTenantIdGlobal);
      if (!tenant) {
        return { success: false, error: 'err_tenant_not_found' };
      }
      if (oldPass !== (tenant.password || '123456')) {
        return { success: false, error: 'err_incorrect_password' };
      }
      Database.updateTenantPassword(tenant.id, newPass);
      return { success: true };
    }
  },
  
  resetPasswordByPhone: (phone: string, newPass: string): { success: boolean; error?: string } => {
    const normalized = phone.replace(/[^0-9]/g, '');
    
    // Check landlord phone
    const isLandlord = normalized.endsWith('901234567');
    if (isLandlord) {
      if (newPass.length < 6) {
        return { success: false, error: 'err_password_too_short' };
      }
      landlordPasswordGlobal = newPass;
      return { success: true };
    }

    // Check tenant phone in database
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const matchedTenant = Database.getTenants().find(t => {
      const tc = t.phone.replace(/[^0-9]/g, '');
      return tc === cleanPhone || (cleanPhone.startsWith('0') && tc === cleanPhone.substring(1)) || (tc.startsWith('0') && cleanPhone === tc.substring(1));
    });

    if (!matchedTenant) {
      return { success: false, error: 'err_phone_not_registered' };
    }
    
    if (newPass.length < 6) {
      return { success: false, error: 'err_password_too_short' };
    }
    
    Database.updateTenantPassword(matchedTenant.id, newPass);
    return { success: true };
  },
  
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }
};

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(isLoggedInGlobal);
  const [currentRole, setCurrentRole] = useState<Role>(currentRoleGlobal);
  const [onboardingCompleted, setOnboardingCompleted] = useState(onboardingCompletedGlobal);

  useEffect(() => {
    const unsubscribe = AuthManager.subscribe(() => {
      setIsLoggedIn(isLoggedInGlobal);
      setCurrentRole(currentRoleGlobal);
      setOnboardingCompleted(onboardingCompletedGlobal);
    });
    return unsubscribe;
  }, []);

  return {
    isLoggedIn,
    currentRole,
    onboardingCompleted,
    login: AuthManager.login,
    logout: AuthManager.logout,
    completeOnboarding: AuthManager.completeOnboarding
  };
};
