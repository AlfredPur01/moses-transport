import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
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
import { Select } from '@/components/ui/Select';
import { NIGERIAN_STATES } from '@/constants/nigeria';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useRegister } from '@/hooks/useRegister';

const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Name is too long'),
  phone: z
    .string()
    .regex(/^\d{10}$/, 'Enter a valid 10-digit phone number'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password is too long'),
  address: z
    .string()
    .min(5, 'Please enter your full address')
    .max(200, 'Address is too long'),
  stateOfOrigin: z.string().min(1, 'Please select your state of origin'),
  localGovt: z
    .string()
    .min(2, 'Please enter your local government area')
    .max(100, 'LGA name is too long'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const { handleRegister, loading, error } = useRegister();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      password: '',
      address: '',
      stateOfOrigin: '',
      localGovt: '',
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    handleRegister({
      ...data,
      phone: `+234${data.phone}`,
    });
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
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Subheading */}
          <Text style={styles.subheading}>
            Join Moses Transport and start your journey today.
          </Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name */}
            <Controller
              name="fullName"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="e.g. Chukwuemeka Obi"
                  autoCapitalize="words"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.fullName?.message}
                />
              )}
            />

            {/* Phone */}
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

            {/* Password */}
            <Controller
              name="password"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Min. 6 characters"
                  secureTextEntry={!showPassword}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  rightElement={
                    <TouchableOpacity
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={Colors.secondary}
                      />
                    </TouchableOpacity>
                  }
                />
              )}
            />

            {/* Address */}
            <Controller
              name="address"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Home Address"
                  placeholder="e.g. 12 Aba Road, Rumuola"
                  autoCapitalize="words"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.address?.message}
                  multiline
                  style={styles.addressInput}
                />
              )}
            />

            {/* State of Origin */}
            <Controller
              name="stateOfOrigin"
              control={control}
              render={({ field: { onChange, value } }) => (
                <Select
                  label="State of Origin"
                  placeholder="Select your state"
                  value={value}
                  options={NIGERIAN_STATES}
                  onChange={onChange}
                  error={errors.stateOfOrigin?.message}
                />
              )}
            />

            {/* Local Government */}
            <Controller
              name="localGovt"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Local Government Area"
                  placeholder="e.g. Obio-Akpor"
                  autoCapitalize="words"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.localGovt?.message}
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

            {/* Submit */}
            <Button
              title="Create Account"
              loading={loading}
              onPress={handleSubmit(onSubmit)}
            />
          </View>

          {/* Login Link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
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
  flex: {
    flex: 1,
  },
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
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  headerSpacer: {
    width: 32,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  subheading: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: Typography.sizes.base * 1.5,
  },
  form: {
    gap: Spacing.md,
  },
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
  addressInput: {
    height: 'auto',
    minHeight: 52,
    paddingTop: 14,
    paddingBottom: 14,
    textAlignVertical: 'top',
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
  errorIcon: {
    flexShrink: 0,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.error,
  },
  retryBtn: {
    flexShrink: 0,
  },
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
});
