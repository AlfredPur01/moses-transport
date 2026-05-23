import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useEditProfile } from '@/hooks/useEditProfile';
import { useUserProfile } from '@/hooks/useUserProfile';

interface FormState {
  full_name:       string;
  email:           string;
  address:         string;
  alternate_phone: string;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType = 'default',
  readOnly,
  error,
}: {
  label:         string;
  value:         string;
  onChange?:     (v: string) => void;
  placeholder?:  string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  readOnly?:     boolean;
  error?:        string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>
        {label}
        {readOnly && <Text style={styles.readOnlyTag}> (read-only)</Text>}
      </Text>
      <TextInput
        style={[styles.input, readOnly && styles.inputReadOnly, error ? styles.inputError : null]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.secondary}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        editable={!readOnly}
        selectTextOnFocus={!readOnly}
      />
      {error ? <Text style={styles.fieldErr}>{error}</Text> : null}
    </View>
  );
}

export default function EditProfileScreen() {
  const { profile, loading: profileLoading } = useUserProfile();
  const { updateProfile, loading, error, success, clearError } = useEditProfile();

  const [form, setForm] = useState<FormState>({
    full_name:       '',
    email:           '',
    address:         '',
    alternate_phone: '',
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});

  useEffect(() => {
    if (profile) {
      setForm({
        full_name:       profile.full_name       ?? '',
        email:           profile.email           ?? '',
        address:         profile.address         ?? '',
        alternate_phone: profile.alternate_phone ?? '',
      });
    }
  }, [profile]);

  const set = (key: keyof FormState) => (val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    clearError();
  };

  const validate = (): boolean => {
    const next: Partial<FormState> = {};
    if (!form.full_name.trim()) next.full_name = 'Full name is required.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Enter a valid email address.';
    }
    if (form.alternate_phone && !/^(\+234|0)[0-9]{10}$/.test(form.alternate_phone.replace(/\s/g, ''))) {
      next.alternate_phone = 'Enter a valid Nigerian phone number.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    await updateProfile(
      {
        full_name:       form.full_name.trim(),
        email:           form.email.trim()           || undefined,
        address:         form.address.trim()         || undefined,
        alternate_phone: form.alternate_phone.trim() || undefined,
      },
      () => {
        setTimeout(() => router.back(), 800);
      }
    );
  };

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Success banner */}
          {success && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.successText}>Profile updated successfully!</Text>
            </View>
          )}

          {/* API error */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.card}>
            <Field
              label="Full Name"
              value={form.full_name}
              onChange={set('full_name')}
              placeholder="Your full name"
              error={errors.full_name}
            />
            <Field
              label="Email Address"
              value={form.email}
              onChange={set('email')}
              placeholder="email@example.com"
              keyboardType="email-address"
              error={errors.email}
            />
            <Field
              label="Home Address"
              value={form.address}
              onChange={set('address')}
              placeholder="Your residential address"
            />
            <Field
              label="Alternate Phone"
              value={form.alternate_phone}
              onChange={set('alternate_phone')}
              placeholder="+2348012345678"
              keyboardType="phone-pad"
              error={errors.alternate_phone}
            />
          </View>

          {/* Read-only fields */}
          <View style={styles.card}>
            <Field
              label="Phone Number"
              value={profile?.phone ?? ''}
              readOnly
            />
            {profile?.nin && (
              <Field
                label="NIN"
                value={profile.nin}
                readOnly
              />
            )}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark" size={20} color="#fff" />
            )}
            <Text style={styles.saveBtnTxt}>
              {loading ? 'Saving…' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: {
    flex: 1, backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
  },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  backIcon:    { padding: 4 },
  headerTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.text },

  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxxl },

  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#D1FAE5', borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  successText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.success },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#FEE2E2', borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  errorText: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.error },

  card: {
    backgroundColor: '#fff', borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.borderLight,
    padding: Spacing.md, gap: Spacing.md, ...Shadows.sm,
  },

  fieldWrap: { gap: 4 },
  fieldLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.text },
  readOnlyTag: { fontWeight: Typography.weights.regular, color: Colors.secondary },
  input: {
    height: 50, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md,
    fontSize: Typography.sizes.base, color: Colors.text,
    backgroundColor: Colors.inputBackground,
  },
  inputReadOnly: {
    backgroundColor: Colors.borderLight, color: Colors.textSecondary,
    borderColor: Colors.borderLight,
  },
  inputError:  { borderColor: Colors.error },
  fieldErr:    { fontSize: Typography.sizes.xs, color: Colors.error },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg, paddingVertical: 15,
    marginTop: Spacing.sm, ...Shadows.sm,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnTxt: { color: '#fff', fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
});
