import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useResetPassword } from '@/hooks/useResetPassword';

const schema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
  newPassword: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password is too long'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

// ── OTP digit box component ─────────────────────────────────────────
function OtpInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const digits = value.padEnd(6, '').split('').slice(0, 6);

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/\D/g, '').slice(-1);
    const next = digits.map((d, i) => (i === index ? cleaned : d)).join('');
    onChange(next.slice(0, 6));
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const next = digits.map((d, i) => (i === index - 1 ? '' : d)).join('');
      onChange(next);
    }
  };

  return (
    <View style={otpStyles.wrapper}>
      <Text style={otpStyles.label}>One-Time Password (OTP)</Text>
      <View style={otpStyles.boxes}>
        {Array.from({ length: 6 }).map((_, i) => (
          <TextInput
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            style={[
              otpStyles.box,
              digits[i] ? otpStyles.boxFilled : null,
              !!error ? otpStyles.boxError : null,
            ]}
            value={digits[i] ?? ''}
            onChangeText={(t) => handleChange(t, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            caretHidden
          />
        ))}
      </View>
      {error ? <Text style={otpStyles.error}>{error}</Text> : null}
    </View>
  );
}

const otpStyles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
  },
  boxes: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  box: {
    flex: 1,
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.inputBackground,
    textAlign: 'center',
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  boxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.cardGreen,
  },
  boxError: {
    borderColor: Colors.error,
  },
  error: {
    fontSize: Typography.sizes.xs,
    color: Colors.error,
  },
});

// ── Main screen ─────────────────────────────────────────────────────
export default function ResetPasswordScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { handleResetPassword, loading, error } = useResetPassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { otp: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = (data: FormData) => {
    handleResetPassword(phone ?? '', data.otp, data.newPassword);
  };

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
          <Text style={styles.headerTitle}>Reset Password</Text>
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
              <Ionicons name="key" size={40} color={Colors.primary} />
            </View>
          </View>

          <Text style={styles.heading}>Create new password</Text>
          {phone ? (
            <Text style={styles.subheading}>
              Enter the OTP sent to{' '}
              <Text style={styles.phoneHighlight}>{phone}</Text> and choose a
              new password.
            </Text>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* OTP boxes */}
            <Controller
              name="otp"
              control={control}
              render={({ field: { onChange, value } }) => (
                <OtpInput
                  value={value}
                  onChange={onChange}
                  error={errors.otp?.message}
                />
              )}
            />

            {/* New Password */}
            <Controller
              name="newPassword"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="New Password"
                  placeholder="Min. 6 characters"
                  secureTextEntry={!showNew}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.newPassword?.message}
                  rightElement={
                    <TouchableOpacity
                      onPress={() => setShowNew((v) => !v)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={showNew ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={Colors.secondary}
                      />
                    </TouchableOpacity>
                  }
                />
              )}
            />

            {/* Confirm Password */}
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm New Password"
                  placeholder="Re-enter your password"
                  secureTextEntry={!showConfirm}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  rightElement={
                    <TouchableOpacity
                      onPress={() => setShowConfirm((v) => !v)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={Colors.secondary}
                      />
                    </TouchableOpacity>
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
              title="Reset Password"
              loading={loading}
              onPress={handleSubmit(onSubmit)}
            />
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
  phoneHighlight: {
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  form: { gap: Spacing.md },
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
});
