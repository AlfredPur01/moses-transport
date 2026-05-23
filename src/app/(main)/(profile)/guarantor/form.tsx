import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
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
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit phone number'),
  relationship: z.string().min(2, 'Relationship is required'),
  address: z.string().min(5, 'Address is required'),
  occupation: z.string().min(2, 'Occupation is required'),
});

type FormData = z.infer<typeof schema>;

export default function GuarantorFormScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', phone: '', relationship: '', address: '', occupation: '' },
  });

  const onSubmit = (data: FormData) => {
    Alert.alert(
      'Details Saved',
      `Guarantor details for ${data.fullName} have been recorded. Please bring this information when you visit our office to apply for a loan.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Guarantor</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.infoText}>
              Fill in your guarantor's details below and bring this information
              when you visit our office for your loan application.
            </Text>
          </View>

          <View style={styles.form}>
            <Controller
              name="fullName"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="Guarantor's full name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.fullName?.message}
                />
              )}
            />
            <Controller
              name="phone"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone Number"
                  placeholder="e.g. 0812 345 6789"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.phone?.message}
                />
              )}
            />
            <Controller
              name="relationship"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Relationship"
                  placeholder="e.g. Uncle, Friend, Employer"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.relationship?.message}
                />
              )}
            />
            <Controller
              name="occupation"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Occupation"
                  placeholder="e.g. Teacher, Trader, Civil Servant"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.occupation?.message}
                />
              )}
            />
            <Controller
              name="address"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Home Address"
                  placeholder="Guarantor's current home address"
                  multiline
                  numberOfLines={3}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.address?.message}
                />
              )}
            />

            <Button title="Save Guarantor Details" onPress={handleSubmit(onSubmit)} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },
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
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.cardGreen,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    lineHeight: Typography.sizes.sm * 1.6,
  },
  form: { gap: Spacing.md },
});
