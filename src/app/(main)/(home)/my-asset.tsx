import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useMyAsset } from '@/hooks/useMyAsset';

const { width: SCREEN_W } = Dimensions.get('window');

const fmtDate = (s?: string) => {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const fmt = (n?: number) =>
  n !== undefined ? `₦${Number(n).toLocaleString('en-NG')}` : '—';

function SpecRow({ icon, label, value, last }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.specRow, !last && styles.specRowBorder]}>
      <View style={styles.specLeft}>
        <Ionicons name={icon} size={15} color={Colors.primary} />
        <Text style={styles.specLabel}>{label}</Text>
      </View>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

export default function MyAssetScreen() {
  const { asset, loading, refreshing, error, refetch, onRefresh } = useMyAsset();
  const [photoIndex, setPhotoIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setPhotoIndex(idx);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading vehicle details…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={52} color={Colors.secondary} />
        <Text style={styles.errTitle}>Could not load vehicle</Text>
        <Text style={styles.errSub}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryTxt}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!asset) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="bicycle-outline" size={64} color={Colors.secondary} />
        <Text style={styles.errTitle}>No vehicle assigned</Text>
        <Text style={styles.errSub}>You don't have an assigned vehicle yet.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnTxt}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const hasPhotos = asset.photos && asset.photos.length > 0;
  const isNew = asset.condition === 'new';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Vehicle</Text>
        <View style={[styles.conditionBadge, isNew && styles.conditionBadgeNew]}>
          <Text style={[styles.conditionTxt, isNew && styles.conditionTxtNew]}>
            {isNew ? 'Brand New' : 'Fairly Used'}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Photo carousel */}
        {hasPhotos ? (
          <View style={styles.carouselWrap}>
            <FlatList
              ref={flatRef}
              data={asset.photos}
              keyExtractor={(_, i) => String(i)}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={styles.photo}
                  contentFit="cover"
                />
              )}
            />
            {asset.photos.length > 1 && (
              <View style={styles.dots}>
                {asset.photos.map((_, i) => (
                  <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons
              name={asset.type === 'tricycle' ? 'car' : 'bicycle'}
              size={72}
              color={Colors.primary}
            />
          </View>
        )}

        {/* Name */}
        <View style={styles.nameSection}>
          <Text style={styles.vehicleName}>{asset.brand} {asset.model}</Text>
          <Text style={styles.assetCode}>{asset.asset_code}</Text>
          {asset.assigned_at && (
            <Text style={styles.assignedDate}>Assigned {fmtDate(asset.assigned_at)}</Text>
          )}
        </View>

        {/* General specs */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          <View style={styles.card}>
            <SpecRow icon="car-outline"           label="Type"        value={asset.type}        />
            <SpecRow icon="color-palette-outline" label="Color"       value={asset.color}       />
            <SpecRow icon="document-text-outline" label="Plate No."   value={asset.plate_number || '—'} />
            <SpecRow icon="construct-outline"     label="Condition"   value={isNew ? 'Brand New' : 'Fairly Used'} />
            <SpecRow icon="pricetag-outline"      label="Market Price" value={fmt(asset.market_price)} last />
          </View>
        </View>

        {/* Technical specs */}
        {(asset.engine_number || asset.chassis_number) && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Technical Details</Text>
            <View style={styles.card}>
              {asset.engine_number && (
                <SpecRow
                  icon="hardware-chip-outline"
                  label="Engine No."
                  value={asset.engine_number}
                  last={!asset.chassis_number}
                />
              )}
              {asset.chassis_number && (
                <SpecRow
                  icon="barcode-outline"
                  label="Chassis No."
                  value={asset.chassis_number}
                  last
                />
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: {
    flex: 1, backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
    gap: Spacing.md, padding: Spacing.xl,
  },
  loadingText: { fontSize: Typography.sizes.base, color: Colors.textSecondary },
  errTitle:   { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold, color: Colors.text },
  errSub:     { fontSize: Typography.sizes.sm, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.primary,
  },
  retryTxt: { color: Colors.primary, fontWeight: Typography.weights.semibold },
  backBtn: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, backgroundColor: Colors.primary,
  },
  backBtnTxt: { color: '#fff', fontWeight: Typography.weights.semibold },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  backIcon:    { padding: 4 },
  headerTitle: { flex: 1, fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.text },
  conditionBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: BorderRadius.full, backgroundColor: '#FEF3C7',
  },
  conditionBadgeNew: { backgroundColor: '#D1FAE5' },
  conditionTxt:    { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold, color: '#92400E' },
  conditionTxtNew: { color: '#065F46' },

  scroll: { paddingBottom: Spacing.xxxl },

  carouselWrap: { position: 'relative' },
  photo: { width: SCREEN_W, height: 260 },
  dots: {
    position: 'absolute', bottom: 10,
    flexDirection: 'row', alignSelf: 'center', gap: 6,
  },
  dot:       { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotActive: { backgroundColor: '#fff', width: 20 },

  photoPlaceholder: {
    height: 220, backgroundColor: Colors.cardGreen,
    justifyContent: 'center', alignItems: 'center',
  },

  nameSection: {
    alignItems: 'center', paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md, gap: 4,
  },
  vehicleName:  { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold, color: Colors.text },
  assetCode:    { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  assignedDate: { fontSize: Typography.sizes.xs, color: Colors.primary, marginTop: 4 },

  sectionWrap: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md, gap: Spacing.xs },
  sectionTitle: {
    fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#fff', borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.borderLight,
    overflow: 'hidden', ...Shadows.sm,
  },

  specRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
  },
  specRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  specLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  specLabel: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  specValue: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, color: Colors.text },
});
