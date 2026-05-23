import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { AvailableAsset, LoanApplication, assetApi } from '@/api/asset';
import { userApi } from '@/api/user';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';

const fmt = (n: number) => `₦${Number(n || 0).toLocaleString('en-NG')}`;

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [asset, setAsset]           = useState<AvailableAsset | null>(null);
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [feePaid, setFeePaid]       = useState<boolean | null>(null);
  const [loading, setLoading]       = useState(true);
  const [applying, setApplying]     = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsRes, appRes, feeRes] = await Promise.all([
          assetApi.getAvailable({ limit: 100 }),
          assetApi.getMyApplication().catch(() => ({ data: null })),
          userApi.getProfile().catch(() => ({ data: null })),
        ]);
        const found = assetsRes.data.assets.find(a => a.id === id) ?? null;
        setAsset(found);
        setApplication((appRes.data as any) ?? null);
        setFeePaid((feeRes.data as any)?.application_fee_paid ?? false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleApply = async () => {
    if (!asset) return;
    if (!feePaid) {
      Alert.alert(
        'Application Fee Required',
        'You must pay the application fee before applying for a vehicle.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Pay Fee', onPress: () => router.push('/(main)/(vehicles)/application-fee') },
        ]
      );
      return;
    }
    setApplying(true);
    try {
      await assetApi.applyForLoan(asset.id);
      Alert.alert(
        'Application Submitted',
        'Your autopay application has been submitted. We will review it and notify you shortly.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to submit application. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!asset) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={52} color={Colors.secondary} />
        <Text style={styles.notFoundTxt}>Vehicle not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backTxt}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const hasPendingApp = application?.status === 'pending';
  const isNew = asset.condition === 'new';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIconBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons
              name={asset.type === 'tricycle' ? 'car' : 'bicycle'}
              size={64}
              color={Colors.primary}
            />
          </View>
          <View style={[styles.conditionBadge, isNew && styles.conditionBadgeNew]}>
            <Text style={[styles.conditionTxt, isNew && styles.conditionTxtNew]}>
              {isNew ? 'Brand New' : 'Fairly Used'}
            </Text>
          </View>
        </View>

        {/* Name + code */}
        <View style={styles.nameSection}>
          <Text style={styles.vehicleName}>{asset.brand} {asset.model}</Text>
          <Text style={styles.vehicleCode}>{asset.asset_code}</Text>
        </View>

        {/* Specs */}
        <View style={styles.specsCard}>
          <SpecRow icon="car-outline"           label="Type"      value={asset.type}            capitalize />
          <SpecRow icon="color-palette-outline" label="Color"     value={asset.color}           capitalize />
          <SpecRow icon="document-text-outline" label="Plate"     value={asset.plate_number || '—'} />
          <SpecRow icon="construct-outline"     label="Condition" value={asset.condition}       capitalize last />
        </View>

        {/* Price */}
        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>Vehicle Price</Text>
          <Text style={styles.priceValue}>{fmt(asset.market_price)}</Text>
        </View>

        {/* Payment plan — daily only */}
        <View style={styles.planInfo}>
          <Ionicons name="sunny-outline" size={18} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.planInfoTitle}>Daily Payment Plan</Text>
            <Text style={styles.planInfoSub}>Payments are collected daily, Sunday – Friday</Text>
          </View>
        </View>

        {/* Application fee notice */}
        {feePaid === false && (
          <TouchableOpacity
            style={styles.feeBanner}
            onPress={() => router.push('/(main)/(vehicles)/application-fee')}
            activeOpacity={0.8}
          >
            <Ionicons name="alert-circle-outline" size={18} color="#92400E" />
            <Text style={styles.feeBannerTxt}>
              Application fee unpaid — tap to pay before applying
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#92400E" />
          </TouchableOpacity>
        )}

        {feePaid === true && (
          <View style={styles.feePaidBanner}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.feePaidTxt}>Application fee paid</Text>
          </View>
        )}

        {/* Apply button */}
        {hasPendingApp ? (
          <View style={styles.pendingBanner}>
            <Ionicons name="time-outline" size={18} color={Colors.warning} />
            <Text style={styles.pendingTxt}>You have a pending application under review</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.applyBtn, (applying || feePaid === false) && styles.applyBtnDisabled]}
            onPress={handleApply}
            disabled={applying}
            activeOpacity={0.85}
          >
            {applying
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />}
            <Text style={styles.applyTxt}>
              {applying ? 'Submitting...' : 'Apply for this Vehicle'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SpecRow({
  icon, label, value, capitalize, last,
}: {
  icon: any; label: string; value: string; capitalize?: boolean; last?: boolean;
}) {
  return (
    <View style={[styles.specRow, !last && styles.specRowBorder]}>
      <View style={styles.specLeft}>
        <Ionicons name={icon} size={15} color={Colors.primary} />
        <Text style={styles.specLabel}>{label}</Text>
      </View>
      <Text style={[styles.specValue, capitalize && styles.specValueCapitalize]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  centered:  { flex: 1, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  notFoundTxt: { fontSize: Typography.sizes.base, color: Colors.textSecondary },
  backBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.primary,
  },
  backTxt: { color: Colors.primary, fontWeight: Typography.weights.semibold },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  headerTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.text },

  scroll: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },

  hero:     { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  heroIcon: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.cardGreen, justifyContent: 'center', alignItems: 'center',
    ...Shadows.md,
  },
  conditionBadge:    { paddingHorizontal: 14, paddingVertical: 4, borderRadius: BorderRadius.full, backgroundColor: '#FEF3C7' },
  conditionBadgeNew: { backgroundColor: '#D1FAE5' },
  conditionTxt:      { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: '#92400E' },
  conditionTxtNew:   { color: '#065F46' },

  nameSection: { alignItems: 'center', gap: 4 },
  vehicleName: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.text },
  vehicleCode: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },

  specsCard:          { backgroundColor: '#fff', borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.borderLight, overflow: 'hidden', ...Shadows.sm },
  specRow:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 12 },
  specRowBorder:      { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  specLeft:           { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  specLabel:          { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  specValue:          { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.text },
  specValueCapitalize:{ textTransform: 'capitalize' },

  priceCard: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    ...Shadows.md,
  },
  priceLabel: { fontSize: Typography.sizes.base, color: 'rgba(255,255,255,0.8)', fontWeight: Typography.weights.medium },
  priceValue: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: '#fff' },

  planInfo: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.cardGreen, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '30',
  },
  planInfoTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.primary },
  planInfoSub:   { fontSize: Typography.sizes.xs, color: Colors.primaryLight, marginTop: 2 },

  feeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#FEF3C7', borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: '#FDE68A',
  },
  feeBannerTxt: { flex: 1, fontSize: Typography.sizes.sm, color: '#92400E', fontWeight: Typography.weights.medium },
  feePaidBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#D1FAE5', borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  feePaidTxt: { fontSize: Typography.sizes.sm, color: Colors.success, fontWeight: Typography.weights.medium },

  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#FEF3C7', borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: '#FDE68A',
  },
  pendingTxt: { flex: 1, fontSize: Typography.sizes.sm, color: '#92400E', fontWeight: Typography.weights.medium },

  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md, paddingVertical: 15, ...Shadows.md,
  },
  applyBtnDisabled: { opacity: 0.6 },
  applyTxt: { color: '#fff', fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },
});
