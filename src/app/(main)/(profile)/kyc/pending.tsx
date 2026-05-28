import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KycData, userApi } from '@/api/user';
import { Button } from '@/components/ui/Button';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useUserProfile } from '@/hooks/useUserProfile';

type KycStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

const STATUS_CONFIG: Record<
  KycStatus,
  { icon: keyof typeof Ionicons.glyphMap; iconColor: string; iconBg: string; title: string; bg: string; textColor: string }
> = {
  not_submitted: {
    icon: 'shield-outline', iconColor: Colors.textSecondary, iconBg: '#F3F4F6',
    title: 'Not Started', bg: '#F3F4F6', textColor: '#6B7280',
  },
  pending: {
    icon: 'time-outline', iconColor: Colors.badge.pending.text, iconBg: Colors.badge.pending.bg,
    title: 'Under Review', bg: Colors.badge.pending.bg, textColor: Colors.badge.pending.text,
  },
  approved: {
    icon: 'checkmark-circle', iconColor: Colors.badge.approved.text, iconBg: Colors.badge.approved.bg,
    title: 'Identity Verified', bg: Colors.badge.approved.bg, textColor: Colors.badge.approved.text,
  },
  rejected: {
    icon: 'close-circle-outline', iconColor: Colors.badge.rejected.text, iconBg: Colors.badge.rejected.bg,
    title: 'Action Required', bg: Colors.badge.rejected.bg, textColor: Colors.badge.rejected.text,
  },
};

const ID_TYPE_LABELS: Record<string, string> = {
  nin: 'NIN',
  voters_card: "Voter's Card",
  drivers_license: "Driver's License",
  international_passport: 'International Passport',
};

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, !value && styles.infoValueEmpty]}>
        {value !== undefined && value !== null && value !== '' ? String(value) : 'Not provided'}
      </Text>
    </View>
  );
}

function PhotoRow({ label, uri }: { label: string; uri?: string | null }) {
  if (!uri) return <InfoRow label={label} value={null} />;
  return (
    <View style={styles.photoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Image source={{ uri }} style={styles.photoThumb} contentFit="cover" />
    </View>
  );
}

function CheckRow({ label, done }: { label: string; done: boolean }) {
  return (
    <View style={styles.checkRow}>
      <Ionicons
        name={done ? 'checkmark-circle' : 'ellipse-outline'}
        size={18}
        color={done ? Colors.success : Colors.textSecondary}
      />
      <Text style={[styles.checkLabel, !done && styles.checkLabelMissing]}>{label}</Text>
      {!done && <Text style={styles.missingTag}>Missing</Text>}
    </View>
  );
}

export default function KycPendingScreen() {
  const { profile, loading: profileLoading, refetch: refetchProfile } = useUserProfile();
  const [kycData, setKycData] = useState<KycData | null>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const loadKyc = useCallback(async () => {
    try {
      const { data } = await userApi.getKycData();
      setKycData(data);
    } catch {
      // non-fatal
    } finally {
      setKycLoading(false);
    }
  }, []);

  useEffect(() => { loadKyc(); }, [loadKyc]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), loadKyc()]);
    setRefreshing(false);
  }, [refetchProfile, loadKyc]);

  const status: KycStatus = profile?.kyc_status ?? 'not_submitted';
  const cfg = STATUS_CONFIG[status];
  const adminNote = profile?.kyc_admin_note;
  const d = kycData;

  const submissionChecks = d ? [
    { label: 'Full name & phone',       done: !!(d.full_name && d.phone) },
    { label: 'Date of birth & gender',  done: !!(d.date_of_birth && d.gender) },
    { label: 'Home address',            done: !!d.address },
    { label: 'State of origin & LGA',   done: !!(d.state_of_origin && d.local_govt) },
    { label: 'NIN / ID document',        done: !!(d.nin || (d.id_type && d.id_number)) },
    { label: 'Passport photo',          done: !!d.profile_photo },
    { label: 'Guarantors (2 required)', done: (d.guarantors?.length ?? 0) >= 2 },
    { label: 'Closest relatives',       done: (d.relatives?.length ?? 0) >= 1 },
  ] : [];

  const completedCount = submissionChecks.filter((c) => c.done).length;
  const loading = profileLoading || kycLoading;

  return (
    <SafeAreaView style={styles.container}>
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
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        >
          {/* Status card */}
          <View style={[styles.statusCard, { backgroundColor: cfg.bg }]}>
            <View style={[styles.iconCircle, { backgroundColor: cfg.iconBg }]}>
              <Ionicons name={cfg.icon} size={52} color={cfg.iconColor} />
            </View>
            <Text style={[styles.statusTitle, { color: cfg.textColor }]}>{cfg.title}</Text>
            {status === 'pending' && (
              <Text style={[styles.statusMessage, { color: cfg.textColor }]}>
                Your documents are being reviewed. You will be notified once a decision is made.
              </Text>
            )}
            {status === 'approved' && (
              <Text style={[styles.statusMessage, { color: cfg.textColor }]}>
                Your identity has been verified. You now have full access to loans and all features.
              </Text>
            )}
            {status === 'rejected' && (
              <Text style={[styles.statusMessage, { color: cfg.textColor }]}>
                Your submission was not approved. Review the feedback below, fix the issues, and re-submit.
              </Text>
            )}
          </View>

          {/* Admin note */}
          {adminNote ? (
            <View style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <Ionicons name="chatbox-outline" size={16} color="#92400e" />
                <Text style={styles.noteHeaderText}>Message from Admin</Text>
              </View>
              <Text style={styles.noteBody}>{adminNote}</Text>
            </View>
          ) : null}

          {/* Submission checklist */}
          {status !== 'approved' && submissionChecks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Submission Progress</Text>
                <Text style={styles.progressText}>{completedCount}/{submissionChecks.length}</Text>
              </View>
              <View style={styles.card}>
                {submissionChecks.map((item, i) => (
                  <View key={item.label} style={i > 0 ? styles.checkRowBorder : undefined}>
                    <CheckRow label={item.label} done={item.done} />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Full KYC review */}
          {d && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.reviewToggle}
                onPress={() => setShowReview(v => !v)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitle}>View My Full Submission</Text>
                <Ionicons
                  name={showReview ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              {showReview && (
                <View style={styles.card}>
                  {/* Personal */}
                  <SectionHeader title="Personal Information" />
                  <View style={styles.twoCol}>
                    {d.profile_photo ? (
                      <View style={styles.passportWrap}>
                        <Image source={{ uri: d.profile_photo }} style={styles.passportPhoto} contentFit="cover" />
                        <Text style={styles.photoCaption}>Passport Photo</Text>
                      </View>
                    ) : null}
                    <View style={{ flex: 1 }}>
                      <InfoRow label="Full Name"      value={d.full_name} />
                      <InfoRow label="Phone"          value={d.phone} />
                      <InfoRow label="Date of Birth"  value={d.date_of_birth} />
                      <InfoRow label="Gender"         value={d.gender} />
                      <InfoRow label="Marital Status" value={d.marital_status} />
                    </View>
                  </View>

                  {/* Address */}
                  <SectionHeader title="Address" />
                  <InfoRow label="Current Address"  value={d.address} />
                  <InfoRow label="Landmark"         value={d.landmark} />
                  <InfoRow label="Length of Stay"   value={d.length_of_stay} />
                  <InfoRow label="Previous Address" value={d.previous_address} />
                  <InfoRow label="State of Origin"  value={d.state_of_origin} />
                  <InfoRow label="LGA"              value={d.local_govt} />

                  {/* Identification */}
                  <SectionHeader title="Identification" />
                  <InfoRow label="NIN"       value={d.nin} />
                  <InfoRow label="ID Type"   value={d.id_type ? (ID_TYPE_LABELS[d.id_type] ?? d.id_type) : null} />
                  <InfoRow label="ID Number" value={d.id_number} />
                  <PhotoRow label="ID Document" uri={d.id_document_url} />

                  {/* Experience */}
                  <SectionHeader title="Riding Experience" />
                  <InfoRow label="Years Riding"          value={d.years_riding} />
                  <InfoRow label="Rider's Permit No."    value={d.riders_permit_number} />
                  <InfoRow label="Previous Company"      value={d.prev_transport_co} />
                  <InfoRow label="Installments Done"     value={d.installments_done} />
                  <InfoRow label="Existing Obligations"  value={d.existing_obligations} />

                  {/* Background */}
                  <SectionHeader title="Background & Referral" />
                  <InfoRow label="Referral Name"    value={d.referral_name} />
                  <InfoRow label="Referral Phone"   value={d.referral_phone} />
                  <InfoRow label="Referral Address" value={d.referral_address} />

                  {/* Relatives */}
                  <SectionHeader title="Closest Relatives" />
                  {(d.relatives?.length ?? 0) === 0 ? (
                    <Text style={styles.emptyText}>No relatives added</Text>
                  ) : (
                    d.relatives.map((r, i) => (
                      <View key={r.id} style={[styles.subCard, i > 0 && { marginTop: 8 }]}>
                        <Text style={styles.subCardTitle}>Relative {i + 1}</Text>
                        <InfoRow label="Name"    value={r.full_name} />
                        <InfoRow label="Phone"   value={r.phone} />
                        <InfoRow label="Address" value={(r as any).address} />
                      </View>
                    ))
                  )}

                  {/* Guarantors */}
                  <SectionHeader title="Guarantors" />
                  {(d.guarantors?.length ?? 0) === 0 ? (
                    <Text style={styles.emptyText}>No guarantors added</Text>
                  ) : (
                    d.guarantors.map((g: any, i: number) => (
                      <View key={g.id} style={[styles.subCard, i > 0 && { marginTop: 8 }]}>
                        <Text style={styles.subCardTitle}>Guarantor {i + 1}</Text>
                        <InfoRow label="Name"              value={g.full_name} />
                        <InfoRow label="Phone"             value={g.phone} />
                        <InfoRow label="Alternate Phone"   value={g.alternate_phone} />
                        <InfoRow label="Relationship"      value={g.relationship} />
                        <InfoRow label="Occupation"        value={g.occupation} />
                        <InfoRow label="Address"           value={g.address} />
                        <InfoRow label="State of Origin"   value={g.state_of_origin} />
                        <InfoRow label="ID Type"           value={g.id_type} />
                        <InfoRow label="ID Number"         value={g.id_number ?? g.nin} />
                        <InfoRow label="Consent"           value={g.guarantor_consent ? 'Given' : 'Not given'} />
                        <PhotoRow label="Guarantor Photo"  uri={g.profile_photo} />
                      </View>
                    ))
                  )}

                  {/* Consents */}
                  <SectionHeader title="Consent & Signature" />
                  <InfoRow label="Data Verification Consent" value={d.consent_data_verify ? 'Yes' : 'No'} />
                  <InfoRow label="Asset Recovery Consent"    value={d.consent_asset_recovery ? 'Yes' : 'No'} />
                  {d.signature_url ? (
                    <View style={styles.sigWrap}>
                      <Text style={styles.infoLabel}>Signature</Text>
                      <Image source={{ uri: d.signature_url }} style={styles.sigImg} contentFit="contain" />
                    </View>
                  ) : (
                    <InfoRow label="Signature" value={null} />
                  )}
                </View>
              )}
            </View>
          )}

          {/* Approved unlock list */}
          {status === 'approved' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What you unlocked</Text>
              <View style={styles.card}>
                {[
                  'Apply for motorcycle and tricycle autopay',
                  'Access your dedicated payment account',
                  'Track repayments and autopay history',
                ].map((item, i) => (
                  <View key={i} style={[styles.checkRow, i > 0 && styles.checkRowBorder]}>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                    <Text style={styles.checkLabel}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Action buttons */}
          {status === 'rejected' && (
            <Button
              title="Fix and Re-submit"
              onPress={() => router.push('/(main)/(profile)/kyc/form')}
              style={styles.actionBtn}
            />
          )}
          {status === 'pending' && (
            <Button
              title="Update My Submission"
              variant="outline"
              onPress={() => router.push('/(main)/(profile)/kyc/form')}
              style={styles.actionBtn}
            />
          )}
          {status === 'not_submitted' && (
            <Button
              title="Start Verification"
              onPress={() => router.push('/(main)/(profile)/kyc/form')}
              style={styles.actionBtn}
            />
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
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  backBtn:      { padding: Spacing.xs },
  headerTitle:  {
    flex: 1, textAlign: 'center',
    fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold, color: Colors.primary,
  },
  headerSpacer: { width: 32 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl, gap: Spacing.lg },

  statusCard: {
    borderRadius: BorderRadius.xl, padding: Spacing.xl,
    alignItems: 'center', gap: Spacing.md,
  },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48,
    justifyContent: 'center', alignItems: 'center',
  },
  statusTitle:   { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, textAlign: 'center' },
  statusMessage: { fontSize: Typography.sizes.base, textAlign: 'center', lineHeight: Typography.sizes.base * 1.6 },

  noteCard: {
    backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fcd34d',
    borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.sm,
  },
  noteHeader:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  noteHeaderText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: '#92400e' },
  noteBody:       { fontSize: Typography.sizes.base, color: '#78350f', lineHeight: Typography.sizes.base * 1.6 },

  section:       { gap: Spacing.sm },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle:  {
    fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  progressText:  { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.primary },

  reviewToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },

  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, ...Shadows.sm },

  checkRow:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  checkRowBorder:  { borderTopWidth: 1, borderTopColor: Colors.borderLight },
  checkLabel:      { flex: 1, fontSize: Typography.sizes.sm, color: Colors.text },
  checkLabelMissing: { color: Colors.textSecondary },
  missingTag: {
    fontSize: 10, fontWeight: Typography.weights.semibold,
    color: Colors.badge.rejected.text, backgroundColor: Colors.badge.rejected.bg,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },

  sectionHeader: {
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    paddingBottom: 6, marginTop: 14, marginBottom: 6,
  },
  sectionHeaderText: {
    fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold,
    color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.8,
  },

  infoRow: { paddingVertical: 5 },
  infoLabel: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, marginBottom: 2 },
  infoValue: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.text },
  infoValueEmpty: { color: Colors.textSecondary, fontStyle: 'italic', fontWeight: Typography.weights.regular },

  twoCol: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  passportWrap: { alignItems: 'center', gap: 4 },
  passportPhoto: { width: 72, height: 72, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.borderLight },
  photoCaption:  { fontSize: 10, color: Colors.textSecondary },

  photoRow: { paddingVertical: 5 },
  photoThumb: { width: '100%', height: 120, borderRadius: BorderRadius.md, marginTop: 6, borderWidth: 1, borderColor: Colors.borderLight },

  sigWrap: { paddingVertical: 5 },
  sigImg:  { width: '100%', height: 80, marginTop: 6, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.borderLight },

  subCard: {
    backgroundColor: Colors.background, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.borderLight, padding: Spacing.sm,
  },
  subCardTitle: {
    fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },
  emptyText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, fontStyle: 'italic', paddingVertical: 6 },

  actionBtn: { marginTop: Spacing.xs },
  backButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  backButtonText: {
    fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.textLight,
  },
});
