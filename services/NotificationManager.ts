//
//  NotificationManager.ts
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set up the default foreground notification rules
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export const NotificationManager = {
  requestPermissions: async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  },

  triggerLocalNotification: async (title: string, body: string): Promise<void> => {
    if (Platform.OS === 'web') return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true
      },
      trigger: null // immediate notification
    });
  }
};
