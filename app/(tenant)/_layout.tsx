//
//  _layout.tsx
//  Rentify
//
//  Created by Tin Pham on 27/7/26.
//

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../services/LanguageManager';

export default function TenantLayout() {
  const { local } = useLanguage();
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
          title: local('home') || 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="notices"
        options={{
          title: local('bulletin') || 'Bulletin',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: local('community_tab') || 'Community',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          )
        }}
      />
    </Tabs>
  );
}
