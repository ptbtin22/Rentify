//
//  NotificationManager.ts
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

/**
 * Stub notifications for Expo Go / web.
 *
 * Do NOT import or require `expo-notifications` here.
 * On Android Expo Go (SDK 53+), loading that package throws at module init
 * (DevicePushTokenAutoRegistration.fx → warnOfExpoGoPushUsage) and crashes
 * the app as ExpoRoot / ContextNavigator / ErrorBoundary errors.
 *
 * Local/push notifications need a development build or production binary.
 * Until then these methods are safe no-ops so the rest of the app can run.
 */
export const NotificationManager = {
  requestPermissions: async (): Promise<boolean> => false,

  triggerLocalNotification: async (_title: string, _body: string): Promise<void> => {
    // no-op in Expo Go / current MVP runtime
  },
};
