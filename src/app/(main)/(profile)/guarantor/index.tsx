import { Ionicons } from '@expo/vector-icons';
import { Image as RNImage } from 'react-native';
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

import { userApi } from '@/api/user';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';

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

export default function GuarantorScreen() {
  const [guarantors, setGuarantors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await userApi.getKycData();
      setGuarantors(data.guarantors ?? []);
    } catch {
      setGuarantors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guarantors</Text>
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
          {guarantors.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={48} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Guarantors Added</Text>
              <Text style={styles.emptySub}>
                You have not submitted any guarantor details yet. Complete your KYC to add guarantors.
              </Text>
              <TouchableOpacity
                style={styles.ctaBtn}
                onPress={() => router.push('/(main)/(profile)/kyc/form')}
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={18} color="#fff" />
                <Text style={styles.ctaBtnTxt}>Complete KYC</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.countLabel}>
                {guarantors.length} {guarantors.length === 1 ? 'Guarantor' : 'Guarantors'} on file
              </Text>

              {guarantors.map((g: any, i: number) => (
                <View key={g.id ?? i} style={styles.card}>
                  {/* Card header */}
                  <View style={styles.cardHeader}>
                    {g.profile_photo ? (
                      <RNImage
                        source={{ uri: g.profile_photo }}
                        style={styles.photo}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <Ionicons name="person" size={28} color={Colors.primary} />
                      </View>
                    )}
                    <View style={styles.cardHeaderText}>
                      <Text style={styles.guarantorName}>{g.full_name ?? 'Unknown'}</Text>
                      <View style={styles.consentBadge(g.guarantor_consent)}>
                        <Ionicons
                          name={g.guarantor_consent ? 'checkmark-circle' : 'close-circle'}
                          size={12}
                          color={g.guarantor_consent ? Colors.success : Colors.error}
                        />
                        <Text style={styles.consentBadgeTxt(g.guarantor_consent)}>
                          {g.guarantor_consent ? 'Consent given' : 'No consent'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.indexBadge}>
                      <Text style={styles.indexBadgeTxt}>#{i + 1}</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Contact */}
                  <Text style={styles.sectionLabel}>Contact</Text>
                  <InfoRow label="Phone" value={g.phone} />
                  <InfoRow label="Alternate Phone" value={g.alternate_phone} />
                  <InfoRow label="Relationship" value={g.relationship} />
                  <InfoRow label="Years of Relationship" value={g.years_of_relationship} />

                  {/* Address */}
                  <View style={styles.divider} />
                  <Text style={styles.sectionLabel}>Address</Text>
                  <InfoRow label="Home Address" value={g.address} />
                  <InfoRow label="Workplace Address" value={g.workplace_address} />
                  <InfoRow label="State of Origin" value={g.state_of_origin} />
                  <InfoRow label="LGA" value={g.local_govt} />

                  {/* Work */}
                  <View style={styles.divider} />
                  <Text style={styles.sectionLabel}>Employment</Text>
                  <InfoRow label="Occupation" value={g.occupation} />
                  <InfoRow label="Employer" value={g.employer_name} />

                  {/* ID */}
                  <View style={styles.divider} />
                  <Text style={styles.sectionLabel}>Identification</Text>
                  <InfoRow label="ID Type" value={g.id_type} />
                  <InfoRow label="ID Number" value={g.id_number} />

                  {/* Status */}
                  <View style={styles.divider} />
                  <View style={styles.statusRow}>
                    <Text style={styles.infoLabel}>Verification Status</Text>
                    <View style={[
                      styles.statusPill,
                      g.verification_status === 'verified' && styles.statusPillGreen,
                    ]}>
                      <Text style={[
                        styles.statusPillTxt,
                        g.verification_status === 'verified' && styles.statusPillTxtGreen,
                      ]}>
                        {g.verification_status ?? 'Pending'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.updateBtn}
                onPress={() => router.push('/(main)/(profile)/kyc/form')}
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={18} color={Colors.primary} />
                <Text style={styles.updateBtnTxt}>Update Guarantors via KYC</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl, gap: Spacing.lg },

  countLabel: {
    fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5,
  },

  card: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.xs, ...Shadows.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingBottom: Spacing.xs },
  photo: { width: 56, height: 56, borderRadius: 28 },
  photoPlaceholder: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.cardGreen, justifyContent: 'center', alignItems: 'center',
  },
  cardHeaderText: { flex: 1, gap: 4 },
  guarantorName: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.text },
  consentBadge: (consent: boolean) => ({
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 3,
    backgroundColor: consent ? '#DCFCE7' : '#FEE2E2',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, alignSelf: 'flex-start' as const,
  }),
  consentBadgeTxt: (consent: boolean) => ({
    fontSize: 10, fontWeight: '600' as const,
    color: consent ? Colors.success : Colors.error,
  }),
  indexBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  indexBadgeTxt: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: '#fff' },

  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 4 },
  sectionLabel: {
    fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold,
    color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 2,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 4 },
  infoLabel: { fontSize: Typography.sizes.xs, color: Colors.textSecondary, flex: 1 },
  infoValue: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.text, flex: 2, textAlign: 'right' },
  infoValueEmpty: { color: Colors.textSecondary, fontStyle: 'italic', fontWeight: '400' },

  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  statusPill: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    backgroundColor: Colors.badge.pending.bg,
  },
  statusPillGreen: { backgroundColor: Colors.badge.approved.bg },
  statusPillTxt: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold, color: Colors.badge.pending.text, textTransform: 'capitalize' },
  statusPillTxtGreen: { color: Colors.badge.approved.text },

  emptyWrap: {
    alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.xxxl, paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.cardGreen, justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.text },
  emptySub: { fontSize: Typography.sizes.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: 12, marginTop: Spacing.xs,
  },
  ctaBtnTxt: { color: '#fff', fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },

  updateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    borderWidth: 1, borderColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: 12,
  },
  updateBtnTxt: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.primary },
});
