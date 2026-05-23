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

import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useUserProfile } from '@/hooks/useUserProfile';

type KycStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

const STATUS_CONFIG: Record<
  KycStatus,
  {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBg: string;
    title: string;
    message: string;
    bg: string;
    textColor: string;
  }
> = {
  not_submitted: {
    icon: 'shield-outline',
    iconColor: Colors.textSecondary,
    iconBg: '#F3F4F6',
    title: 'Verification Not Started',
    message: 'Visit a Moses Transport office with your NIN and valid ID to get verified.',
    bg: '#F3F4F6',
    textColor: '#6B7280',
  },
  pending: {
    icon: 'time-outline',
    iconColor: Colors.badge.pending.text,
    iconBg: Colors.badge.pending.bg,
    title: 'Under Review',
    message: 'Your documents are being reviewed by our team. You will be notified within 24 hours.',
    bg: Colors.badge.pending.bg,
    textColor: Colors.badge.pending.text,
  },
  approved: {
    icon: 'checkmark-circle',
    iconColor: Colors.badge.approved.text,
    iconBg: Colors.badge.approved.bg,
    title: 'Identity Verified',
    message: 'Your identity has been verified. You now have full access to loans and all features.',
    bg: Colors.badge.approved.bg,
    textColor: Colors.badge.approved.text,
  },
  rejected: {
    icon: 'close-circle-outline',
    iconColor: Colors.badge.rejected.text,
    iconBg: Colors.badge.rejected.bg,
    title: 'Verification Rejected',
    message: 'Your KYC was not approved. Please visit our office with valid documents to re-submit.',
    bg: Colors.badge.rejected.bg,
    textColor: Colors.badge.rejected.text,
  },
};

const OFFICE_INFO = [
  { icon: 'location-outline' as const, label: 'Address', value: '12 Moses Transport Plaza, Lagos State' },
  { icon: 'time-outline' as const, label: 'Office Hours', value: 'Mon – Sat: 8:00 AM – 5:00 PM' },
  { icon: 'call-outline' as const, label: 'Phone', value: '+234 800 000 0000' },
];

export default function KycPendingScreen() {
  const { profile, loading } = useUserProfile();

  const status: KycStatus = profile?.kyc_status ?? 'not_submitted';
  const cfg = STATUS_CONFIG[status];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Status</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Status card */}
          <View style={[styles.statusCard, { backgroundColor: cfg.bg }]}>
            <View style={[styles.iconCircle, { backgroundColor: cfg.iconBg }]}>
              <Ionicons name={cfg.icon} size={52} color={cfg.iconColor} />
            </View>
            <Text style={[styles.statusTitle, { color: cfg.textColor }]}>{cfg.title}</Text>
            <Text style={[styles.statusMessage, { color: cfg.textColor }]}>{cfg.message}</Text>
          </View>

          {/* What to bring (only if not approved) */}
          {status !== 'approved' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What to bring</Text>
              <View style={styles.card}>
                {[
                  { icon: 'card-outline' as const, text: 'Original NIN slip or National ID card' },
                  { icon: 'person-outline' as const, text: 'Recent passport photograph (2 copies)' },
                  { icon: 'document-text-outline' as const, text: 'Proof of address (utility bill or bank statement)' },
                ].map((item, i) => (
                  <View key={i} style={[styles.docRow, i > 0 && styles.docRowBorder]}>
                    <View style={styles.docIcon}>
                      <Ionicons name={item.icon} size={18} color={Colors.primary} />
                    </View>
                    <Text style={styles.docText}>{item.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Office info (only if not approved) */}
          {status !== 'approved' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Us</Text>
              <View style={styles.card}>
                {OFFICE_INFO.map((info, i) => (
                  <View key={i} style={[styles.infoRow, i > 0 && styles.infoRowBorder]}>
                    <Ionicons name={info.icon} size={16} color={Colors.textSecondary} />
                    <View>
                      <Text style={styles.infoLabel}>{info.label}</Text>
                      <Text style={styles.infoValue}>{info.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Approved — what's unlocked */}
          {status === 'approved' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What's unlocked</Text>
              <View style={styles.card}>
                {[
                  'Apply for motorcycle and tricycle loans',
                  'Access your dedicated payment account',
                  'Track repayments and loan history',
                ].map((item, i) => (
                  <View key={i} style={[styles.unlockRow, i > 0 && styles.unlockRowBorder]}>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                    <Text style={styles.unlockText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back to Profile</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  statusCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    lineHeight: Typography.sizes.base * 1.6,
  },
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  docRowBorder: { borderTopWidth: 1, borderTopColor: Colors.borderLight },
  docIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.text,
    lineHeight: Typography.sizes.sm * 1.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: Colors.borderLight },
  infoLabel: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },
  infoValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
    marginTop: 2,
  },
  unlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  unlockRowBorder: { borderTopWidth: 1, borderTopColor: Colors.borderLight },
  unlockText: { flex: 1, fontSize: Typography.sizes.base, color: Colors.text },
  backButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textLight,
  },
});
