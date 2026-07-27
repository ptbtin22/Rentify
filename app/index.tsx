//
//  index.tsx
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../services/AuthManager';

export default function Index() {
  const { isLoggedIn, currentRole, onboardingCompleted } = useAuth();
  
  if (!onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }
  
  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }
  
  return <Redirect href={currentRole === 'landlord' ? '/(landlord)/dashboard' : '/(tenant)/portal'} />;
}
