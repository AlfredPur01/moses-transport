import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { registerForPushNotificationsAsync } from '@/utils/pushNotifications';

function AuthNavigator() {
  const { token, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pushRegistered = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    const inMain = segments[0] === '(main)';

    if (!token && !inAuth) {
      // Not logged in and not already on an auth screen → go to login
      router.replace('/(auth)/login');
    } else if (token && !inMain) {
      // Logged in but on splash/index or auth screen → go to home
      router.replace('/(main)/(home)');
    }
  }, [token, isLoading, segments]);

  // Register push token once per session after login
  useEffect(() => {
    if (token && !pushRegistered.current) {
      pushRegistered.current = true;
      registerForPushNotificationsAsync().catch(console.warn);
    }
    if (!token) {
      pushRegistered.current = false;
    }
  }, [token]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AuthNavigator />
    </AuthProvider>
  );
}
