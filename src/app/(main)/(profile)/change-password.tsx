import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!currentPassword.trim()) { setError('Enter your current password.'); return; }
    if (newPassword.length < 6) { setError('New password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {success ? (
            <View style={styles.successWrap}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
              </View>
              <Text style={styles.successTitle}>Password Changed</Text>
              <Text style={styles.successSub}>
                Your password has been updated successfully.
              </Text>
              <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()} activeOpacity={0.85}>
                <Text style={styles.doneBtnTxt}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.iconWrap}>
                <Ionicons name="lock-closed-outline" size={40} color={Colors.primary} />
              </View>
              <Text style={styles.title}>Update your password</Text>
              <Text style={styles.subtitle}>
                Enter your current password, then choose a new one.
              </Text>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                  <Text style={styles.errorTxt}>{error}</Text>
                </View>
              ) : null}

              {/* Current password */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Current Password</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    placeholderTextColor={Colors.secondary}
                    secureTextEntry={!showCurrent}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowCurrent(v => !v)} hitSlop={8}>
                    <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* New password */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>New Password</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="At least 6 characters"
                    placeholderTextColor={Colors.secondary}
                    secureTextEntry={!showNew}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowNew(v => !v)} hitSlop={8}>
                    <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm password */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Confirm New Password</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter new password"
                    placeholderTextColor={Colors.secondary}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(v => !v)} hitSlop={8}>
                    <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
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
                  : <Text style={styles.submitBtnTxt}>Change Password</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold, color: Colors.primary,
  },
  headerSpacer: { width: 32 },

  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl, gap: Spacing.md },

  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.cardGreen, justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold,
    color: Colors.primary, textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.base, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 22, marginBottom: Spacing.sm,
  },

  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs,
    backgroundColor: '#FEF2F2', borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: '#FECACA',
  },
  errorTxt: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.error, lineHeight: 20 },

  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.text },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, ...Shadows.sm,
  },
  input: {
    flex: 1, height: 48,
    fontSize: Typography.sizes.base, color: Colors.text,
  },

  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: Spacing.sm, ...Shadows.sm,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnTxt: { color: '#fff', fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },

  successWrap: { flex: 1, alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.xxxl },
  successIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center',
  },
  successTitle: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.text },
  successSub: { fontSize: Typography.sizes.base, color: Colors.textSecondary, textAlign: 'center' },
  doneBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xxxl, paddingVertical: 13, marginTop: Spacing.md,
  },
  doneBtnTxt: { color: '#fff', fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },
});
