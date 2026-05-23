import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing, Typography } from '@/constants/theme';

// AuthNavigator in _layout.tsx handles routing away from this screen
// once the stored token is read from AsyncStorage.
export default function SplashScreen() {

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerContent}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.brandName}>Moses Transport</Text>
        <Text style={styles.tagline}>For a better world...</Text>
      </View>

      <Text style={styles.footer}>Empowering Nigerians, One Ride at a Time</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: Spacing.sm,
  },
  brandName: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.primary,
    opacity: 0.7,
    letterSpacing: 0.3,
  },
  footer: {
    fontSize: Typography.sizes.xs,
    color: Colors.primary,
    opacity: 0.45,
    letterSpacing: 0.2,
  },
});
