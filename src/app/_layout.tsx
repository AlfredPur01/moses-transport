import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { registerForPushNotificationsAsync } from '@/utils/pushNotifications';

function AuthNavigator() {
  const { token, phoneVerified, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pushRegistered = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    // segments is [] while the native image picker / camera is open on Android.
    // Bail out so we don't fire a redirect mid-picker and send the user home.
    if (segments.length === 0) return;

    const inAuth    = segments[0] === '(auth)';
    const inMain    = segments[0] === '(main)';
    const inVerify  = inAuth && segments[1] === 'verify-phone';

    if (!token && !inAuth) {
      router.replace('/(auth)/login');
    } else if (token && !phoneVerified && !inVerify) {
      router.replace('/(auth)/verify-phone');
    } else if (token && phoneVerified && !inMain) {
      router.replace('/(main)/(home)');
    }
  }, [token, phoneVerified, isLoading, segments]);

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
