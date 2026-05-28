import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UserProfile } from '@/api/user';
import { Button } from '@/components/ui/Button';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useUserProfile } from '@/hooks/useUserProfile';

// ── Types ───────────────────────────────────────────────────────────
type KycStatus = UserProfile['kyc_status'];

// ── Status badge ────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  KycStatus,
  { label: string; bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  not_submitted: {
    label: 'Not Submitted',
    bg: '#F3F4F6',
    text: '#6B7280',
    icon: 'ellipse-outline',
  },
  pending: {
    label: 'Under Review',
    bg: Colors.badge.pending.bg,
    text: Colors.badge.pending.text,
    icon: 'time-outline',
  },
  approved: {
    label: 'Verified',
    bg: Colors.badge.approved.bg,
    text: Colors.badge.approved.text,
    icon: 'checkmark-circle',
  },
  rejected: {
    label: 'Action Required',
    bg: Colors.badge.rejected.bg,
    text: Colors.badge.rejected.text,
    icon: 'close-circle-outline',
  },
};

function StatusBadge({ status }: { status: KycStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={14} color={config.text} />
      <Text style={[styles.badgeText, { color: config.text }]}>
        {config.label}
      </Text>
    </View>
  );
}

// ── Step row ────────────────────────────────────────────────────────
function StepRow({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{description}</Text>
      </View>
    </View>
  );
}

// ── CTA helpers ─────────────────────────────────────────────────────
function getCtaLabel(status: KycStatus): string {
  switch (status) {
    case 'not_submitted':
      return 'Begin Verification';
    case 'rejected':
      return 'View Feedback and Fix';
    case 'pending':
      return 'Track My Application';
    case 'approved':
      return 'View Verified Status';
  }
}

function handleCta(status: KycStatus) {
  router.push('/(main)/(profile)/kyc/pending');
}

// ── Main screen ─────────────────────────────────────────────────────
export default function KycIntroScreen() {
  const { profile, loading, error, refetch } = useUserProfile();

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
        <Text style={styles.headerTitle}>Identity Verification</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Loading */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your KYC status…</Text>
        </View>
      ) : error ? (
        /* Error state */
        <View style={styles.centered}>
          <Ionicons
            name="cloud-offline-outline"
            size={56}
            color={Colors.secondary}
          />
          <Text style={styles.errorHeading}>Something went wrong</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Button
            title="Retry"
            variant="outline"
            onPress={refetch}
            style={styles.retryButton}
            fullWidth={false}
          />
        </View>
      ) : !profile?.application_fee_paid ? (
        /* ── Fee gate ─────────────────────────────────────────── */
        <View style={styles.centered}>
          <View style={styles.feeGateIcon}>
            <Ionicons name="receipt-outline" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.feeGateTitle}>Application Fee Required</Text>
          <Text style={styles.feeGateBody}>
            You need to pay the application fee before you can complete your KYC verification.
          </Text>
          <Button
            title="Pay Application Fee"
            onPress={() => router.push('/(main)/(vehicles)/application-fee')}
            style={styles.feeGateBtn}
          />
          <TouchableOpacity onPress={() => router.back()} style={styles.feeGateBack}>
            <Text style={styles.feeGateBackTxt}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Status badge */}
          <View style={styles.badgeRow}>
            <StatusBadge status={profile?.kyc_status ?? 'not_submitted'} />
          </View>

          {/* Hero icon */}
          <View style={styles.heroContainer}>
            <View style={styles.heroBg}>
              <Ionicons name="shield-checkmark" size={52} color={Colors.primary} />
            </View>
          </View>

          {/* Heading */}
          <Text style={styles.heading}>Verify your identity</Text>
          <Text style={styles.subheading}>
            Complete your KYC right here in the app — or visit any Moses Transport
            office if you need help. Verified users unlock full loan access.
          </Text>

          {/* Rejected notice */}
          {profile?.kyc_status === 'rejected' ? (
            <View style={styles.rejectedBox}>
              <Ionicons name="warning-outline" size={18} color={Colors.badge.rejected.text} />
              <Text style={styles.rejectedText}>
                Your submission was not approved.
                {profile.kyc_admin_note
                  ? ` Admin note: "${profile.kyc_admin_note}"`
                  : ' Tap "View Feedback and Fix" for details.'
                }
              </Text>
            </View>
          ) : null}

          {/* Pending notice */}
          {profile?.kyc_status === 'pending' && profile.kyc_admin_note ? (
            <View style={styles.pendingNoteBox}>
              <Ionicons name="chatbox-outline" size={18} color="#92400e" />
              <Text style={styles.pendingNoteText}>
                Admin message: {profile.kyc_admin_note}
              </Text>
            </View>
          ) : null}

          {/* Steps — only shown before submission */}
          {(profile?.kyc_status === 'not_submitted') && (
            <>
              <View style={styles.stepsCard}>
                <Text style={styles.stepsHeading}>4 easy steps</Text>
                <StepRow
                  number={1}
                  title="NIN Details"
                  description="Enter your NIN number and take a photo of your NIN slip or ID card"
                />
                <View style={styles.stepDivider} />
                <StepRow
                  number={2}
                  title="Take a Selfie"
                  description="Take a clear photo of your face using the front camera"
                />
                <View style={styles.stepDivider} />
                <StepRow
                  number={3}
                  title="Your Address"
                  description="Provide your home address and contact details"
                />
                <View style={styles.stepDivider} />
                <StepRow
                  number={4}
                  title="Guarantor Details"
                  description="Add a guarantor — their info, NIN, and NIN document photo"
                />
              </View>

              <View style={styles.securityNote}>
                <Ionicons name="lock-closed-outline" size={16} color={Colors.primary} />
                <Text style={styles.securityText}>
                  Your information is encrypted and secure. We will never share
                  your details without your consent.
                </Text>
              </View>
            </>
          )}

          {/* CTA */}
          <Button
            title={getCtaLabel(profile?.kyc_status ?? 'not_submitted')}
            onPress={() => handleCta(profile?.kyc_status ?? 'not_submitted')}
            style={styles.ctaButton}
          />

          {/* Visit office fallback */}
          {(profile?.kyc_status === 'not_submitted' || profile?.kyc_status === 'rejected') ? (
            <TouchableOpacity
              onPress={() => router.push('/(main)/(profile)/kyc/pending')}
              style={styles.officeLink}
            >
              <Ionicons name="business-outline" size={15} color={Colors.textSecondary} />
              <Text style={styles.officeLinkText}>
                Can't complete this yourself? Visit our office
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      )}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
  },
  errorHeading: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  errorBody: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  badgeRow: {
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    letterSpacing: 0.3,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    marginBottom: Spacing.lg,
  },
  rejectedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.badge.rejected.bg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  rejectedText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.badge.rejected.text,
    lineHeight: Typography.sizes.sm * 1.6,
  },
  pendingNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  pendingNoteText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: '#78350f',
    lineHeight: Typography.sizes.sm * 1.6,
  },
  stepsCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  stepsHeading: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textLight,
  },
  stepContent: {
    flex: 1,
    gap: 3,
  },
  stepTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  stepDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sizes.sm * 1.5,
  },
  stepDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.cardGreen,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  securityText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    lineHeight: Typography.sizes.sm * 1.6,
  },
  ctaButton: {
    marginTop: Spacing.sm,
  },
  officeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  officeLinkText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },

  // Fee gate
  feeGateIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.cardGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  feeGateTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  feeGateBody: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  feeGateBtn: {
    marginTop: Spacing.sm,
    width: '100%',
  },
  feeGateBack: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  feeGateBackTxt: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
