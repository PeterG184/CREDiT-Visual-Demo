import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { t } from '../../services/i18n';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accentSky,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.dashboard'),
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="forecast"
        options={{
          title: t('nav.forecast'),
          tabBarIcon: ({ color, size }) => (
            <Feather name="trending-up" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="allocation"
        options={{
          title: t('nav.allocation'),
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="battery"
        options={{
          title: t('nav.battery'),
          tabBarIcon: ({ color, size }) => (
            <Feather name="battery-charging" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="maintenance"
        options={{
          title: t('nav.maintenance'),
          tabBarIcon: ({ color, size }) => (
            <Feather name="tool" size={size || 20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});

