//
//  _layout.tsx
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TenantLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#34C759', // Green tint matching native TenantMainTabView
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          backgroundColor: '#FFF'
        }
      }}
    >
      <Tabs.Screen
        name="portal"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="notices"
        options={{
          title: 'Bulletin',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          )
        }}
      />
    </Tabs>
  );
}
