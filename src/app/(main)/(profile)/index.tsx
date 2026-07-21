import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';

const KYC_STATUS_CONFIG = {
  not_submitted: { label: 'Not Submitted', bg: '#F3F4F6', color: '#6B7280', icon: 'ellipse-outline' as const },
  pending: { label: 'Under Review', bg: Colors.badge.pending.bg, color: Colors.badge.pending.text, icon: 'time-outline' as const },
  approved: { label: 'Verified', bg: Colors.badge.approved.bg, color: Colors.badge.approved.text, icon: 'checkmark-circle' as const },
  rejected: { label: 'Action Required', bg: Colors.badge.rejected.bg, color: Colors.badge.rejected.text, icon: 'close-circle-outline' as const },
};

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={Colors.textSecondary} />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.actionIcon, danger && styles.actionIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? Colors.error : Colors.primary} />
      </View>
      <Text style={[styles.actionLabel, danger && styles.actionLabelDanger]}>{label}</Text>
      {!danger && <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { profile, loading, error, refetch } = useUserProfile();
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => logout(),
        // AuthNavigator in _layout.tsx detects token removal and redirects
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.secondary} />
        <Text style={styles.errorText}>{error ?? 'Failed to load profile'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const kycCfg = KYC_STATUS_CONFIG[profile.kyc_status] ?? KYC_STATUS_CONFIG.not_submitted;
  const firstName = profile.full_name?.split(' ')[0] ?? '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          {profile.profile_photo ? (
            <Image
              source={{ uri: profile.profile_photo }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.fullName}>{profile.full_name}</Text>
          {profile.user_code && (
            <Text style={styles.userCode}>{profile.user_code}</Text>
          )}
          <Text style={styles.phone}>{profile.phone}</Text>
          <View style={[styles.statusBadge, { backgroundColor: kycCfg.bg }]}>
            <Ionicons name={kycCfg.icon} size={12} color={kycCfg.color} />
            <Text style={[styles.statusText, { color: kycCfg.color }]}>{kycCfg.label}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* KYC Section */}
          {profile.kyc_status !== 'approved' && (
            <TouchableOpacity
              style={styles.kycCard}
              onPress={() => router.push('/(main)/(profile)/kyc/intro')}
              activeOpacity={0.8}
            >
              <View style={styles.kycCardLeft}>
                <Ionicons name="shield-checkmark-outline" size={24} color={Colors.primary} />
                <View>
                  <Text style={styles.kycCardTitle}>Identity Verification</Text>
                  <Text style={styles.kycCardSub}>
                    {profile.kyc_status === 'pending'
                      ? 'Verification under review'
                      : profile.kyc_status === 'rejected'
                      ? 'Re-submit required'
                      : 'Complete to unlock loans'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}

          {/* Account Info */}
          {profile.virtual_account_number && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Account</Text>
              <View style={styles.sectionCard}>
                <InfoRow icon="wallet-outline" label="Account Number" value={profile.virtual_account_number} />
                <View style={styles.rowDivider} />
                <InfoRow icon="business-outline" label="Bank" value={profile.virtual_bank_name} />
              </View>
            </View>
          )}

          {/* Personal Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.sectionCard}>
              <InfoRow icon="mail-outline" label="Email" value={profile.email} />
              {profile.email && profile.alternate_phone && <View style={styles.rowDivider} />}
              <InfoRow icon="call-outline" label="Alternate Phone" value={profile.alternate_phone} />
              {(profile.email || profile.alternate_phone) && profile.address && <View style={styles.rowDivider} />}
              <InfoRow icon="location-outline" label="Address" value={profile.address} />
              {profile.address && profile.state_of_origin && <View style={styles.rowDivider} />}
              <InfoRow icon="map-outline" label="State of Origin" value={profile.state_of_origin} />
              {profile.state_of_origin && profile.local_govt && <View style={styles.rowDivider} />}
              <InfoRow icon="business-outline" label="Local Govt. Area" value={profile.local_govt} />
            </View>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.sectionCard}>
              <ActionRow
                icon="people-outline"
                label="Guarantor Information"
                onPress={() => router.push('/(main)/(profile)/guarantor')}
              />
              <View style={styles.rowDivider} />
              <ActionRow
                icon="lock-closed-outline"
                label="Change Password"
                onPress={() => router.push('/(main)/(profile)/change-password')}
              />
              <View style={styles.rowDivider} />
              <ActionRow
                icon="log-out-outline"
                label="Log Out"
                onPress={handleLogout}
                danger
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  errorText: { fontSize: Typography.sizes.base, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  retryText: { fontSize: Typography.sizes.base, color: Colors.primary, fontWeight: Typography.weights.semibold },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.primary },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.cardGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: { fontSize: Typography.sizes.xxxl, fontWeight: Typography.weights.bold, color: Colors.primary },
  fullName: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.text },
  userCode: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.primary, fontFamily: 'monospace', letterSpacing: 1 },
  phone: { fontSize: Typography.sizes.base, color: Colors.textSecondary },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl, gap: Spacing.lg },
  kycCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardGreen,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  kycCardLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  kycCardTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.primary },
  kycCardSub: { fontSize: Typography.sizes.sm, color: Colors.primaryLight, marginTop: 2 },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.xs },
  infoText: { flex: 1 },
  infoLabel: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },
  infoValue: { fontSize: Typography.sizes.base, color: Colors.text, fontWeight: Typography.weights.medium, marginTop: 1 },
  rowDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 2 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconDanger: { backgroundColor: '#FEE2E2' },
  actionLabel: { flex: 1, fontSize: Typography.sizes.base, color: Colors.text, fontWeight: Typography.weights.medium },
  actionLabelDanger: { color: Colors.error },
});
