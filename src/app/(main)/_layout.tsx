import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function MainTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.secondary,
        tabBarStyle: { backgroundColor: Colors.background, borderTopColor: Colors.border },
      }}>
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(vehicles)"
        options={{
          title: 'Vehicles',
          tabBarIcon: ({ color, size }) => <Ionicons name="bicycle-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(payment)"
        options={{
          title: 'Payment',
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
