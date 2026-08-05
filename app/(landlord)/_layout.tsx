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

export default function LandlordLayout() {
  const { local } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF', // Blue tint matching native MainTabView
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
        name="dashboard"
        options={{
          title: local('landlord_tab_dashboard'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: local('landlord_tab_properties'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="tenants"
        options={{
          title: local('landlord_tab_tenants'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: local('landlord_tab_payments'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="notices"
        options={{
          title: local('landlord_tab_notices'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="create-lease"
        options={{
          href: null,
          headerShown: false
        }}
      />
      <Tabs.Screen
        name="room-detail"
        options={{
          href: null,
          headerShown: false
        }}
      />
    </Tabs>
  );
}
