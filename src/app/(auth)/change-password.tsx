import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authApi } from '@/api/auth';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { getApiErrorMessage } from '@/utils/error';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [errors, setErrors]                   = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!currentPassword) e.current = 'Current password is required.';
    if (!newPassword)     e.new     = 'New password is required.';
    else if (newPassword.length < 6) e.new = 'Password must be at least 6 characters.';
    if (!confirmPassword) e.confirm = 'Please confirm your new password.';
    else if (newPassword !== confirmPassword) e.confirm = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      Alert.alert(
        'Password Changed',
        'Your password has been updated successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      const msg = getApiErrorMessage(err) ?? 'Failed to change password. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed-outline" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.subtitle}>
            Enter your current password and choose a new one.
          </Text>

          <View style={styles.form}>
            {/* Current password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Current Password</Text>
              <View style={[styles.inputWrap, errors.current ? styles.inputWrapErr : null]}>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={(v) => { setCurrentPassword(v); setErrors((e) => ({ ...e, current: '' })); }}
                  secureTextEntry={!showCurrent}
                  placeholder="Enter current password"
                  placeholderTextColor={Colors.secondary}
                  autoCapitalize="none"
                  returnKeyType="next"
                />
                <TouchableOpacity onPress={() => setShowCurrent((v) => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {errors.current ? <Text style={styles.fieldErr}>{errors.current}</Text> : null}
            </View>

            {/* New password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={[styles.inputWrap, errors.new ? styles.inputWrapErr : null]}>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={(v) => { setNewPassword(v); setErrors((e) => ({ ...e, new: '' })); }}
                  secureTextEntry={!showNew}
                  placeholder="At least 6 characters"
                  placeholderTextColor={Colors.secondary}
                  autoCapitalize="none"
                  returnKeyType="next"
                />
                <TouchableOpacity onPress={() => setShowNew((v) => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {errors.new ? <Text style={styles.fieldErr}>{errors.new}</Text> : null}
            </View>

            {/* Confirm password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={[styles.inputWrap, errors.confirm ? styles.inputWrapErr : null]}>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirm: '' })); }}
                  secureTextEntry={!showConfirm}
                  placeholder="Re-enter new password"
                  placeholderTextColor={Colors.secondary}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {errors.confirm ? <Text style={styles.fieldErr}>{errors.confirm}</Text> : null}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />}
            <Text style={styles.submitTxt}>
              {loading ? 'Updating…' : 'Update Password'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  backIcon:    { padding: 4 },
  headerTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.text },

  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxxl, alignItems: 'center' },

  iconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.cardGreen,
    justifyContent: 'center', alignItems: 'center',
    marginTop: Spacing.md, ...Shadows.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.base, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 22,
  },

  form: { width: '100%', gap: Spacing.md },

  fieldGroup: { gap: 6 },
  label: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.text },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md,
    backgroundColor: Colors.card, height: 52,
  },
  inputWrapErr: { borderColor: Colors.error },
  input: {
    flex: 1, fontSize: Typography.sizes.base,
    color: Colors.text,
  },
  eyeBtn: { padding: 4 },
  fieldErr: { fontSize: Typography.sizes.xs, color: Colors.error },

  submitBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg, paddingVertical: 16, ...Shadows.md,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitTxt: { color: '#fff', fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
});
