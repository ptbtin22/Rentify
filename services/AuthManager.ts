//
//  AuthManager.ts
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

import { useState, useEffect } from 'react';

export type Role = 'landlord' | 'tenant';

let isLoggedInGlobal = false;
let currentRoleGlobal: Role = 'landlord';
let onboardingCompletedGlobal = false;

// Stateful passwords (Q9 Change Password feature)
let landlordPasswordGlobal = '123456';
let tenantPasswordGlobal = '123456';

const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

export const AuthManager = {
  isLoggedIn: () => isLoggedInGlobal,
  currentRole: () => currentRoleGlobal,
  onboardingCompleted: () => onboardingCompletedGlobal,
  
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
  
  verifyPassword: (role: Role, password: string): boolean => {
    const correct = role === 'landlord' ? landlordPasswordGlobal : tenantPasswordGlobal;
    return password === correct;
  },
  
  changePassword: (role: Role, oldPass: string, newPass: string): { success: boolean; error?: string } => {
    const current = role === 'landlord' ? landlordPasswordGlobal : tenantPasswordGlobal;
    if (oldPass !== current) {
      return { success: false, error: 'err_incorrect_password' };
    }
    if (newPass.length < 6) {
      return { success: false, error: 'err_password_too_short' };
    }
    if (role === 'landlord') {
      landlordPasswordGlobal = newPass;
    } else {
      tenantPasswordGlobal = newPass;
    }
    return { success: true };
  },
  
  resetPasswordByPhone: (phone: string, newPass: string): { success: boolean; error?: string } => {
    // Normalize phone number (strip leading 0 or country codes if necessary, check landlord / tenant)
    const normalized = phone.replace(/[^0-9]/g, '');
    const isLandlord = normalized.endsWith('901234567');
    const isTenant = normalized.endsWith('909888777');
    
    if (!isLandlord && !isTenant) {
      return { success: false, error: 'err_phone_not_registered' };
    }
    
    if (newPass.length < 6) {
      return { success: false, error: 'err_password_too_short' };
    }
    
    if (isLandlord) {
      landlordPasswordGlobal = newPass;
    } else {
      tenantPasswordGlobal = newPass;
    }
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
