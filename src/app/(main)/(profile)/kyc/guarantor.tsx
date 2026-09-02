import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
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

import { kycApi } from '@/api/kyc';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { useImageUpload } from '@/hooks/useImageUpload';
import { getApiErrorMessage } from '@/utils/error';

const KYC_STEPS = ['NIN', 'Selfie', 'Address', 'Guarantors'];

const RELATIONSHIP_OPTIONS = [
  { label: 'Friend', value: 'friend' },
  { label: 'Family', value: 'family' },
  { label: 'Colleague', value: 'colleague' },
  { label: 'Neighbour', value: 'neighbour' },
  { label: 'Other', value: 'other' },
];

const guarantorShape = z.object({
  fullName: z.string().min(3, 'Full name is required'),
  phone: z.string().regex(/^\d{11}$/, 'Phone must be 11 digits'),
  relationship: z.string().min(1, 'Relationship is required'),
  occupation: z.string().min(2, 'Occupation is required'),
  address: z.string().min(5, 'Address is required'),
  nin: z.string().regex(/^\d{11}$/, 'NIN must be exactly 11 digits'),
});

const schema = z.object({
  g1: guarantorShape,
  g2: guarantorShape,
});

type FormData = z.infer<typeof schema>;

type PhotoState = { uri: string | null; base64: string | null };
const emptyPhoto = (): PhotoState => ({ uri: null, base64: null });

// ── Reusable photo picker section ──────────────────────────────────
function NinPhotoSection({
  photo,
  onPick,
  label,
}: {
  photo: PhotoState;
  onPick: (fromCamera: boolean) => void;
  label: string;
}) {
  const showOptions = () =>
    Alert.alert(label, 'Choose a source', [
      { text: 'Camera', onPress: () => onPick(true) },
      { text: 'Gallery', onPress: () => onPick(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);

  return (
    <View>
      <Text style={styles.photoLabel}>{label}</Text>
      <Text style={styles.photoHint}>
        Take a clear photo of the guarantor's NIN slip or National ID card
      </Text>
      {photo.uri ? (
        <View style={styles.previewWrapper}>
          <Image source={{ uri: photo.uri }} style={styles.previewImage} contentFit="cover" />
          <TouchableOpacity style={styles.changeBtn} onPress={showOptions}>
            <Ionicons name="camera-outline" size={14} color={Colors.primary} />
            <Text style={styles.changeBtnText}>Change</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.photoPlaceholder}>
          <Ionicons name="id-card-outline" size={36} color={Colors.secondary} />
          <Text style={styles.placeholderText}>Add NIN document photo</Text>
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.photoActionBtn} onPress={() => onPick(true)}>
              <Ionicons name="camera-outline" size={16} color={Colors.primary} />
              <Text style={styles.photoActionText}>Camera</Text>
            </TouchableOpacity>
            <View style={styles.photoActionDivider} />
            <TouchableOpacity style={styles.photoActionBtn} onPress={() => onPick(false)}>
              <Ionicons name="image-outline" size={16} color={Colors.primary} />
              <Text style={styles.photoActionText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Main screen ─────────────────────────────────────────────────────
export default function KycGuarantorScreen() {
  const userId = useCurrentUserId();
  const { upload, uploading } = useImageUpload();

  const [g1Photo, setG1Photo] = useState<PhotoState>(emptyPhoto());
  const [g2Photo, setG2Photo] = useState<PhotoState>(emptyPhoto());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      g1: { fullName: '', phone: '', relationship: '', occupation: '', address: '', nin: '' },
      g2: { fullName: '', phone: '', relationship: '', occupation: '', address: '', nin: '' },
    },
  });

  const g1Nin = watch('g1.nin');
  const g2Nin = watch('g2.nin');

  const pickImage = async (
    fromCamera: boolean,
    setPhoto: (p: PhotoState) => void,
  ) => {
    const ImagePicker = await import('expo-image-picker');
    const { status } = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', fromCamera
        ? 'Camera access is required.'
        : 'Gallery access is required.');
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
      setPhoto({ uri: asset.uri, base64: `data:image/jpeg;base64,${asset.base64}` });
    }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError(null);
    try {
      // Upload both NIN photos in parallel
      const [g1Url, g2Url] = await Promise.all([
        g1Photo.base64 && userId
          ? upload(g1Photo.base64, `kyc/${userId}/guarantor1/nin`)
          : Promise.resolve(undefined as string | null),
        g2Photo.base64 && userId
          ? upload(g2Photo.base64, `kyc/${userId}/guarantor2/nin`)
          : Promise.resolve(undefined as string | null),
      ]);

      // Submit guarantor 1
      await kycApi.submitGuarantor({
        fullName: data.g1.fullName,
        phone: data.g1.phone,
        relationship: data.g1.relationship,
        occupation: data.g1.occupation,
        address: data.g1.address,
        nin: data.g1.nin,
        ninDocUrl: g1Url ?? undefined,
      });

      // Submit guarantor 2
      await kycApi.submitGuarantor({
        fullName: data.g2.fullName,
        phone: data.g2.phone,
        relationship: data.g2.relationship,
        occupation: data.g2.occupation,
        address: data.g2.address,
        nin: data.g2.nin,
        ninDocUrl: g2Url ?? undefined,
      });

      router.replace('/(main)/(profile)/kyc/pending');
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'Failed to submit guarantors. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const busy = uploading || submitting;

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
          <Text style={styles.headerTitle}>Guarantors</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Step indicator */}
        <View style={styles.stepWrapper}>
          <StepIndicator steps={KYC_STEPS} currentStep={3} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Heading */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBg}>
              <Ionicons name="people" size={44} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.heading}>Add 2 Guarantors</Text>
          <Text style={styles.subheading}>
            Two guarantors are required. They must know you personally and be
            reachable.
          </Text>

          <View style={styles.infoNote}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>
              This is the final step. Submitting will send your KYC for admin review.
            </Text>
          </View>

          {/* ── Guarantor 1 ── */}
          <GuarantorSection
            title="Guarantor 1"
            prefix="g1"
            control={control}
            errors={errors.g1}
            ninValue={g1Nin}
            photo={g1Photo}
            onPickPhoto={(fromCamera) => pickImage(fromCamera, setG1Photo)}
          />

          <View style={styles.sectionDivider} />

          {/* ── Guarantor 2 ── */}
          <GuarantorSection
            title="Guarantor 2"
            prefix="g2"
            control={control}
            errors={errors.g2}
            ninValue={g2Nin}
            photo={g2Photo}
            onPickPhoto={(fromCamera) => pickImage(fromCamera, setG2Photo)}
            hidePhoto
          />

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            title={busy ? (uploading ? 'Uploading photos…' : 'Submitting KYC…') : 'Submit KYC'}
            loading={busy}
            disabled={busy}
            onPress={handleSubmit(onSubmit)}
            style={styles.submitBtn}
          />

          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Go back to address details</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Guarantor section sub-component ─────────────────────────────────
function GuarantorSection({
  title,
  prefix,
  control,
  errors,
  ninValue,
  photo,
  onPickPhoto,
  hidePhoto = false,
}: {
  title: string;
  prefix: 'g1' | 'g2';
  control: any;
  errors: any;
  ninValue: string;
  photo: PhotoState;
  onPickPhoto: (fromCamera: boolean) => void;
  hidePhoto?: boolean;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>{prefix === 'g1' ? '1' : '2'}</Text>
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      <View style={styles.sectionFields}>
        <Controller
          name={`${prefix}.fullName`}
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Full Name"
              placeholder="Guarantor's full name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors?.fullName?.message}
            />
          )}
        />

        <Controller
          name={`${prefix}.phone`}
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Phone Number"
              placeholder="11-digit phone number"
              keyboardType="number-pad"
              maxLength={11}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors?.phone?.message}
            />
          )}
        />

        <Controller
          name={`${prefix}.relationship`}
          control={control}
          render={({ field: { onChange, value } }) => (
            <Select
              label="Relationship"
              placeholder="How do you know this person?"
              value={value}
              options={RELATIONSHIP_OPTIONS}
              onChange={onChange}
              error={errors?.relationship?.message}
              searchable={false}
            />
          )}
        />

        <Controller
          name={`${prefix}.occupation`}
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Occupation"
              placeholder="e.g. Teacher, Trader, Civil Servant"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors?.occupation?.message}
            />
          )}
        />

        <Controller
          name={`${prefix}.address`}
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Home Address"
              placeholder="Guarantor's full home address"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors?.address?.message}
              multiline
              numberOfLines={2}
            />
          )}
        />

        <Controller
          name={`${prefix}.nin`}
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="NIN"
              placeholder="11-digit NIN"
              keyboardType="number-pad"
              maxLength={11}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors?.nin?.message}
              rightElement={
                <Text style={[styles.charCount, ninValue.length === 11 && styles.charCountDone]}>
                  {ninValue.length}/11
                </Text>
              }
            />
          )}
        />

        {!hidePhoto && (
          <NinPhotoSection
            photo={photo}
            onPick={onPickPhoto}
            label="NIN Document Photo"
          />
        )}
      </View>
    </View>
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
  stepWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  iconContainer: { alignItems: 'center', marginBottom: Spacing.lg },
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
    marginBottom: Spacing.md,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.cardGreen,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    lineHeight: Typography.sizes.sm * 1.6,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  sectionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionBadgeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textLight,
  },
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textLight,
  },
  sectionFields: { padding: Spacing.md, gap: Spacing.md },
  sectionDivider: { height: Spacing.lg },
  charCount: {
    fontSize: Typography.sizes.sm,
    color: Colors.secondary,
    fontWeight: Typography.weights.medium,
  },
  charCountDone: { color: Colors.success },
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
  previewWrapper: { borderRadius: BorderRadius.md, overflow: 'hidden', position: 'relative' },
  previewImage: { width: '100%', height: 160, borderRadius: BorderRadius.md },
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
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
  },
  placeholderText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  photoActions: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs },
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
  photoActionDivider: { width: 1, height: 20, backgroundColor: Colors.border },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#FEE2E2',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
  },
  errorText: { flex: 1, fontSize: Typography.sizes.sm, color: Colors.error },
  submitBtn: { marginTop: Spacing.lg },
  backLink: { alignItems: 'center', paddingVertical: Spacing.sm },
  backLinkText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
