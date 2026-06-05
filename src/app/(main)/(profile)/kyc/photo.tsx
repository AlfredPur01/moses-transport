import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useKycSelfie } from '@/hooks/useKycSelfie';

const KYC_STEPS = ['NIN', 'Selfie', 'Address', 'Guarantor'];

const TIPS = [
  'Find a well-lit spot — avoid bright lights behind you',
  'Look straight into the camera',
  'Remove glasses, hats, or anything covering your face',
  'Make sure your full face is visible and clear',
];

export default function KycPhotoScreen() {
  const userId = useCurrentUserId();
  const { handleSubmit: submitSelfie, loading, error: submitError } = useKycSelfie();
  const { upload, uploading, error: uploadError } = useImageUpload();

  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);

  const takeSelfie = async () => {
    const ImagePicker = await import('expo-image-picker');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera permission needed',
        'Please allow camera access to take your selfie.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelfieUri(asset.uri);
      setSelfieBase64(`data:image/jpeg;base64,${asset.base64}`);
    }
  };

  const handleSubmit = async () => {
    if (!selfieBase64 || !userId) return;
    const url = await upload(selfieBase64, `kyc/${userId}/selfie`);
    if (!url) return;
    await submitSelfie(url);
  };

  const busy = uploading || loading;
  const error = uploadError || submitError;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Take a Selfie</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Step indicator */}
      <View style={styles.stepWrapper}>
        <StepIndicator steps={KYC_STEPS} currentStep={1} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {selfieUri ? (
          /* Preview */
          <View style={styles.previewSection}>
            <Image
              source={{ uri: selfieUri }}
              style={styles.previewImage}
              contentFit="cover"
            />
            <View style={styles.previewActions}>
              <TouchableOpacity style={styles.retakeBtn} onPress={takeSelfie}>
                <Ionicons name="camera-outline" size={18} color={Colors.primary} />
                <Text style={styles.retakeBtnText}>Retake</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Camera prompt */
          <View style={styles.cameraPrompt}>
            <View style={styles.faceFrame}>
              <Ionicons name="person-outline" size={80} color={Colors.secondary} />
            </View>
            <Text style={styles.promptHeading}>Position your face here</Text>
            <Text style={styles.promptSubtext}>
              Your face must be fully visible and centred in the frame
            </Text>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={Colors.primary}
            />
            <Text style={styles.tipsTitle}>Tips for a good selfie</Text>
          </View>
          {TIPS.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* CTA */}
        {selfieUri ? (
          <Button
            title={busy ? (uploading ? 'Uploading…' : 'Saving…') : 'Use This Photo'}
            loading={busy}
            disabled={busy}
            onPress={handleSubmit}
            style={styles.cta}
          />
        ) : (
          <Button
            title="Open Front Camera"
            onPress={takeSelfie}
            style={styles.cta}
          />
        )}

        <TouchableOpacity
          style={styles.skipNote}
          onPress={() => router.back()}
        >
          <Text style={styles.skipNoteText}>Go back and re-check NIN details</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  cameraPrompt: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  faceFrame: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.cardGreen,
  },
  promptHeading: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    textAlign: 'center',
  },
  promptSubtext: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.sizes.base * 1.5,
  },
  previewSection: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  previewImage: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  retakeBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.primary,
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
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 6,
    flexShrink: 0,
  },
  tipText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sizes.sm * 1.5,
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
  cta: {
    marginTop: Spacing.xs,
  },
  skipNote: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  skipNoteText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
