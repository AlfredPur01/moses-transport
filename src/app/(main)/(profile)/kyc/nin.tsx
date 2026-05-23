import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
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
import { StepIndicator } from '@/components/ui/StepIndicator';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useNinSubmit } from '@/hooks/useNinSubmit';

const KYC_STEPS = ['NIN', 'Selfie', 'Address', 'Guarantor'];

const schema = z.object({
  nin: z
    .string()
    .min(1, 'NIN is required')
    .regex(/^\d{11}$/, 'NIN must be exactly 11 digits'),
});

type FormData = z.infer<typeof schema>;

const NIN_TIPS = [
  { icon: 'call-outline' as const, text: 'Dial *347# on any network' },
  { icon: 'phone-portrait-outline' as const, text: 'Open the NIMC MobileID app' },
  { icon: 'document-text-outline' as const, text: 'Check your NIN Slip or ID card' },
  { icon: 'card-outline' as const, text: 'Visit any NIMC enrolment centre' },
];

export default function NinScreen() {
  const userId = useCurrentUserId();
  const { handleSubmit: submitNin, loading, error: submitError } = useNinSubmit();
  const { upload, uploading, error: uploadError } = useImageUpload();

  const [docUri, setDocUri] = useState<string | null>(null);
  const [docBase64, setDocBase64] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nin: '' },
  });

  const ninValue = watch('nin');
  const isReady = ninValue.length === 11 && !!docUri;

  const pickImage = async (fromCamera: boolean) => {
    let permStatus: ImagePicker.PermissionStatus;
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      permStatus = status;
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      permStatus = status;
    }

    if (permStatus !== 'granted') {
      Alert.alert(
        'Permission needed',
        fromCamera
          ? 'Camera access is required to take a photo.'
          : 'Gallery access is required to pick a photo.',
      );
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [3, 2],
          quality: 0.8,
          base64: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [3, 2],
          quality: 0.8,
          base64: true,
        });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setDocUri(asset.uri);
      setDocBase64(`data:image/jpeg;base64,${asset.base64}`);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert('NIN Document Photo', 'Choose a source', [
      { text: 'Camera', onPress: () => pickImage(true) },
      { text: 'Gallery', onPress: () => pickImage(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const onSubmit = async (data: FormData) => {
    let ninDocUrl: string | undefined;
    if (docBase64 && userId) {
      const url = await upload(docBase64, `kyc/${userId}/nin`);
      if (!url) return;
      ninDocUrl = url;
    }
    await submitNin(data.nin, ninDocUrl);
  };

  const busy = uploading || loading;
  const error = uploadError || submitError;

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
          <Text style={styles.headerTitle}>NIN Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Step indicator */}
        <View style={styles.stepWrapper}>
          <StepIndicator steps={KYC_STEPS} currentStep={0} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBg}>
              <Ionicons name="finger-print" size={48} color={Colors.primary} />
            </View>
          </View>

          <Text style={styles.heading}>Enter your NIN</Text>
          <Text style={styles.subheading}>
            Provide your 11-digit NIN and take a photo of your NIN slip or
            National ID card.
          </Text>

          {/* Form */}
          <View style={styles.form}>
            {/* NIN input */}
            <Controller
              name="nin"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="National Identification Number (NIN)"
                  placeholder="Enter your 11-digit NIN"
                  keyboardType="number-pad"
                  maxLength={11}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.nin?.message}
                  rightElement={
                    <Text
                      style={[
                        styles.charCount,
                        ninValue.length === 11 && styles.charCountDone,
                      ]}
                    >
                      {ninValue.length}/11
                    </Text>
                  }
                />
              )}
            />

            {/* NIN document photo */}
            <View>
              <Text style={styles.photoLabel}>NIN Document Photo</Text>
              <Text style={styles.photoHint}>
                Take a clear photo of your NIN slip or National ID card
              </Text>

              {docUri ? (
                <View style={styles.previewWrapper}>
                  <Image
                    source={{ uri: docUri }}
                    style={styles.previewImage}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    style={styles.changeBtn}
                    onPress={showPhotoOptions}
                  >
                    <Ionicons name="camera-outline" size={14} color={Colors.primary} />
                    <Text style={styles.changeBtnText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="id-card-outline" size={40} color={Colors.secondary} />
                  <Text style={styles.placeholderText}>
                    Add your NIN document photo
                  </Text>
                  <View style={styles.photoActions}>
                    <TouchableOpacity
                      style={styles.photoActionBtn}
                      onPress={() => pickImage(true)}
                    >
                      <Ionicons name="camera-outline" size={16} color={Colors.primary} />
                      <Text style={styles.photoActionText}>Camera</Text>
                    </TouchableOpacity>
                    <View style={styles.photoActionDivider} />
                    <TouchableOpacity
                      style={styles.photoActionBtn}
                      onPress={() => pickImage(false)}
                    >
                      <Ionicons name="image-outline" size={16} color={Colors.primary} />
                      <Text style={styles.photoActionText}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Tips card */}
            <View style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={Colors.primary}
                />
                <Text style={styles.tipsTitle}>Where to find your NIN</Text>
              </View>
              {NIN_TIPS.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Ionicons name={tip.icon} size={15} color={Colors.textSecondary} />
                  <Text style={styles.tipText}>{tip.text}</Text>
                </View>
              ))}
            </View>

            {/* Privacy note */}
            <View style={styles.privacyNote}>
              <Ionicons name="lock-closed-outline" size={14} color={Colors.primary} />
              <Text style={styles.privacyText}>
                Your NIN is encrypted and used solely for identity verification.
              </Text>
            </View>

            {/* API Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              title={busy ? (uploading ? 'Uploading…' : 'Saving…') : 'Continue'}
              loading={busy}
              disabled={!isReady || busy}
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
  stepWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
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
    width: 96,
    height: 96,
    borderRadius: 48,
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
  form: {
    gap: Spacing.md,
  },
  charCount: {
    fontSize: Typography.sizes.sm,
    color: Colors.secondary,
    fontWeight: Typography.weights.medium,
  },
  charCountDone: {
    color: Colors.success,
  },
  photoLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
    marginBottom: 4,
  },
  photoHint: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  previewWrapper: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
  },
  changeBtn: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  changeBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  photoPlaceholder: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
  },
  placeholderText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  photoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  photoActionText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.primary,
  },
  photoActionDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
  },
  tipsCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tipsTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tipText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.cardGreen,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  privacyText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.primary,
    lineHeight: Typography.sizes.xs * 1.6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#FEE2E2',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.error,
  },
});
