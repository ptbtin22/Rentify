//
//  _layout.tsx
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NotificationManager } from '../services/NotificationManager';
import { FireBroadcastOverlay } from '../components/FireBroadcastOverlay';

export default function RootLayout() {
  useEffect(() => {
    NotificationManager.requestPermissions();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ presentation: 'modal' }} />
        <Stack.Screen name="login" />
      </Stack>
      <FireBroadcastOverlay />
    </SafeAreaProvider>
  );
}
