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
