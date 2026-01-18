import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES } from '../../src/constants/theme';

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.gray500,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <TabIcon icon="📋" color={color} />,
        }}
      />
      <Tabs.Screen
        name="playbooks"
        options={{
          title: 'Playbooks',
          tabBarIcon: ({ color }) => <TabIcon icon="📚" color={color} />,
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: 'Review',
          tabBarIcon: ({ color }) => <TabIcon icon="📊" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon icon="⚙️" color={color} />,
        }}
      />
      <Tabs.Screen
        name="import"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, { opacity: color === COLORS.accent ? 1 : 0.5 }]}>
        {icon}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.gray900,
    borderTopColor: COLORS.gray800,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 8,
    height: 70,
  },
  
  tabBarLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    marginTop: 4,
  },
  
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  tabIcon: {
    fontSize: 22,
  },
});
