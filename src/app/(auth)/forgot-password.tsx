import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useForgotPassword } from '@/hooks/useForgotPassword';

const schema = z.object({
  phone: z
    .string()
    .regex(/^\d{10}$/, 'Enter a valid 10-digit phone number'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const { handleForgotPassword, loading, error, success, reset } =
    useForgotPassword();

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '' },
  });

  const onSubmit = (data: FormData) => {
    handleForgotPassword(data.phone);
  };

  // ── Success state ──────────────────────────────────────────────────
  if (success) {
    const phone = getValues('phone');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={reset}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Forgot Password</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.successContent}>
          <View style={styles.successIconBg}>
            <Ionicons
              name="checkmark-circle"
              size={64}
              color={Colors.primary}
            />
          </View>

          <Text style={styles.successHeading}>OTP Sent!</Text>
          <Text style={styles.successBody}>
            We've sent a 6-digit OTP to{'\n'}
            <Text style={styles.successPhone}>+234{phone}</Text>
            {'\n\n'}Check your SMS and enter the code on the next screen.
          </Text>

          <Button
            title="Enter OTP"
            onPress={() =>
              router.push({
                pathname: '/(auth)/reset-password',
                params: { phone: `+234${phone}` },
              })
            }
            style={styles.successBtn}
          />

          <TouchableOpacity
            onPress={() => handleForgotPassword(phone)}
            disabled={loading}
            style={styles.resendBtn}
          >
            <Text style={styles.resendText}>
              {loading ? 'Resending...' : "Didn't receive it? Resend OTP"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Default state ──────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Forgot Password</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBg}>
              <Ionicons name="lock-closed" size={40} color={Colors.primary} />
            </View>
          </View>

          {/* Heading */}
          <Text style={styles.heading}>Reset your password</Text>
          <Text style={styles.subheading}>
            Enter the phone number linked to your Moses Transport account.
            We'll send a one-time OTP to verify it's you.
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <Controller
              name="phone"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone Number"
                  placeholder="8012345678"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.phone?.message}
                  leftElement={
                    <View style={styles.phonePrefix}>
                      <Text style={styles.phonePrefixText}>+234</Text>
                      <View style={styles.phoneDivider} />
                    </View>
                  }
                />
              )}
            />

            {/* API Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={Colors.error}
                  style={styles.errorIcon}
                />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  onPress={handleSubmit(onSubmit)}
                  style={styles.retryBtn}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <Button
              title="Send OTP"
              loading={loading}
              onPress={handleSubmit(onSubmit)}
            />
          </View>

          {/* Back to Login */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Remember your password? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  headerSpacer: { width: 32 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.cardGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  subheading: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    lineHeight: Typography.sizes.base * 1.6,
    marginBottom: Spacing.xl,
  },
  form: { gap: Spacing.md },
  phonePrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  phonePrefixText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
  },
  phoneDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  errorIcon: { flexShrink: 0 },
  errorText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.error,
  },
  retryBtn: { flexShrink: 0 },
  retryText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.error,
    textDecorationLine: 'underline',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  loginText: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  // ── Success state styles ──
  successContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxxl,
    gap: Spacing.md,
  },
  successIconBg: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.cardGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  successHeading: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  successBody: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.sizes.base * 1.6,
  },
  successPhone: {
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  successBtn: {
    marginTop: Spacing.md,
    alignSelf: 'stretch',
  },
  resendBtn: {
    paddingVertical: Spacing.sm,
  },
  resendText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
    textDecorationLine: 'underline',
  },
});
